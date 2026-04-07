import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { resolveAcademicYearId } from '@/lib/academic-student-filters';

async function validateGradeFks(
  studentId: number,
  semesterId: number,
  subjectId: number
): Promise<string | null> {
  const [st] = await sql`SELECT id FROM core_students WHERE id = ${studentId}`;
  if (!st) return 'Siswa tidak ditemukan';
  const [sem] = await sql`SELECT id FROM academic_semesters WHERE id = ${semesterId}`;
  if (!sem) return 'Semester tidak ditemukan';
  const [su] = await sql`SELECT id FROM academic_subjects WHERE id = ${subjectId}`;
  if (!su) return 'Mata pelajaran tidak ditemukan';
  return null;
}

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
    SELECT g.*,
      st.full_name AS student_name,
      sem.semester_label,
      sem.academic_year,
      sub.name_id AS subject_name
    FROM academic_grades g
    JOIN core_students st ON st.id = g.student_id
    JOIN academic_semesters sem ON sem.id = g.semester_id
    JOIN academic_subjects sub ON sub.id = g.subject_id
    WHERE
      (${qPattern}::text IS NULL OR st.full_name ILIKE ${qPattern}
        OR st.nis ILIKE ${qPattern}
        OR COALESCE(st.username, '') ILIKE ${qPattern})
      AND (${schoolId}::int IS NULL OR st.school_id = ${schoolId})
      AND (${studentId}::int IS NULL OR g.student_id = ${studentId})
      AND (
        ${classId}::int IS NULL
        OR (
          ${academicYearId}::int IS NOT NULL
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
    ORDER BY g.id DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const studentId = Number(b?.student_id);
  const semesterId = Number(b?.semester_id);
  const subjectId = Number(b?.subject_id);
  const scoreRaw = b?.score;
  if (!studentId || !semesterId || !subjectId || scoreRaw == null || scoreRaw === '') {
    return NextResponse.json(
      { error: 'student_id, semester_id, subject_id, score wajib' },
      { status: 400 }
    );
  }
  const score = String(scoreRaw).trim();
  const letterGrade =
    b?.letter_grade != null && String(b.letter_grade).trim() !== ''
      ? String(b.letter_grade).trim()
      : null;
  const err = await validateGradeFks(studentId, semesterId, subjectId);
  if (err) return NextResponse.json({ error: err }, { status: 400 });
  const [row] = await sql`
    INSERT INTO academic_grades (student_id, semester_id, subject_id, score, letter_grade)
    VALUES (${studentId}, ${semesterId}, ${subjectId}, ${score}, ${letterGrade})
    RETURNING *
  `;
  return NextResponse.json(row, { status: 201 });
}
