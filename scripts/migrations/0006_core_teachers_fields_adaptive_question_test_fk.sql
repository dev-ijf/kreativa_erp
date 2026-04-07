-- =============================================================================
-- 0006: core_teachers.join_date, latest_education
--       academic_adaptive_questions.adaptive_test_id → academic_adaptive_tests
-- =============================================================================

ALTER TABLE public.core_teachers
  ADD COLUMN IF NOT EXISTS join_date date;

ALTER TABLE public.core_teachers
  ADD COLUMN IF NOT EXISTS latest_education varchar(100);

ALTER TABLE public.academic_adaptive_questions
  ADD COLUMN IF NOT EXISTS adaptive_test_id integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'academic_adaptive_questions_adaptive_test_id_academic_adaptive_tests_id_fk'
  )
  AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'academic_adaptive_tests'
  )
  AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'academic_adaptive_questions'
  ) THEN
    ALTER TABLE public.academic_adaptive_questions
      ADD CONSTRAINT academic_adaptive_questions_adaptive_test_id_academic_adaptive_tests_id_fk
      FOREIGN KEY (adaptive_test_id)
      REFERENCES public.academic_adaptive_tests(id)
      ON DELETE CASCADE
      ON UPDATE NO ACTION;
  END IF;
END $$;
