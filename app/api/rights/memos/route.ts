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
    memos: data.memos,
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
  const summary = typeof body.summary === 'string' ? body.summary.trim() : '';
  const workId = typeof body.workId === 'string' && body.workId.trim() ? body.workId.trim() : null;

  if (!summary) {
    return NextResponse.json({ error: 'Memo summary is required.' }, { status: 400 });
  }

  if (resolved.provider === 'azure') {
    const result = await queryAzure<{
      id: string;
      summary: string;
      work_id: string | null;
      work_title: string | null;
      created_at: string;
    }>(
      `
        insert into public.rights_memos
          (organization_id, work_id, summary)
        values ($1, $2, $3)
        returning
          id,
          summary,
          work_id,
          created_at,
          (select title from public.rights_works where id = work_id) as work_title
      `,
      [organization.id, workId, summary]
    );

    const data = result.rows[0];
    return NextResponse.json({
      memo: {
        id: data.id,
        summary: data.summary,
        workId: data.work_id,
        workTitle: data.work_title,
        createdAt: data.created_at,
      },
    });
  }

  const { supabase } = resolved;
  const { data, error } = await supabase
    .from('rights_memos')
    .insert({
      organization_id: organization.id,
      work_id: workId,
      summary,
    })
    .select('id, summary, work_id, created_at, rights_works(title)')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to create rights memo.' }, { status: 500 });
  }

  return NextResponse.json({
    memo: {
      id: data.id,
      summary: data.summary,
      workId: data.work_id,
      workTitle: (data as { rights_works?: { title?: string | null } }).rights_works?.title || null,
      createdAt: data.created_at,
    },
  });
}
