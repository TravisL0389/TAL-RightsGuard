'use client';

import { useCallback, useEffect, useState } from 'react';
import type {
  EvidenceRecord,
  RightsMemo,
  RightsWork,
  RightsWorkspaceDataResponse,
} from '@/lib/saas-types';

export const useRightsWorkspaceData = (workspaceSlug?: string) => {
  const [data, setData] = useState<RightsWorkspaceDataResponse | null>(null);
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
        const [worksResponse, evidenceResponse, memosResponse] = await Promise.all([
          fetch(`/api/rights/works${params}`),
          fetch(`/api/rights/evidence${params}`),
          fetch(`/api/rights/memos${params}`),
        ]);

        if (!worksResponse.ok || !evidenceResponse.ok || !memosResponse.ok) {
          throw new Error('Failed to load rights workspace data');
        }

        const worksPayload = await worksResponse.json();
        const evidencePayload = await evidenceResponse.json();
        const memosPayload = await memosResponse.json();

        if (!cancelled) {
          setData({
            mode: worksPayload.mode || evidencePayload.mode || memosPayload.mode || 'seed',
            works: worksPayload.works || [],
            evidence: evidencePayload.evidence || [],
            memos: memosPayload.memos || [],
            warnings: [...(worksPayload.warnings || []), ...(evidencePayload.warnings || []), ...(memosPayload.warnings || [])],
            timestamp: worksPayload.timestamp || evidencePayload.timestamp || memosPayload.timestamp || new Date().toISOString(),
          });
          setError(null);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : 'Failed to load rights workspace data');
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

  return { data, loading, error, reload };
};

export const createRightsWork = async (
  accessToken: string | null | undefined,
  payload: {
    workspaceSlug: string;
    title: string;
    workType: RightsWork['workType'];
    status: string;
    platformSource?: string;
    releaseStage?: string;
  }
) => {
  const response = await fetch('/api/rights/works', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'Failed to create rights work');
  }

  return result.work as RightsWork;
};

export const createEvidenceRecord = async (
  accessToken: string | null | undefined,
  payload: {
    workspaceSlug: string;
    title: string;
    evidenceType: string;
    workId?: string;
    fileUrl?: string;
  }
) => {
  const response = await fetch('/api/rights/evidence', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'Failed to create evidence record');
  }

  return result.evidence as EvidenceRecord;
};

export const createRightsMemo = async (
  accessToken: string | null | undefined,
  payload: {
    workspaceSlug: string;
    summary: string;
    workId?: string;
  }
) => {
  const response = await fetch('/api/rights/memos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'Failed to create rights memo');
  }

  return result.memo as RightsMemo;
};

export const uploadEvidenceFile = async (
  accessToken: string | null | undefined,
  payload: {
    workspaceSlug: string;
    workId?: string;
    file: File;
  }
) => {
  const formData = new FormData();
  formData.append('workspaceSlug', payload.workspaceSlug);
  if (payload.workId) {
    formData.append('workId', payload.workId);
  }
  formData.append('file', payload.file);

  const response = await fetch('/api/storage/evidence-upload', {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    body: formData,
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'Failed to upload evidence file');
  }

  return result as { blobName: string; url: string };
};
