import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await sql`
    SELECT
      ma.id,
      ma.module_id,
      ma.school_id,
      ma.level_grade_id,
      ma.is_visible,
      m.module_code,
      m.module_name,
      s.name AS school_name,
      lg.name AS level_grade_name
    FROM core_module_access ma
    JOIN core_app_modules m ON ma.module_id = m.id
    LEFT JOIN core_schools s ON ma.school_id = s.id
    LEFT JOIN core_level_grades lg ON ma.level_grade_id = lg.id
    WHERE ma.id = ${Number(id)}
  `;
  if (!row) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await req.json();
  const module_id = Number(b.module_id);
  if (!Number.isFinite(module_id)) {
    return NextResponse.json({ error: 'module_id wajib' }, { status: 400 });
  }
  const school_id =
    b.school_id != null && b.school_id !== '' ? Number(b.school_id) : null;
  const level_grade_id =
    b.level_grade_id != null && b.level_grade_id !== '' ? Number(b.level_grade_id) : null;
  const is_visible = b.is_visible === false ? false : true;

  try {
    const [row] = await sql`
      UPDATE core_module_access
      SET module_id = ${module_id},
          school_id = ${school_id},
          level_grade_id = ${level_grade_id},
          is_visible = ${is_visible}
      WHERE id = ${Number(id)}
      RETURNING id, module_id, school_id, level_grade_id, is_visible
    `;
    if (!row) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
    return NextResponse.json(row);
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === '23505') {
      return NextResponse.json(
        { error: 'Kombinasi modul + sekolah + tingkat sudah ada' },
        { status: 409 }
      );
    }
    throw e;
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [gone] = await sql`DELETE FROM core_module_access WHERE id = ${Number(id)} RETURNING id`;
  if (!gone) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  return NextResponse.json({ success: true });
}
