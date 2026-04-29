import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { parseOptionsJson } from '@/lib/adaptive-question-options';
import { normalizeLang, validateAdaptiveQuestionsBankPayload } from '@/lib/adaptive-questions-bank-validate';

export async function GET() {
  const rows = await sql`
    SELECT
      b.id,
      b.subject_id,
      b.grade_band,
      b.difficulty,
      b.question_text,
      b.options_json,
      b.correct_answer,
      b.explanation,
      b.lang,
      b.generated_by,
      b.level_grade_id,
      s.name_id AS subject_name_id,
      s.name_en AS subject_name_en,
      lg.name AS level_grade_name
    FROM academic_adaptive_questions_bank b
    LEFT JOIN academic_subjects s ON s.id = b.subject_id
    LEFT JOIN core_level_grades lg ON lg.id = b.level_grade_id
    ORDER BY b.id DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
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
    INSERT INTO academic_adaptive_questions_bank (
      subject_id,
      grade_band,
      difficulty,
      question_text,
      options_json,
      correct_answer,
      explanation,
      lang,
      generated_by,
      level_grade_id
    )
    VALUES (
      ${subjectId},
      ${gradeBand},
      ${difficulty},
      ${questionText},
      ${optsJson}::jsonb,
      ${correctAnswer},
      ${explanation},
      ${lang},
      ${generatedBy},
      ${levelGradeId}
    )
    RETURNING *
  `;
  return NextResponse.json(row, { status: 201 });
}
