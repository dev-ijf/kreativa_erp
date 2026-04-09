-- =============================================================================
-- 0008: tuition_bills denormalization (school_id, cohort_id) & parent profile
-- =============================================================================

-- 1. core_parent_student_relations: add profile fields
ALTER TABLE public.core_parent_student_relations
  ADD COLUMN IF NOT EXISTS nik varchar(20),
  ADD COLUMN IF NOT EXISTS birth_year varchar(4),
  ADD COLUMN IF NOT EXISTS education varchar(50),
  ADD COLUMN IF NOT EXISTS occupation varchar(100),
  ADD COLUMN IF NOT EXISTS income_range varchar(100);

-- 2. tuition_bills: upgrade id to bigint and add denormalized fields
-- We use DO block to be safe with existing data
DO $$
BEGIN
    -- Upgrade ID to bigint if it's still integer/serial
    IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'tuition_bills' AND column_name = 'id') = 'integer' THEN
        ALTER TABLE public.tuition_bills ALTER COLUMN id TYPE bigint;
    END IF;

    -- Add school_id and cohort_id as nullable first
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tuition_bills' AND column_name = 'school_id') THEN
        ALTER TABLE public.tuition_bills ADD COLUMN school_id bigint;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tuition_bills' AND column_name = 'cohort_id') THEN
        ALTER TABLE public.tuition_bills ADD COLUMN cohort_id bigint;
    END IF;

    -- Backfill from core_students
    UPDATE public.tuition_bills b
    SET school_id = s.school_id,
        cohort_id = s.cohort_id
    FROM public.core_students s
    WHERE b.student_id = s.id
      AND (b.school_id IS NULL OR b.cohort_id IS NULL);

    -- Now set to NOT NULL
    ALTER TABLE public.tuition_bills ALTER COLUMN school_id SET NOT NULL;
    ALTER TABLE public.tuition_bills ALTER COLUMN cohort_id SET NOT NULL;

    -- Add other fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tuition_bills' AND column_name = 'discount_amount') THEN
        ALTER TABLE public.tuition_bills ADD COLUMN discount_amount decimal(15, 2) DEFAULT 0.00;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tuition_bills' AND column_name = 'notes') THEN
        ALTER TABLE public.tuition_bills ADD COLUMN notes text;
    END IF;
END $$;

-- 3. Indexes for tuition_bills
CREATE INDEX IF NOT EXISTS idx_tuition_bills_school ON public.tuition_bills(school_id);
CREATE INDEX IF NOT EXISTS idx_tuition_bills_cohort ON public.tuition_bills(cohort_id);

-- 4. Foreign Keys (if not already managed by Drizzle)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tuition_bills_school_id_core_schools_id_fk') THEN
        ALTER TABLE public.tuition_bills ADD CONSTRAINT tuition_bills_school_id_core_schools_id_fk FOREIGN KEY (school_id) REFERENCES public.core_schools(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tuition_bills_cohort_id_core_cohorts_id_fk') THEN
        ALTER TABLE public.tuition_bills ADD CONSTRAINT tuition_bills_cohort_id_core_cohorts_id_fk FOREIGN KEY (cohort_id) REFERENCES public.core_cohorts(id);
    END IF;
END $$;
