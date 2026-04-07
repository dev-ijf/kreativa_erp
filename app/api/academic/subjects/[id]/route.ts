import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await sql`SELECT * FROM academic_subjects WHERE id = ${Number(id)}`;
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b?.name_en || !b?.name_id) {
    return NextResponse.json({ error: 'name_en dan name_id wajib' }, { status: 400 });
  }
  const code = b?.code != null ? String(b.code).trim() || null : null;
  const color = b?.color_theme != null ? String(b.color_theme).trim() || null : null;
  const [row] = await sql`
    UPDATE academic_subjects
    SET code = ${code}, name_en = ${String(b!.name_en)}, name_id = ${String(b!.name_id)}, color_theme = ${color}
    WHERE id = ${Number(id)}
    RETURNING *
  `;
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await sql`DELETE FROM academic_subjects WHERE id = ${Number(id)}`;
  return NextResponse.json({ success: true });
}
