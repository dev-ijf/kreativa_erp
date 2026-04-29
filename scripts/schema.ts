import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  integer,
  bigint,
  bigserial,
  decimal,
  date,
  timestamp,
  primaryKey,
  unique,
  index,
  foreignKey,
  jsonb,
} from 'drizzle-orm/pg-core';

// ==============================================================================
// CORE: PORTAL THEMES
// ==============================================================================
export const corePortalThemes = pgTable('core_portal_themes', {
  id: serial('id').primaryKey(),
  hostDomain: varchar('host_domain', { length: 100 }).notNull().unique(),
  portalTitle: varchar('portal_title', { length: 100 }).notNull(),
  logoUrl: text('logo_url'),
  primaryColor: varchar('primary_color', { length: 20 }),
  loginBgUrl: text('login_bg_url'),
  faviconUrl: text('favicon_url'),
  welcomeText: text('welcome_text'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// CORE: SCHOOLS
// ==============================================================================
export const coreSchools = pgTable('core_schools', {
  id: serial('id').primaryKey(),
  themeId: integer('theme_id'),
  name: varchar('name', { length: 100 }).notNull(),
  address: text('address'),
  schoolLogoUrl: text('school_logo_url'),
  bankChannelCode: varchar('bank_channel_code', { length: 100 }),
  schoolCode: varchar('school_code', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==============================================================================
// CORE: ACADEMIC YEARS
// ==============================================================================
export const coreAcademicYears = pgTable('core_academic_years', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 20 }).notNull(),
  isActive: boolean('is_active').default(false),
});

// ==============================================================================
// CORE: SETTINGS
// ==============================================================================
export const coreSettings = pgTable(
  'core_settings',
  {
    id: serial('id').primaryKey(),
    schoolId: integer('school_id'),
    settingKey: varchar('setting_key', { length: 100 }).notNull(),
    settingValue: text('setting_value'),
    description: varchar('description', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => [unique('unique_setting_per_school').on(t.schoolId, t.settingKey)]
);

// ==============================================================================
// CORE: USERS
// ==============================================================================
export const coreUsers = pgTable('core_users', {
  id: serial('id').primaryKey(),
  schoolId: integer('school_id'),
  fullName: varchar('full_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  role: varchar('role', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==============================================================================
// CORE: TEACHERS (profil mengajar ↔ akun core_users)
// ==============================================================================
export const coreTeachers = pgTable('core_teachers', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .unique()
    .references(() => coreUsers.id, { onDelete: 'cascade' }),
  nip: varchar('nip', { length: 50 }),
  joinDate: date('join_date'),
  latestEducation: varchar('latest_education', { length: 100 }),
});

// ==============================================================================
// CORE: REGIONAL DATA
// ==============================================================================
export const coreProvinces = pgTable('core_provinces', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
});

export const coreCities = pgTable('core_cities', {
  id: serial('id').primaryKey(),
  provinceId: integer('province_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
});

export const coreDistricts = pgTable('core_districts', {
  id: serial('id').primaryKey(),
  cityId: integer('city_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
});

export const coreSubdistricts = pgTable('core_subdistricts', {
  id: serial('id').primaryKey(),
  districtId: integer('district_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  postalCode: varchar('postal_code', { length: 10 }),
});

// ==============================================================================
// CORE: STUDENTS (extended for UI / Dapodik-style fields)
// ==============================================================================
export const coreStudents = pgTable('core_students', {
  id: serial('id').primaryKey(),
  schoolId: integer('school_id').notNull(),
  cohortId: integer('cohort_id').notNull().references(() => coreCohorts.id),
  userId: integer('user_id').unique(),
  fullName: varchar('full_name', { length: 100 }).notNull(),
  nickname: varchar('nickname', { length: 100 }),
  username: varchar('username', { length: 50 }),
  nis: varchar('nis', { length: 20 }).notNull().unique(),
  nisn: varchar('nisn', { length: 20 }),
  nik: varchar('nik', { length: 20 }),
  nationality: varchar('nationality', { length: 50 }),
  photoUrl: text('photo_url'),
  studentType: varchar('student_type', { length: 50 }),
  program: varchar('program', { length: 50 }),
  curriculum: varchar('curriculum', { length: 50 }),
  previousSchool: varchar('previous_school', { length: 100 }),
  gender: varchar('gender', { length: 10 }),
  placeOfBirth: varchar('place_of_birth', { length: 50 }),
  dateOfBirth: date('date_of_birth'),
  religion: varchar('religion', { length: 30 }),
  childOrder: integer('child_order'),
  siblingsCount: integer('siblings_count'),
  childStatus: varchar('child_status', { length: 50 }),
  address: text('address'),
  rt: varchar('rt', { length: 10 }),
  rw: varchar('rw', { length: 10 }),
  hamlet: varchar('hamlet', { length: 100 }),
  villageLabel: varchar('village_label', { length: 100 }),
  districtLabel: varchar('district_label', { length: 100 }),
  cityLabel: varchar('city_label', { length: 100 }),
  provinceId: integer('province_id'),
  cityId: integer('city_id'),
  districtId: integer('district_id'),
  subdistrictId: integer('subdistrict_id'),
  postalCode: varchar('postal_code', { length: 10 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 100 }),
  livingWith: varchar('living_with', { length: 50 }),
  dailyLanguage: varchar('daily_language', { length: 100 }),
  hobbies: text('hobbies'),
  aspiration: text('aspiration'),
  transportMode: varchar('transport_mode', { length: 50 }),
  distanceToSchool: varchar('distance_to_school', { length: 50 }),
  travelTime: varchar('travel_time', { length: 50 }),
  registrationType: varchar('registration_type', { length: 50 }),
  enrollmentDate: date('enrollment_date'),
  diplomaSerial: varchar('diploma_serial', { length: 100 }),
  skhunSerial: varchar('skhun_serial', { length: 100 }),
  isAlumni: boolean('is_alumni').default(false),
  boardingStatus: varchar('boarding_status', { length: 50 }),
  entryAcademicYearId: integer('entry_academic_year_id'),
  activeAcademicYearId: integer('active_academic_year_id'),
  bloodType: varchar('blood_type', { length: 10 }),
  weightKg: decimal('weight_kg', { precision: 5, scale: 2 }),
  heightCm: integer('height_cm'),
  headCircumferenceCm: integer('head_circumference_cm'),
  allergies: text('allergies'),
  visionCondition: varchar('vision_condition', { length: 100 }),
  hearingCondition: varchar('hearing_condition', { length: 100 }),
  specialNeeds: varchar('special_needs', { length: 100 }),
  chronicDiseases: text('chronic_diseases'),
  physicalAbnormalities: text('physical_abnormalities'),
  recurringDiseases: text('recurring_diseases'),
  graduatedAt: date('graduated_at'),
  enrollmentStatus: varchar('enrollment_status', { length: 20 }).notNull().default('active'),
  leftSchoolAt: date('left_school_at'),
  exitNotes: text('exit_notes'),
  addressLatitude: decimal('address_latitude', { precision: 10, scale: 7 }),
  addressLongitude: decimal('address_longitude', { precision: 10, scale: 7 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// CORE: STUDENT PARENT PROFILES (ayah/ibu/wali tanpa wajib akun portal)
// ==============================================================================
export const coreStudentParentProfiles = pgTable(
  'core_student_parent_profiles',
  {
    id: serial('id').primaryKey(),
    studentId: integer('student_id').notNull(),
    relationType: varchar('relation_type', { length: 20 }).notNull(),
    fullName: varchar('full_name', { length: 100 }).notNull(),
    nik: varchar('nik', { length: 20 }),
    birthYear: integer('birth_year'),
    education: varchar('education', { length: 50 }),
    occupation: varchar('occupation', { length: 100 }),
    incomeBracket: varchar('income_bracket', { length: 50 }),
    specialNeedsNote: varchar('special_needs_note', { length: 100 }),
    phone: varchar('phone', { length: 20 }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => [unique('unique_student_relation').on(t.studentId, t.relationType)]
);

// ==============================================================================
// CORE: STUDENT EDUCATION HISTORIES
// ==============================================================================
export const coreStudentEducationHistories = pgTable('core_student_education_histories', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').notNull(),
  schoolName: varchar('school_name', { length: 200 }).notNull(),
  levelLabel: varchar('level_label', { length: 50 }),
  yearFrom: integer('year_from'),
  yearTo: integer('year_to'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==============================================================================
// CORE: STUDENT DOCUMENTS
// ==============================================================================
export const coreStudentDocuments = pgTable('core_student_documents', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').notNull(),
  documentType: varchar('document_type', { length: 50 }).notNull(),
  fileName: text('file_name').notNull(),
  filePath: text('file_path').notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
});

// ==============================================================================
// CORE: PARENT-STUDENT RELATIONS (portal users)
// ==============================================================================
export const coreParentStudentRelations = pgTable(
  'core_parent_student_relations',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => coreUsers.id),
    studentId: integer('student_id')
      .notNull()
      .references(() => coreStudents.id),
    relationType: varchar('relation_type', { length: 50 }).notNull(),
    nik: varchar('nik', { length: 20 }),
    birthYear: varchar('birth_year', { length: 4 }),
    education: varchar('education', { length: 50 }),
    occupation: varchar('occupation', { length: 100 }),
    incomeRange: varchar('income_range', { length: 100 }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.studentId] })]
);

// ==============================================================================
// CORE: COHORTS (Angkatan)
// ==============================================================================
export const coreCohorts = pgTable('core_cohorts', {
  id: serial('id').primaryKey(),
  schoolId: integer('school_id').notNull().references(() => coreSchools.id),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==============================================================================
// CORE: LEVEL GRADES
// ==============================================================================
export const coreLevelGrades = pgTable('core_level_grades', {
  id: serial('id').primaryKey(),
  schoolId: integer('school_id').notNull(),
  name: varchar('name', { length: 50 }).notNull(),
  levelOrder: integer('level_order').notNull(),
  isTerminal: boolean('is_terminal').default(false),
});

// ==============================================================================
// CORE: CLASSES
// ==============================================================================
export const coreClasses = pgTable('core_classes', {
  id: serial('id').primaryKey(),
  schoolId: integer('school_id').notNull(),
  levelGradeId: integer('level_grade_id').notNull(),
  name: varchar('name', { length: 50 }).notNull(),
});

// ==============================================================================
// CORE: STUDENT CLASS HISTORIES
// ==============================================================================
export const coreStudentClassHistories = pgTable('core_student_class_histories', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').notNull(),
  classId: integer('class_id').notNull(),
  levelGradeId: integer('level_grade_id').notNull(),
  academicYearId: integer('academic_year_id').notNull(),
  status: varchar('status', { length: 50 }).default('active'),
});

// ==============================================================================
// CORE: TEACHER CLASS ASSIGNMENTS (guru ↔ rombel per tahun ajaran)
// ==============================================================================
export const coreTeacherClassAssignments = pgTable(
  'core_teacher_class_assignments',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull(),
    classId: integer('class_id').notNull(),
    academicYearId: integer('academic_year_id').notNull(),
    assignmentRole: varchar('assignment_role', { length: 30 }).default('homeroom'),
  },
  (t) => [unique('unique_teacher_class_year').on(t.userId, t.classId, t.academicYearId)]
);

// ==============================================================================
// CORE: APP MODULES & ACCESS
// ==============================================================================
export const coreAppModules = pgTable('core_app_modules', {
  id: serial('id').primaryKey(),
  moduleCode: varchar('module_code', { length: 50 }).notNull().unique(),
  moduleName: varchar('module_name', { length: 100 }).notNull(),
});

export const coreModuleAccess = pgTable(
  'core_module_access',
  {
    id: serial('id').primaryKey(),
    moduleId: integer('module_id').notNull(),
    schoolId: integer('school_id'),
    levelGradeId: integer('level_grade_id'),
    isVisible: boolean('is_visible').default(true),
  },
  (t) => [unique('unique_access_rule').on(t.moduleId, t.schoolId, t.levelGradeId)]
);

// ==============================================================================
// TUITION: PRODUCTS (global master)
// ==============================================================================
export const tuitionProducts = pgTable('tuition_products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  paymentType: varchar('payment_type', { length: 50 }).notNull(),
  isInstallment: boolean('is_installment').notNull().default(false),
  coa: varchar('coa', { length: 50 }),
  coaAnother: varchar('coa_another', { length: 50 }),
  description: text('description'),
});

// ==============================================================================
// TUITION: PRODUCT TARIFFS
// ==============================================================================
export const tuitionProductTariffs = pgTable(
  'tuition_product_tariffs',
  {
    id: serial('id').primaryKey(),
    schoolId: integer('school_id').notNull(),
    productId: integer('product_id').notNull(),
    academicYearId: integer('academic_year_id').notNull(),
    cohortId: integer('cohort_id').notNull(),
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    minPayment: decimal('min_payment', { precision: 15, scale: 2 }).notNull().default('0.00'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => [
    unique('unique_tariff_matrix').on(
      t.schoolId,
      t.productId,
      t.academicYearId,
      t.cohortId
    ),
  ]
);

// ==============================================================================
// TUITION: PAYMENT METHODS
// ==============================================================================
export const tuitionPaymentMethods = pgTable('tuition_payment_methods', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  schoolId: integer('school_id').references(() => coreSchools.id, { onDelete: 'set null' }),
  category: varchar('category', { length: 50 }).notNull(),
  coa: varchar('coa', { length: 50 }),
  vendor: varchar('vendor', { length: 100 }),
  logoUrl: text('logo_url'),
  isRedirect: boolean('is_redirect').default(false),
  isPublish: boolean('is_publish').default(true),
  sortOrder: integer('sort_order'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==============================================================================
// TUITION: PAYMENT INSTRUCTIONS (single table)
// ==============================================================================
export const tuitionPaymentInstructions = pgTable('tuition_payment_instructions', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  stepOrder: bigint('step_order', { mode: 'number' }),
  paymentChannelId: integer('payment_channel_id').notNull(),
  lang: varchar('lang', { length: 2 }).notNull().default('ID'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ==============================================================================
// TUITION: BILLS
// ==============================================================================
export const tuitionBills = pgTable(
  'tuition_bills',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    schoolId: bigint('school_id', { mode: 'number' })
      .notNull()
      .references(() => coreSchools.id),
    cohortId: bigint('cohort_id', { mode: 'number' })
      .notNull()
      .references(() => coreCohorts.id),
    studentId: integer('student_id')
      .notNull()
      .references(() => coreStudents.id),
    productId: integer('product_id')
      .notNull()
      .references(() => tuitionProducts.id),
    academicYearId: integer('academic_year_id')
      .notNull()
      .references(() => coreAcademicYears.id),
    title: varchar('title', { length: 100 }).notNull(),
    totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
    discountAmount: decimal('discount_amount', { precision: 15, scale: 2 }).default('0.00'),
    paidAmount: decimal('paid_amount', { precision: 15, scale: 2 }).default('0.00'),
    minPayment: decimal('min_payment', { precision: 15, scale: 2 }).default('0.00'),
    dueDate: date('due_date'),
    status: varchar('status', { length: 50 }).default('unpaid'),
    billMonth: integer('bill_month'),
    billYear: integer('bill_year'),
    relatedMonth: date('related_month'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => [
    index('idx_tuition_bills_school').on(t.schoolId),
    index('idx_tuition_bills_cohort').on(t.cohortId),
    index('idx_tuition_bills_period').on(t.billYear, t.billMonth),
  ]
);

// ==============================================================================
// TUITION: TRANSACTIONS (id bigserial + created_at composite PK; RANGE partitioned
// by created_at per bulan — lihat 0000_init_ijf_schema.sql & 0020)
// ==============================================================================
export const tuitionTransactions = pgTable(
  'tuition_transactions',
  {
    id: bigserial('id', { mode: 'number' }),
    userId: integer('user_id')
      .notNull()
      .references(() => coreUsers.id),
    studentId: integer('student_id')
      .notNull()
      .references(() => coreStudents.id),
    academicYearId: integer('academic_year_id')
      .notNull()
      .references(() => coreAcademicYears.id),
    referenceNo: varchar('reference_no', { length: 50 }).notNull(),
    totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
    paymentMethodId: integer('payment_method_id').references(
      () => tuitionPaymentMethods.id,
      { onDelete: 'set null' }
    ),
    vaNo: varchar('va_no', { length: 100 }),
    qrCode: text('qr_code'),
    status: varchar('status', { length: 50 }).default('pending'),
    paymentDate: timestamp('payment_date'),
    isWhatsappCheckout: boolean('is_whatsapp_checkout').notNull().default(false),
    isWhatsappPaid: boolean('is_whatsapp_paid').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.id, t.createdAt] }),
    unique('unique_ref_no_per_partition').on(t.referenceNo, t.createdAt),
    index('idx_tuition_tx_student').on(t.studentId),
    index('idx_tuition_tx_user').on(t.userId),
  ]
);

export const tuitionTransactionDetails = pgTable(
  'tuition_transaction_details',
  {
    id: bigserial('id', { mode: 'number' }),
    transactionId: bigint('transaction_id', { mode: 'number' }).notNull(),
    transactionCreatedAt: timestamp('transaction_created_at').notNull(),
    billId: integer('bill_id')
      .notNull()
      .references(() => tuitionBills.id),
    productId: integer('product_id')
      .notNull()
      .references(() => tuitionProducts.id),
    studentId: integer('student_id')
      .notNull()
      .references(() => coreStudents.id),
    amountPaid: decimal('amount_paid', { precision: 15, scale: 2 }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.id, t.createdAt] }),
    foreignKey({
      columns: [t.transactionId, t.transactionCreatedAt],
      foreignColumns: [tuitionTransactions.id, tuitionTransactions.createdAt],
    }).onDelete('cascade'),
    index('idx_tuition_tx_det_student').on(t.studentId),
    index('idx_tuition_tx_det_bill').on(t.billId),
  ]
);

export const tuitionPaymentLogs = pgTable('tuition_payment_logs', {
  id: serial('id').primaryKey(),
  transactionId: bigint('transaction_id', { mode: 'number' }).notNull(),
  transactionCreatedAt: timestamp('transaction_created_at').notNull(),
  requestPayload: text('request_payload'),
  responsePayload: text('response_payload'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const tuitionZainsLog = pgTable('tuition_zains_log', {
  id: serial('id').primaryKey(),
  transactionId: bigint('transaction_id', { mode: 'number' }).notNull(),
  transactionCreatedAt: timestamp('transaction_created_at').notNull(),
  requestPayload: text('request_payload'),
  responsePayload: text('response_payload'),
  url: text('url'),
  process: varchar('process', { length: 100 }),
  status: varchar('status', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==============================================================================
// NOTIF: TEMPLATES & LOGS
// ==============================================================================
export const notifTemplates = pgTable('notif_templates', {
  id: serial('id').primaryKey(),
  schoolId: integer('school_id'),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  triggerEvent: varchar('trigger_event', { length: 50 }).notNull(),
  subject: text('subject'),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  isActive: boolean('is_active').default(true),
});

export const notifLogs = pgTable('notif_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'),
  templateId: integer('template_id'),
  type: varchar('type', { length: 50 }).notNull(),
  recipient: varchar('recipient', { length: 100 }).notNull(),
  requestPayload: text('request_payload'),
  responsePayload: text('response_payload'),
  status: varchar('status', { length: 50 }).default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==============================================================================
// ACADEMIC: MASTER (SUBJECTS, TEACHERS, SEMESTERS)
// ==============================================================================
export const academicSubjects = pgTable('academic_subjects', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }),
  nameEn: varchar('name_en', { length: 100 }).notNull(),
  nameId: varchar('name_id', { length: 100 }).notNull(),
  colorTheme: varchar('color_theme', { length: 100 }),
});

export const academicSemesters = pgTable('academic_semesters', {
  id: serial('id').primaryKey(),
  academicYear: varchar('academic_year', { length: 20 }).notNull(),
  semesterLabel: varchar('semester_label', { length: 10 }).notNull(),
  isActive: boolean('is_active').default(false),
});

// ==============================================================================
// ACADEMIC: SCHEDULES
// ==============================================================================
export const academicSchedules = pgTable(
  'academic_schedules',
  {
    id: serial('id').primaryKey(),
    classId: integer('class_id')
      .notNull()
      .references(() => coreClasses.id),
    academicYearId: integer('academic_year_id')
      .notNull()
      .references(() => coreAcademicYears.id),
    subjectId: bigint('subject_id', { mode: 'number' }).references(() => academicSubjects.id, {
      onDelete: 'set null',
    }),
    teacherId: integer('teacher_id').references(() => coreTeachers.id, {
      onDelete: 'set null',
    }),
    dayOfWeek: varchar('day_of_week', { length: 20 }).notNull(),
    startTime: varchar('start_time', { length: 10 }).notNull(),
    endTime: varchar('end_time', { length: 10 }).notNull(),
    isBreak: boolean('is_break').default(false),
  },
  (t) => [index('idx_acad_sch_class_year_day').on(t.classId, t.academicYearId, t.dayOfWeek)]
);

// ==============================================================================
// ACADEMIC: ATTENDANCES (composite PK id + attendance_date; RANGE partitioned by attendance_date per bulan)
// ==============================================================================
export const academicAttendances = pgTable(
  'academic_attendances',
  {
    id: bigint('id', { mode: 'number' })
      .notNull()
      .generatedAlwaysAsIdentity({ name: 'academic_attendances_id_seq' }),
    studentId: integer('student_id')
      .notNull()
      .references(() => coreStudents.id),
    attendanceDate: date('attendance_date').notNull(),
    status: varchar('status', { length: 20 }).notNull(),
    noteEn: varchar('note_en', { length: 255 }),
    noteId: varchar('note_id', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.id, t.attendanceDate] }),
    index('idx_acad_att_student_date').on(t.studentId, t.attendanceDate),
    index('idx_acad_att_status').on(t.status),
  ]
);

// ==============================================================================
// ACADEMIC: GRADES
// ==============================================================================
export const academicGrades = pgTable(
  'academic_grades',
  {
    id: serial('id').primaryKey(),
    studentId: integer('student_id')
      .notNull()
      .references(() => coreStudents.id),
    semesterId: bigint('semester_id', { mode: 'number' })
      .notNull()
      .references(() => academicSemesters.id, { onDelete: 'cascade' }),
    subjectId: bigint('subject_id', { mode: 'number' })
      .notNull()
      .references(() => academicSubjects.id, { onDelete: 'cascade' }),
    score: decimal('score', { precision: 5, scale: 2 }).notNull(),
    letterGrade: varchar('letter_grade', { length: 10 }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [index('idx_acad_grd_student_sem').on(t.studentId, t.semesterId)]
);

// ==============================================================================
// ACADEMIC: AGENDA & ANNOUNCEMENTS
// ==============================================================================
export const academicAgendas = pgTable(
  'academic_agendas',
  {
    id: serial('id').primaryKey(),
    schoolId: integer('school_id')
      .notNull()
      .references(() => coreSchools.id),
    targetGrade: varchar('target_grade', { length: 50 }),
    eventDate: date('event_date').notNull(),
    titleEn: varchar('title_en', { length: 200 }).notNull(),
    titleId: varchar('title_id', { length: 200 }).notNull(),
    timeRange: varchar('time_range', { length: 100 }),
    eventType: varchar('event_type', { length: 50 }).notNull(),
  },
  (t) => [index('idx_acad_agd_school_date').on(t.schoolId, t.eventDate)]
);

export const academicAnnouncements = pgTable(
  'academic_announcements',
  {
    id: serial('id').primaryKey(),
    schoolId: integer('school_id')
      .notNull()
      .references(() => coreSchools.id),
    publishDate: date('publish_date').notNull(),
    titleEn: varchar('title_en', { length: 200 }).notNull(),
    titleId: varchar('title_id', { length: 200 }).notNull(),
    contentEn: text('content_en').notNull(),
    contentId: text('content_id').notNull(),
    featuredImage: text('featured_image'),
    active: boolean('active').notNull().default(true),
  },
  (t) => [index('idx_acad_ann_school_date').on(t.schoolId, t.publishDate)]
);

// ==============================================================================
// ACADEMIC: CLINIC VISITS
// ==============================================================================
export const academicClinicVisits = pgTable(
  'academic_clinic_visits',
  {
    id: serial('id').primaryKey(),
    studentId: integer('student_id')
      .notNull()
      .references(() => coreStudents.id),
    visitDate: date('visit_date').notNull(),
    complaintEn: varchar('complaint_en', { length: 255 }),
    complaintId: varchar('complaint_id', { length: 255 }),
    actionEn: text('action_en'),
    actionId: text('action_id'),
    handledBy: varchar('handled_by', { length: 100 }),
  },
  (t) => [index('idx_acad_cln_student_date').on(t.studentId, t.visitDate)]
);

// ==============================================================================
// ACADEMIC: HABITS (composite PK id + habit_date; RANGE partitioned by habit_date per bulan)
// ==============================================================================
export const academicHabits = pgTable(
  'academic_habits',
  {
    id: bigint('id', { mode: 'number' })
      .notNull()
      .generatedAlwaysAsIdentity({ name: 'academic_habits_id_seq' }),
    studentId: integer('student_id')
      .notNull()
      .references(() => coreStudents.id),
    habitDate: date('habit_date').notNull(),
    fajr: boolean('fajr').default(false),
    dhuhr: boolean('dhuhr').default(false),
    asr: boolean('asr').default(false),
    maghrib: boolean('maghrib').default(false),
    isha: boolean('isha').default(false),
    dhuha: boolean('dhuha').default(false),
    tahajud: boolean('tahajud').default(false),
    readQuran: boolean('read_quran').default(false),
    sunnahFasting: boolean('sunnah_fasting').default(false),
    wakeUpEarly: boolean('wake_up_early').default(false),
    helpParents: boolean('help_parents').default(false),
    prayWithParents: boolean('pray_with_parents').default(false),
    giveGreetings: boolean('give_greetings').default(false),
    smileGreetPolite: boolean('smile_greet_polite').default(false),
    onTimeArrival: varchar('on_time_arrival', { length: 20 }),
    parentHugPray: boolean('parent_hug_pray').default(false),
    childTellParents: boolean('child_tell_parents').default(false),
    quranJuzInfo: text('quran_juz_info'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.id, t.habitDate] }),
    index('idx_acad_hbt_student_date').on(t.studentId, t.habitDate),
    unique('unique_student_habit_date').on(t.studentId, t.habitDate),
  ]
);

// ==============================================================================
// ACADEMIC: ADAPTIVE LEARNING (tests dulu — questions punya FK ke test)
// ==============================================================================
export const academicAdaptiveTests = pgTable(
  'academic_adaptive_tests',
  {
    id: serial('id').primaryKey(),
    studentId: integer('student_id')
      .notNull()
      .references(() => coreStudents.id),
    subjectId: bigint('subject_id', { mode: 'number' })
      .notNull()
      .references(() => academicSubjects.id, { onDelete: 'cascade' }),
    classId: integer('class_id').references(() => coreClasses.id, { onDelete: 'set null' }),
    academicYearId: integer('academic_year_id').references(() => coreAcademicYears.id, {
      onDelete: 'set null',
    }),
    levelGradeId: integer('level_grade_id').references(() => coreLevelGrades.id, { onDelete: 'set null' }),
    testDate: timestamp('test_date').defaultNow(),
    score: integer('score').notNull(),
    masteryLevel: decimal('mastery_level', { precision: 3, scale: 2 }).notNull(),
  },
  (t) => [index('idx_acad_adt_student_subj').on(t.studentId, t.subjectId)]
);

export const academicAdaptiveQuestions = pgTable(
  'academic_adaptive_questions',
  {
    id: serial('id').primaryKey(),
    adaptiveTestId: integer('adaptive_test_id').references(() => academicAdaptiveTests.id, {
      onDelete: 'cascade',
    }),
    subjectId: bigint('subject_id', { mode: 'number' })
      .notNull()
      .references(() => academicSubjects.id, { onDelete: 'cascade' }),
    classId: integer('class_id').references(() => coreClasses.id, { onDelete: 'set null' }),
    academicYearId: integer('academic_year_id').references(() => coreAcademicYears.id, {
      onDelete: 'set null',
    }),
    levelGradeId: integer('level_grade_id').references(() => coreLevelGrades.id, { onDelete: 'set null' }),
    lang: varchar('lang', { length: 20 }),
    generatedBy: varchar('generated_by', { length: 50 }),
    gradeBand: varchar('grade_band', { length: 50 }).notNull(),
    difficulty: decimal('difficulty', { precision: 3, scale: 2 }).notNull(),
    questionText: text('question_text').notNull(),
    optionsJson: jsonb('options_json').notNull(),
    correctAnswer: varchar('correct_answer', { length: 255 }).notNull(),
    /** Jawaban yang dipilih siswa untuk percobaan tes ini (nilai opsi, selaras dengan correct_answer). */
    studentAnswer: varchar('student_answer', { length: 255 }),
    explanation: text('explanation'),
  },
  (t) => [index('idx_acad_adq_subj_grade_diff').on(t.subjectId, t.gradeBand, t.difficulty)]
);

/** Bank soal adaptif (repositori; tidak terikat satu baris tes). */
export const academicAdaptiveQuestionsBank = pgTable(
  'academic_adaptive_questions_bank',
  {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    subjectId: bigint('subject_id', { mode: 'number' })
      .notNull()
      .references(() => academicSubjects.id, { onDelete: 'cascade' }),
    gradeBand: varchar('grade_band', { length: 50 }).notNull(),
    difficulty: decimal('difficulty', { precision: 3, scale: 2 }).notNull(),
    questionText: text('question_text').notNull(),
    optionsJson: jsonb('options_json').notNull(),
    correctAnswer: varchar('correct_answer', { length: 255 }).notNull(),
    explanation: text('explanation'),
    lang: varchar('lang', { length: 20 }),
    generatedBy: varchar('generated_by', { length: 50 }),
    levelGradeId: integer('level_grade_id').references(() => coreLevelGrades.id, { onDelete: 'set null' }),
  },
  (t) => [index('idx_acad_adqb_subj_grade_diff').on(t.subjectId, t.gradeBand, t.difficulty)]
);
