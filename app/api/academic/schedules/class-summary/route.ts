import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const schoolRaw = sp.get('school_id');
  const ayRaw = sp.get('academic_year_id');

  const schoolId = schoolRaw && schoolRaw !== '' && !Number.isNaN(Number(schoolRaw)) ? Number(schoolRaw) : null;
  const academicYearId = ayRaw && ayRaw !== '' && !Number.isNaN(Number(ayRaw)) ? Number(ayRaw) : null;

  const rows = await sql`
    SELECT
      c.id AS class_id,
      c.name AS class_name,
      s.name AS school_name,
      ay.id AS academic_year_id,
      ay.name AS academic_year_name,
      COUNT(sch.id)::int AS slot_count
    FROM core_classes c
    JOIN core_schools s ON s.id = c.school_id
    INNER JOIN academic_schedules sch ON sch.class_id = c.id
    JOIN core_academic_years ay ON ay.id = sch.academic_year_id
    WHERE
      (${schoolId}::int IS NULL OR c.school_id = ${schoolId})
      AND (${academicYearId}::int IS NULL OR sch.academic_year_id = ${academicYearId})
    GROUP BY c.id, c.name, s.name, ay.id, ay.name
    ORDER BY s.name, c.name, ay.name
  `;
  return NextResponse.json(rows);
}
