import { NextRequest, NextResponse } from 'next/server';
import { isAzurePostgresConfigured, queryAzure } from '@/lib/azure-postgres';
import { getServerSupabaseClient } from '@/lib/supabase-server';
import { getPlanCodeFromPriceId, getStripeClient, getStripeWebhookSecret, mapStripeStatus } from '@/lib/stripe';

export const runtime = 'nodejs';

const syncSubscriptionFromStripe = async (
  supabase: NonNullable<ReturnType<typeof getServerSupabaseClient>>,
  subscription: any
) => {
  const stripeCustomerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
  const stripeSubscriptionId = subscription.id;
  const priceId = subscription.items?.data?.[0]?.price?.id;
  const organizationId = subscription.metadata?.organization_id || null;
  const planCode = getPlanCodeFromPriceId(priceId) || 'starter';
  const renewsAt = subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null;
  const mrrCents = subscription.items?.data?.[0]?.price?.unit_amount || 0;

  let resolvedOrganizationId = organizationId;

  if (!resolvedOrganizationId && stripeCustomerId) {
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('organization_id')
      .eq('stripe_customer_id', stripeCustomerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    resolvedOrganizationId = existingSubscription?.organization_id || null;
  }

  if (!resolvedOrganizationId) {
    return;
  }

  const limits =
    planCode === 'studio'
      ? { seats: 12, aiQueries: 5000, works: 500 }
      : planCode === 'pro'
        ? { seats: 3, aiQueries: 600, works: 50 }
        : { seats: 1, aiQueries: 80, works: 5 };

  const payload = {
    organization_id: resolvedOrganizationId,
    plan: planCode,
    status: mapStripeStatus(subscription.status),
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSubscriptionId,
    seats_included: limits.seats,
    ai_query_limit: limits.aiQueries,
    work_limit: limits.works,
    renews_at: renewsAt,
    mrr_cents: mrrCents,
  };

  const { data: existingByStripeId } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .maybeSingle();

  if (existingByStripeId?.id) {
    await supabase.from('subscriptions').update(payload).eq('id', existingByStripeId.id);
  } else {
    await supabase.from('subscriptions').insert(payload);
  }

  await supabase.from('integration_connections').upsert(
    {
      organization_id: resolvedOrganizationId,
      kind: 'stripe',
      status: 'connected',
    },
    {
      onConflict: 'organization_id,kind',
    }
  );
};

const syncSubscriptionFromAzure = async (subscription: any) => {
  const stripeCustomerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
  const stripeSubscriptionId = subscription.id;
  const priceId = subscription.items?.data?.[0]?.price?.id;
  const organizationId = subscription.metadata?.organization_id || null;
  const planCode = getPlanCodeFromPriceId(priceId) || 'starter';
  const renewsAt = subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null;
  const mrrCents = subscription.items?.data?.[0]?.price?.unit_amount || 0;

  let resolvedOrganizationId = organizationId;

  if (!resolvedOrganizationId && stripeCustomerId) {
    const existingSubscription = await queryAzure<{ organization_id: string }>(
      `
        select organization_id
        from public.subscriptions
        where stripe_customer_id = $1
        order by created_at desc
        limit 1
      `,
      [stripeCustomerId]
    );
    resolvedOrganizationId = existingSubscription.rows[0]?.organization_id || null;
  }

  if (!resolvedOrganizationId) {
    return;
  }

  const limits =
    planCode === 'studio'
      ? { seats: 12, aiQueries: 5000, works: 500 }
      : planCode === 'pro'
        ? { seats: 3, aiQueries: 600, works: 50 }
        : { seats: 1, aiQueries: 80, works: 5 };

  const existingByStripeId = await queryAzure<{ id: string }>(
    'select id from public.subscriptions where stripe_subscription_id = $1 limit 1',
    [stripeSubscriptionId]
  );

  if (existingByStripeId.rows[0]?.id) {
    await queryAzure(
      `
        update public.subscriptions
        set
          organization_id = $2,
          plan = $3,
          status = $4,
          stripe_customer_id = $5,
          stripe_subscription_id = $6,
          seats_included = $7,
          ai_query_limit = $8,
          work_limit = $9,
          renews_at = $10,
          mrr_cents = $11
        where id = $1
      `,
      [
        existingByStripeId.rows[0].id,
        resolvedOrganizationId,
        planCode,
        mapStripeStatus(subscription.status),
        stripeCustomerId,
        stripeSubscriptionId,
        limits.seats,
        limits.aiQueries,
        limits.works,
        renewsAt,
        mrrCents,
      ]
    );
  } else {
    await queryAzure(
      `
        insert into public.subscriptions
          (organization_id, plan, status, stripe_customer_id, stripe_subscription_id, seats_included, ai_query_limit, work_limit, renews_at, mrr_cents)
        values
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        resolvedOrganizationId,
        planCode,
        mapStripeStatus(subscription.status),
        stripeCustomerId,
        stripeSubscriptionId,
        limits.seats,
        limits.aiQueries,
        limits.works,
        renewsAt,
        mrrCents,
      ]
    );
  }

  await queryAzure(
    `
      insert into public.integration_connections (organization_id, kind, status)
      values ($1, 'stripe', 'connected')
      on conflict (organization_id, kind) do update set status = excluded.status
    `,
    [resolvedOrganizationId]
  );
};

export async function POST(request: NextRequest) {
  const stripe = getStripeClient();
  const webhookSecret = getStripeWebhookSecret();
  const supabase = getServerSupabaseClient();

  if (!stripe || !webhookSecret || (!supabase && !isAzurePostgresConfigured())) {
    return NextResponse.json({ error: 'Stripe webhook is not configured yet.' }, { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature.' }, { status: 400 });
  }

  try {
    const rawBody = await request.text();
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          if (isAzurePostgresConfigured()) {
            await syncSubscriptionFromAzure(subscription);
          } else if (supabase) {
            await syncSubscriptionFromStripe(supabase, subscription);
          }
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        if (isAzurePostgresConfigured()) {
          await syncSubscriptionFromAzure(event.data.object as any);
        } else if (supabase) {
          await syncSubscriptionFromStripe(supabase, event.data.object as any);
        }
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Webhook handling failed.',
      },
      { status: 400 }
    );
  }
}
