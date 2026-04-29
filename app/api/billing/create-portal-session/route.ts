import { NextRequest, NextResponse } from 'next/server';
import { getDefaultWorkspaceSlug } from '@/lib/saas-config';
import { queryAzure } from '@/lib/azure-postgres';
import { getAppBaseUrl, getStripeClient } from '@/lib/stripe';
import { resolveAuthorizedWorkspace } from '@/lib/workspace-access';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const stripe = getStripeClient();

  if (!stripe) {
    return NextResponse.json({ error: 'Billing backend is not configured yet.' }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const workspaceSlug = typeof body.workspaceSlug === 'string' && body.workspaceSlug.trim() ? body.workspaceSlug.trim() : getDefaultWorkspaceSlug();
  const resolved = await resolveAuthorizedWorkspace(request, workspaceSlug);

  if ('error' in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const { organization } = resolved;
  let stripeCustomerId: string | null = null;

  if (resolved.provider === 'azure') {
    const latestSubscription = await queryAzure<{ stripe_customer_id: string | null }>(
      `
        select stripe_customer_id
        from public.subscriptions
        where organization_id = $1
        order by created_at desc
        limit 1
      `,
      [organization.id]
    );
    stripeCustomerId = latestSubscription.rows[0]?.stripe_customer_id || null;
  } else if (resolved.provider === 'supabase') {
    const { supabase } = resolved;
    const { data: latestSubscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    stripeCustomerId = latestSubscription?.stripe_customer_id || null;
  } else {
    return NextResponse.json({ error: 'Unsupported workspace provider.' }, { status: 500 });
  }

  if (!stripeCustomerId) {
    return NextResponse.json({ error: 'No Stripe customer is linked to this workspace yet. Start checkout first.' }, { status: 400 });
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${getAppBaseUrl()}/pricing`,
  });

  return NextResponse.json({ url: portal.url });
}
