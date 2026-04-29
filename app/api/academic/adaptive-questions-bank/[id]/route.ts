import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { parseOptionsJson } from '@/lib/adaptive-question-options';
import { normalizeLang, validateAdaptiveQuestionsBankPayload } from '@/lib/adaptive-questions-bank-validate';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const nid = Number(id);
  if (!Number.isFinite(nid)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const [row] = await sql`
    SELECT
      b.*,
      s.name_id AS subject_name_id,
      s.name_en AS subject_name_en,
      lg.name AS level_grade_name
    FROM academic_adaptive_questions_bank b
    LEFT JOIN academic_subjects s ON s.id = b.subject_id
    LEFT JOIN core_level_grades lg ON lg.id = b.level_grade_id
    WHERE b.id = ${nid}
  `;
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const nid = Number(id);
  if (!Number.isFinite(nid)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const err = validateAdaptiveQuestionsBankPayload(b);
  if (err) return NextResponse.json(err, { status: 400 });

  const subjectId = Number(b!.subject_id);
  const gradeBand = String(b!.grade_band).trim();
  const difficulty = String(b!.difficulty).trim();
  const questionText = String(b!.question_text);
  const optionsArr = parseOptionsJson(b!.options_json).map((x) => String(x).trim()).filter(Boolean);
  const correctAnswer = String(b!.correct_answer).trim();
  const explanation =
    b!.explanation != null && String(b!.explanation).trim() !== '' ? String(b!.explanation) : null;
  const lang = normalizeLang(b!.lang)!;
  const generatedBy =
    b!.generated_by != null && String(b!.generated_by).trim() !== '' ? String(b!.generated_by).trim() : null;
  const levelGradeIdRaw = b!.level_grade_id;
  const levelGradeId =
    levelGradeIdRaw != null && String(levelGradeIdRaw).trim() !== ''
      ? Number(levelGradeIdRaw)
      : null;

  const optsJson = JSON.stringify(optionsArr);

  const [row] = await sql`
    UPDATE academic_adaptive_questions_bank
    SET
      subject_id = ${subjectId},
      grade_band = ${gradeBand},
      difficulty = ${difficulty},
      question_text = ${questionText},
      options_json = ${optsJson}::jsonb,
      correct_answer = ${correctAnswer},
      explanation = ${explanation},
      lang = ${lang},
      generated_by = ${generatedBy},
      level_grade_id = ${levelGradeId}
    WHERE id = ${nid}
    RETURNING *
  `;
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const nid = Number(id);
  if (!Number.isFinite(nid)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  await sql`DELETE FROM academic_adaptive_questions_bank WHERE id = ${nid}`;
  return NextResponse.json({ success: true });
}
