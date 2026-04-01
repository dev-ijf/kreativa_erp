-- =============================================================================
-- 0002: Payment Instructions (single table), Payment Methods sorting, Notif templates upgrades
-- =============================================================================

-- 1) Payment Instructions: new single-table model
CREATE TABLE IF NOT EXISTS "payment_instructions" (
  "id" bigserial PRIMARY KEY,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now(),
  "step_order" bigint,
  "payment_channel_id" integer NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'payment_instructions_payment_channel_id_fkey'
  ) THEN
    ALTER TABLE "payment_instructions"
      ADD CONSTRAINT "payment_instructions_payment_channel_id_fkey"
      FOREIGN KEY ("payment_channel_id")
      REFERENCES "public"."tuition_payment_methods"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_payment_instructions_payment_channel_id"
  ON "payment_instructions" ("payment_channel_id");

CREATE INDEX IF NOT EXISTS "idx_payment_instructions_step_order"
  ON "payment_instructions" ("payment_channel_id", "step_order");

-- Optional uniqueness for step_order within a channel (only when step_order is set)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'uniq_payment_instructions_channel_step_order'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX uniq_payment_instructions_channel_step_order
             ON payment_instructions(payment_channel_id, step_order)
             WHERE step_order IS NOT NULL';
  END IF;
END $$;

-- 2) Data migration from legacy group/steps tables (if present)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tuition_payment_instruction_groups'
  )
  AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tuition_payment_instruction_steps'
  ) THEN
    INSERT INTO payment_instructions (title, description, step_order, payment_channel_id, created_at, updated_at)
    SELECT
      g.title,
      s.instruction_text,
      s.step_number,
      g.payment_method_id,
      now(),
      now()
    FROM tuition_payment_instruction_groups g
    JOIN tuition_payment_instruction_steps s ON s.group_id = g.id
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 3) Drop legacy tables (if exist)
DROP TABLE IF EXISTS "tuition_payment_instruction_steps";
DROP TABLE IF EXISTS "tuition_payment_instruction_groups";

-- 4) Payment methods: add sort_order for DnD ordering
ALTER TABLE "tuition_payment_methods"
  ADD COLUMN IF NOT EXISTS "sort_order" integer;

-- Backfill sort_order once (only for rows still null)
WITH ordered AS (
  SELECT id, row_number() OVER (ORDER BY id ASC) AS rn
  FROM tuition_payment_methods
)
UPDATE tuition_payment_methods m
SET sort_order = ordered.rn
FROM ordered
WHERE m.id = ordered.id AND m.sort_order IS NULL;

CREATE INDEX IF NOT EXISTS "idx_tuition_payment_methods_sort_order"
  ON "tuition_payment_methods" ("sort_order");

-- 5) Notification templates upgrades
ALTER TABLE "notif_templates"
  ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now();

ALTER TABLE "notif_templates"
  ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true;

ALTER TABLE "notif_templates"
  ADD COLUMN IF NOT EXISTS "subject" text;

