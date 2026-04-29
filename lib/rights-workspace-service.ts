import { isAzurePostgresConfigured, queryAzure } from '@/lib/azure-postgres';
import { getDefaultWorkspaceSlug } from '@/lib/saas-config';
import type {
  EvidenceRecord,
  RightsMemo,
  RightsWork,
  RightsWorkspaceDataResponse,
} from '@/lib/saas-types';
import { getServerSupabaseClient } from '@/lib/supabase-server';

const seedWorks: RightsWork[] = [
  {
    id: 'seed-work-1',
    title: 'Midnight Drive',
    workType: 'recording',
    status: 'In Progress',
    platformSource: 'Suno Pro',
    releaseStage: 'Evidence capture',
    createdAt: '2026-04-29T10:30:00.000Z',
  },
  {
    id: 'seed-work-2',
    title: 'Fading Signals',
    workType: 'composition',
    status: 'Release Ready',
    platformSource: 'Udio',
    releaseStage: 'Distributor packet',
    createdAt: '2026-04-28T14:00:00.000Z',
  },
  {
    id: 'seed-work-3',
    title: 'Echoes of You',
    workType: 'recording',
    status: 'Needs Review',
    platformSource: 'Suno',
    releaseStage: 'Terms review',
    createdAt: '2026-04-27T09:15:00.000Z',
  },
];

const seedEvidence: EvidenceRecord[] = [
  {
    id: 'seed-evidence-1',
    title: 'Original lyric draft',
    evidenceType: 'lyrics',
    workId: 'seed-work-1',
    workTitle: 'Midnight Drive',
    createdAt: '2026-04-29T10:45:00.000Z',
  },
  {
    id: 'seed-evidence-2',
    title: 'DAW session export',
    evidenceType: 'session',
    workId: 'seed-work-1',
    workTitle: 'Midnight Drive',
    createdAt: '2026-04-29T11:00:00.000Z',
  },
  {
    id: 'seed-evidence-3',
    title: 'Plan receipt snapshot',
    evidenceType: 'terms',
    workId: 'seed-work-2',
    workTitle: 'Fading Signals',
    createdAt: '2026-04-28T15:10:00.000Z',
  },
];

const seedMemos: RightsMemo[] = [
  {
    id: 'seed-memo-1',
    summary: 'Human-authored lyrics and vocal arrangement are strong. Keep the Udio Pro plan receipt and DAW revision trail attached before release.',
    workId: 'seed-work-2',
    workTitle: 'Fading Signals',
    createdAt: '2026-04-28T16:00:00.000Z',
  },
  {
    id: 'seed-memo-2',
    summary: 'This track still needs contributor paperwork and a clearer disclosure note describing what the model generated versus what was rebuilt in Ableton.',
    workId: 'seed-work-1',
    workTitle: 'Midnight Drive',
    createdAt: '2026-04-29T11:20:00.000Z',
  },
];

const fallbackResponse = (warning: string): RightsWorkspaceDataResponse => ({
  mode: 'seed',
  works: seedWorks,
  evidence: seedEvidence,
  memos: seedMemos,
  warnings: [warning],
  timestamp: new Date().toISOString(),
});

async function getAzureRightsWorkspaceData(workspaceSlug: string): Promise<RightsWorkspaceDataResponse | null> {
  if (!isAzurePostgresConfigured()) {
    return null;
  }

  const organizationResult = await queryAzure<{ id: string }>(
    'select id from public.organizations where slug = $1 limit 1',
    [workspaceSlug]
  );
  const organization = organizationResult.rows[0];

  if (!organization) {
    return fallbackResponse('No workspace rows were found for this Azure workspace slug yet. Seeded rights data is still active.');
  }

  try {
    const [worksResult, evidenceResult, memosResult] = await Promise.all([
      queryAzure<{
        id: string;
        title: string;
        work_type: RightsWork['workType'];
        status: string;
        platform_source: string | null;
        release_stage: string | null;
        created_at: string;
      }>(
        `
          select id, title, work_type, status, platform_source, release_stage, created_at
          from public.rights_works
          where organization_id = $1
          order by created_at desc
          limit 12
        `,
        [organization.id]
      ),
      queryAzure<{
        id: string;
        title: string;
        evidence_type: string;
        file_url: string | null;
        work_id: string | null;
        work_title: string | null;
        created_at: string;
      }>(
        `
          select e.id, e.title, e.evidence_type, e.file_url, e.work_id, e.created_at, w.title as work_title
          from public.evidence_records e
          left join public.rights_works w on w.id = e.work_id
          where e.organization_id = $1
          order by e.created_at desc
          limit 12
        `,
        [organization.id]
      ),
      queryAzure<{
        id: string;
        summary: string;
        work_id: string | null;
        work_title: string | null;
        created_at: string;
      }>(
        `
          select m.id, m.summary, m.work_id, m.created_at, w.title as work_title
          from public.rights_memos m
          left join public.rights_works w on w.id = m.work_id
          where m.organization_id = $1
          order by m.created_at desc
          limit 12
        `,
        [organization.id]
      ),
    ]);

    return {
      mode: 'azure',
      works: worksResult.rows.length
        ? worksResult.rows.map((row) => ({
            id: row.id,
            title: row.title,
            workType: row.work_type,
            status: row.status,
            platformSource: row.platform_source,
            releaseStage: row.release_stage,
            createdAt: row.created_at,
          }))
        : seedWorks,
      evidence: evidenceResult.rows.length
        ? evidenceResult.rows.map((row) => ({
            id: row.id,
            title: row.title,
            evidenceType: row.evidence_type,
            fileUrl: row.file_url,
            workId: row.work_id,
            workTitle: row.work_title,
            createdAt: row.created_at,
          }))
        : seedEvidence,
      memos: memosResult.rows.length
        ? memosResult.rows.map((row) => ({
            id: row.id,
            summary: row.summary,
            workId: row.work_id,
            workTitle: row.work_title,
            createdAt: row.created_at,
          }))
        : seedMemos,
      warnings: [],
      timestamp: new Date().toISOString(),
    };
  } catch {
    return fallbackResponse('Azure PostgreSQL rights workspace tables are not fully available yet. Seeded works, evidence, and memo data remain active.');
  }
}

async function getSupabaseRightsWorkspaceData(workspaceSlug: string): Promise<RightsWorkspaceDataResponse | null> {
  const supabase = getServerSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data: organization } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', workspaceSlug)
    .maybeSingle();

  if (!organization) {
    return fallbackResponse('No workspace rows were found for this slug yet. Seeded rights data is still active.');
  }

  try {
    const [worksResult, evidenceResult, memosResult] = await Promise.all([
      supabase
        .from('rights_works')
        .select('id, title, work_type, status, platform_source, release_stage, created_at')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(12),
      supabase
        .from('evidence_records')
        .select('id, title, evidence_type, file_url, work_id, created_at, rights_works(title)')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(12),
      supabase
        .from('rights_memos')
        .select('id, summary, work_id, created_at, rights_works(title)')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(12),
    ]);

    const warnings: string[] = [];
    if (worksResult.error) warnings.push('Rights works could not be read from Supabase. Seed data is being used for works.');
    if (evidenceResult.error) warnings.push('Evidence records could not be read from Supabase. Seed data is being used for evidence.');
    if (memosResult.error) warnings.push('Rights memos could not be read from Supabase. Seed data is being used for memos.');

    return {
      mode: 'supabase',
      works: worksResult.data
        ? worksResult.data.map((row) => ({
            id: row.id,
            title: row.title,
            workType: row.work_type,
            status: row.status,
            platformSource: row.platform_source,
            releaseStage: row.release_stage,
            createdAt: row.created_at,
          }))
        : seedWorks,
      evidence: evidenceResult.data
        ? evidenceResult.data.map((row: any) => ({
            id: row.id,
            title: row.title,
            evidenceType: row.evidence_type,
            fileUrl: row.file_url,
            workId: row.work_id,
            workTitle: row.rights_works?.title || null,
            createdAt: row.created_at,
          }))
        : seedEvidence,
      memos: memosResult.data
        ? memosResult.data.map((row: any) => ({
            id: row.id,
            summary: row.summary,
            workId: row.work_id,
            workTitle: row.rights_works?.title || null,
            createdAt: row.created_at,
          }))
        : seedMemos,
      warnings,
      timestamp: new Date().toISOString(),
    };
  } catch {
    return fallbackResponse('Rights workspace tables are not fully available yet. Seeded works, evidence, and memo data remain active.');
  }
}

export async function getRightsWorkspaceData(workspaceSlug?: string): Promise<RightsWorkspaceDataResponse> {
  const slug = workspaceSlug || getDefaultWorkspaceSlug();

  if (isAzurePostgresConfigured()) {
    const azureData = await getAzureRightsWorkspaceData(slug);
    if (azureData) {
      return azureData;
    }
  }

  const supabaseData = await getSupabaseRightsWorkspaceData(slug);
  if (supabaseData) {
    return supabaseData;
  }

  return fallbackResponse('No configured backend responded. Seeded rights data remains active.');
}
