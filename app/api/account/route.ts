import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceSnapshot } from '@/lib/account-service';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const workspaceSlug = request.nextUrl.searchParams.get('workspace') || request.headers.get('x-workspace-slug') || undefined;
  const snapshot = await getWorkspaceSnapshot(workspaceSlug);
  return NextResponse.json(snapshot);
}
