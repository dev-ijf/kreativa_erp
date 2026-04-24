-- Migrasi academic_habits ke RANGE-partitioned by habit_date (bulanan).
-- Partisi: 2025-01-01 .. 2027-12-31 (parent bounds Jan 2025 – Des 2027).
-- Jalankan manual lewat psql / klien SQL.
-- Pastikan tidak ada habit_date di luar rentang partisi sebelum menjalankan.

ALTER SEQUENCE "academic_habits_id_seq" RENAME TO "academic_habits_id_seq_old";

ALTER TABLE "public"."academic_habits" RENAME TO "academic_habits_old";

CREATE TABLE "public"."academic_habits" (
	"id" bigint GENERATED ALWAYS AS IDENTITY (sequence name "academic_habits_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"student_id" integer NOT NULL REFERENCES "core_students"("id"),
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
	"pray_with_parents" boolean DEFAULT false,
	"give_greetings" boolean DEFAULT false,
	"smile_greet_polite" boolean DEFAULT false,
	"on_time_arrival" varchar(255),
	"parent_hug_pray" boolean DEFAULT false,
	"child_tell_parents" boolean DEFAULT false,
	"quran_juz_info" text,
	CONSTRAINT "academic_habits_id_habit_date_pk" PRIMARY KEY ("id", "habit_date"),
	CONSTRAINT "unique_student_habit_date" UNIQUE ("student_id", "habit_date")
) PARTITION BY RANGE ("habit_date");

DO $$
DECLARE
	d date;
	d_from date;
	d_to date;
	pname text;
BEGIN
	d := '2025-01-01'::date;
	WHILE d < '2028-01-01'::date LOOP
		d_from := d;
		d_to := (d + interval '1 month')::date;
		pname := 'academic_habits_y' || to_char(d, 'YYYY') || 'm' || to_char(d, 'MM');
		EXECUTE format(
			'CREATE TABLE %I PARTITION OF academic_habits FOR VALUES FROM (%L) TO (%L)',
			pname, d_from, d_to
		);
		d := d + interval '1 month';
	END LOOP;
END $$;

INSERT INTO "public"."academic_habits" (
	"id",
	"student_id",
	"habit_date",
	"fajr",
	"dhuhr",
	"asr",
	"maghrib",
	"isha",
	"dhuha",
	"tahajud",
	"read_quran",
	"sunnah_fasting",
	"wake_up_early",
	"help_parents",
	"created_at",
	"updated_at",
	"pray_with_parents",
	"give_greetings",
	"smile_greet_polite",
	"on_time_arrival",
	"parent_hug_pray",
	"child_tell_parents",
	"quran_juz_info"
) OVERRIDING SYSTEM VALUE
SELECT
	o."id",
	o."student_id",
	o."habit_date",
	o."fajr",
	o."dhuhr",
	o."asr",
	o."maghrib",
	o."isha",
	o."dhuha",
	o."tahajud",
	o."read_quran",
	o."sunnah_fasting",
	o."wake_up_early",
	o."help_parents",
	o."created_at",
	o."updated_at",
	o."pray_with_parents",
	o."give_greetings",
	o."smile_greet_polite",
	o."on_time_arrival",
	o."parent_hug_pray",
	o."child_tell_parents",
	o."quran_juz_info"
FROM "public"."academic_habits_old" o;

SELECT setval(
	'academic_habits_id_seq',
	(SELECT COALESCE(MAX("id"), 1) FROM "public"."academic_habits")
);

CREATE INDEX IF NOT EXISTS "idx_acad_hbt_student_date" ON "public"."academic_habits" ("student_id", "habit_date" DESC);

DROP SEQUENCE IF EXISTS "academic_habits_id_seq_old";
DROP TABLE "public"."academic_habits_old";
