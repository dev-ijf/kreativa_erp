import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await sql`SELECT * FROM academic_semesters WHERE id = ${Number(id)}`;
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b?.academic_year || !b?.semester_label) {
    return NextResponse.json({ error: 'academic_year dan semester_label wajib' }, { status: 400 });
  }
  const isActive = Boolean(b?.is_active);
  const [row] = await sql`
    UPDATE academic_semesters
    SET academic_year = ${String(b!.academic_year)}, semester_label = ${String(b!.semester_label)}, is_active = ${isActive}
    WHERE id = ${Number(id)}
    RETURNING *
  `;
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await sql`DELETE FROM academic_semesters WHERE id = ${Number(id)}`;
  return NextResponse.json({ success: true });
}
