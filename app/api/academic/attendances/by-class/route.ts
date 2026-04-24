import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { resolveAcademicYearId } from '@/lib/academic-student-filters';

const VALID_STATUSES = ['hadir', 'izin', 'sakit', 'alpha', 'terlambat'];

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const dateStr = sp.get('date')?.trim().slice(0, 10);
  const classIdRaw = sp.get('class_id');
  const ayRaw = sp.get('academic_year_id');

  if (!dateStr || !classIdRaw) {
    return NextResponse.json({ error: 'date dan class_id wajib' }, { status: 400 });
  }

  const classId = Number(classIdRaw);
  const academicYearId = await resolveAcademicYearId(
    ayRaw && !Number.isNaN(Number(ayRaw)) ? Number(ayRaw) : null
  );

  if (!academicYearId) {
    return NextResponse.json({ error: 'Tahun ajaran aktif tidak ditemukan' }, { status: 400 });
  }

  const rows = await sql`
    SELECT
      s.id AS student_id,
      s.full_name,
      s.nis,
      a.id AS attendance_id,
      a.status,
      a.note_en,
      a.note_id
    FROM core_students s
    JOIN core_student_class_histories ch
      ON ch.student_id = s.id
      AND ch.class_id = ${classId}
      AND ch.academic_year_id = ${academicYearId}
      AND ch.status = 'active'
    LEFT JOIN academic_attendances a
      ON a.student_id = s.id
      AND a.attendance_date = ${dateStr}::date
    ORDER BY s.full_name ASC
  `;

  const [cls] = await sql`SELECT name FROM core_classes WHERE id = ${classId}`;

  return NextResponse.json({
    class_name: cls?.name || null,
    date: dateStr,
    students: rows,
  });
}

export async function PUT(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    date?: string;
    class_id?: number;
    academic_year_id?: number;
    items?: { student_id: number; status: string; note_id?: string | null }[];
  } | null;

  if (!body) {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const dateStr = body.date ? String(body.date).slice(0, 10) : '';
  const classId = body.class_id ? Number(body.class_id) : 0;
  const items = Array.isArray(body.items) ? body.items : [];

  if (!dateStr || !classId || items.length === 0) {
    return NextResponse.json({ error: 'date, class_id, dan items wajib' }, { status: 400 });
  }

  for (const item of items) {
    if (!item.student_id || !item.status) {
      return NextResponse.json({ error: 'Setiap item harus memiliki student_id dan status' }, { status: 400 });
    }
    if (!VALID_STATUSES.includes(item.status)) {
      return NextResponse.json({ error: `Status "${item.status}" tidak valid` }, { status: 400 });
    }
  }

  const studentIds = items.map((i) => i.student_id);
  const statuses = items.map((i) => i.status);
  const notesId = items.map((i) => (i.note_id ? String(i.note_id).trim() : null));

  await sql`
    DELETE FROM academic_attendances
    WHERE attendance_date = ${dateStr}::date
      AND student_id = ANY(${studentIds}::int[])
  `;

  const rows = await sql`
    INSERT INTO academic_attendances (student_id, attendance_date, status, note_id)
    SELECT
      unnest(${studentIds}::int[]),
      ${dateStr}::date,
      unnest(${statuses}::varchar[]),
      unnest(${notesId}::varchar[])
    RETURNING *
  `;

  return NextResponse.json({ updated: rows.length, rows }, { status: 200 });
}
