/**
 * Unggah file ke Vercel Blob lewat route internal [`/api/upload/blob`](../app/api/upload/blob/route.ts).
 * Butuh `BLOB_READ_WRITE_TOKEN` di environment.
 */
export async function uploadPublicBlob(file: File, prefix: string): Promise<string> {
  const normalized = prefix.replace(/^\/+/, '').replace(/\/+$/, '') || 'uploads';
  const fd = new FormData();
  fd.append('file', file);
  fd.append('prefix', normalized);
  const res = await fetch('/api/upload/blob', { method: 'POST', body: fd });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok) throw new Error(data.error || 'Gagal mengunggah file');
  if (!data.url) throw new Error('Respons upload tidak valid');
  return data.url;
}
