import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { parseAcademicListFilters, resolveAcademicYearId } from '@/lib/academic-student-filters';

export async function GET(req: NextRequest) {
  const f = parseAcademicListFilters(req);
  const academicYearId = await resolveAcademicYearId(f.academicYearIdParam);

  const rows = await sql`
    SELECT
      a.attendance_date,
      c.id   AS class_id,
      c.name AS class_name,
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE a.status = 'hadir')::int     AS hadir,
      COUNT(*) FILTER (WHERE a.status = 'izin')::int      AS izin,
      COUNT(*) FILTER (WHERE a.status = 'sakit')::int     AS sakit,
      COUNT(*) FILTER (WHERE a.status = 'alpha')::int     AS alpha,
      COUNT(*) FILTER (WHERE a.status = 'terlambat')::int AS terlambat
    FROM academic_attendances a
    JOIN core_students s ON s.id = a.student_id
    LEFT JOIN core_student_class_histories ch
      ON ch.student_id = s.id
      AND ch.status = 'active'
      AND (${academicYearId}::int IS NULL OR ch.academic_year_id = ${academicYearId})
    LEFT JOIN core_classes c ON c.id = ch.class_id
    WHERE
      (${f.schoolId}::int IS NULL OR s.school_id = ${f.schoolId})
      AND (
        ${f.classId}::int IS NULL
        OR (
          ${academicYearId}::int IS NOT NULL
          AND ch.class_id = ${f.classId}
          AND ch.academic_year_id = ${academicYearId}
        )
      )
    GROUP BY a.attendance_date, c.id, c.name
    ORDER BY a.attendance_date DESC, c.name ASC
  `;
  return NextResponse.json(rows);
}
