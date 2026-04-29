import { NextRequest, NextResponse } from 'next/server';
import { getDefaultWorkspaceSlug } from '@/lib/saas-config';
import { queryAzure } from '@/lib/azure-postgres';
import { getAppBaseUrl, getStripeClient, getStripePriceId } from '@/lib/stripe';
import { resolveAuthorizedWorkspace } from '@/lib/workspace-access';
import type { WorkspacePlanCode } from '@/lib/saas-types';

export const runtime = 'nodejs';

const validPlans: WorkspacePlanCode[] = ['starter', 'pro', 'studio'];

export async function POST(request: NextRequest) {
  const stripe = getStripeClient();

  if (!stripe) {
    return NextResponse.json({ error: 'Billing backend is not configured yet.' }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const workspaceSlug = typeof body.workspaceSlug === 'string' && body.workspaceSlug.trim() ? body.workspaceSlug.trim() : getDefaultWorkspaceSlug();
  const requestedPlan = typeof body.planCode === 'string' && validPlans.includes(body.planCode as WorkspacePlanCode) ? body.planCode as WorkspacePlanCode : 'pro';
  const priceId = getStripePriceId(requestedPlan);
  const resolved = await resolveAuthorizedWorkspace(request, workspaceSlug);

  if ('error' in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  if (!priceId) {
    return NextResponse.json({ error: `Stripe price is not configured for plan "${requestedPlan}".` }, { status: 503 });
  }

  const { organization } = resolved;
  let stripeCustomerId: string | null = null;
  let latestSubscriptionId: string | null = null;
  let latestStripeSubscriptionId: string | null = null;

  if (resolved.provider === 'azure') {
    const latestSubscription = await queryAzure<{ id: string; stripe_customer_id: string | null; stripe_subscription_id: string | null }>(
      `
        select id, stripe_customer_id, stripe_subscription_id
        from public.subscriptions
        where organization_id = $1
        order by created_at desc
        limit 1
      `,
      [organization.id]
    );
    latestSubscriptionId = latestSubscription.rows[0]?.id || null;
    stripeCustomerId = latestSubscription.rows[0]?.stripe_customer_id || null;
    latestStripeSubscriptionId = latestSubscription.rows[0]?.stripe_subscription_id || null;
  } else if (resolved.provider === 'supabase') {
    const { supabase } = resolved;
    const { data: latestSubscription } = await supabase
      .from('subscriptions')
      .select('id, stripe_customer_id, stripe_subscription_id')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    latestSubscriptionId = latestSubscription?.id || null;
    stripeCustomerId = latestSubscription?.stripe_customer_id || null;
    latestStripeSubscriptionId = latestSubscription?.stripe_subscription_id || null;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        name: organization.name,
        metadata: {
          organization_id: organization.id,
          workspace_slug: organization.slug,
        },
      });

      stripeCustomerId = customer.id;

      if (latestSubscriptionId) {
        await supabase.from('subscriptions').update({ stripe_customer_id: stripeCustomerId }).eq('id', latestSubscriptionId);
      }
    }
  } else {
    return NextResponse.json({ error: 'Unsupported workspace provider.' }, { status: 500 });
  }

  if (requestedPlan === 'starter') {
    if (latestStripeSubscriptionId) {
      return NextResponse.json(
        {
          error: 'Use the billing portal to move a paid subscription back to Starter so Stripe stays in sync.',
        },
        { status: 409 }
      );
    }

    const starterPayload = {
      organization_id: organization.id,
      plan: 'starter',
      status: 'active',
      seats_included: 1,
      ai_query_limit: 80,
      work_limit: 5,
      renews_at: null,
      mrr_cents: 0,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: null,
    };

    if (resolved.provider === 'azure') {
      if (latestSubscriptionId) {
        await queryAzure(
          `
            update public.subscriptions
            set
              organization_id = $2,
              plan = $3,
              status = $4,
              seats_included = $5,
              ai_query_limit = $6,
              work_limit = $7,
              renews_at = $8,
              mrr_cents = $9,
              stripe_customer_id = $10,
              stripe_subscription_id = $11
            where id = $1
          `,
          [
            latestSubscriptionId,
            starterPayload.organization_id,
            starterPayload.plan,
            starterPayload.status,
            starterPayload.seats_included,
            starterPayload.ai_query_limit,
            starterPayload.work_limit,
            starterPayload.renews_at,
            starterPayload.mrr_cents,
            starterPayload.stripe_customer_id,
            starterPayload.stripe_subscription_id,
          ]
        );
      } else {
        await queryAzure(
          `
            insert into public.subscriptions
              (organization_id, plan, status, seats_included, ai_query_limit, work_limit, renews_at, mrr_cents, stripe_customer_id, stripe_subscription_id)
            values
              ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `,
          [
            starterPayload.organization_id,
            starterPayload.plan,
            starterPayload.status,
            starterPayload.seats_included,
            starterPayload.ai_query_limit,
            starterPayload.work_limit,
            starterPayload.renews_at,
            starterPayload.mrr_cents,
            starterPayload.stripe_customer_id,
            starterPayload.stripe_subscription_id,
          ]
        );
      }

      await queryAzure(
        `
          insert into public.integration_connections (organization_id, kind, status)
          values ($1, 'stripe', 'connected')
          on conflict (organization_id, kind) do update set status = excluded.status
        `,
        [organization.id]
      );
    } else if (resolved.provider === 'supabase') {
      const { supabase } = resolved;

      if (latestSubscriptionId) {
        await supabase.from('subscriptions').update(starterPayload).eq('id', latestSubscriptionId);
      } else {
        await supabase.from('subscriptions').insert(starterPayload);
      }

      await supabase.from('integration_connections').upsert(
        {
          organization_id: organization.id,
          kind: 'stripe',
          status: 'connected',
        },
        {
          onConflict: 'organization_id,kind',
        }
      );
    }

    return NextResponse.json({
      activated: true,
      message: 'Starter plan activated.',
    });
  }

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      name: organization.name,
      metadata: {
        organization_id: organization.id,
        workspace_slug: organization.slug,
      },
    });

    stripeCustomerId = customer.id;

    if (resolved.provider === 'azure') {
      await queryAzure(
        `
          update public.subscriptions
          set stripe_customer_id = $2
          where id = (
            select id
            from public.subscriptions
            where organization_id = $1
            order by created_at desc
            limit 1
          )
        `,
      [organization.id, stripeCustomerId]
      );
    } else if (resolved.provider === 'supabase') {
      const { supabase } = resolved;
      if (latestSubscriptionId) {
        await supabase.from('subscriptions').update({ stripe_customer_id: stripeCustomerId }).eq('id', latestSubscriptionId);
      }
    } else {
      return NextResponse.json({ error: 'Unsupported workspace provider.' }, { status: 500 });
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: stripeCustomerId,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${getAppBaseUrl()}/pricing?checkout=success`,
    cancel_url: `${getAppBaseUrl()}/pricing?checkout=cancelled`,
    metadata: {
      organization_id: organization.id,
      workspace_slug: organization.slug,
      plan_code: requestedPlan,
      source: 'rightsguard',
    },
    subscription_data: {
      metadata: {
        organization_id: organization.id,
        workspace_slug: organization.slug,
        plan_code: requestedPlan,
        source: 'rightsguard',
      },
    },
  });

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
