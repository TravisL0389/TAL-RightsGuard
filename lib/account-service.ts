import { isAzurePostgresConfigured, queryAzure } from '@/lib/azure-postgres';
import type { SetupStatus, WorkspaceSnapshotResponse } from '@/lib/saas-types';
import { getBackendReadiness, getDefaultWorkspaceSlug } from '@/lib/saas-config';
import { getServerSupabaseClient } from '@/lib/supabase-server';
import { buildSeedWorkspaceSnapshot, planFromCode } from '@/lib/workspace-seed';

const setupStatusFromRow = (value: string | null | undefined, fallback: boolean): SetupStatus => {
  if (value === 'connected') {
    return 'ready';
  }

  if (value === 'pending') {
    return 'pending';
  }

  return fallback ? 'pending' : 'missing';
};

async function getAzureWorkspaceSnapshot(workspaceSlug: string): Promise<WorkspaceSnapshotResponse | null> {
  if (!isAzurePostgresConfigured()) {
    return null;
  }

  const backend = getBackendReadiness();
  const fallbackWorkspace = buildSeedWorkspaceSnapshot(workspaceSlug, backend);
  const warnings: string[] = [];

  try {
    const organizationResult = await queryAzure<{
      id: string;
      name: string;
      slug: string;
    }>('select id, name, slug from public.organizations where slug = $1 limit 1', [workspaceSlug]);

    const organization = organizationResult.rows[0];
    if (!organization) {
      warnings.push('Azure PostgreSQL is connected, but no organization row matched this workspace slug. Seed data is still active until the workspace is bootstrapped.');
      return {
        workspace: fallbackWorkspace,
        mode: 'seed',
        backend,
        warnings,
        timestamp: new Date().toISOString(),
      };
    }

    const [membershipCountResult, operatorResult, subscriptionResult, usageResult, integrationsResult] = await Promise.all([
      queryAzure<{ count: string }>('select count(*)::text as count from public.organization_memberships where organization_id = $1', [organization.id]),
      queryAzure<{ full_name: string | null; role: string }>(
        `
          select p.full_name, m.role
          from public.organization_memberships m
          left join public.profiles p on p.id = m.user_id
          where m.organization_id = $1
          order by m.created_at asc
          limit 1
        `,
        [organization.id]
      ),
      queryAzure<{
        plan: string;
        status: string;
        seats_included: number;
        ai_query_limit: number;
        work_limit: number;
        renews_at: string | null;
        mrr_cents: number;
      }>(
        `
          select plan, status, seats_included, ai_query_limit, work_limit, renews_at, mrr_cents
          from public.subscriptions
          where organization_id = $1
          order by created_at desc
          limit 1
        `,
        [organization.id]
      ),
      queryAzure<{
        ai_queries_used: number;
        rights_reports_used: number;
        storage_bytes_used: string | number;
      }>(
        `
          select ai_queries_used, rights_reports_used, storage_bytes_used
          from public.usage_counters
          where organization_id = $1
          order by period_start desc
          limit 1
        `,
        [organization.id]
      ),
      queryAzure<{ kind: string; status: string }>(
        'select kind, status from public.integration_connections where organization_id = $1',
        [organization.id]
      ),
    ]);

    const subscription = subscriptionResult.rows[0];
    const usage = usageResult.rows[0];
    const operator = operatorResult.rows[0];
    const integrationMap = new Map<string, string>(
      integrationsResult.rows.map((item: { kind: string; status: string }) => [item.kind, item.status])
    );
    const plan = planFromCode(subscription?.plan);

    return {
      workspace: {
        organizationId: organization.id,
        workspaceName: organization.name,
        workspaceSlug: organization.slug,
        operatorName: operator?.full_name || fallbackWorkspace.operatorName,
        operatorRole: operator?.role || fallbackWorkspace.operatorRole,
        plan: {
          code: plan.code,
          label: plan.label,
          seatsIncluded: subscription?.seats_included || plan.seatsIncluded,
          aiQueryLimit: subscription?.ai_query_limit || plan.aiQueryLimit,
          workLimit: subscription?.work_limit || plan.workLimit,
        },
        seats: {
          used: Number(membershipCountResult.rows[0]?.count || fallbackWorkspace.seats.used),
          included: subscription?.seats_included || plan.seatsIncluded,
        },
        billing: {
          status: (subscription?.status as WorkspaceSnapshotResponse['workspace']['billing']['status']) || fallbackWorkspace.billing.status,
          renewalDate: subscription?.renews_at ? new Date(subscription.renews_at).toISOString().split('T')[0] : fallbackWorkspace.billing.renewalDate,
          monthlyRecurringRevenue: subscription?.mrr_cents ? Math.round(subscription.mrr_cents / 100) : fallbackWorkspace.billing.monthlyRecurringRevenue,
        },
        usage: {
          aiQueriesUsed: usage?.ai_queries_used || 0,
          rightsReportsUsed: usage?.rights_reports_used || 0,
          storageGbUsed: usage?.storage_bytes_used ? Number((Number(usage.storage_bytes_used) / 1024 / 1024 / 1024).toFixed(1)) : 0,
        },
        setup: {
          auth: backend.supabase ? 'ready' : backend.azurePostgres ? 'pending' : 'missing',
          database: backend.azurePostgres || backend.supabase ? 'ready' : 'missing',
          billing: setupStatusFromRow(integrationMap.get('stripe'), backend.stripe),
          email: setupStatusFromRow(integrationMap.get('resend'), backend.resend),
          ai: backend.gemini ? 'ready' : 'pending',
        },
      },
      mode: 'azure',
      backend,
      warnings,
      timestamp: new Date().toISOString(),
    };
  } catch {
    warnings.push('Azure PostgreSQL is reachable, but the shared SaaS schema is not fully available yet. Seed data is still active.');
    return {
      workspace: fallbackWorkspace,
      mode: 'seed',
      backend,
      warnings,
      timestamp: new Date().toISOString(),
    };
  }
}

async function getSupabaseWorkspaceSnapshot(workspaceSlug: string): Promise<WorkspaceSnapshotResponse | null> {
  const backend = getBackendReadiness();
  const fallbackWorkspace = buildSeedWorkspaceSnapshot(workspaceSlug, backend);
  const warnings: string[] = [];
  const supabase = getServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  try {
    const { data: organization, error: organizationError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('slug', workspaceSlug)
      .maybeSingle();

    if (organizationError || !organization) {
      warnings.push('Supabase is connected, but no organization row matched this workspace slug. Seed data is still active until the workspace is bootstrapped.');
      return {
        workspace: fallbackWorkspace,
        mode: 'seed',
        backend,
        warnings,
        timestamp: new Date().toISOString(),
      };
    }

    const [membershipResult, subscriptionResult, usageResult, integrationsResult] = await Promise.all([
      supabase.from('organization_memberships').select('role', { count: 'exact' }).eq('organization_id', organization.id).limit(1),
      supabase
        .from('subscriptions')
        .select('plan, status, seats_included, ai_query_limit, work_limit, renews_at, mrr_cents')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('usage_counters')
        .select('ai_queries_used, rights_reports_used, storage_bytes_used')
        .eq('organization_id', organization.id)
        .order('period_start', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from('integration_connections').select('kind, status').eq('organization_id', organization.id),
    ]);

    const subscription = subscriptionResult.data;
    const usage = usageResult.data;
    const memberships = membershipResult.data || [];
    const integrations = integrationsResult.data || [];
    const plan = planFromCode(subscription?.plan);
    const integrationMap = new Map(integrations.map((item) => [item.kind, item.status]));

    return {
      workspace: {
        organizationId: organization.id,
        workspaceName: organization.name,
        workspaceSlug: organization.slug,
        operatorName: 'Workspace operator',
        operatorRole: memberships[0]?.role || fallbackWorkspace.operatorRole,
        plan: {
          code: plan.code,
          label: plan.label,
          seatsIncluded: subscription?.seats_included || plan.seatsIncluded,
          aiQueryLimit: subscription?.ai_query_limit || plan.aiQueryLimit,
          workLimit: subscription?.work_limit || plan.workLimit,
        },
        seats: {
          used: membershipResult.count || fallbackWorkspace.seats.used,
          included: subscription?.seats_included || plan.seatsIncluded,
        },
        billing: {
          status: subscription?.status || fallbackWorkspace.billing.status,
          renewalDate: subscription?.renews_at ? new Date(subscription.renews_at).toISOString().split('T')[0] : fallbackWorkspace.billing.renewalDate,
          monthlyRecurringRevenue: subscription?.mrr_cents ? Math.round(subscription.mrr_cents / 100) : fallbackWorkspace.billing.monthlyRecurringRevenue,
        },
        usage: {
          aiQueriesUsed: usage?.ai_queries_used || 0,
          rightsReportsUsed: usage?.rights_reports_used || 0,
          storageGbUsed: usage?.storage_bytes_used ? Number((usage.storage_bytes_used / 1024 / 1024 / 1024).toFixed(1)) : 0,
        },
        setup: {
          auth: backend.supabase ? 'ready' : 'missing',
          database: backend.supabase ? 'ready' : 'missing',
          billing: setupStatusFromRow(integrationMap.get('stripe'), backend.stripe),
          email: setupStatusFromRow(integrationMap.get('resend'), backend.resend),
          ai: backend.gemini ? 'ready' : 'pending',
        },
      },
      mode: 'supabase',
      backend,
      warnings,
      timestamp: new Date().toISOString(),
    };
  } catch {
    warnings.push('Supabase was reachable, but the shared SaaS schema is not fully available yet. Seed data is still active.');
    return {
      workspace: fallbackWorkspace,
      mode: 'seed',
      backend,
      warnings,
      timestamp: new Date().toISOString(),
    };
  }
}

export const getWorkspaceSnapshot = async (workspaceSlug?: string): Promise<WorkspaceSnapshotResponse> => {
  const backend = getBackendReadiness();
  const slug = workspaceSlug || getDefaultWorkspaceSlug();
  const fallbackWorkspace = buildSeedWorkspaceSnapshot(slug, backend);

  if (backend.azurePostgres) {
    const azureSnapshot = await getAzureWorkspaceSnapshot(slug);
    if (azureSnapshot) {
      return azureSnapshot;
    }
  }

  const supabaseSnapshot = await getSupabaseWorkspaceSnapshot(slug);
  if (supabaseSnapshot) {
    return supabaseSnapshot;
  }

  return {
    workspace: fallbackWorkspace,
    mode: 'seed',
    backend,
    warnings: ['No configured backend responded. RightsGuard is running from seeded workspace data.'],
    timestamp: new Date().toISOString(),
  };
};
