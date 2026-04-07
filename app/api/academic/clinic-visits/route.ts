import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { resolveAcademicYearId } from '@/lib/academic-student-filters';

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
    SELECT v.*, s.full_name AS student_name, s.nis
    FROM academic_clinic_visits v
    JOIN core_students s ON s.id = v.student_id
    WHERE
      (${qPattern}::text IS NULL OR s.full_name ILIKE ${qPattern}
        OR s.nis ILIKE ${qPattern}
        OR COALESCE(s.username, '') ILIKE ${qPattern})
      AND (${schoolId}::int IS NULL OR s.school_id = ${schoolId})
      AND (${studentId}::int IS NULL OR v.student_id = ${studentId})
      AND (
        ${classId}::int IS NULL
        OR (
          ${academicYearId}::int IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM core_student_class_histories ch
            WHERE ch.student_id = s.id
              AND ch.class_id = ${classId}
              AND ch.academic_year_id = ${academicYearId}
              AND ch.status = 'active'
          )
        )
      )
    ORDER BY v.visit_date DESC, v.id DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
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
    INSERT INTO academic_clinic_visits (
      student_id, visit_date, complaint_en, complaint_id, action_en, action_id, handled_by
    )
    VALUES (${studentId}, ${visitDate}, ${complaintEn}, ${complaintId}, ${actionEn}, ${actionId}, ${handledBy})
    RETURNING *
  `;
  return NextResponse.json(row, { status: 201 });
}
