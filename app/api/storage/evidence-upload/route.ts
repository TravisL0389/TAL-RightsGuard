import { NextRequest, NextResponse } from 'next/server';
import { uploadEvidenceBlob } from '@/lib/azure-blob';
import { resolveAuthorizedWorkspace } from '@/lib/workspace-access';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const workspaceSlug = typeof formData.get('workspaceSlug') === 'string' ? String(formData.get('workspaceSlug')) : undefined;
  const workId = typeof formData.get('workId') === 'string' ? String(formData.get('workId')) : null;
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'A file is required.' }, { status: 400 });
  }

  const resolved = await resolveAuthorizedWorkspace(request, workspaceSlug);
  if ('error' in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const upload = await uploadEvidenceBlob({
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      buffer: Buffer.from(arrayBuffer),
      workspaceSlug: resolved.organization.slug,
      workId,
    });

    return NextResponse.json(upload);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to upload evidence file.',
      },
      { status: 500 }
    );
  }
}
