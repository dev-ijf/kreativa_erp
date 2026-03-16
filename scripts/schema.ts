import {
  pgTable, serial, varchar, text, boolean, integer, decimal, date, timestamp, primaryKey, unique
} from 'drizzle-orm/pg-core';

// ==============================================================================
// CORE: SCHOOLS
// ==============================================================================
export const coreSchools = pgTable('core_schools', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  address: text('address'),
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
export const coreSettings = pgTable('core_settings', {
  id: serial('id').primaryKey(),
  schoolId: integer('school_id'),
  settingKey: varchar('setting_key', { length: 100 }).notNull(),
  settingValue: text('setting_value'),
  description: varchar('description', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  unique('unique_setting_per_school').on(t.schoolId, t.settingKey),
]);

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
  role: varchar('role', { length: 20 }).notNull(), // 'superadmin' | 'school_finance' | 'parent' | 'teacher'
  createdAt: timestamp('created_at').defaultNow(),
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
// CORE: STUDENTS
// ==============================================================================
export const coreStudents = pgTable('core_students', {
  id: serial('id').primaryKey(),
  schoolId: integer('school_id').notNull(),
  fullName: varchar('full_name', { length: 100 }).notNull(),
  nis: varchar('nis', { length: 20 }).notNull().unique(),
  nisn: varchar('nisn', { length: 20 }).unique(),
  previousSchool: varchar('previous_school', { length: 100 }),
  gender: varchar('gender', { length: 1 }), // 'L' | 'P'
  placeOfBirth: varchar('place_of_birth', { length: 50 }),
  dateOfBirth: date('date_of_birth'),
  religion: varchar('religion', { length: 30 }),
  childOrder: integer('child_order'),
  siblingsCount: integer('siblings_count'),
  childStatus: varchar('child_status', { length: 20 }), // 'Kandung' | 'Tiri' | 'Angkat'
  address: text('address'),
  provinceId: integer('province_id'),
  cityId: integer('city_id'),
  districtId: integer('district_id'),
  subdistrictId: integer('subdistrict_id'),
  postalCode: varchar('postal_code', { length: 10 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 100 }),
  livingWith: varchar('living_with', { length: 50 }),
  // Health
  bloodType: varchar('blood_type', { length: 2 }),
  weightKg: decimal('weight_kg', { precision: 5, scale: 2 }),
  heightCm: integer('height_cm'),
  allergies: text('allergies'),
  visionCondition: varchar('vision_condition', { length: 100 }),
  hearingCondition: varchar('hearing_condition', { length: 100 }),
  specialNeeds: varchar('special_needs', { length: 100 }),
  chronicDiseases: text('chronic_diseases'),
  physicalAbnormalities: text('physical_abnormalities'),
  recurringDiseases: text('recurring_diseases'),
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
// CORE: PARENT-STUDENT RELATIONS
// ==============================================================================
export const coreParentStudentRelations = pgTable('core_parent_student_relations', {
  userId: integer('user_id').notNull(),
  studentId: integer('student_id').notNull(),
  relationType: varchar('relation_type', { length: 20 }).notNull(), // 'father' | 'mother' | 'guardian'
}, (t) => [primaryKey({ columns: [t.userId, t.studentId] })]);

// ==============================================================================
// CORE: LEVEL GRADES
// ==============================================================================
export const coreLevelGrades = pgTable('core_level_grades', {
  id: serial('id').primaryKey(),
  schoolId: integer('school_id').notNull(),
  name: varchar('name', { length: 50 }).notNull(),
  levelOrder: integer('level_order').notNull(),
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
  status: varchar('status', { length: 20 }).default('active'), // 'active' | 'completed' | 'dropped'
});

// ==============================================================================
// TUITION: PRODUCTS
// ==============================================================================
export const tuitionProducts = pgTable('tuition_products', {
  id: serial('id').primaryKey(),
  schoolId: integer('school_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  paymentType: varchar('payment_type', { length: 20 }).notNull(), // 'monthly' | 'installment' | 'one_time'
  coa: varchar('coa', { length: 50 }),
  description: text('description'),
});

// ==============================================================================
// TUITION: PAYMENT METHODS
// ==============================================================================
export const tuitionPaymentMethods = pgTable('tuition_payment_methods', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  category: varchar('category', { length: 50 }).notNull(),
  coa: varchar('coa', { length: 50 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==============================================================================
// TUITION: PAYMENT INSTRUCTION GROUPS & STEPS
// ==============================================================================
export const tuitionPaymentInstructionGroups = pgTable('tuition_payment_instruction_groups', {
  id: serial('id').primaryKey(),
  paymentMethodId: integer('payment_method_id').notNull(),
  title: varchar('title', { length: 100 }).notNull(),
});

export const tuitionPaymentInstructionSteps = pgTable('tuition_payment_instruction_steps', {
  id: serial('id').primaryKey(),
  groupId: integer('group_id').notNull(),
  stepNumber: integer('step_number').notNull(),
  instructionText: text('instruction_text').notNull(),
});

// ==============================================================================
// TUITION: BILLS
// ==============================================================================
export const tuitionBills = pgTable('tuition_bills', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').notNull(),
  productId: integer('product_id').notNull(),
  academicYearId: integer('academic_year_id').notNull(),
  title: varchar('title', { length: 100 }).notNull(),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
  paidAmount: decimal('paid_amount', { precision: 15, scale: 2 }).default('0'),
  minPayment: decimal('min_payment', { precision: 15, scale: 2 }).default('0'),
  dueDate: date('due_date'),
  status: varchar('status', { length: 20 }).default('unpaid'), // 'paid' | 'unpaid' | 'partial'
  relatedMonth: date('related_month'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==============================================================================
// TUITION: TRANSACTIONS
// ==============================================================================
export const tuitionTransactions = pgTable('tuition_transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  academicYearId: integer('academic_year_id').notNull(),
  referenceNo: varchar('reference_no', { length: 50 }).notNull().unique(),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
  paymentMethodId: integer('payment_method_id'),
  vaNo: varchar('va_no', { length: 100 }),
  qrCode: text('qr_code'),
  status: varchar('status', { length: 20 }).default('pending'), // 'success' | 'pending' | 'failed'
  paymentDate: timestamp('payment_date'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==============================================================================
// TUITION: TRANSACTION DETAILS
// ==============================================================================
export const tuitionTransactionDetails = pgTable('tuition_transaction_details', {
  id: serial('id').primaryKey(),
  transactionId: integer('transaction_id').notNull(),
  billId: integer('bill_id').notNull(),
  amountPaid: decimal('amount_paid', { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==============================================================================
// TUITION: PAYMENT LOGS
// ==============================================================================
export const tuitionPaymentLogs = pgTable('tuition_payment_logs', {
  id: serial('id').primaryKey(),
  transactionId: integer('transaction_id').notNull(),
  requestPayload: text('request_payload'),
  responsePayload: text('response_payload'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==============================================================================
// NOTIF: TEMPLATES
// ==============================================================================
export const notifTemplates = pgTable('notif_templates', {
  id: serial('id').primaryKey(),
  schoolId: integer('school_id'),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'whatsapp' | 'email'
  triggerEvent: varchar('trigger_event', { length: 50 }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==============================================================================
// NOTIF: LOGS
// ==============================================================================
export const notifLogs = pgTable('notif_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'),
  templateId: integer('template_id'),
  type: varchar('type', { length: 20 }).notNull(),
  recipient: varchar('recipient', { length: 100 }).notNull(),
  requestPayload: text('request_payload'),
  responsePayload: text('response_payload'),
  status: varchar('status', { length: 20 }).default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
});
