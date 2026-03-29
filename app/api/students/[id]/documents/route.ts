import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

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
  const { searchParams } = new URL(req.url);
  const docId = searchParams.get('document_id');
  if (!docId) {
    return NextResponse.json({ error: 'document_id required' }, { status: 400 });
  }
  await sql`
    DELETE FROM core_student_documents
    WHERE id = ${Number(docId)} AND student_id = ${Number(id)}
  `;
  return NextResponse.json({ success: true });
}
