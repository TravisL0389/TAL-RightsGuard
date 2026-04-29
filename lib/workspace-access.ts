import { type NextRequest } from 'next/server';
import { isAzurePostgresConfigured, queryAzure } from '@/lib/azure-postgres';
import { getDefaultWorkspaceSlug } from '@/lib/saas-config';
import { getServerSupabaseClient } from '@/lib/supabase-server';

export async function resolveWorkspaceBySlug(workspaceSlug?: string) {
  const slug = workspaceSlug || getDefaultWorkspaceSlug();

  if (isAzurePostgresConfigured()) {
    const organizationResult = await queryAzure<{ id: string; name: string; slug: string }>(
      'select id, name, slug from public.organizations where slug = $1 limit 1',
      [slug]
    );

    const organization = organizationResult.rows[0];
    if (!organization) {
      return { error: 'Workspace was not found.', status: 404 as const };
    }

    return { provider: 'azure' as const, organization };
  }

  const supabase = getServerSupabaseClient();
  if (!supabase) {
    return { error: 'No configured database backend is available.', status: 503 as const };
  }

  const { data: organization } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', slug)
    .maybeSingle();

  if (!organization) {
    return { error: 'Workspace was not found.', status: 404 as const };
  }

  return { provider: 'supabase' as const, supabase, organization };
}

export async function resolveAuthorizedWorkspace(request: NextRequest, workspaceSlug?: string) {
  const base = await resolveWorkspaceBySlug(workspaceSlug);
  if ('error' in base) {
    return base;
  }

  if (base.provider === 'azure') {
    return {
      provider: 'azure' as const,
      organization: base.organization,
      user: {
        id: 'azure-owner-mode',
        email: 'owner-mode@local',
      },
      membership: {
        id: 'azure-owner-membership',
        role: 'owner',
      },
    };
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';

  if (!token) {
    return { error: 'Missing bearer token.', status: 401 as const };
  }

  const { supabase, organization } = base;
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  const user = userData.user;

  if (userError || !user) {
    return { error: 'Invalid Supabase session.', status: 401 as const };
  }

  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('id, role')
    .eq('organization_id', organization.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return { error: 'You do not have access to this workspace.', status: 403 as const };
  }

  return { provider: 'supabase' as const, supabase, organization, user, membership };
}
