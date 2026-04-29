'use client';

import { useCallback, useEffect, useState } from 'react';
import type { WorkspaceSnapshotResponse } from '@/lib/saas-types';

export const useWorkspaceSnapshot = (workspaceSlug?: string) => {
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshotResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const reload = useCallback(() => {
    setRefreshCount((count) => count + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const params = workspaceSlug ? `?workspace=${encodeURIComponent(workspaceSlug)}` : '';
        const response = await fetch(`/api/account${params}`);

        if (!response.ok) {
          throw new Error('Workspace snapshot request failed');
        }

        const result = (await response.json()) as WorkspaceSnapshotResponse;
        if (!cancelled) {
          setSnapshot(result);
          setError(null);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : 'Failed to load workspace snapshot');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [refreshCount, workspaceSlug]);

  return { snapshot, loading, error, reload };
};
