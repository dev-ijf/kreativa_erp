-- OPSIONAL: hanya jika database Anda masih dari skema LAMA (0000 tanpa PARTITION)
-- dan belum pernah menjalankan migrasi partisi ini. Untuk instalasi baru, cukup
-- drizzle-kit migrate dengan 0000_init_ijf_schema.sql yang sudah berisi partisi.
--
-- Jalankan manual lewat psql / klien SQL jika perlu upgrade dari tabel non-partisi.

ALTER TABLE "tuition_transaction_details" DROP CONSTRAINT "tuition_transaction_details_transaction_id_transaction_created_at_tuition_transactions_id_created_at_fk";

ALTER SEQUENCE "tuition_transactions_id_seq" RENAME TO "tuition_transactions_id_seq_old";
ALTER SEQUENCE "tuition_transaction_details_id_seq" RENAME TO "tuition_transaction_details_id_seq_old";

ALTER TABLE "tuition_transactions" RENAME TO "tuition_transactions_old";
ALTER TABLE "tuition_transaction_details" RENAME TO "tuition_transaction_details_old";

ALTER TABLE "tuition_transactions_old" RENAME CONSTRAINT "tuition_transactions_id_created_at_pk" TO "tuition_transactions_old_id_created_at_pk";
ALTER TABLE "tuition_transactions_old" RENAME CONSTRAINT "unique_ref_no_per_partition" TO "unique_ref_no_per_partition_old";
ALTER TABLE "tuition_transaction_details_old" RENAME CONSTRAINT "tuition_transaction_details_id_created_at_pk" TO "tuition_transaction_details_old_id_created_at_pk";

CREATE TABLE "tuition_transactions" (
	"id" bigint GENERATED ALWAYS AS IDENTITY (sequence name "tuition_transactions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"academic_year_id" integer NOT NULL,
	"reference_no" varchar(50) NOT NULL,
	"total_amount" numeric(15, 2) NOT NULL,
	"payment_method_id" integer,
	"va_no" varchar(100),
	"qr_code" text,
	"status" varchar(50) DEFAULT 'pending',
	"payment_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tuition_transactions_id_created_at_pk" PRIMARY KEY("id","created_at"),
	CONSTRAINT "unique_ref_no_per_partition" UNIQUE("reference_no","created_at")
) PARTITION BY RANGE ("created_at");

CREATE TABLE "tuition_transaction_details" (
	"id" bigint GENERATED ALWAYS AS IDENTITY (sequence name "tuition_transaction_details_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"transaction_id" bigint NOT NULL,
	"transaction_created_at" timestamp NOT NULL,
	"bill_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"amount_paid" numeric(15, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tuition_transaction_details_id_created_at_pk" PRIMARY KEY("id","created_at")
) PARTITION BY RANGE ("created_at");

DO $$
DECLARE
	d date;
	t_from timestamp;
	t_to timestamp;
	pname_tx text;
	pname_det text;
BEGIN
	d := '2023-01-01'::date;
	WHILE d < '2032-01-01'::date LOOP
		t_from := d::timestamp;
		t_to := (d + interval '1 month')::timestamp;
		pname_tx := 'tuition_transactions_y' || to_char(d, 'YYYY') || 'm' || to_char(d, 'MM');
		pname_det := 'tuition_transaction_details_y' || to_char(d, 'YYYY') || 'm' || to_char(d, 'MM');
		EXECUTE format(
			'CREATE TABLE %I PARTITION OF tuition_transactions FOR VALUES FROM (%L) TO (%L)',
			pname_tx, t_from, t_to
		);
		EXECUTE format(
			'CREATE TABLE %I PARTITION OF tuition_transaction_details FOR VALUES FROM (%L) TO (%L)',
			pname_det, t_from, t_to
		);
		d := d + interval '1 month';
	END LOOP;
END $$;

INSERT INTO "tuition_transactions" OVERRIDING SYSTEM VALUE
SELECT * FROM "tuition_transactions_old";

INSERT INTO "tuition_transaction_details" OVERRIDING SYSTEM VALUE
SELECT * FROM "tuition_transaction_details_old";

SELECT setval(
	'tuition_transactions_id_seq',
	(SELECT COALESCE(MAX("id"), 1) FROM "tuition_transactions")
);

SELECT setval(
	'tuition_transaction_details_id_seq',
	(SELECT COALESCE(MAX("id"), 1) FROM "tuition_transaction_details")
);

DROP TABLE "tuition_transaction_details_old";
DROP TABLE "tuition_transactions_old";

ALTER TABLE "tuition_transaction_details" ADD CONSTRAINT "tuition_transaction_details_transaction_id_transaction_created_at_tuition_transactions_id_created_at_fk" FOREIGN KEY ("transaction_id","transaction_created_at") REFERENCES "public"."tuition_transactions"("id","created_at") ON DELETE cascade ON UPDATE no action;
