CREATE TABLE "core_academic_years" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(20) NOT NULL,
	"is_active" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "core_app_modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"module_code" varchar(50) NOT NULL,
	"module_name" varchar(100) NOT NULL,
	CONSTRAINT "core_app_modules_module_code_unique" UNIQUE("module_code")
);
--> statement-breakpoint
CREATE TABLE "core_cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"province_id" integer NOT NULL,
	"name" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core_classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_id" integer NOT NULL,
	"level_grade_id" integer NOT NULL,
	"name" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core_districts" (
	"id" serial PRIMARY KEY NOT NULL,
	"city_id" integer NOT NULL,
	"name" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core_level_grades" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_id" integer NOT NULL,
	"name" varchar(50) NOT NULL,
	"level_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core_module_access" (
	"id" serial PRIMARY KEY NOT NULL,
	"module_id" integer NOT NULL,
	"school_id" integer,
	"level_grade_id" integer,
	"is_visible" boolean DEFAULT true,
	CONSTRAINT "unique_access_rule" UNIQUE("module_id","school_id","level_grade_id")
);
--> statement-breakpoint
CREATE TABLE "core_parent_student_relations" (
	"user_id" integer NOT NULL,
	"student_id" integer NOT NULL,
	"relation_type" varchar(50) NOT NULL,
	CONSTRAINT "core_parent_student_relations_user_id_student_id_pk" PRIMARY KEY("user_id","student_id")
);
--> statement-breakpoint
CREATE TABLE "core_portal_themes" (
	"id" serial PRIMARY KEY NOT NULL,
	"host_domain" varchar(100) NOT NULL,
	"portal_title" varchar(100) NOT NULL,
	"logo_url" text,
	"primary_color" varchar(20),
	"login_bg_url" text,
	"welcome_text" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "core_portal_themes_host_domain_unique" UNIQUE("host_domain")
);
--> statement-breakpoint
CREATE TABLE "core_provinces" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core_schools" (
	"id" serial PRIMARY KEY NOT NULL,
	"theme_id" integer,
	"name" varchar(100) NOT NULL,
	"address" text,
	"school_logo_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "core_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_id" integer,
	"setting_key" varchar(100) NOT NULL,
	"setting_value" text,
	"description" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_setting_per_school" UNIQUE("school_id","setting_key")
);
--> statement-breakpoint
CREATE TABLE "core_student_class_histories" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"class_id" integer NOT NULL,
	"level_grade_id" integer NOT NULL,
	"academic_year_id" integer NOT NULL,
	"status" varchar(50) DEFAULT 'active'
);
--> statement-breakpoint
CREATE TABLE "core_student_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"file_name" text NOT NULL,
	"file_path" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "core_student_education_histories" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"school_name" varchar(200) NOT NULL,
	"level_label" varchar(50),
	"year_from" integer,
	"year_to" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "core_student_parent_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"relation_type" varchar(20) NOT NULL,
	"full_name" varchar(100) NOT NULL,
	"nik" varchar(20),
	"birth_year" integer,
	"education" varchar(50),
	"occupation" varchar(100),
	"income_bracket" varchar(50),
	"special_needs_note" varchar(100),
	"phone" varchar(20),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_student_relation" UNIQUE("student_id","relation_type")
);
--> statement-breakpoint
CREATE TABLE "core_students" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_id" integer NOT NULL,
	"user_id" integer,
	"full_name" varchar(100) NOT NULL,
	"nickname" varchar(100),
	"username" varchar(50),
	"nis" varchar(20) NOT NULL,
	"nisn" varchar(20),
	"nik" varchar(20),
	"nationality" varchar(50),
	"photo_url" text,
	"student_type" varchar(50),
	"program" varchar(50),
	"curriculum" varchar(50),
	"previous_school" varchar(100),
	"gender" varchar(10),
	"place_of_birth" varchar(50),
	"date_of_birth" date,
	"religion" varchar(30),
	"child_order" integer,
	"siblings_count" integer,
	"child_status" varchar(50),
	"address" text,
	"rt" varchar(10),
	"rw" varchar(10),
	"hamlet" varchar(100),
	"village_label" varchar(100),
	"district_label" varchar(100),
	"city_label" varchar(100),
	"province_id" integer,
	"city_id" integer,
	"district_id" integer,
	"subdistrict_id" integer,
	"postal_code" varchar(10),
	"phone" varchar(20),
	"email" varchar(100),
	"living_with" varchar(50),
	"daily_language" varchar(100),
	"hobbies" text,
	"aspiration" text,
	"transport_mode" varchar(50),
	"distance_to_school" varchar(50),
	"travel_time" varchar(50),
	"registration_type" varchar(50),
	"enrollment_date" date,
	"diploma_serial" varchar(100),
	"skhun_serial" varchar(100),
	"is_alumni" boolean DEFAULT false,
	"boarding_status" varchar(50),
	"entry_academic_year_id" integer,
	"active_academic_year_id" integer,
	"blood_type" varchar(10),
	"weight_kg" numeric(5, 2),
	"height_cm" integer,
	"head_circumference_cm" integer,
	"allergies" text,
	"vision_condition" varchar(100),
	"hearing_condition" varchar(100),
	"special_needs" varchar(100),
	"chronic_diseases" text,
	"physical_abnormalities" text,
	"recurring_diseases" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "core_students_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "core_students_nis_unique" UNIQUE("nis")
);
--> statement-breakpoint
CREATE TABLE "core_subdistricts" (
	"id" serial PRIMARY KEY NOT NULL,
	"district_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"postal_code" varchar(10)
);
--> statement-breakpoint
CREATE TABLE "core_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_id" integer,
	"full_name" varchar(100) NOT NULL,
	"email" varchar(100) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"phone" varchar(20),
	"role" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "core_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "notif_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"template_id" integer,
	"type" varchar(50) NOT NULL,
	"recipient" varchar(100) NOT NULL,
	"request_payload" text,
	"response_payload" text,
	"status" varchar(50) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notif_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_id" integer,
	"name" varchar(100) NOT NULL,
	"type" varchar(50) NOT NULL,
	"trigger_event" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tuition_bills" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"academic_year_id" integer NOT NULL,
	"title" varchar(100) NOT NULL,
	"total_amount" numeric(15, 2) NOT NULL,
	"paid_amount" numeric(15, 2) DEFAULT '0',
	"min_payment" numeric(15, 2) DEFAULT '0',
	"due_date" date,
	"status" varchar(50) DEFAULT 'unpaid',
	"bill_month" integer,
	"bill_year" integer,
	"related_month" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tuition_payment_instruction_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"payment_method_id" integer NOT NULL,
	"title" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tuition_payment_instruction_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"step_number" integer NOT NULL,
	"instruction_text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tuition_payment_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_id" bigint NOT NULL,
	"transaction_created_at" timestamp NOT NULL,
	"request_payload" text,
	"response_payload" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tuition_payment_methods" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(50) NOT NULL,
	"category" varchar(50) NOT NULL,
	"coa" varchar(50),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "tuition_payment_methods_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "tuition_product_tariffs" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"academic_year_id" integer NOT NULL,
	"level_grade_id" integer NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_tariff_matrix" UNIQUE("school_id","product_id","academic_year_id","level_grade_id")
);
--> statement-breakpoint
CREATE TABLE "tuition_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"payment_type" varchar(50) NOT NULL,
	"coa" varchar(50),
	"coa_another" varchar(50),
	"description" text
);
--> statement-breakpoint
-- tuition_transactions & tuition_transaction_details: PARTITION BY RANGE(created_at) bulanan.
-- Partisi fisik 2023-01 .. 2031-12; setelah itu jalankan npm run db:ensure-partitions atau perluas rentang di DO block.
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "tuition_zains_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_id" bigint NOT NULL,
	"transaction_created_at" timestamp NOT NULL,
	"request_payload" text,
	"response_payload" text,
	"url" text,
	"process" varchar(100),
	"status" varchar(50),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "tuition_transaction_details" ADD CONSTRAINT "tuition_transaction_details_transaction_id_transaction_created_at_tuition_transactions_id_created_at_fk" FOREIGN KEY ("transaction_id","transaction_created_at") REFERENCES "public"."tuition_transactions"("id","created_at") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_tuition_bills_period" ON "tuition_bills" USING btree ("bill_year","bill_month");