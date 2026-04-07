import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await sql`
    SELECT a.*, s.full_name AS student_name, s.nis
    FROM academic_attendances a
    JOIN core_students s ON s.id = a.student_id
    WHERE a.id = ${Number(id)}
  `;
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
    UPDATE academic_attendances
    SET student_id = ${studentId}, attendance_date = ${attendanceDate}, status = ${status},
        note_en = ${noteEn}, note_id = ${noteId}
    WHERE id = ${Number(id)}
    RETURNING *
  `;
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await sql`DELETE FROM academic_attendances WHERE id = ${Number(id)}`;
  return NextResponse.json({ success: true });
}
