 

-- ==============================================================================
-- 2. MASTER ACADEMIC (SUBJECTS, TEACHERS, SEMESTERS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS "public"."academic_subjects" (
    "id" bigserial PRIMARY KEY,
    "code" varchar,
    "name_en" varchar NOT NULL,
    "name_id" varchar NOT NULL,
    "color_theme" varchar -- e.g., 'bg-blue-100 text-blue-600'
);

CREATE TABLE IF NOT EXISTS "public"."core_teachers" (
    "id" serial PRIMARY KEY,
    "user_id" int4 NOT NULL UNIQUE REFERENCES "public"."core_users"("id") ON DELETE CASCADE,
    "nip" varchar(50),
    "join_date" date,
    "latest_education" varchar(100)
);

ALTER TABLE "public"."core_teachers"
  ADD COLUMN IF NOT EXISTS "join_date" date;
ALTER TABLE "public"."core_teachers"
  ADD COLUMN IF NOT EXISTS "latest_education" varchar(100);

CREATE TABLE IF NOT EXISTS "public"."academic_semesters" (
    "id" bigserial PRIMARY KEY,
    "academic_year" varchar NOT NULL,
    "semester_label" varchar NOT NULL,
    "is_active" boolean DEFAULT false
);
 


-- ==============================================================================
-- 3. SCHEDULES (JADWAL HARI INI)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS "public"."academic_schedules" (
    "id" bigserial PRIMARY KEY,
    "student_id" int4 NOT NULL,
    "subject_id" bigint REFERENCES "public"."academic_subjects"("id") ON DELETE SET NULL,
    "teacher_id" int4 REFERENCES "public"."core_teachers"("id") ON DELETE SET NULL,
    "day_of_week" varchar NOT NULL, -- 'Monday', 'Tuesday', dll
    "start_time" varchar NOT NULL, -- format 'HH:MM'
    "end_time" varchar NOT NULL, -- format 'HH:MM'
    "is_break" boolean DEFAULT false
);
CREATE INDEX IF NOT EXISTS "idx_acad_sch_student_day" ON "public"."academic_schedules" ("student_id", "day_of_week");


-- ==============================================================================
-- 4. ATTENDANCES (KEHADIRAN)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS "public"."academic_attendances" (
    "id" bigserial PRIMARY KEY,
    "student_id" int4 NOT NULL,
    "attendance_date" date NOT NULL,
    "status" varchar NOT NULL, -- 'present', 'sick', 'permission', 'absent'
    "note_en" varchar,
    "note_id" varchar,
    "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_acad_att_student_date" ON "public"."academic_attendances" ("student_id", "attendance_date");
CREATE INDEX IF NOT EXISTS "idx_acad_att_status" ON "public"."academic_attendances" ("status");


-- ==============================================================================
-- 5. GRADES (RAPOR)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS "public"."academic_grades" (
    "id" bigserial PRIMARY KEY,
    "student_id" int4 NOT NULL,
    "semester_id" bigint NOT NULL REFERENCES "public"."academic_semesters"("id") ON DELETE CASCADE,
    "subject_id" bigint NOT NULL REFERENCES "public"."academic_subjects"("id") ON DELETE CASCADE,
    "score" numeric(5,2) NOT NULL,
    "letter_grade" varchar,
    "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_acad_grd_student_sem" ON "public"."academic_grades" ("student_id", "semester_id");


-- ==============================================================================
-- 6. AGENDA & ANNOUNCEMENTS (AGENDA & INFO)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS "public"."academic_agendas" (
    "id" bigserial PRIMARY KEY,
    "school_id" int4 NOT NULL,
    "target_grade" varchar, -- Null jika untuk semua kelas
    "event_date" date NOT NULL,
    "title_en" varchar NOT NULL,
    "title_id" varchar NOT NULL,
    "time_range" varchar, -- e.g., '07:30 - 12:00 WIB'
    "event_type" varchar NOT NULL -- 'exam', 'event', 'holiday'
);
CREATE INDEX IF NOT EXISTS "idx_acad_agd_school_date" ON "public"."academic_agendas" ("school_id", "event_date");

CREATE TABLE IF NOT EXISTS "public"."academic_announcements" (
    "id" bigserial PRIMARY KEY,
    "school_id" int4 NOT NULL,
    "publish_date" date NOT NULL,
    "title_en" varchar NOT NULL,
    "title_id" varchar NOT NULL,
    "content_en" text NOT NULL,
    "content_id" text NOT NULL,
    "featured_image" text,
    "active" boolean NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS "idx_acad_ann_school_date" ON "public"."academic_announcements" ("school_id", "publish_date" DESC);

ALTER TABLE "public"."academic_announcements"
  ADD COLUMN IF NOT EXISTS "featured_image" text;

ALTER TABLE "public"."academic_announcements"
  ADD COLUMN IF NOT EXISTS "active" boolean NOT NULL DEFAULT true;


-- ==============================================================================
-- 7. CLINIC VISITS (RIWAYAT UKS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS "public"."academic_clinic_visits" (
    "id" bigserial PRIMARY KEY,
    "student_id" int4 NOT NULL,
    "visit_date" date NOT NULL,
    "complaint_en" varchar,
    "complaint_id" varchar,
    "action_en" text,
    "action_id" text,
    "handled_by" varchar
);
CREATE INDEX IF NOT EXISTS "idx_acad_cln_student_date" ON "public"."academic_clinic_visits" ("student_id", "visit_date" DESC);


-- ==============================================================================
-- 8. HABITS (PEMBIASAAN HARIAN)
-- Untuk database produksi: RANGE partition by habit_date (bulanan, 2025–2027)
-- dan PK komposit (id, habit_date) diterapkan lewat
-- scripts/migrations/0012_academic_habits_partition.sql (gantikan struktur di bawah setelah init).
-- ==============================================================================
CREATE TABLE IF NOT EXISTS "public"."academic_habits" (
    "id" bigserial PRIMARY KEY,
    "student_id" int4 NOT NULL,
    "habit_date" date NOT NULL,
    "fajr" boolean DEFAULT false,
    "dhuhr" boolean DEFAULT false,
    "asr" boolean DEFAULT false,
    "maghrib" boolean DEFAULT false,
    "isha" boolean DEFAULT false,
    "dhuha" boolean DEFAULT false,
    "tahajud" boolean DEFAULT false,
    "read_quran" boolean DEFAULT false,
    "sunnah_fasting" boolean DEFAULT false,
    "wake_up_early" boolean DEFAULT false,
    "help_parents" boolean DEFAULT false,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now(),
    UNIQUE("student_id", "habit_date") -- Mencegah duplikasi entri di hari yang sama
);
CREATE INDEX IF NOT EXISTS "idx_acad_hbt_student_date" ON "public"."academic_habits" ("student_id", "habit_date" DESC);

-- Kolom tambahan sesuai Google Form Pembiasaan Kelas 1
ALTER TABLE "public"."academic_habits"
  ADD COLUMN IF NOT EXISTS "pray_with_parents" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "give_greetings" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "smile_greet_polite" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "on_time_arrival" varchar(20) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS "parent_hug_pray" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "child_tell_parents" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "quran_juz_info" text DEFAULT NULL;


-- ==============================================================================
-- 9. ADAPTIVE LEARNING (tes dulu; soal many-to-one ke tes)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS "public"."academic_adaptive_tests" (
    "id" bigserial PRIMARY KEY,
    "student_id" int4 NOT NULL,
    "subject_id" bigint NOT NULL REFERENCES "public"."academic_subjects"("id") ON DELETE CASCADE,
    "test_date" timestamp DEFAULT now(),
    "score" int4 NOT NULL,
    "mastery_level" numeric(3,2) NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_acad_adt_student_subj" ON "public"."academic_adaptive_tests" ("student_id", "subject_id");

CREATE TABLE IF NOT EXISTS "public"."academic_adaptive_questions" (
    "id" bigserial PRIMARY KEY,
    "adaptive_test_id" bigint REFERENCES "public"."academic_adaptive_tests"("id") ON DELETE CASCADE,
    "subject_id" bigint NOT NULL REFERENCES "public"."academic_subjects"("id") ON DELETE CASCADE,
    "grade_band" varchar NOT NULL,
    "difficulty" numeric(3,2) NOT NULL,
    "question_text" text NOT NULL,
    "options_json" jsonb NOT NULL,
    "correct_answer" varchar NOT NULL,
    "student_answer" varchar(255),
    "explanation" text
);
CREATE INDEX IF NOT EXISTS "idx_acad_adq_subj_grade_diff" ON "public"."academic_adaptive_questions" ("subject_id", "grade_band", "difficulty");

ALTER TABLE "public"."academic_adaptive_questions"
  ADD COLUMN IF NOT EXISTS "adaptive_test_id" bigint REFERENCES "public"."academic_adaptive_tests"("id") ON DELETE CASCADE;

ALTER TABLE "public"."academic_adaptive_questions"
  ADD COLUMN IF NOT EXISTS "student_answer" varchar(255);


-- ==============================================================================
-- ==============================================================================
-- S E E D   D A T A (MOCK DATA)
-- Asumsi student_id = 1 (Budi Santoso) dan student_id = 2 (Ani Santoso / Zevanya)
-- Asumsi school_id = 4 (Sesuai dengan insert Anda di core_students)
-- ==============================================================================
-- ==============================================================================
 
-- Seed Subjects
INSERT INTO "public"."academic_subjects" ("id", "code", "name_en", "name_id", "color_theme") VALUES 
(1, 'MATH', 'Math', 'Matematika', 'bg-blue-100 text-blue-600'),
(2, 'SCI', 'Science', 'Ilmu Pengetahuan Alam', 'bg-emerald-100 text-emerald-600'),
(3, 'ENG', 'English', 'Bahasa Inggris', 'bg-orange-100 text-orange-600'),
(4, 'ART', 'Art', 'Seni Budaya', 'bg-purple-100 text-purple-600'),
(5, 'HIST', 'History', 'Sejarah', 'bg-yellow-100 text-yellow-600')
ON CONFLICT ("id") DO NOTHING;

-- Seed guru: akun core_users + baris core_teachers (id 1–4 untuk konsistensi jadwal)
INSERT INTO "public"."core_users" ("id", "school_id", "full_name", "email", "password_hash", "role") VALUES
(10, 4, 'Mr. Hendra', 'hendra.teacher@kreativa.sch.id', 'hash', 'teacher'),
(11, 4, 'Mrs. Rina', 'rina.teacher@kreativa.sch.id', 'hash', 'teacher'),
(12, 4, 'Mr. John', 'john.teacher@kreativa.sch.id', 'hash', 'teacher'),
(13, 4, 'Mrs. Susi', 'susi.teacher@kreativa.sch.id', 'hash', 'teacher')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "public"."core_teachers" ("id", "user_id", "nip", "join_date", "latest_education") VALUES
(1, 10, NULL, '2022-07-01', 'S1 Pendidikan Matematika'),
(2, 11, NULL, '2021-08-15', 'S1 Pendidikan IPA'),
(3, 12, NULL, '2023-01-10', 'S2 TESOL'),
(4, 13, NULL, '2020-03-01', 'S1 Pendidikan Seni')
ON CONFLICT ("id") DO NOTHING;

SELECT setval(
  pg_get_serial_sequence('public.core_teachers', 'id'),
  COALESCE((SELECT MAX("id") FROM "public"."core_teachers"), 1)
);

-- Seed Semesters
INSERT INTO "public"."academic_semesters" ("id", "academic_year", "semester_label", "is_active") VALUES
(1, '2023/2024', '1', true)
ON CONFLICT ("id") DO NOTHING;

 

-- Seed Schedules (Monday)
INSERT INTO "public"."academic_schedules" ("student_id", "subject_id", "teacher_id", "day_of_week", "start_time", "end_time", "is_break")
SELECT v.student_id, v.subject_id, v.teacher_id, v.day_of_week, v.start_time, v.end_time, v.is_break
FROM (
  VALUES
    (1::int4, 1::bigint, 1::int4, 'Monday'::varchar, '07:30'::varchar, '09:00'::varchar, false::boolean),
    (1::int4, 2::bigint, 2::int4, 'Monday'::varchar, '09:00'::varchar, '10:30'::varchar, false::boolean),
    (1::int4, NULL::bigint, NULL::int4, 'Monday'::varchar, '10:30'::varchar, '11:00'::varchar, true::boolean),
    (1::int4, 3::bigint, 3::int4, 'Monday'::varchar, '11:00'::varchar, '12:30'::varchar, false::boolean),
    (2::int4, 4::bigint, 4::int4, 'Monday'::varchar, '08:00'::varchar, '09:30'::varchar, false::boolean),
    (2::int4, NULL::bigint, NULL::int4, 'Monday'::varchar, '09:30'::varchar, '10:00'::varchar, true::boolean),
    (2::int4, 1::bigint, 1::int4, 'Monday'::varchar, '10:00'::varchar, '11:30'::varchar, false::boolean)
) AS v(student_id, subject_id, teacher_id, day_of_week, start_time, end_time, is_break)
WHERE NOT EXISTS (
  SELECT 1
  FROM "public"."academic_schedules" s
  WHERE s."student_id" = v.student_id
    AND s."day_of_week" = v.day_of_week
    AND s."start_time" = v.start_time
    AND s."end_time" = v.end_time
    AND s."is_break" = v.is_break
    AND s."subject_id" IS NOT DISTINCT FROM v.subject_id
    AND s."teacher_id" IS NOT DISTINCT FROM v.teacher_id
);

-- Seed Attendances
INSERT INTO "public"."academic_attendances" ("student_id", "attendance_date", "status", "note_en", "note_id")
SELECT v.student_id, v.attendance_date, v.status, v.note_en, v.note_id
FROM (
  VALUES
    (1::int4, '2023-11-12'::date, 'sick'::varchar, 'Fever'::varchar, 'Demam'::varchar),
    (1::int4, '2023-10-05'::date, 'permission'::varchar, 'Family event'::varchar, 'Acara keluarga'::varchar)
) AS v(student_id, attendance_date, status, note_en, note_id)
WHERE NOT EXISTS (
  SELECT 1
  FROM "public"."academic_attendances" a
  WHERE a."student_id" = v.student_id
    AND a."attendance_date" = v.attendance_date
    AND a."status" = v.status
);

-- Seed Grades
INSERT INTO "public"."academic_grades" ("student_id", "semester_id", "subject_id", "score")
SELECT v.student_id, v.semester_id, v.subject_id, v.score
FROM (
  VALUES
    (1::int4, 1::bigint, 1::bigint, 88::numeric),
    (1::int4, 1::bigint, 2::bigint, 92::numeric),
    (1::int4, 1::bigint, 3::bigint, 85::numeric),
    (1::int4, 1::bigint, 5::bigint, 78::numeric),
    (2::int4, 1::bigint, 1::bigint, 95::numeric),
    (2::int4, 1::bigint, 2::bigint, 90::numeric),
    (2::int4, 1::bigint, 4::bigint, 98::numeric)
) AS v(student_id, semester_id, subject_id, score)
WHERE NOT EXISTS (
  SELECT 1
  FROM "public"."academic_grades" g
  WHERE g."student_id" = v.student_id
    AND g."semester_id" = v.semester_id
    AND g."subject_id" = v.subject_id
    AND g."score" = v.score
);

-- Seed Agendas
INSERT INTO "public"."academic_agendas" ("school_id", "target_grade", "event_date", "title_en", "title_id", "time_range", "event_type")
SELECT v.school_id, v.target_grade, v.event_date, v.title_en, v.title_id, v.time_range, v.event_type
FROM (
  VALUES
    (4::int4, NULL::varchar, '2023-11-20'::date, 'Mid-term Examinations'::varchar, 'Ujian Tengah Semester'::varchar, '07:30 - 12:00 WIB'::varchar, 'exam'::varchar),
    (4::int4, 'Grade 4'::varchar, '2023-11-25'::date, 'Museum Field Trip (Grade 4)'::varchar, 'Kunjungan Museum (Kelas 4)'::varchar, '08:00 - 14:00 WIB'::varchar, 'event'::varchar),
    (4::int4, NULL::varchar, '2023-12-01'::date, 'National Teacher''s Day'::varchar, 'Peringatan Hari Guru Nasional'::varchar, '07:00 - 10:00 WIB'::varchar, 'event'::varchar)
) AS v(school_id, target_grade, event_date, title_en, title_id, time_range, event_type)
WHERE NOT EXISTS (
  SELECT 1
  FROM "public"."academic_agendas" ag
  WHERE ag."school_id" = v.school_id
    AND ag."event_date" = v.event_date
    AND ag."title_en" = v.title_en
    AND ag."event_type" = v.event_type
);

-- Seed Announcements
INSERT INTO "public"."academic_announcements" ("school_id", "publish_date", "title_en", "title_id", "content_en", "content_id", "featured_image")
SELECT v.school_id, v.publish_date, v.title_en, v.title_id, v.content_en, v.content_id, v.featured_image
FROM (
  VALUES
    (4::int4, '2023-11-18'::date, 'New School Bus Route'::varchar, 'Rute Bus Sekolah Baru'::varchar, 'Starting next month, we are adding a new route covering the South District.'::text, 'Mulai bulan depan, kami menambahkan rute baru yang mencakup Area Selatan.'::text, '/assets/announcements/school-bus.jpg'::text),
    (4::int4, '2023-11-15'::date, 'Library Renovation Completed'::varchar, 'Renovasi Perpustakaan Selesai'::varchar, 'Students can now enjoy the newly renovated library.'::text, 'Siswa kini dapat menikmati perpustakaan yang baru direnovasi.'::text, '/assets/announcements/library.jpg'::text)
) AS v(school_id, publish_date, title_en, title_id, content_en, content_id, featured_image)
WHERE NOT EXISTS (
  SELECT 1
  FROM "public"."academic_announcements" an
  WHERE an."school_id" = v.school_id
    AND an."publish_date" = v.publish_date
    AND an."title_en" = v.title_en
);

UPDATE "public"."academic_announcements" an
SET "featured_image" = v.featured_image
FROM (
  VALUES
    (4::int4, '2023-11-18'::date, 'New School Bus Route'::varchar, '/assets/announcements/school-bus.jpg'::text),
    (4::int4, '2023-11-15'::date, 'Library Renovation Completed'::varchar, '/assets/announcements/library.jpg'::text)
) AS v(school_id, publish_date, title_en, featured_image)
WHERE an."school_id" = v.school_id
  AND an."publish_date" = v.publish_date
  AND an."title_en" = v.title_en
  AND (an."featured_image" IS NULL OR an."featured_image" = '');

-- Seed Clinic Visits
INSERT INTO "public"."academic_clinic_visits" ("student_id", "visit_date", "complaint_en", "complaint_id", "action_en", "action_id")
SELECT v.student_id, v.visit_date, v.complaint_en, v.complaint_id, v.action_en, v.action_id
FROM (
  VALUES
    (1::int4, '2023-11-12'::date, 'Fever'::varchar, 'Demam'::varchar, 'Given paracetamol and rested'::text, 'Diberi paracetamol dan istirahat'::text),
    (2::int4, '2023-09-02'::date, 'Scraped knee'::varchar, 'Lutut lecet'::varchar, 'Cleaned and bandaged'::text, 'Dibersihkan dan diperban'::text)
) AS v(student_id, visit_date, complaint_en, complaint_id, action_en, action_id)
WHERE NOT EXISTS (
  SELECT 1
  FROM "public"."academic_clinic_visits" cv
  WHERE cv."student_id" = v.student_id
    AND cv."visit_date" = v.visit_date
    AND cv."complaint_en" IS NOT DISTINCT FROM v.complaint_en
);

-- Seed Habits (Pembiasaan) — tanggal dalam rentang partisi 2025–2027 bila memakai migrasi 0012
INSERT INTO "public"."academic_habits" ("student_id", "habit_date", "fajr", "dhuhr", "asr", "maghrib", "isha", "dhuha", "tahajud", "read_quran", "wake_up_early", "help_parents") VALUES 
(1, '2025-11-18', true, true, false, false, false, true, false, false, true, true),
(1, '2025-11-17', true, true, true, true, true, false, false, true, true, true)
ON CONFLICT ("student_id", "habit_date") DO NOTHING;

-- Seed Adaptive Tests (harus sebelum soal)
INSERT INTO "public"."academic_adaptive_tests" ("id", "student_id", "subject_id", "test_date", "score", "mastery_level") VALUES
(1, 1, 1, '2023-11-18 14:00:00', 85, 0.85),
(2, 1, 2, '2023-11-15 09:30:00', 70, 0.70)
ON CONFLICT ("id") DO NOTHING;

SELECT setval(
  pg_get_serial_sequence('public.academic_adaptive_tests', 'id'),
  COALESCE((SELECT MAX("id") FROM "public"."academic_adaptive_tests"), 1)
);

-- Seed Adaptive Questions (detail per tes)
INSERT INTO "public"."academic_adaptive_questions" ("adaptive_test_id", "subject_id", "grade_band", "difficulty", "question_text", "options_json", "correct_answer", "student_answer", "explanation")
SELECT v.adaptive_test_id, v.subject_id, v.grade_band, v.difficulty, v.question_text, v.options_json, v.correct_answer, v.student_answer, v.explanation
FROM (
  VALUES
    (1::bigint, 1::bigint, 'g4-6'::varchar, 0.75::numeric, 'What is 12 x 15?'::text, '["180", "165", "170", "175"]'::jsonb, '180'::varchar, '180'::varchar, '12 x 15 = 12 x 10 + 12 x 5 = 120 + 60 = 180'::text),
    (1::bigint, 1::bigint, 'g4-6'::varchar, 0.50::numeric, 'What is 15 + 25?'::text, '["30", "40", "50", "45"]'::jsonb, '40'::varchar, '45'::varchar, '15 + 25 = 40. Basic addition.'::text),
    (2::bigint, 2::bigint, 'g4-6'::varchar, 0.60::numeric, 'What is H2O?'::text, '["Water", "Salt", "Oxygen", "Iron"]'::jsonb, 'Water'::varchar, 'Water'::varchar, 'H2O is water.'::text)
) AS v(adaptive_test_id, subject_id, grade_band, difficulty, question_text, options_json, correct_answer, student_answer, explanation)
WHERE NOT EXISTS (
  SELECT 1
  FROM "public"."academic_adaptive_questions" q
  WHERE q."adaptive_test_id" = v.adaptive_test_id
    AND q."question_text" = v.question_text
);

UPDATE "public"."academic_adaptive_questions" AS q
SET "student_answer" = v.sa
FROM (
  VALUES
    ('What is 12 x 15?'::text, '180'::varchar(255)),
    ('What is 15 + 25?'::text, '45'::varchar(255)),
    ('What is H2O?'::text, 'Water'::varchar(255))
) AS v(qt, sa)
WHERE q."question_text" = v.qt
  AND (q."student_answer" IS NULL OR q."student_answer" = '');
-- ==============================================================================
-- PRODUCT REFACTOR: Standardized frequencies and is_installment flag
-- ==============================================================================
ALTER TABLE "public"."tuition_products" ADD COLUMN IF NOT EXISTS "is_installment" BOOLEAN DEFAULT FALSE;

-- Migrate existing 'installment' types to 'one_time' + is_installment=true
UPDATE "public"."tuition_products" 
SET "payment_type" = 'one_time', "is_installment" = TRUE 
WHERE "payment_type" = 'installment';

-- Ensure 'monthly' products are never installments
UPDATE "public"."tuition_products" 
SET "is_installment" = FALSE 
WHERE "payment_type" = 'monthly';

-- ==============================================================================
-- SCHEDULES: Migrasi dari per-student ke per-class per-academic_year
-- ==============================================================================
TRUNCATE "public"."academic_schedules" RESTART IDENTITY CASCADE;

ALTER TABLE "public"."academic_schedules"
  DROP COLUMN IF EXISTS "student_id";

ALTER TABLE "public"."academic_schedules"
  ADD COLUMN IF NOT EXISTS "class_id" int4,
  ADD COLUMN IF NOT EXISTS "academic_year_id" int4;

ALTER TABLE "public"."academic_schedules"
  ALTER COLUMN "class_id" SET NOT NULL,
  ALTER COLUMN "academic_year_id" SET NOT NULL;

DO $$ BEGIN
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
