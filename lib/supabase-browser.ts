'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null | undefined;

export const isSupabaseBrowserConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const getBrowserSupabaseClient = () => {
  if (browserClient !== undefined) {
    return browserClient;
  }

  if (!isSupabaseBrowserConfigured()) {
    browserClient = null;
    return browserClient;
  }

  browserClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  );

  return browserClient;
};
