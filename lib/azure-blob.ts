import { BlobServiceClient } from '@azure/storage-blob';

let cachedClient: BlobServiceClient | null | undefined;

const readEnv = (...keys: string[]) => {
  const match = keys.find((key) => Boolean(process.env[key]));
  return match ? process.env[match] : undefined;
};

export const isAzureBlobConfigured = () => Boolean(readEnv('AZURE_BLOB_CONNECTION_STRING'));

export const getBlobServiceClient = () => {
  if (cachedClient !== undefined) {
    return cachedClient;
  }

  const connectionString = readEnv('AZURE_BLOB_CONNECTION_STRING');
  if (!connectionString) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = BlobServiceClient.fromConnectionString(connectionString);
  return cachedClient;
};

export const getEvidenceContainerName = () => readEnv('AZURE_BLOB_CONTAINER_EVIDENCE') || 'rights-evidence';

export async function ensureEvidenceContainer() {
  const client = getBlobServiceClient();
  if (!client) {
    throw new Error('Azure Blob Storage is not configured.');
  }

  const containerClient = client.getContainerClient(getEvidenceContainerName());
  await containerClient.createIfNotExists();
  return containerClient;
}

export async function uploadEvidenceBlob({
  fileName,
  contentType,
  buffer,
  workspaceSlug,
  workId,
}: {
  fileName: string;
  contentType: string;
  buffer: Buffer;
  workspaceSlug: string;
  workId?: string | null;
}) {
  const containerClient = await ensureEvidenceContainer();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, '-');
  const blobName = `${workspaceSlug}/${workId || 'unassigned'}/${Date.now()}-${safeName}`;
  const blobClient = containerClient.getBlockBlobClient(blobName);

  await blobClient.uploadData(buffer, {
    blobHTTPHeaders: {
      blobContentType: contentType,
    },
  });

  return {
    blobName,
    url: blobClient.url,
  };
}
