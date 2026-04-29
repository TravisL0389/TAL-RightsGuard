import { Pool, type QueryResultRow } from 'pg';

let cachedPool: Pool | null | undefined;

const readEnv = (...keys: string[]) => {
  const match = keys.find((key) => Boolean(process.env[key]));
  return match ? process.env[match] : undefined;
};

export const isAzurePostgresConfigured = () => Boolean(readEnv('AZURE_POSTGRES_URL', 'DATABASE_URL'));

export const getAzurePostgresPool = () => {
  if (cachedPool !== undefined) {
    return cachedPool;
  }

  const connectionString = readEnv('AZURE_POSTGRES_URL', 'DATABASE_URL');
  if (!connectionString) {
    cachedPool = null;
    return cachedPool;
  }

  const sslEnv = (process.env.AZURE_POSTGRES_SSL || '').toLowerCase();
  const useSsl = sslEnv ? !['false', '0', 'off', 'disable'].includes(sslEnv) : true;

  cachedPool = new Pool({
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  });

  return cachedPool;
};

export async function queryAzure<T extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]) {
  const pool = getAzurePostgresPool();

  if (!pool) {
    throw new Error('Azure PostgreSQL is not configured.');
  }

  return pool.query<T>(text, values);
}
