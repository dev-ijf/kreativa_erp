-- =============================================================================
-- Migrasi academic_schedules: dari student_id ke class_id + academic_year_id
-- Jalankan sekali di PostgreSQL (psql / GUI client) sebagai user yang punya hak DDL.
--
-- PERINGATAN: baris TRUNCATE di bawah menghapus SEMUA baris jadwal yang ada.
-- Jika Anda harus mempertahankan data lama, jangan jalankan TRUNCATE; isi
-- class_id & academic_year_id lewat UPDATE manual lalu baru SET NOT NULL + FK.
-- =============================================================================

BEGIN;

-- Kosongkan jadwal (opsional tapi disarankan agar kolom lama bisa di-drop bersih)
TRUNCATE "public"."academic_schedules" RESTART IDENTITY CASCADE;

ALTER TABLE "public"."academic_schedules"
  DROP COLUMN IF EXISTS "student_id";

ALTER TABLE "public"."academic_schedules"
  ADD COLUMN IF NOT EXISTS "class_id" int4,
  ADD COLUMN IF NOT EXISTS "academic_year_id" int4;

-- Pastikan tidak ada NULL sebelum NOT NULL (setelah TRUNCATE biasanya sudah bersih)
UPDATE "public"."academic_schedules"
SET "class_id" = (SELECT id FROM "public"."core_classes" ORDER BY id LIMIT 1)
WHERE "class_id" IS NULL;

UPDATE "public"."academic_schedules"
SET "academic_year_id" = (SELECT id FROM "public"."core_academic_years" ORDER BY id LIMIT 1)
WHERE "academic_year_id" IS NULL;

ALTER TABLE "public"."academic_schedules"
  ALTER COLUMN "class_id" SET NOT NULL,
  ALTER COLUMN "academic_year_id" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academic_schedules_class_id_fk') THEN
    ALTER TABLE "public"."academic_schedules"
      ADD CONSTRAINT "academic_schedules_class_id_fk"
      FOREIGN KEY ("class_id") REFERENCES "public"."core_classes"("id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academic_schedules_academic_year_id_fk') THEN
    ALTER TABLE "public"."academic_schedules"
      ADD CONSTRAINT "academic_schedules_academic_year_id_fk"
      FOREIGN KEY ("academic_year_id") REFERENCES "public"."core_academic_years"("id");
  END IF;
END $$;

DROP INDEX IF EXISTS "idx_acad_sch_student_day";
CREATE INDEX IF NOT EXISTS "idx_acad_sch_class_year_day"
  ON "public"."academic_schedules" ("class_id", "academic_year_id", "day_of_week");

COMMIT;

-- =============================================================================
-- Seed contoh (opsional): hapus komentar untuk mengisi ulang setelah migrasi
-- Sesuaikan id kelas / tahun / mapel / guru dengan data Anda.
-- =============================================================================
/*
INSERT INTO "public"."academic_schedules"
  ("class_id", "academic_year_id", "subject_id", "teacher_id", "day_of_week", "start_time", "end_time", "is_break")
VALUES
  (1, 2, 1, 1, 'Senin', '07:30', '09:00', false),
  (1, 2, 2, 2, 'Senin', '09:00', '10:30', false),
  (1, 2, NULL, NULL, 'Senin', '10:30', '11:00', true),
  (2, 2, 4, 4, 'Senin', '08:00', '09:30', false);
*/
