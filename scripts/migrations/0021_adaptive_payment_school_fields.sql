-- 0021: adaptive questions/tests metadata, payment method logo

ALTER TABLE public.academic_adaptive_questions
  ADD COLUMN IF NOT EXISTS lang varchar(20),
  ADD COLUMN IF NOT EXISTS generated_by varchar(50),
  ADD COLUMN IF NOT EXISTS class_id integer REFERENCES public.core_classes (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS academic_year_id integer REFERENCES public.core_academic_years (id) ON DELETE SET NULL;

ALTER TABLE public.academic_adaptive_tests
  ADD COLUMN IF NOT EXISTS class_id integer REFERENCES public.core_classes (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS academic_year_id integer REFERENCES public.core_academic_years (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_acad_adt_class_id ON public.academic_adaptive_tests (class_id);
CREATE INDEX IF NOT EXISTS idx_acad_adt_academic_year_id ON public.academic_adaptive_tests (academic_year_id);

ALTER TABLE public.tuition_payment_methods
  ADD COLUMN IF NOT EXISTS logo_url text;
