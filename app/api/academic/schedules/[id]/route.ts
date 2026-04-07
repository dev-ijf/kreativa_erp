import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await sql`
    SELECT sch.*,
      st.full_name AS student_name,
      sub.name_id AS subject_name,
      u.full_name AS teacher_name
    FROM academic_schedules sch
    JOIN core_students st ON st.id = sch.student_id
    LEFT JOIN academic_subjects sub ON sub.id = sch.subject_id
    LEFT JOIN core_teachers ct ON ct.id = sch.teacher_id
    LEFT JOIN core_users u ON u.id = ct.user_id
    WHERE sch.id = ${Number(id)}
  `;
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
    UPDATE academic_schedules
    SET student_id = ${studentId}, subject_id = ${subjectId}, teacher_id = ${teacherId},
        day_of_week = ${dayOfWeek}, start_time = ${startTime}, end_time = ${endTime}, is_break = ${isBreak}
    WHERE id = ${Number(id)}
    RETURNING *
  `;
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await sql`DELETE FROM academic_schedules WHERE id = ${Number(id)}`;
  return NextResponse.json({ success: true });
}
