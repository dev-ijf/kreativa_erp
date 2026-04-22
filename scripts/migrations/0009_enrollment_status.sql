-- Add enrollment_status, left_school_at, exit_notes to core_students
ALTER TABLE "core_students" ADD COLUMN "enrollment_status" varchar(20) NOT NULL DEFAULT 'active';
ALTER TABLE "core_students" ADD COLUMN "left_school_at" date;
ALTER TABLE "core_students" ADD COLUMN "exit_notes" text;

-- Backfill: graduated students
UPDATE "core_students"
SET enrollment_status = 'graduated'
WHERE is_alumni = true OR graduated_at IS NOT NULL;

-- Backfill: students with no active class history and not graduated => unknown (admin review)
-- We leave them as 'active' default for now; admin can change via UI.
