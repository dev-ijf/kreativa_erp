import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

async function validateScheduleFks(
  classId: number,
  academicYearId: number,
  subjectId: number | null,
  teacherId: number | null
): Promise<string | null> {
  const [cls] = await sql`SELECT id FROM core_classes WHERE id = ${classId}`;
  if (!cls) return 'Kelas tidak ditemukan';
  const [ay] = await sql`SELECT id FROM core_academic_years WHERE id = ${academicYearId}`;
  if (!ay) return 'Tahun ajaran tidak ditemukan';
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
  const schoolRaw = sp.get('school_id');
  const classRaw = sp.get('class_id');
  const ayRaw = sp.get('academic_year_id');
  const q = sp.get('q')?.trim();
  const qPattern = q ? `%${q}%` : null;

  const schoolId = schoolRaw && schoolRaw !== '' && !Number.isNaN(Number(schoolRaw)) ? Number(schoolRaw) : null;
  const classId = classRaw && classRaw !== '' && !Number.isNaN(Number(classRaw)) ? Number(classRaw) : null;
  const academicYearId = ayRaw && ayRaw !== '' && !Number.isNaN(Number(ayRaw)) ? Number(ayRaw) : null;

  const rows = await sql`
    SELECT sch.*,
      c.name AS class_name,
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
    WHERE
      (${schoolId}::int IS NULL OR c.school_id = ${schoolId})
      AND (${classId}::int IS NULL OR sch.class_id = ${classId})
      AND (${academicYearId}::int IS NULL OR sch.academic_year_id = ${academicYearId})
      AND (${qPattern}::text IS NULL
        OR sub.name_id ILIKE ${qPattern}
        OR u.full_name ILIKE ${qPattern}
        OR c.name ILIKE ${qPattern})
    ORDER BY c.name, sch.day_of_week, sch.start_time
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
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
  const err = await validateScheduleFks(classId, academicYearId, subjectId, teacherId);
  if (err) return NextResponse.json({ error: err }, { status: 400 });
  const [row] = await sql`
    INSERT INTO academic_schedules (class_id, academic_year_id, subject_id, teacher_id, day_of_week, start_time, end_time, is_break)
    VALUES (${classId}, ${academicYearId}, ${subjectId}, ${teacherId}, ${dayOfWeek}, ${startTime}, ${endTime}, ${isBreak})
    RETURNING *
  `;
  return NextResponse.json(row, { status: 201 });
}
