import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

/**
 * Query opsional:
 * - school_id + for_active_year=1: kelas sekolah pada tahun ajaran aktif (default hanya yang punya siswa aktif).
 * - include_empty=1: sertakan kelas tanpa siswa (untuk penugasan guru sebelum siswa masuk).
 */
export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const schoolIdRaw = sp.get('school_id');
  const forActiveYear = sp.get('for_active_year') === '1';
  const includeEmpty = sp.get('include_empty') === '1';

  if (forActiveYear && schoolIdRaw) {
    const schoolId = Number(schoolIdRaw);
    const [ay] = await sql`
      SELECT id, name FROM core_academic_years WHERE is_active = true LIMIT 1
    `;
    if (!ay) {
      return NextResponse.json([]);
    }
    const ayId = ay.id;
    if (includeEmpty) {
      const rows = await sql`
        SELECT c.*, s.name AS school_name, lg.name AS level_name
        FROM core_classes c
        JOIN core_schools s ON c.school_id = s.id
        JOIN core_level_grades lg ON c.level_grade_id = lg.id
        WHERE c.school_id = ${schoolId}
        ORDER BY lg.level_order ASC, c.name ASC
      `;
      return NextResponse.json(rows.map((r) => ({ ...r, filter_academic_year_id: ayId })));
    }
    const rows = await sql`
      SELECT DISTINCT c.*, s.name AS school_name, lg.name AS level_name, lg.level_order
      FROM core_classes c
      JOIN core_schools s ON c.school_id = s.id
      JOIN core_level_grades lg ON c.level_grade_id = lg.id
      INNER JOIN core_student_class_histories ch ON ch.class_id = c.id
        AND ch.academic_year_id = ${ayId}
        AND ch.status = 'active'
      WHERE c.school_id = ${schoolId}
      ORDER BY lg.level_order ASC, c.name ASC
    `;
    return NextResponse.json(rows.map((r) => ({ ...r, filter_academic_year_id: ayId })));
  }

  const rows = await sql`
    SELECT c.*, s.name as school_name, lg.name as level_name 
    FROM core_classes c
    JOIN core_schools s ON c.school_id = s.id
    JOIN core_level_grades lg ON c.level_grade_id = lg.id
    ORDER BY s.name ASC, lg.level_order ASC, c.name ASC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { school_id, level_grade_id, name } = await req.json();
  const [row] = await sql`
    INSERT INTO core_classes (school_id, level_grade_id, name) 
    VALUES (${school_id}, ${level_grade_id}, ${name}) RETURNING *
  `;
  return NextResponse.json(row, { status: 201 });
}
