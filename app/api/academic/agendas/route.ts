import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const rows = await sql`
    SELECT a.*, s.name AS school_name
    FROM academic_agendas a
    JOIN core_schools s ON s.id = a.school_id
    ORDER BY a.event_date DESC, a.id DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
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
    INSERT INTO academic_agendas (school_id, target_grade, event_date, title_en, title_id, time_range, event_type)
    VALUES (${schoolId}, ${targetGrade}, ${eventDate}, ${titleEn}, ${titleId}, ${timeRange}, ${eventType})
    RETURNING *
  `;
  return NextResponse.json(row, { status: 201 });
}
