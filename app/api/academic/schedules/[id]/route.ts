import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await sql`
    SELECT sch.*,
      c.name AS class_name,
      c.school_id,
      s.name AS school_name,
      ay.name AS academic_year_name,
      sub.name_id AS subject_name,
      u.full_name AS teacher_name
    FROM academic_schedules sch
    JOIN core_classes c ON c.id = sch.class_id
    JOIN core_schools s ON s.id = c.school_id
    JOIN core_academic_years ay ON ay.id = sch.academic_year_id
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
  const classId = Number(b?.class_id);
  const academicYearId = Number(b?.academic_year_id);
  const dayOfWeek = b?.day_of_week != null ? String(b.day_of_week).trim() : '';
  const startTime = b?.start_time != null ? String(b.start_time).trim() : '';
  const endTime = b?.end_time != null ? String(b.end_time).trim() : '';
  if (!classId || !academicYearId || !dayOfWeek || !startTime || !endTime) {
    return NextResponse.json(
      { error: 'class_id, academic_year_id, day_of_week, start_time, end_time wajib' },
      { status: 400 }
    );
  }
  const subjectId =
    b?.subject_id != null && b.subject_id !== '' && !Number.isNaN(Number(b.subject_id))
      ? Number(b.subject_id)
      : null;
  const teacherId =
    b?.teacher_id != null && b.teacher_id !== '' && !Number.isNaN(Number(b.teacher_id))
      ? Number(b.teacher_id)
      : null;
  const isBreak = Boolean(b?.is_break);

  const [cls] = await sql`SELECT id FROM core_classes WHERE id = ${classId}`;
  if (!cls) return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 400 });
  const [ay] = await sql`SELECT id FROM core_academic_years WHERE id = ${academicYearId}`;
  if (!ay) return NextResponse.json({ error: 'Tahun ajaran tidak ditemukan' }, { status: 400 });

  const [row] = await sql`
    UPDATE academic_schedules
    SET class_id = ${classId}, academic_year_id = ${academicYearId},
        subject_id = ${subjectId}, teacher_id = ${teacherId},
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
