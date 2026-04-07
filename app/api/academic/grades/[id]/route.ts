import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

async function validateGradeFks(
  studentId: number,
  semesterId: number,
  subjectId: number
): Promise<string | null> {
  const [st] = await sql`SELECT id FROM core_students WHERE id = ${studentId}`;
  if (!st) return 'Siswa tidak ditemukan';
  const [sem] = await sql`SELECT id FROM academic_semesters WHERE id = ${semesterId}`;
  if (!sem) return 'Semester tidak ditemukan';
  const [su] = await sql`SELECT id FROM academic_subjects WHERE id = ${subjectId}`;
  if (!su) return 'Mata pelajaran tidak ditemukan';
  return null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await sql`
    SELECT g.*,
      st.full_name AS student_name,
      sem.semester_label,
      sem.academic_year,
      sub.name_id AS subject_name
    FROM academic_grades g
    JOIN core_students st ON st.id = g.student_id
    JOIN academic_semesters sem ON sem.id = g.semester_id
    JOIN academic_subjects sub ON sub.id = g.subject_id
    WHERE g.id = ${Number(id)}
  `;
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const studentId = Number(b?.student_id);
  const semesterId = Number(b?.semester_id);
  const subjectId = Number(b?.subject_id);
  const scoreRaw = b?.score;
  if (!studentId || !semesterId || !subjectId || scoreRaw == null || scoreRaw === '') {
    return NextResponse.json(
      { error: 'student_id, semester_id, subject_id, score wajib' },
      { status: 400 }
    );
  }
  const score = String(scoreRaw).trim();
  const letterGrade =
    b?.letter_grade != null && String(b.letter_grade).trim() !== ''
      ? String(b.letter_grade).trim()
      : null;
  const err = await validateGradeFks(studentId, semesterId, subjectId);
  if (err) return NextResponse.json({ error: err }, { status: 400 });
  const [row] = await sql`
    UPDATE academic_grades
    SET student_id = ${studentId}, semester_id = ${semesterId}, subject_id = ${subjectId},
        score = ${score}, letter_grade = ${letterGrade}
    WHERE id = ${Number(id)}
    RETURNING *
  `;
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await sql`DELETE FROM academic_grades WHERE id = ${Number(id)}`;
  return NextResponse.json({ success: true });
}
