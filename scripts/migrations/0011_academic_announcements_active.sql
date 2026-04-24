-- =============================================================================
-- 0011: academic_announcements.active (tampil / nonaktif)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'academic_announcements'
  ) THEN
    ALTER TABLE "public"."academic_announcements"
      ADD COLUMN IF NOT EXISTS "active" boolean NOT NULL DEFAULT true;
  END IF;
END $$;
