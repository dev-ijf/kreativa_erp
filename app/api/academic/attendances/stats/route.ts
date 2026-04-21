import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { parseAcademicListFilters, resolveAcademicYearId } from '@/lib/academic-student-filters';

export async function GET(req: NextRequest) {
  const f = parseAcademicListFilters(req);
  const academicYearId = await resolveAcademicYearId(f.academicYearIdParam);

  const [totals] = await sql`
    SELECT
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
  `;

  const daily = await sql`
    SELECT
      a.attendance_date AS date,
      COUNT(*) FILTER (WHERE a.status = 'hadir')::int AS hadir,
      (COUNT(*) - COUNT(*) FILTER (WHERE a.status = 'hadir'))::int AS tidak_hadir
    FROM academic_attendances a
    JOIN core_students s ON s.id = a.student_id
    LEFT JOIN core_student_class_histories ch
      ON ch.student_id = s.id
      AND ch.status = 'active'
      AND (${academicYearId}::int IS NULL OR ch.academic_year_id = ${academicYearId})
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
    GROUP BY a.attendance_date
    ORDER BY a.attendance_date ASC
  `;

  return NextResponse.json({ totals, daily });
}
