export type WorkspacePlanCode = 'starter' | 'pro' | 'studio';
export type BillingStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unconfigured';
export type SetupStatus = 'ready' | 'pending' | 'missing';
export type WorkspaceMode = 'seed' | 'supabase' | 'azure';

export interface WorkspacePlan {
  code: WorkspacePlanCode;
  label: string;
  seatsIncluded: number;
  aiQueryLimit: number;
  workLimit: number;
}

export interface RightsWorkspaceSnapshot {
  organizationId: string;
  workspaceName: string;
  workspaceSlug: string;
  operatorName: string;
  operatorRole: string;
  plan: WorkspacePlan;
  seats: {
    used: number;
    included: number;
  };
  billing: {
    status: BillingStatus;
    renewalDate: string;
    monthlyRecurringRevenue: number;
  };
  usage: {
    aiQueriesUsed: number;
    rightsReportsUsed: number;
    storageGbUsed: number;
  };
  setup: {
    auth: SetupStatus;
    database: SetupStatus;
    billing: SetupStatus;
    email: SetupStatus;
    ai: SetupStatus;
  };
}

export interface BackendReadiness {
  supabase: boolean;
  stripe: boolean;
  resend: boolean;
  gemini: boolean;
  azurePostgres: boolean;
  azureBlob: boolean;
}

export interface WorkspaceSnapshotResponse {
  workspace: RightsWorkspaceSnapshot;
  mode: WorkspaceMode;
  backend: BackendReadiness;
  warnings: string[];
  timestamp: string;
}

export interface RightsWork {
  id: string;
  title: string;
  workType: 'composition' | 'recording' | 'release' | 'agreement';
  status: string;
  platformSource?: string | null;
  releaseStage?: string | null;
  createdAt: string;
}

export interface EvidenceRecord {
  id: string;
  title: string;
  evidenceType: string;
  fileUrl?: string | null;
  workId?: string | null;
  workTitle?: string | null;
  createdAt: string;
}

export interface RightsMemo {
  id: string;
  summary: string;
  workId?: string | null;
  workTitle?: string | null;
  createdAt: string;
}

export interface RightsWorkspaceDataResponse {
  mode: WorkspaceMode;
  works: RightsWork[];
  evidence: EvidenceRecord[];
  memos: RightsMemo[];
  warnings: string[];
  timestamp: string;
}
