'use client';

import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getBrowserSupabaseClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser';

export const useSupabaseAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();

    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) {
        return;
      }

      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_, nextSession) => {
      if (!active) {
        return;
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return {
    supabase: getBrowserSupabaseClient(),
    isConfigured: isSupabaseBrowserConfigured(),
    session,
    user,
    loading,
  };
};
