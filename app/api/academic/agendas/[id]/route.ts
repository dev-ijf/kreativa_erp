import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await sql`
    SELECT a.*, s.name AS school_name
    FROM academic_agendas a
    JOIN core_schools s ON s.id = a.school_id
    WHERE a.id = ${Number(id)}
  `;
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const schoolId = Number(b?.school_id);
  const eventDate = b?.event_date != null ? String(b.event_date).slice(0, 10) : '';
  const titleEn = b?.title_en != null ? String(b.title_en).trim() : '';
  const titleId = b?.title_id != null ? String(b.title_id).trim() : '';
  const eventType = b?.event_type != null ? String(b.event_type).trim() : '';
  if (!schoolId || !eventDate || !titleEn || !titleId || !eventType) {
    return NextResponse.json(
      { error: 'school_id, event_date, title_en, title_id, event_type wajib' },
      { status: 400 }
    );
  }
  const [sch] = await sql`SELECT id FROM core_schools WHERE id = ${schoolId}`;
  if (!sch) return NextResponse.json({ error: 'Sekolah tidak ditemukan' }, { status: 400 });
  const targetGrade =
    b?.target_grade != null && String(b.target_grade).trim() !== '' ? String(b.target_grade).trim() : null;
  const timeRange =
    b?.time_range != null && String(b.time_range).trim() !== '' ? String(b.time_range).trim() : null;
  const [row] = await sql`
    UPDATE academic_agendas
    SET school_id = ${schoolId}, target_grade = ${targetGrade}, event_date = ${eventDate},
        title_en = ${titleEn}, title_id = ${titleId}, time_range = ${timeRange}, event_type = ${eventType}
    WHERE id = ${Number(id)}
    RETURNING *
  `;
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await sql`DELETE FROM academic_agendas WHERE id = ${Number(id)}`;
  return NextResponse.json({ success: true });
}
