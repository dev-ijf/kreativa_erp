import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

interface BulkItem {
  student_id: number;
  status: string;
  note_en?: string | null;
  note_id?: string | null;
}

const VALID_STATUSES = ['hadir', 'izin', 'sakit', 'alpha', 'terlambat'];

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    attendance_date?: string;
    items?: BulkItem[];
  } | null;

  if (!body) {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const attendanceDate = body.attendance_date ? String(body.attendance_date).slice(0, 10) : '';
  const items = Array.isArray(body.items) ? body.items : [];

  if (!attendanceDate || items.length === 0) {
    return NextResponse.json({ error: 'attendance_date dan items wajib diisi' }, { status: 400 });
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
  const notesEn = items.map((i) => (i.note_en ? String(i.note_en).trim() : null));
  const notesId = items.map((i) => (i.note_id ? String(i.note_id).trim() : null));

  await sql`
    DELETE FROM academic_attendances
    WHERE attendance_date = ${attendanceDate}::date
      AND student_id = ANY(${studentIds}::int[])
  `;

  const rows = await sql`
    INSERT INTO academic_attendances (student_id, attendance_date, status, note_en, note_id)
    SELECT
      unnest(${studentIds}::int[]),
      ${attendanceDate}::date,
      unnest(${statuses}::varchar[]),
      unnest(${notesEn}::varchar[]),
      unnest(${notesId}::varchar[])
    RETURNING *
  `;

  return NextResponse.json({ inserted: rows.length, rows }, { status: 201 });
}
