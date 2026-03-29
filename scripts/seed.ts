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
    ])
    .onConflictDoNothing();

  await db.insert(schema.coreProvinces).values([{ id: 1, name: 'Jawa Barat' }]).onConflictDoNothing();
  await db.insert(schema.coreCities).values([{ id: 1, provinceId: 1, name: 'Kota Bandung' }]).onConflictDoNothing();
  await db.insert(schema.coreDistricts).values([{ id: 1, cityId: 1, name: 'Coblong' }]).onConflictDoNothing();
  await db
    .insert(schema.coreSubdistricts)
    .values([{ id: 1, districtId: 1, name: 'Dago', postalCode: '40135' }])
    .onConflictDoNothing();

  await db
    .insert(schema.coreStudents)
    .values([
      {
        id: 1,
        schoolId: 1,
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
      { userId: 2, studentId: 1, relationType: 'father' },
      { userId: 2, studentId: 2, relationType: 'father' },
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
      { id: 1, name: 'SPP Bulanan', paymentType: 'monthly' },
      { id: 2, name: 'Uang Gedung', paymentType: 'installment' },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.tuitionProductTariffs)
    .values([
      { schoolId: 1, productId: 1, academicYearId: 1, levelGradeId: 1, amount: '750000' },
      { schoolId: 1, productId: 1, academicYearId: 1, levelGradeId: 2, amount: '750000' },
      { schoolId: 4, productId: 1, academicYearId: 1, levelGradeId: 3, amount: '1100000' },
      { schoolId: 1, productId: 1, academicYearId: 2, levelGradeId: 1, amount: '800000' },
      { schoolId: 1, productId: 1, academicYearId: 2, levelGradeId: 2, amount: '850000' },
      { schoolId: 4, productId: 1, academicYearId: 2, levelGradeId: 3, amount: '1200000' },
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
        id: 1,
        studentId: 1,
        productId: 1,
        academicYearId: 2,
        title: 'SPP Juli 2025',
        totalAmount: '800000',
        paidAmount: '0',
        billMonth: 7,
        billYear: 2025,
        relatedMonth: '2025-07-01',
        status: 'unpaid',
      },
      {
        id: 2,
        studentId: 2,
        productId: 1,
        academicYearId: 2,
        title: 'SPP Juli 2025',
        totalAmount: '1200000',
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

  const createdAt = new Date('2024-10-15T10:00:00.000Z');
  const txResult = await pool.query<{
    id: string;
    created_at: Date;
  }>(
    `INSERT INTO tuition_transactions (
      user_id, academic_year_id, reference_no, total_amount, payment_method_id, status, payment_date, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, created_at`,
    [2, 2, 'TRX-OKT-001', 800000, 1, 'success', createdAt, createdAt]
  );
  const tx = txResult.rows[0];
  if (!tx) throw new Error('Insert tuition_transactions failed');

  await pool.query(
    `INSERT INTO tuition_transaction_details (
      transaction_id, transaction_created_at, bill_id, product_id, amount_paid, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6)`,
    [tx.id, tx.created_at, 1, 1, 800000, createdAt]
  );

  await pool.query(
    `UPDATE tuition_bills SET paid_amount = total_amount, status = 'paid', updated_at = NOW() WHERE id = 1`
  );

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
