import { isAzureBlobConfigured } from '@/lib/azure-blob';
import { isAzurePostgresConfigured } from '@/lib/azure-postgres';
import type { BackendReadiness } from '@/lib/saas-types';

const readServerEnv = (...keys: string[]) => {
  const match = keys.find((key) => Boolean(process.env[key]));
  return match ? process.env[match] : undefined;
};

export const getBackendReadiness = (): BackendReadiness => ({
  supabase: Boolean(readServerEnv('SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL') && readServerEnv('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY')),
  stripe: Boolean(readServerEnv('STRIPE_SECRET_KEY')),
  resend: Boolean(readServerEnv('RESEND_API_KEY')),
  gemini: Boolean(readServerEnv('GEMINI_API_KEY')),
  azurePostgres: isAzurePostgresConfigured(),
  azureBlob: isAzureBlobConfigured(),
});

export const getDefaultWorkspaceSlug = () => readServerEnv('DEFAULT_WORKSPACE_SLUG') || 'rightsguard';

export const getSupabaseServerConfig = () => ({
  url: readServerEnv('SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'),
  key: readServerEnv('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
});
