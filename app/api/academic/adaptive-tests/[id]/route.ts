import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tid = Number(id);
  const [test] = await sql`
    SELECT t.*,
      sub.name_id AS subject_name,
      st.full_name AS student_name,
      st.nis
    FROM academic_adaptive_tests t
    JOIN academic_subjects sub ON sub.id = t.subject_id
    JOIN core_students st ON st.id = t.student_id
    WHERE t.id = ${tid}
  `;
  if (!test) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const tr = test as Record<string, unknown>;
  const subjectId = Number(tr.subject_id);

  let questions: Record<string, unknown>[];
  try {
    questions = await sql`
      SELECT *
      FROM academic_adaptive_questions
      WHERE adaptive_test_id = ${tid}
      ORDER BY difficulty ASC, id ASC
    `;
  } catch (err: unknown) {
    const code =
      err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : '';
    // Kolom belum ada — jalankan migrasi 0006. Fallback: soal per mapel tes ini.
    if (code === '42703' && Number.isFinite(subjectId)) {
      questions = await sql`
        SELECT *
        FROM academic_adaptive_questions
        WHERE subject_id = ${subjectId}
        ORDER BY difficulty ASC, id ASC
      `;
    } else {
      console.error(err);
      return NextResponse.json(
        { error: 'Gagal memuat soal', test, questions: [] },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ test, questions });
}
