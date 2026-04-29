import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { resolveAcademicYearId } from '@/lib/academic-student-filters';

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const q = sp.get('q')?.trim();
  const qPattern = q ? `%${q}%` : null;
  const schoolRaw = sp.get('school_id');
  const studentRaw = sp.get('student_id');
  const classRaw = sp.get('class_id');
  const ayRaw = sp.get('academic_year_id');
  const schoolId = schoolRaw && schoolRaw !== '' && !Number.isNaN(Number(schoolRaw)) ? Number(schoolRaw) : null;
  const studentId = studentRaw && studentRaw !== '' && !Number.isNaN(Number(studentRaw)) ? Number(studentRaw) : null;
  const classId = classRaw && classRaw !== '' && !Number.isNaN(Number(classRaw)) ? Number(classRaw) : null;
  const academicYearIdParam = ayRaw && ayRaw !== '' && !Number.isNaN(Number(ayRaw)) ? Number(ayRaw) : null;
  const academicYearId = await resolveAcademicYearId(academicYearIdParam);

  const rows = await sql`
    SELECT t.*,
      sub.name_id AS subject_name,
      st.full_name AS student_name,
      st.nis,
      c.name AS class_name,
      ay.name AS academic_year_name
    FROM academic_adaptive_tests t
    JOIN academic_subjects sub ON sub.id = t.subject_id
    JOIN core_students st ON st.id = t.student_id
    LEFT JOIN core_classes c ON c.id = t.class_id
    LEFT JOIN core_academic_years ay ON ay.id = t.academic_year_id
    WHERE
      (${qPattern}::text IS NULL OR st.full_name ILIKE ${qPattern}
        OR st.nis ILIKE ${qPattern}
        OR COALESCE(st.username, '') ILIKE ${qPattern})
      AND (${schoolId}::int IS NULL OR st.school_id = ${schoolId})
      AND (${studentId}::int IS NULL OR t.student_id = ${studentId})
      AND (
        ${classId}::int IS NULL
        OR (
          (
            t.class_id IS NOT NULL
            AND t.class_id = ${classId}
            AND (
              ${academicYearId}::int IS NULL
              OR t.academic_year_id IS NULL
              OR t.academic_year_id = ${academicYearId}
            )
          )
          OR (
            t.class_id IS NULL
            AND ${academicYearId}::int IS NOT NULL
            AND EXISTS (
              SELECT 1
              FROM core_student_class_histories ch
              WHERE ch.student_id = st.id
                AND ch.class_id = ${classId}
                AND ch.academic_year_id = ${academicYearId}
                AND ch.status = 'active'
            )
          )
        )
      )
    ORDER BY t.id DESC
  `;
  return NextResponse.json(rows);
}
