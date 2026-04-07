import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { parseAcademicListFilters, resolveAcademicYearId } from '@/lib/academic-student-filters';

export async function GET(req: NextRequest) {
  const f = parseAcademicListFilters(req);
  const academicYearId = await resolveAcademicYearId(f.academicYearIdParam);

  const rows = await sql`
    SELECT
      s.id AS student_id,
      s.full_name,
      s.nis,
      (
        SELECT c.name
        FROM core_student_class_histories ch2
        JOIN core_classes c ON c.id = ch2.class_id
        WHERE ch2.student_id = s.id AND ch2.status = 'active'
        ORDER BY ch2.academic_year_id DESC
        LIMIT 1
      ) AS class_name,
      COUNT(t.id)::int AS row_count
    FROM core_students s
    INNER JOIN academic_attendances t ON t.student_id = s.id
    WHERE
      (${f.qPattern}::text IS NULL OR s.full_name ILIKE ${f.qPattern}
        OR s.nis ILIKE ${f.qPattern}
        OR COALESCE(s.username, '') ILIKE ${f.qPattern})
      AND (${f.schoolId}::int IS NULL OR s.school_id = ${f.schoolId})
      AND (${f.studentId}::int IS NULL OR s.id = ${f.studentId})
      AND (
        ${f.classId}::int IS NULL
        OR (
          ${academicYearId}::int IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM core_student_class_histories ch
            WHERE ch.student_id = s.id
              AND ch.class_id = ${f.classId}
              AND ch.academic_year_id = ${academicYearId}
              AND ch.status = 'active'
          )
        )
      )
    GROUP BY s.id, s.full_name, s.nis
    ORDER BY s.full_name ASC
  `;
  return NextResponse.json(rows);
}
