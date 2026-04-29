import { NextResponse } from 'next/server';
import { getBackendReadiness } from '@/lib/saas-config';

export const runtime = 'nodejs';

export function GET() {
  const backend = getBackendReadiness();

  return NextResponse.json({
    status: 'ok',
    aiEnabled: backend.gemini,
    backend,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
}
