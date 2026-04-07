-- =============================================================================
-- 0007: academic_adaptive_questions.student_answer (jawaban siswa per soal pada tes)
-- =============================================================================

ALTER TABLE public.academic_adaptive_questions
  ADD COLUMN IF NOT EXISTS student_answer varchar(255);

-- Backfill contoh seed (abaikan jika baris tidak ada)
UPDATE public.academic_adaptive_questions AS q
SET student_answer = v.sa
FROM (
  VALUES
    ('What is 12 x 15?'::text, '180'::varchar(255)),
    ('What is 15 + 25?'::text, '45'::varchar(255)),
    ('What is H2O?'::text, 'Water'::varchar(255))
) AS v(qt, sa)
WHERE q.question_text = v.qt
  AND (q.student_answer IS NULL OR q.student_answer = '');
