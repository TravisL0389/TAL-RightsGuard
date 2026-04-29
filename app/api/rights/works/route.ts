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
    works: data.works,
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
  const workType = typeof body.workType === 'string' ? body.workType.trim() : '';
  const status = typeof body.status === 'string' ? body.status.trim() : 'Draft';
  const platformSource = typeof body.platformSource === 'string' ? body.platformSource.trim() : null;
  const releaseStage = typeof body.releaseStage === 'string' ? body.releaseStage.trim() : null;

  if (!title || !workType) {
    return NextResponse.json({ error: 'Title and work type are required.' }, { status: 400 });
  }

  if (resolved.provider === 'azure') {
    const result = await queryAzure<{
      id: string;
      title: string;
      work_type: 'composition' | 'recording' | 'release' | 'agreement';
      status: string;
      platform_source: string | null;
      release_stage: string | null;
      created_at: string;
    }>(
      `
        insert into public.rights_works
          (organization_id, title, work_type, status, platform_source, release_stage)
        values ($1, $2, $3, $4, $5, $6)
        returning id, title, work_type, status, platform_source, release_stage, created_at
      `,
      [organization.id, title, workType, status, platformSource, releaseStage]
    );

    const data = result.rows[0];
    return NextResponse.json({
      work: {
        id: data.id,
        title: data.title,
        workType: data.work_type,
        status: data.status,
        platformSource: data.platform_source,
        releaseStage: data.release_stage,
        createdAt: data.created_at,
      },
    });
  }

  const { supabase } = resolved;
  const { data, error } = await supabase
    .from('rights_works')
    .insert({
      organization_id: organization.id,
      title,
      work_type: workType,
      status,
      platform_source: platformSource,
      release_stage: releaseStage,
    })
    .select('id, title, work_type, status, platform_source, release_stage, created_at')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to create rights work.' }, { status: 500 });
  }

  return NextResponse.json({
    work: {
      id: data.id,
      title: data.title,
      workType: data.work_type,
      status: data.status,
      platformSource: data.platform_source,
      releaseStage: data.release_stage,
      createdAt: data.created_at,
    },
  });
}
