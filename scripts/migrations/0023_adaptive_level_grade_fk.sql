-- 0023: jenjang (level grade) pada tes & soal adaptif

ALTER TABLE public.academic_adaptive_tests
  ADD COLUMN IF NOT EXISTS level_grade_id integer REFERENCES public.core_level_grades (id) ON DELETE SET NULL;

ALTER TABLE public.academic_adaptive_questions
  ADD COLUMN IF NOT EXISTS level_grade_id integer REFERENCES public.core_level_grades (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_acad_adt_level_grade_id ON public.academic_adaptive_tests (level_grade_id);
CREATE INDEX IF NOT EXISTS idx_acad_adq_level_grade_id ON public.academic_adaptive_questions (level_grade_id);
