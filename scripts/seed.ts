/**
 * Seed memakai driver `pg` (TCP), sama seperti drizzle-kit migrate — hindari neon-http
 * yang bergantung pada `fetch` (sering gagal di beberapa jaringan / proxy).
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { config } from 'dotenv';
import path from 'node:path';
import * as schema from './schema';
import { pgConnectionString } from './pg-url';

config({ path: path.join(process.cwd(), '.env.local') });

const rawUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!rawUrl) {
  console.error('Set DATABASE_URL_UNPOOLED atau DATABASE_URL di .env.local');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: pgConnectionString(rawUrl) });
const db = drizzle(pool, { schema });

async function seed() {
  console.log('🌱 Seeding database...');

  await db
    .insert(schema.corePortalThemes)
    .values([
      {
        id: 1,
        hostDomain: 'parents.kreativaglobal.sch.id',
        portalTitle: 'Kreativa Parent Portal',
        logoUrl: '/assets/brand/kreativa-main.png',
        primaryColor: '#2563eb',
        loginBgUrl: '/assets/bg/kreativa-bg.jpg',
        welcomeText: 'Selamat Datang di Portal Kreativa Global School.',
      },
      {
        id: 2,
        hostDomain: 'parents.talentajuara.sch.id',
        portalTitle: 'Talenta Juara Portal',
        logoUrl: '/assets/brand/talenta-main.png',
        primaryColor: '#ea580c',
        loginBgUrl: '/assets/bg/talenta-bg.jpg',
        welcomeText: 'Mari bersama membangun generasi juara di Talenta Juara.',
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.coreSchools)
    .values([
      { id: 1, themeId: 1, name: 'SD Kreativa Global', address: 'Jl. Merpati 1', schoolLogoUrl: '/assets/logos/sd-kreativa.png' },
      { id: 2, themeId: 1, name: 'SMP Kreativa Global', address: 'Jl. Merpati 2', schoolLogoUrl: '/assets/logos/smp-kreativa.png' },
      { id: 3, themeId: 2, name: 'SD Talenta Juara Bandung', address: 'Jl. Terusan Jkt', schoolLogoUrl: '/assets/logos/sd-talenta.png' },
      { id: 4, themeId: 2, name: 'SMP Talenta Juara Bandung', address: 'Jl. Terusan Jkt', schoolLogoUrl: '/assets/logos/smp-talenta.png' },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.coreAcademicYears)
    .values([
      { id: 1, name: '2024/2025', isActive: false },
      { id: 2, name: '2025/2026', isActive: true },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.coreSettings)
    .values([
      {
        schoolId: null,
        settingKey: 'app_title',
        settingValue: 'Kreativa ERP',
        description: 'Judul aplikasi',
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.coreUsers)
    .values([
      { id: 1, schoolId: null, fullName: 'Superadmin Yayasan', email: 'superadmin@yayasan.com', passwordHash: 'hash', role: 'superadmin' },
      { id: 2, schoolId: null, fullName: 'Budi Santoso', email: 'budi.ayah@email.com', passwordHash: 'hash', role: 'parent' },
      { id: 3, schoolId: 4, fullName: 'Zevanya', email: 'zevanya@student.com', passwordHash: 'hash', role: 'student' },
      { id: 10, schoolId: 4, fullName: 'Mr. Hendra', email: 'hendra.teacher@kreativa.sch.id', passwordHash: 'hash', role: 'teacher' },
      { id: 11, schoolId: 4, fullName: 'Mrs. Rina', email: 'rina.teacher@kreativa.sch.id', passwordHash: 'hash', role: 'teacher' },
      { id: 12, schoolId: 4, fullName: 'Mr. John', email: 'john.teacher@kreativa.sch.id', passwordHash: 'hash', role: 'teacher' },
      { id: 13, schoolId: 4, fullName: 'Mrs. Susi', email: 'susi.teacher@kreativa.sch.id', passwordHash: 'hash', role: 'teacher' },
    ])
    .onConflictDoNothing();

  await db.insert(schema.coreProvinces).values([{ id: 1, name: 'Jawa Barat' }]).onConflictDoNothing();
  await db.insert(schema.coreCities).values([{ id: 1, provinceId: 1, name: 'Kota Bandung' }]).onConflictDoNothing();
  await db.insert(schema.coreDistricts).values([{ id: 1, cityId: 1, name: 'Coblong' }]).onConflictDoNothing();
  await db.insert(schema.coreSubdistricts).values([{ id: 1, districtId: 1, name: 'Dago', postalCode: '40135' }]).onConflictDoNothing();

  await db
    .insert(schema.coreCohorts)
    .values([
      { id: 1, schoolId: 1, name: 'Angkatan 2024' },
      { id: 2, schoolId: 4, name: 'Angkatan 2024' },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.coreStudents)
    .values([
      {
        id: 1,
        schoolId: 1,
        cohortId: 1,
        userId: null,
        fullName: 'Revy Ahmad',
        username: 'revy.ahmad',
        nis: 'SD-001',
        nisn: '00112233',
        gender: 'L',
        studentType: 'Reguler',
        program: 'Reguler',
        curriculum: 'Merdeka',
        entryAcademicYearId: 2,
        activeAcademicYearId: 2,
      },
      {
        id: 2,
        schoolId: 4,
        cohortId: 2,
        userId: 3,
        fullName: 'Zevanya',
        username: 'zevanya',
        nis: 'SMP-001',
        nisn: '00112244',
        gender: 'P',
        studentType: 'Reguler',
        program: 'Reguler',
        curriculum: 'Merdeka',
        entryAcademicYearId: 2,
        activeAcademicYearId: 2,
      },
    ])
    .onConflictDoNothing();
  await db
    .insert(schema.coreStudentEducationHistories)
    .values([
      { studentId: 1, schoolName: 'TK Permata Hati', levelLabel: 'TK', yearFrom: 2021, yearTo: 2023, notes: 'Lulus dengan baik' },
      { studentId: 2, schoolName: 'SD Negeri 1 Bandung', levelLabel: 'SD', yearFrom: 2018, yearTo: 2024, notes: 'Siswa berprestasi' },
    ])
    .onConflictDoNothing();


  await db
    .insert(schema.coreStudentParentProfiles)
    .values([
      {
        studentId: 1,
        relationType: 'father',
        fullName: 'Budi Santoso',
        phone: '081234567890',
        education: 'S1',
        occupation: 'Wiraswasta',
        incomeBracket: '3-5 jt',
      },
      {
        studentId: 1,
        relationType: 'mother',
        fullName: 'Ani Wijaya',
        phone: '081298765432',
        education: 'S1',
        occupation: 'Guru',
        incomeBracket: '3-5 jt',
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.coreParentStudentRelations)
    .values([
      {
        userId: 2,
        studentId: 1,
        relationType: 'father',
        nik: '3201010101010001',
        birthYear: '1980',
        education: 'S1',
        occupation: 'Wiraswasta',
        incomeRange: '3-5jt',
      },
      {
        userId: 2,
        studentId: 2,
        relationType: 'father',
        nik: '3201010101010001',
        birthYear: '1980',
        education: 'S1',
        occupation: 'Wiraswasta',
        incomeRange: '3-5jt',
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.coreStudentDocuments)
    .values([
      {
        studentId: 1,
        documentType: 'Kartu Keluarga',
        fileName: 'kk_revy.pdf',
        filePath: '/storage/documents/kk_revy.pdf',
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.coreLevelGrades)
    .values([
      { id: 1, schoolId: 1, name: 'Kelas 1', levelOrder: 1 },
      { id: 2, schoolId: 1, name: 'Kelas 2', levelOrder: 2 },
      { id: 3, schoolId: 4, name: 'Kelas 7', levelOrder: 7 },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.coreClasses)
    .values([
      { id: 1, schoolId: 1, levelGradeId: 1, name: 'KELAS 1 A' },
      { id: 2, schoolId: 4, levelGradeId: 3, name: '7A' },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.coreStudentClassHistories)
    .values([
      { studentId: 1, classId: 1, levelGradeId: 1, academicYearId: 2, status: 'active' },
      { studentId: 2, classId: 2, levelGradeId: 3, academicYearId: 2, status: 'active' },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.coreAppModules)
    .values([
      { id: 1, moduleCode: 'financial', moduleName: 'Keuangan (SPP)' },
      { id: 2, moduleCode: 'academic', moduleName: 'Nilai Harian & Rapor' },
      { id: 3, moduleCode: 'habits', moduleName: 'Pembiasaan (Ibadah Harian)' },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.coreModuleAccess)
    .values([
      { moduleId: 1, schoolId: null, levelGradeId: null, isVisible: true },
      { moduleId: 2, schoolId: null, levelGradeId: null, isVisible: true },
      { moduleId: 3, schoolId: null, levelGradeId: null, isVisible: false },
      { moduleId: 3, schoolId: null, levelGradeId: 1, isVisible: true },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.tuitionProducts)
    .values([
      { id: 1, name: 'SPP Bulanan', paymentType: 'monthly', isInstallment: false },
      { id: 2, name: 'DSP (Uang Gedung)', paymentType: 'one_time', isInstallment: true },
      { id: 3, name: 'DKT (Uang Tahunan)', paymentType: 'annualy', isInstallment: false },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.tuitionProductTariffs)
    .values([
      { schoolId: 1, productId: 1, academicYearId: 1, cohortId: 1, amount: '750000' },
      { schoolId: 4, productId: 1, academicYearId: 1, cohortId: 2, amount: '1100000' },
      { schoolId: 1, productId: 1, academicYearId: 2, cohortId: 1, amount: '800000' },
      { schoolId: 4, productId: 1, academicYearId: 2, cohortId: 2, amount: '1200000' },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.tuitionPaymentMethods)
    .values([
      { id: 1, name: 'BCA Virtual Account', code: 'BCA_TF', category: 'Virtual Account', coa: '1101.01.001' },
      { id: 2, name: 'GoPay', code: 'GOPAY', category: 'e-Wallet', coa: '1101.02.002' },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.tuitionBills)
    .values([
      {
        schoolId: 1,
        cohortId: 1,
        studentId: 1,
        productId: 1,
        academicYearId: 2,
        title: 'SPP Juli 2025',
        totalAmount: '800000',
        discountAmount: '0',
        paidAmount: '0',
        billMonth: 7,
        billYear: 2025,
        relatedMonth: '2025-07-01',
        status: 'unpaid',
      },
      {
        schoolId: 4,
        cohortId: 2,
        studentId: 2,
        productId: 1,
        academicYearId: 2,
        title: 'SPP Juli 2025',
        totalAmount: '1200000',
        discountAmount: '0',
        paidAmount: '0',
        billMonth: 7,
        billYear: 2025,
        relatedMonth: '2025-07-01',
        status: 'unpaid',
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.notifTemplates)
    .values([
      {
        id: 1,
        schoolId: null,
        name: 'Payment Success WA',
        type: 'whatsapp',
        triggerEvent: 'PAYMENT_SUCCESS',
        content: 'Halo {name}, pembayaran untuk {bill_title} sebesar {amount} telah berhasil.',
      },
    ])
    .onConflictDoNothing();

  // ==============================================================================
  // ACADEMIC SEED DATA
  // ==============================================================================

  await db
    .insert(schema.academicSubjects)
    .values([
      { id: 1, code: 'MATH', nameEn: 'Math', nameId: 'Matematika', colorTheme: 'bg-blue-100 text-blue-600' },
      { id: 2, code: 'SCI', nameEn: 'Science', nameId: 'Ilmu Pengetahuan Alam', colorTheme: 'bg-emerald-100 text-emerald-600' },
      { id: 3, code: 'ENG', nameEn: 'English', nameId: 'Bahasa Inggris', colorTheme: 'bg-orange-100 text-orange-600' },
      { id: 4, code: 'ART', nameEn: 'Art', nameId: 'Seni Budaya', colorTheme: 'bg-purple-100 text-purple-600' },
      { id: 5, code: 'HIST', nameEn: 'History', nameId: 'Sejarah', colorTheme: 'bg-yellow-100 text-yellow-600' },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.coreTeachers)
    .values([
      { id: 1, userId: 10, nip: null, joinDate: '2022-07-01', latestEducation: 'S1 Pendidikan Matematika' },
      { id: 2, userId: 11, nip: null, joinDate: '2021-08-15', latestEducation: 'S1 Pendidikan IPA' },
      { id: 3, userId: 12, nip: null, joinDate: '2023-01-10', latestEducation: 'S2 TESOL' },
      { id: 4, userId: 13, nip: null, joinDate: '2020-03-01', latestEducation: 'S1 Pendidikan Seni' },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.academicSemesters)
    .values([{ id: 1, academicYear: '2023/2024', semesterLabel: '1', isActive: true }])
    .onConflictDoNothing();

  await db
    .insert(schema.academicSchedules)
    .values([
      { studentId: 1, subjectId: 1, teacherId: 1, dayOfWeek: 'Monday', startTime: '07:30', endTime: '09:00', isBreak: false },
      { studentId: 1, subjectId: 2, teacherId: 2, dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:30', isBreak: false },
      { studentId: 1, subjectId: null, teacherId: null, dayOfWeek: 'Monday', startTime: '10:30', endTime: '11:00', isBreak: true },
      { studentId: 1, subjectId: 3, teacherId: 3, dayOfWeek: 'Monday', startTime: '11:00', endTime: '12:30', isBreak: false },
      { studentId: 2, subjectId: 4, teacherId: 4, dayOfWeek: 'Monday', startTime: '08:00', endTime: '09:30', isBreak: false },
      { studentId: 2, subjectId: null, teacherId: null, dayOfWeek: 'Monday', startTime: '09:30', endTime: '10:00', isBreak: true },
      { studentId: 2, subjectId: 1, teacherId: 1, dayOfWeek: 'Monday', startTime: '10:00', endTime: '11:30', isBreak: false },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.academicAttendances)
    .values([
      { studentId: 1, attendanceDate: '2023-11-12', status: 'sick', noteEn: 'Fever', noteId: 'Demam' },
      { studentId: 1, attendanceDate: '2023-10-05', status: 'permission', noteEn: 'Family event', noteId: 'Acara keluarga' },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.academicGrades)
    .values([
      { studentId: 1, semesterId: 1, subjectId: 1, score: '88' },
      { studentId: 1, semesterId: 1, subjectId: 2, score: '92' },
      { studentId: 1, semesterId: 1, subjectId: 3, score: '85' },
      { studentId: 1, semesterId: 1, subjectId: 5, score: '78' },
      { studentId: 2, semesterId: 1, subjectId: 1, score: '95' },
      { studentId: 2, semesterId: 1, subjectId: 2, score: '90' },
      { studentId: 2, semesterId: 1, subjectId: 4, score: '98' },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.academicAgendas)
    .values([
      { schoolId: 4, targetGrade: null, eventDate: '2023-11-20', titleEn: 'Mid-term Examinations', titleId: 'Ujian Tengah Semester', timeRange: '07:30 - 12:00 WIB', eventType: 'exam' },
      { schoolId: 4, targetGrade: 'Grade 4', eventDate: '2023-11-25', titleEn: 'Museum Field Trip (Grade 4)', titleId: 'Kunjungan Museum (Kelas 4)', timeRange: '08:00 - 14:00 WIB', eventType: 'event' },
      { schoolId: 4, targetGrade: null, eventDate: '2023-12-01', titleEn: "National Teacher's Day", titleId: 'Peringatan Hari Guru Nasional', timeRange: '07:00 - 10:00 WIB', eventType: 'event' },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.academicAnnouncements)
    .values([
      {
        schoolId: 4,
        publishDate: '2023-11-18',
        titleEn: 'New School Bus Route',
        titleId: 'Rute Bus Sekolah Baru',
        contentEn: 'Starting next month, we are adding a new route covering the South District.',
        contentId: 'Mulai bulan depan, kami menambahkan rute baru yang mencakup Area Selatan.',
        featuredImage: '/assets/announcements/school-bus.jpg',
      },
      {
        schoolId: 4,
        publishDate: '2023-11-15',
        titleEn: 'Library Renovation Completed',
        titleId: 'Renovasi Perpustakaan Selesai',
        contentEn: 'Students can now enjoy the newly renovated library.',
        contentId: 'Siswa kini dapat menikmati perpustakaan yang baru direnovasi.',
        featuredImage: '/assets/announcements/library.jpg',
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.academicClinicVisits)
    .values([
      { studentId: 1, visitDate: '2023-11-12', complaintEn: 'Fever', complaintId: 'Demam', actionEn: 'Given paracetamol and rested', actionId: 'Diberi paracetamol dan istirahat' },
      { studentId: 2, visitDate: '2023-09-02', complaintEn: 'Scraped knee', complaintId: 'Lutut lecet', actionEn: 'Cleaned and bandaged', actionId: 'Dibersihkan dan diperban' },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.academicHabits)
    .values([
      { studentId: 1, habitDate: '2023-11-18', fajr: true, dhuhr: true, asr: false, maghrib: false, isha: false, dhuha: true, tahajud: false, readQuran: false, wakeUpEarly: true, helpParents: true },
      { studentId: 1, habitDate: '2023-11-17', fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true, dhuha: false, tahajud: false, readQuran: true, wakeUpEarly: true, helpParents: true },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.academicAdaptiveTests)
    .values([
      { id: 1, studentId: 1, subjectId: 1, testDate: new Date('2023-11-18 14:00:00'), score: 85, masteryLevel: '0.85' },
      { id: 2, studentId: 1, subjectId: 2, testDate: new Date('2023-11-15 09:30:00'), score: 70, masteryLevel: '0.70' },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.academicAdaptiveQuestions)
    .values([
      {
        adaptiveTestId: 1,
        subjectId: 1,
        gradeBand: 'g4-6',
        difficulty: '0.75',
        questionText: 'What is 12 x 15?',
        optionsJson: ['180', '165', '170', '175'],
        correctAnswer: '180',
        studentAnswer: '180',
        explanation: '12 x 15 = 12 x 10 + 12 x 5 = 120 + 60 = 180',
      },
      {
        adaptiveTestId: 1,
        subjectId: 1,
        gradeBand: 'g4-6',
        difficulty: '0.50',
        questionText: 'What is 15 + 25?',
        optionsJson: ['30', '40', '50', '45'],
        correctAnswer: '40',
        studentAnswer: '45',
        explanation: '15 + 25 = 40. Basic addition.',
      },
      {
        adaptiveTestId: 2,
        subjectId: 2,
        gradeBand: 'g4-6',
        difficulty: '0.60',
        questionText: 'What is H2O?',
        optionsJson: ['Water', 'Salt', 'Oxygen', 'Iron'],
        correctAnswer: 'Water',
        studentAnswer: 'Water',
        explanation: 'H2O is water.',
      },
    ])
    .onConflictDoNothing();

  const createdAt = new Date('2024-10-15T10:00:00.000Z');
  const txResult = await pool.query<{
    id: string;
    created_at: Date;
  }>(
    `INSERT INTO tuition_transactions (
      user_id, academic_year_id, reference_no, total_amount, payment_method_id, status, payment_date, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT DO NOTHING
    RETURNING id, created_at`,
    [2, 2, 'TRX-OKT-001', 800000, 1, 'success', createdAt, createdAt]
  );

  if (txResult.rows.length > 0) {
    const tx = txResult.rows[0];
    await pool.query(
      `INSERT INTO tuition_transaction_details (
        transaction_id, transaction_created_at, bill_id, product_id, amount_paid, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING`,
      [tx.id, tx.created_at, 1, 1, 800000, createdAt]
    );

    await pool.query(
      `UPDATE tuition_bills SET paid_amount = total_amount, status = 'paid', updated_at = NOW() WHERE id = 1`
    );
  }

  await pool.query(
    `SELECT setval('core_portal_themes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM core_portal_themes))`
  );
  await pool.query(`SELECT setval('core_schools_id_seq', (SELECT COALESCE(MAX(id), 1) FROM core_schools))`);
  await pool.query(
    `SELECT setval('core_academic_years_id_seq', (SELECT COALESCE(MAX(id), 1) FROM core_academic_years))`
  );
  await pool.query(`SELECT setval('core_users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM core_users))`);
  await pool.query(`SELECT setval('core_students_id_seq', (SELECT COALESCE(MAX(id), 1) FROM core_students))`);
  await pool.query(
    `SELECT setval('core_cohorts_id_seq', (SELECT COALESCE(MAX(id), 1) FROM core_cohorts))`
  );
  await pool.query(
    `SELECT setval('core_level_grades_id_seq', (SELECT COALESCE(MAX(id), 1) FROM core_level_grades))`
  );
  await pool.query(`SELECT setval('core_classes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM core_classes))`);
  await pool.query(
    `SELECT setval('core_app_modules_id_seq', (SELECT COALESCE(MAX(id), 1) FROM core_app_modules))`
  );
  await pool.query(
    `SELECT setval('tuition_products_id_seq', (SELECT COALESCE(MAX(id), 1) FROM tuition_products))`
  );
  await pool.query(
    `SELECT setval('tuition_product_tariffs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM tuition_product_tariffs))`
  );
  await pool.query(`SELECT setval('tuition_bills_id_seq', (SELECT COALESCE(MAX(id), 1) FROM tuition_bills))`);
  await pool.query(
    `SELECT setval('tuition_payment_methods_id_seq', (SELECT COALESCE(MAX(id), 1) FROM tuition_payment_methods))`
  );
  await pool.query(
    `SELECT setval('core_student_education_histories_id_seq', (SELECT COALESCE(MAX(id), 1) FROM core_student_education_histories))`
  );

  // Academic sequence resets
  await pool.query(`SELECT setval('academic_subjects_id_seq', (SELECT COALESCE(MAX(id), 1) FROM academic_subjects))`);
  await pool.query(`SELECT setval('core_teachers_id_seq', (SELECT COALESCE(MAX(id), 1) FROM core_teachers))`);
  await pool.query(`SELECT setval('academic_semesters_id_seq', (SELECT COALESCE(MAX(id), 1) FROM academic_semesters))`);
  await pool.query(`SELECT setval('academic_schedules_id_seq', (SELECT COALESCE(MAX(id), 1) FROM academic_schedules))`);
  await pool.query(`SELECT setval('academic_attendances_id_seq', (SELECT COALESCE(MAX(id), 1) FROM academic_attendances))`);
  await pool.query(`SELECT setval('academic_grades_id_seq', (SELECT COALESCE(MAX(id), 1) FROM academic_grades))`);
  await pool.query(`SELECT setval('academic_agendas_id_seq', (SELECT COALESCE(MAX(id), 1) FROM academic_agendas))`);
  await pool.query(`SELECT setval('academic_announcements_id_seq', (SELECT COALESCE(MAX(id), 1) FROM academic_announcements))`);
  await pool.query(`SELECT setval('academic_clinic_visits_id_seq', (SELECT COALESCE(MAX(id), 1) FROM academic_clinic_visits))`);
  await pool.query(`SELECT setval('academic_habits_id_seq', (SELECT COALESCE(MAX(id), 1) FROM academic_habits))`);
  await pool.query(`SELECT setval('academic_adaptive_tests_id_seq', (SELECT COALESCE(MAX(id), 1) FROM academic_adaptive_tests))`);
  await pool.query(`SELECT setval('academic_adaptive_questions_id_seq', (SELECT COALESCE(MAX(id), 1) FROM academic_adaptive_questions))`);

  console.log('✅ Seeding complete!');
}

seed()
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  })
  .finally(() => {
    void pool.end();
  });
