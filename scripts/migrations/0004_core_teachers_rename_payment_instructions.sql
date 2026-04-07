-- =============================================================================
-- 0004: Rename payment_instructions → core_payment_instructions (DB lama),
--       academic_teachers → core_teachers + relasi core_users, FK jadwal
-- =============================================================================

-- ---------------------------------------------------------------------------
-- A) payment_instructions → core_payment_instructions (hanya jika nama lama ada)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.payment_instructions') IS NOT NULL
     AND to_regclass('public.core_payment_instructions') IS NULL THEN
    ALTER TABLE public.payment_instructions RENAME TO core_payment_instructions;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.core_payment_instructions') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'payment_instructions_payment_channel_id_fkey'
    ) THEN
      ALTER TABLE public.core_payment_instructions
        RENAME CONSTRAINT payment_instructions_payment_channel_id_fkey
        TO core_payment_instructions_payment_channel_id_fkey;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'idx_payment_instructions_payment_channel_id'
  ) THEN
    ALTER INDEX idx_payment_instructions_payment_channel_id
      RENAME TO idx_core_payment_instructions_payment_channel_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'idx_payment_instructions_step_order'
  ) THEN
    ALTER INDEX idx_payment_instructions_step_order
      RENAME TO idx_core_payment_instructions_step_order;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'uniq_payment_instructions_channel_step_order'
  ) THEN
    ALTER INDEX uniq_payment_instructions_channel_step_order
      RENAME TO uniq_core_payment_instructions_channel_step_order;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- B) core_teachers: ganti academic_teachers, relasi ke core_users
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  fk_rec RECORD;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'academic_schedules'
  ) THEN
  FOR fk_rec IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'academic_schedules'
      AND c.contype = 'f'
      AND pg_get_constraintdef(c.oid) ILIKE '%academic_teachers%'
  LOOP
    EXECUTE format('ALTER TABLE public.academic_schedules DROP CONSTRAINT IF EXISTS %I', fk_rec.conname);
  END LOOP;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.core_teachers (
  id serial PRIMARY KEY,
  user_id integer NOT NULL UNIQUE REFERENCES public.core_users(id) ON DELETE CASCADE,
  nip varchar(50)
);

DO $$
DECLARE
  r RECORD;
  uid integer;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'academic_teachers'
  ) THEN
    FOR r IN SELECT * FROM public.academic_teachers ORDER BY id
    LOOP
      INSERT INTO public.core_users (school_id, full_name, email, password_hash, role)
      VALUES (
        NULL,
        r.full_name,
        'migrated_teacher_' || r.id || '@kreativa.seed',
        'hash',
        'teacher'
      )
      ON CONFLICT (email) DO NOTHING;

      SELECT id INTO uid FROM public.core_users
      WHERE email = 'migrated_teacher_' || r.id || '@kreativa.seed'
      LIMIT 1;

      IF uid IS NOT NULL THEN
        INSERT INTO public.core_teachers (id, user_id, nip)
        VALUES (r.id::integer, uid, r.nip)
        ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id, nip = EXCLUDED.nip;
      END IF;
    END LOOP;

    DROP TABLE public.academic_teachers;
  END IF;
END $$;

SELECT setval(
  pg_get_serial_sequence('public.core_teachers', 'id'),
  COALESCE((SELECT MAX(id) FROM public.core_teachers), 1)
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'academic_schedules'
  ) THEN
    ALTER TABLE public.academic_schedules
      ALTER COLUMN teacher_id TYPE integer USING teacher_id::integer;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'academic_schedules_teacher_id_core_teachers_id_fk'
    ) THEN
      ALTER TABLE public.academic_schedules
        ADD CONSTRAINT academic_schedules_teacher_id_core_teachers_id_fk
        FOREIGN KEY (teacher_id)
        REFERENCES public.core_teachers(id)
        ON DELETE SET NULL
        ON UPDATE NO ACTION;
    END IF;
  END IF;
END $$;
