import { NextRequest, NextResponse } from 'next/server';
import { queryAzure } from '@/lib/azure-postgres';
import { getRightsWorkspaceData } from '@/lib/rights-workspace-service';
import { resolveAuthorizedWorkspace } from '@/lib/workspace-access';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const workspaceSlug = request.nextUrl.searchParams.get('workspace') || undefined;
  const data = await getRightsWorkspaceData(workspaceSlug);
  return NextResponse.json({
    mode: data.mode,
    evidence: data.evidence,
    warnings: data.warnings,
    timestamp: data.timestamp,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const workspaceSlug = typeof body.workspaceSlug === 'string' ? body.workspaceSlug : undefined;
  const resolved = await resolveAuthorizedWorkspace(request, workspaceSlug);

  if ('error' in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const { organization } = resolved;
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const evidenceType = typeof body.evidenceType === 'string' ? body.evidenceType.trim() : '';
  const fileUrl = typeof body.fileUrl === 'string' && body.fileUrl.trim() ? body.fileUrl.trim() : null;
  const workId = typeof body.workId === 'string' && body.workId.trim() ? body.workId.trim() : null;

  if (!title || !evidenceType) {
    return NextResponse.json({ error: 'Title and evidence type are required.' }, { status: 400 });
  }

  if (resolved.provider === 'azure') {
    const result = await queryAzure<{
      id: string;
      title: string;
      evidence_type: string;
      file_url: string | null;
      work_id: string | null;
      work_title: string | null;
      created_at: string;
    }>(
      `
        insert into public.evidence_records
          (organization_id, work_id, title, evidence_type, file_url)
        values ($1, $2, $3, $4, $5)
        returning
          id,
          title,
          evidence_type,
          file_url,
          work_id,
          created_at,
          (select title from public.rights_works where id = work_id) as work_title
      `,
      [organization.id, workId, title, evidenceType, fileUrl]
    );

    const data = result.rows[0];
    return NextResponse.json({
      evidence: {
        id: data.id,
        title: data.title,
        evidenceType: data.evidence_type,
        fileUrl: data.file_url,
        workId: data.work_id,
        workTitle: data.work_title,
        createdAt: data.created_at,
      },
    });
  }

  const { supabase } = resolved;
  const { data, error } = await supabase
    .from('evidence_records')
    .insert({
      organization_id: organization.id,
      work_id: workId,
      title,
      evidence_type: evidenceType,
      file_url: fileUrl,
    })
    .select('id, title, evidence_type, file_url, work_id, created_at, rights_works(title)')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to create evidence record.' }, { status: 500 });
  }

  return NextResponse.json({
    evidence: {
      id: data.id,
      title: data.title,
      evidenceType: data.evidence_type,
      fileUrl: data.file_url,
      workId: data.work_id,
      workTitle: (data as { rights_works?: { title?: string | null } }).rights_works?.title || null,
      createdAt: data.created_at,
    },
  });
}
