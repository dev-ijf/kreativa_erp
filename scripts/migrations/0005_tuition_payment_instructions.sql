-- =============================================================================
-- 0005: Rename core_payment_instructions → tuition_payment_instructions
-- (DB yang sudah lewat 0002 lama dengan nama core_*)
-- =============================================================================

DO $$
BEGIN
  IF to_regclass('public.core_payment_instructions') IS NOT NULL
     AND to_regclass('public.tuition_payment_instructions') IS NULL THEN
    ALTER TABLE public.core_payment_instructions RENAME TO tuition_payment_instructions;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.tuition_payment_instructions') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'core_payment_instructions_payment_channel_id_fkey'
    ) THEN
      ALTER TABLE public.tuition_payment_instructions
        RENAME CONSTRAINT core_payment_instructions_payment_channel_id_fkey
        TO tuition_payment_instructions_payment_channel_id_fkey;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'idx_core_payment_instructions_payment_channel_id'
  ) THEN
    ALTER INDEX idx_core_payment_instructions_payment_channel_id
      RENAME TO idx_tuition_payment_instructions_payment_channel_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'idx_core_payment_instructions_step_order'
  ) THEN
    ALTER INDEX idx_core_payment_instructions_step_order
      RENAME TO idx_tuition_payment_instructions_step_order;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'uniq_core_payment_instructions_channel_step_order'
  ) THEN
    ALTER INDEX uniq_core_payment_instructions_channel_step_order
      RENAME TO uniq_tuition_payment_instructions_channel_step_order;
  END IF;
END $$;
