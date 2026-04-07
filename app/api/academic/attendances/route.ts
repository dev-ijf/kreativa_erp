import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const rows = await sql`
    SELECT a.*, s.full_name AS student_name, s.nis
    FROM academic_attendances a
    JOIN core_students s ON s.id = a.student_id
    ORDER BY a.attendance_date DESC, a.id DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const studentId = Number(b?.student_id);
  const attendanceDate = b?.attendance_date != null ? String(b.attendance_date).slice(0, 10) : '';
  const status = b?.status != null ? String(b.status).trim() : '';
  if (!studentId || !attendanceDate || !status) {
    return NextResponse.json({ error: 'student_id, attendance_date, status wajib' }, { status: 400 });
  }
  const [st] = await sql`SELECT id FROM core_students WHERE id = ${studentId}`;
  if (!st) return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 400 });
  const noteEn =
    b?.note_en != null && String(b.note_en).trim() !== '' ? String(b.note_en).trim() : null;
  const noteId =
    b?.note_id != null && String(b.note_id).trim() !== '' ? String(b.note_id).trim() : null;
  const [row] = await sql`
    INSERT INTO academic_attendances (student_id, attendance_date, status, note_en, note_id)
    VALUES (${studentId}, ${attendanceDate}, ${status}, ${noteEn}, ${noteId})
    RETURNING *
  `;
  return NextResponse.json(row, { status: 201 });
}
