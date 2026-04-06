-- =============================================================================
-- 0003: academic_announcements.featured_image (URL gambar unggulan)
-- Tabel bisa sudah ada dari refs/additional.sql; migrasi ini jalan sebelum additional,
-- jadi kolom hanya ditambahkan jika tabel sudah ada.
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
      ADD COLUMN IF NOT EXISTS "featured_image" text;
  END IF;
END $$;
