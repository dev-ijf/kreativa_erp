-- Migrasi academic_attendances dari tabel biasa ke RANGE-partitioned by attendance_date (bulanan).
-- Jalankan manual lewat psql / klien SQL.

ALTER SEQUENCE "academic_attendances_id_seq" RENAME TO "academic_attendances_id_seq_old";

ALTER TABLE "academic_attendances" RENAME TO "academic_attendances_old";

CREATE TABLE "academic_attendances" (
	"id" bigint GENERATED ALWAYS AS IDENTITY (sequence name "academic_attendances_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"student_id" integer NOT NULL REFERENCES "core_students"("id"),
	"attendance_date" date NOT NULL,
	"status" varchar(20) NOT NULL,
	"note_en" varchar(255),
	"note_id" varchar(255),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "academic_attendances_id_attendance_date_pk" PRIMARY KEY("id","attendance_date")
) PARTITION BY RANGE ("attendance_date");

DO $$
DECLARE
	d date;
	d_from date;
	d_to date;
	pname text;
BEGIN
	d := '2023-01-01'::date;
	WHILE d < '2031-01-01'::date LOOP
		d_from := d;
		d_to := (d + interval '1 month')::date;
		pname := 'academic_attendances_y' || to_char(d, 'YYYY') || 'm' || to_char(d, 'MM');
		EXECUTE format(
			'CREATE TABLE %I PARTITION OF academic_attendances FOR VALUES FROM (%L) TO (%L)',
			pname, d_from, d_to
		);
		d := d + interval '1 month';
	END LOOP;
END $$;

INSERT INTO "academic_attendances" OVERRIDING SYSTEM VALUE
SELECT * FROM "academic_attendances_old";

SELECT setval(
	'academic_attendances_id_seq',
	(SELECT COALESCE(MAX("id"), 1) FROM "academic_attendances")
);

CREATE INDEX IF NOT EXISTS "idx_acad_att_student_date" ON "academic_attendances" ("student_id", "attendance_date");
CREATE INDEX IF NOT EXISTS "idx_acad_att_status" ON "academic_attendances" ("status");

DROP SEQUENCE IF EXISTS "academic_attendances_id_seq_old";
DROP TABLE "academic_attendances_old";
