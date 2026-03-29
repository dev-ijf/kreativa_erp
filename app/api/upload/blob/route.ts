import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

const MAX_BYTES = 10 * 1024 * 1024;

/**
 * multipart/form-data: field `file` (wajib), `prefix` (opsional, mis. students/123/photos)
 */
export async function POST(req: NextRequest) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json(
      {
        error:
          'BLOB_READ_WRITE_TOKEN belum diset. Buat token di Vercel Storage / Blob dan tambahkan ke .env.local',
      },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const file = form.get('file');
  const prefixRaw = form.get('prefix');
  const prefix =
    typeof prefixRaw === 'string'
      ? prefixRaw.replace(/^\/+/, '').replace(/\/+$/, '')
      : 'uploads';

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Field file wajib' }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'File kosong' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File terlalu besar (maks 10 MB)' }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'file';
  const pathname = `${prefix}/${Date.now()}-${safeName}`;

  try {
    const blob = await put(pathname, file, { access: 'public', token });
    return NextResponse.json({ url: blob.url, pathname: blob.pathname });
  } catch (e) {
    console.error('blob put', e);
    return NextResponse.json({ error: 'Gagal mengunggah ke penyimpanan' }, { status: 500 });
  }
}
