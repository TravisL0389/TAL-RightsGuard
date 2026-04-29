import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseServerConfig } from '@/lib/saas-config';

let cachedClient: SupabaseClient | null | undefined;

export const getServerSupabaseClient = () => {
  if (cachedClient !== undefined) {
    return cachedClient;
  }

  const { url, key } = getSupabaseServerConfig();
  if (!url || !key) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedClient;
};
