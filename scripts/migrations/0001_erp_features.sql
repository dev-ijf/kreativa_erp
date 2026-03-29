CREATE TABLE "core_teacher_class_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"class_id" integer NOT NULL,
	"academic_year_id" integer NOT NULL,
	"assignment_role" varchar(30) DEFAULT 'homeroom',
	CONSTRAINT "unique_teacher_class_year" UNIQUE("user_id","class_id","academic_year_id")
);
--> statement-breakpoint
ALTER TABLE "core_teacher_class_assignments" ADD CONSTRAINT "core_teacher_class_assignments_user_id_core_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "core_users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "core_teacher_class_assignments" ADD CONSTRAINT "core_teacher_class_assignments_class_id_core_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "core_classes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "core_teacher_class_assignments" ADD CONSTRAINT "core_teacher_class_assignments_academic_year_id_core_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "core_academic_years"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_teacher_class_assign_user" ON "core_teacher_class_assignments" ("user_id");
--> statement-breakpoint
CREATE INDEX "idx_teacher_class_assign_year" ON "core_teacher_class_assignments" ("academic_year_id");
--> statement-breakpoint
ALTER TABLE "core_level_grades" ADD COLUMN "is_terminal" boolean DEFAULT false;
--> statement-breakpoint
ALTER TABLE "core_students" ADD COLUMN "graduated_at" date;
--> statement-breakpoint
ALTER TABLE "core_students" ADD COLUMN "address_latitude" numeric(10, 7);
--> statement-breakpoint
ALTER TABLE "core_students" ADD COLUMN "address_longitude" numeric(10, 7);
