import { del } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

async function deleteBlobIfStored(url: string | null | undefined) {
  if (!url || typeof url !== 'string') return;
  if (!url.includes('blob.vercel-storage.com')) return;
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return;
  try {
    await del(url, { token });
  } catch (e) {
    console.error('blob del', e);
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await sql`
    SELECT * FROM core_student_documents
    WHERE student_id = ${Number(id)}
    ORDER BY uploaded_at DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { document_type, file_name, file_path } = body;
  const [row] = await sql`
    INSERT INTO core_student_documents (student_id, document_type, file_name, file_path)
    VALUES (${Number(id)}, ${document_type}, ${file_name}, ${file_path})
    RETURNING *
  `;
  return NextResponse.json(row, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sid = Number(id);
  const { searchParams } = new URL(req.url);
  const docId = searchParams.get('document_id');
  if (!docId) {
    return NextResponse.json({ error: 'document_id required' }, { status: 400 });
  }
  const [row] = await sql`
    SELECT file_path FROM core_student_documents
    WHERE id = ${Number(docId)} AND student_id = ${sid}
  `;
  await sql`
    DELETE FROM core_student_documents
    WHERE id = ${Number(docId)} AND student_id = ${sid}
  `;
  if (row?.file_path) {
    await deleteBlobIfStored(String(row.file_path));
  }
  return NextResponse.json({ success: true });
}
