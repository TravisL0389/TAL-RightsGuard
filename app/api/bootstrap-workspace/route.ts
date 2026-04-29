import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { isAzurePostgresConfigured, queryAzure } from '@/lib/azure-postgres';
import { getWorkspaceSnapshot } from '@/lib/account-service';
import { getBackendReadiness, getDefaultWorkspaceSlug } from '@/lib/saas-config';
import { getServerSupabaseClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'rightsguard';

export async function POST(request: NextRequest) {
  const readiness = getBackendReadiness();
  const body = await request.json().catch(() => ({}));
  const workspaceName = typeof body.workspaceName === 'string' && body.workspaceName.trim() ? body.workspaceName.trim() : 'RightsGuard AI';
  const workspaceSlug = typeof body.workspaceSlug === 'string' && body.workspaceSlug.trim() ? slugify(body.workspaceSlug) : getDefaultWorkspaceSlug();

  if (isAzurePostgresConfigured()) {
    try {
      const existingOrganizationResult = await queryAzure<{ id: string }>(
        'select id from public.organizations where slug = $1 limit 1',
        [workspaceSlug]
      );

      let organizationId = existingOrganizationResult.rows[0]?.id || null;

      if (!organizationId) {
        const createdOrganizationResult = await queryAzure<{ id: string }>(
          'insert into public.organizations (name, slug) values ($1, $2) returning id',
          [workspaceName, workspaceSlug]
        );
        organizationId = createdOrganizationResult.rows[0]?.id || null;
      }

      if (!organizationId) {
        return NextResponse.json({ error: 'Failed to create Azure workspace organization.' }, { status: 500 });
      }

      const existingOwnerResult = await queryAzure<{ user_id: string }>(
        `
          select user_id
          from public.organization_memberships
          where organization_id = $1 and role = 'owner'
          order by created_at asc
          limit 1
        `,
        [organizationId]
      );

      const profileId = existingOwnerResult.rows[0]?.user_id || randomUUID();

      await queryAzure(
        `
          insert into public.profiles (id, full_name, email)
          values ($1, $2, $3)
          on conflict (id) do nothing
        `,
        [profileId, 'Workspace Owner', null]
      );

      await queryAzure(
        `
          insert into public.organization_memberships (organization_id, user_id, role)
          values ($1, $2, 'owner')
          on conflict (organization_id, user_id) do nothing
        `,
        [organizationId, profileId]
      );

      const existingSubscriptionResult = await queryAzure<{ id: string }>(
        'select id from public.subscriptions where organization_id = $1 order by created_at desc limit 1',
        [organizationId]
      );

      if (!existingSubscriptionResult.rows[0]?.id) {
        await queryAzure(
          `
            insert into public.subscriptions
              (organization_id, plan, status, seats_included, ai_query_limit, work_limit, renews_at, mrr_cents)
            values
              ($1, 'starter', 'trialing', 1, 80, 5, $2, 0)
          `,
          [organizationId, new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()]
        );
      }

      const existingUsageResult = await queryAzure<{ id: string }>(
        'select id from public.usage_counters where organization_id = $1 order by period_start desc limit 1',
        [organizationId]
      );

      if (!existingUsageResult.rows[0]?.id) {
        await queryAzure(
          `
            insert into public.usage_counters (organization_id, period_start)
            values ($1, $2)
          `,
          [organizationId, new Date().toISOString().split('T')[0]]
        );
      }

      const integrationSeeds = [
        { kind: 'stripe', status: readiness.stripe ? 'connected' : 'pending' },
        { kind: 'resend', status: readiness.resend ? 'connected' : 'pending' },
        { kind: 'make', status: 'pending' },
        { kind: 'slack', status: 'pending' },
        { kind: 'publishing', status: 'pending' },
      ];

      for (const integration of integrationSeeds) {
        await queryAzure(
          `
            insert into public.integration_connections (organization_id, kind, status)
            values ($1, $2, $3)
            on conflict (organization_id, kind) do update set status = excluded.status
          `,
          [organizationId, integration.kind, integration.status]
        );
      }

      const snapshot = await getWorkspaceSnapshot(workspaceSlug);
      return NextResponse.json(snapshot);
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : 'Azure workspace bootstrap failed.',
        },
        { status: 500 }
      );
    }
  }

  const supabase = getServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'No configured backend is available.' }, { status: 503 });
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';

  if (!token) {
    return NextResponse.json({ error: 'Missing bearer token.' }, { status: 401 });
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  const user = userData.user;

  if (userError || !user) {
    return NextResponse.json({ error: 'Invalid Supabase session.' }, { status: 401 });
  }

  try {
    await supabase.from('profiles').upsert({
      id: user.id,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Workspace owner',
      email: user.email || null,
    });

    let organizationId: string | null = null;
    const { data: existingOrganization } = await supabase.from('organizations').select('id').eq('slug', workspaceSlug).maybeSingle();

    if (existingOrganization?.id) {
      organizationId = existingOrganization.id;
    } else {
      const { data: createdOrganization, error: organizationError } = await supabase
        .from('organizations')
        .insert({ name: workspaceName, slug: workspaceSlug })
        .select('id')
        .single();

      if (organizationError || !createdOrganization) {
        return NextResponse.json({ error: 'Failed to create organization.' }, { status: 500 });
      }

      organizationId = createdOrganization.id;
    }

    await supabase.from('organization_memberships').upsert(
      {
        organization_id: organizationId,
        user_id: user.id,
        role: 'owner',
      },
      { onConflict: 'organization_id,user_id' }
    );

    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!existingSubscription?.id) {
      await supabase.from('subscriptions').insert({
        organization_id: organizationId,
        plan: 'starter',
        status: 'trialing',
        seats_included: 1,
        ai_query_limit: 80,
        work_limit: 5,
        renews_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        mrr_cents: 0,
      });
    }

    const { data: existingUsage } = await supabase
      .from('usage_counters')
      .select('id')
      .eq('organization_id', organizationId)
      .order('period_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!existingUsage?.id) {
      await supabase.from('usage_counters').insert({
        organization_id: organizationId,
        period_start: new Date().toISOString().split('T')[0],
      });
    }

    const integrationSeeds = [
      { kind: 'stripe', status: readiness.stripe ? 'connected' : 'pending' },
      { kind: 'resend', status: readiness.resend ? 'connected' : 'pending' },
      { kind: 'make', status: 'pending' },
      { kind: 'slack', status: 'pending' },
      { kind: 'publishing', status: 'pending' },
    ];

    for (const integration of integrationSeeds) {
      await supabase.from('integration_connections').upsert(
        {
          organization_id: organizationId,
          kind: integration.kind,
          status: integration.status,
        },
        { onConflict: 'organization_id,kind' }
      );
    }

    const snapshot = await getWorkspaceSnapshot(workspaceSlug);
    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Workspace bootstrap failed.',
      },
      { status: 500 }
    );
  }
}
