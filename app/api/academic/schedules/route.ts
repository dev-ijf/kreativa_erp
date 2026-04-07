import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { resolveAcademicYearId } from '@/lib/academic-student-filters';

async function validateScheduleFks(
  studentId: number,
  subjectId: number | null,
  teacherId: number | null
): Promise<string | null> {
  const [st] = await sql`SELECT id FROM core_students WHERE id = ${studentId}`;
  if (!st) return 'Siswa tidak ditemukan';
  if (subjectId != null) {
    const [su] = await sql`SELECT id FROM academic_subjects WHERE id = ${subjectId}`;
    if (!su) return 'Mata pelajaran tidak ditemukan';
  }
  if (teacherId != null) {
    const [t] = await sql`SELECT id FROM core_teachers WHERE id = ${teacherId}`;
    if (!t) return 'Guru tidak ditemukan';
  }
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
    SELECT sch.*,
      st.full_name AS student_name,
      sub.name_id AS subject_name,
      u.full_name AS teacher_name
    FROM academic_schedules sch
    JOIN core_students st ON st.id = sch.student_id
    LEFT JOIN academic_subjects sub ON sub.id = sch.subject_id
    LEFT JOIN core_teachers ct ON ct.id = sch.teacher_id
    LEFT JOIN core_users u ON u.id = ct.user_id
    WHERE
      (${qPattern}::text IS NULL OR st.full_name ILIKE ${qPattern}
        OR st.nis ILIKE ${qPattern}
        OR COALESCE(st.username, '') ILIKE ${qPattern})
      AND (${schoolId}::int IS NULL OR st.school_id = ${schoolId})
      AND (${studentId}::int IS NULL OR sch.student_id = ${studentId})
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
    ORDER BY sch.student_id, sch.day_of_week, sch.start_time
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const studentId = Number(b?.student_id);
  const dayOfWeek = b?.day_of_week != null ? String(b.day_of_week).trim() : '';
  const startTime = b?.start_time != null ? String(b.start_time).trim() : '';
  const endTime = b?.end_time != null ? String(b.end_time).trim() : '';
  if (!studentId || !dayOfWeek || !startTime || !endTime) {
    return NextResponse.json(
      { error: 'student_id, day_of_week, start_time, end_time wajib' },
      { status: 400 }
    );
  }
  const subjectIdRaw = b?.subject_id;
  const subjectId =
    subjectIdRaw != null && subjectIdRaw !== '' && !Number.isNaN(Number(subjectIdRaw))
      ? Number(subjectIdRaw)
      : null;
  const teacherIdRaw = b?.teacher_id;
  const teacherId =
    teacherIdRaw != null && teacherIdRaw !== '' && !Number.isNaN(Number(teacherIdRaw))
      ? Number(teacherIdRaw)
      : null;
  const isBreak = Boolean(b?.is_break);
  const err = await validateScheduleFks(studentId, subjectId, teacherId);
  if (err) return NextResponse.json({ error: err }, { status: 400 });
  const [row] = await sql`
    INSERT INTO academic_schedules (student_id, subject_id, teacher_id, day_of_week, start_time, end_time, is_break)
    VALUES (${studentId}, ${subjectId}, ${teacherId}, ${dayOfWeek}, ${startTime}, ${endTime}, ${isBreak})
    RETURNING *
  `;
  return NextResponse.json(row, { status: 201 });
}
