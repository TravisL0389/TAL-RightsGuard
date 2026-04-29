import type { BackendReadiness, RightsWorkspaceSnapshot, WorkspacePlan, WorkspacePlanCode } from '@/lib/saas-types';

const PLAN_LIBRARY: Record<WorkspacePlanCode, WorkspacePlan> = {
  starter: {
    code: 'starter',
    label: 'Starter',
    seatsIncluded: 1,
    aiQueryLimit: 80,
    workLimit: 5,
  },
  pro: {
    code: 'pro',
    label: 'Pro',
    seatsIncluded: 3,
    aiQueryLimit: 600,
    workLimit: 50,
  },
  studio: {
    code: 'studio',
    label: 'Studio',
    seatsIncluded: 12,
    aiQueryLimit: 5000,
    workLimit: 500,
  },
};

const toWorkspaceName = (slug: string) =>
  slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const readinessToStatus = (isReady: boolean) => (isReady ? 'ready' : 'pending');

export const planFromCode = (code: WorkspacePlanCode | string | null | undefined) => {
  if (!code) {
    return PLAN_LIBRARY.pro;
  }

  return PLAN_LIBRARY[code as WorkspacePlanCode] || PLAN_LIBRARY.pro;
};

export const buildSeedWorkspaceSnapshot = (workspaceSlug: string, readiness: BackendReadiness): RightsWorkspaceSnapshot => {
  const plan = PLAN_LIBRARY.pro;

  return {
    organizationId: `seed-${workspaceSlug}`,
    workspaceName: toWorkspaceName(workspaceSlug),
    workspaceSlug,
    operatorName: 'Maya Rivera',
    operatorRole: 'Rights admin',
    plan,
    seats: {
      used: 1,
      included: plan.seatsIncluded,
    },
    billing: {
      status: readiness.stripe ? 'trialing' : 'unconfigured',
      renewalDate: '2026-05-31',
      monthlyRecurringRevenue: 24,
    },
    usage: {
      aiQueriesUsed: 37,
      rightsReportsUsed: 9,
      storageGbUsed: 1.8,
    },
    setup: {
      auth: readinessToStatus(readiness.supabase),
      database: readinessToStatus(readiness.supabase),
      billing: readinessToStatus(readiness.stripe),
      email: readinessToStatus(readiness.resend),
      ai: readinessToStatus(readiness.gemini),
    },
  };
};
