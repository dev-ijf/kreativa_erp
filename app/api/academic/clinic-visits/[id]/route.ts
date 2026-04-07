import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await sql`
    SELECT v.*, s.full_name AS student_name, s.nis
    FROM academic_clinic_visits v
    JOIN core_students s ON s.id = v.student_id
    WHERE v.id = ${Number(id)}
  `;
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const studentId = Number(b?.student_id);
  const visitDate = b?.visit_date != null ? String(b.visit_date).slice(0, 10) : '';
  if (!studentId || !visitDate) {
    return NextResponse.json({ error: 'student_id dan visit_date wajib' }, { status: 400 });
  }
  const [st] = await sql`SELECT id FROM core_students WHERE id = ${studentId}`;
  if (!st) return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 400 });
  const complaintEn =
    b?.complaint_en != null && String(b.complaint_en).trim() !== '' ? String(b.complaint_en).trim() : null;
  const complaintId =
    b?.complaint_id != null && String(b.complaint_id).trim() !== '' ? String(b.complaint_id).trim() : null;
  const actionEn =
    b?.action_en != null && String(b.action_en).trim() !== '' ? String(b.action_en).trim() : null;
  const actionId =
    b?.action_id != null && String(b.action_id).trim() !== '' ? String(b.action_id).trim() : null;
  const handledBy =
    b?.handled_by != null && String(b.handled_by).trim() !== '' ? String(b.handled_by).trim() : null;
  const [row] = await sql`
    UPDATE academic_clinic_visits
    SET student_id = ${studentId}, visit_date = ${visitDate}, complaint_en = ${complaintEn},
        complaint_id = ${complaintId}, action_en = ${actionEn}, action_id = ${actionId}, handled_by = ${handledBy}
    WHERE id = ${Number(id)}
    RETURNING *
  `;
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await sql`DELETE FROM academic_clinic_visits WHERE id = ${Number(id)}`;
  return NextResponse.json({ success: true });
}
