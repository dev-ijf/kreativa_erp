import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log('🌱 Seeding database...');

  // 1. Schools
  await db.insert(schema.coreSchools).values([
    { id: 1, name: 'SMA Cendekia', address: 'Jl. Merpati 1, Jakarta' },
    { id: 2, name: 'SMP Cendekia', address: 'Jl. Merpati 2, Jakarta' },
  ]).onConflictDoNothing();

  // 2. Academic Years
  await db.insert(schema.coreAcademicYears).values([
    { id: 1, name: '2023/2024', isActive: false },
    { id: 2, name: '2024/2025', isActive: true },
  ]).onConflictDoNothing();

  // 2B. Settings
  await db.insert(schema.coreSettings).values([
    { schoolId: null, settingKey: 'app_title', settingValue: 'Kreativa Portal', description: 'Judul aplikasi utama global' },
    { schoolId: null, settingKey: 'global_logo_url', settingValue: 'https://digieduka.web.id/assets/logo.png', description: 'Logo default' },
    { schoolId: null, settingKey: 'primary_color', settingValue: '#2563eb', description: 'Warna tema utama global' },
    { schoolId: 1, settingKey: 'primary_color', settingValue: '#1e40af', description: 'Warna tema SMA Cendekia' },
    { schoolId: 2, settingKey: 'primary_color', settingValue: '#047857', description: 'Warna tema SMP Cendekia' },
  ]).onConflictDoNothing();

  // 3. Users
  await db.insert(schema.coreUsers).values([
    { id: 1, schoolId: null, fullName: 'System Superadmin', email: 'superadmin@yayasan.com', passwordHash: 'hash', role: 'superadmin' },
    { id: 2, schoolId: 1, fullName: 'Finance SMA', email: 'finance@sma-cendekia.com', passwordHash: 'hash', role: 'school_finance' },
    { id: 3, schoolId: 2, fullName: 'Finance SMP', email: 'finance@smp-cendekia.com', passwordHash: 'hash', role: 'school_finance' },
    { id: 4, schoolId: null, fullName: 'Budi Santoso', email: 'budi.ayah@email.com', passwordHash: 'hash', role: 'parent' },
    { id: 5, schoolId: null, fullName: 'Siti Aminah', email: 'siti.ibu@email.com', passwordHash: 'hash', role: 'parent' },
  ]).onConflictDoNothing();

  // 3B. Regional
  await db.insert(schema.coreProvinces).values([{ id: 1, name: 'DKI Jakarta' }]).onConflictDoNothing();
  await db.insert(schema.coreCities).values([{ id: 1, provinceId: 1, name: 'Jakarta Selatan' }]).onConflictDoNothing();
  await db.insert(schema.coreDistricts).values([{ id: 1, cityId: 1, name: 'Kebayoran Lama' }]).onConflictDoNothing();
  await db.insert(schema.coreSubdistricts).values([{ id: 1, districtId: 1, name: 'Pondok Pinang', postalCode: '12240' }]).onConflictDoNothing();

  // 4. Students
  await db.insert(schema.coreStudents).values([
    {
      id: 1, schoolId: 1, fullName: 'Ahmad Santoso', nis: 'SMA-001', nisn: '0012345678',
      previousSchool: 'SMP Negeri 1', gender: 'L', placeOfBirth: 'Jakarta',
      dateOfBirth: '2008-05-15', religion: 'Islam', childOrder: 1, siblingsCount: 2,
      childStatus: 'Kandung', address: 'Jl. Merpati No. 45', provinceId: 1, cityId: 1,
      districtId: 1, subdistrictId: 1, postalCode: '12240', phone: '081299998888',
      email: 'ahmad@email.com', livingWith: 'Orang Tua', bloodType: 'O',
      weightKg: '55.50', heightCm: 165, allergies: 'Tidak ada', visionCondition: 'Normal',
      hearingCondition: 'Normal', specialNeeds: 'Tidak', chronicDiseases: 'Tidak ada',
      physicalAbnormalities: 'Tidak ada', recurringDiseases: 'Tidak ada',
    },
    {
      id: 2, schoolId: 2, fullName: 'Aisyah Santoso', nis: 'SMP-001', nisn: '0034567890',
      previousSchool: 'SD Negeri 2', gender: 'P', placeOfBirth: 'Jakarta',
      dateOfBirth: '2011-08-20', religion: 'Islam', childOrder: 2, siblingsCount: 2,
      childStatus: 'Kandung', address: 'Jl. Merpati No. 45', provinceId: 1, cityId: 1,
      districtId: 1, subdistrictId: 1, postalCode: '12240', phone: '081277776666',
      email: 'aisyah@email.com', livingWith: 'Orang Tua', bloodType: 'A',
      weightKg: '42.00', heightCm: 150, allergies: 'Alergi Seafood', visionCondition: 'Minus 1',
      hearingCondition: 'Normal', specialNeeds: 'Tidak', chronicDiseases: 'Asma',
      physicalAbnormalities: 'Tidak ada', recurringDiseases: 'Asma',
    },
  ]).onConflictDoNothing();

  // 4B. Student Documents
  await db.insert(schema.coreStudentDocuments).values([
    { studentId: 1, documentType: 'KARTU KELUARGA', fileName: 'kk_ahmad_santoso.pdf', filePath: '/storage/documents/kk_ahmad_santoso.pdf' },
    { studentId: 1, documentType: 'AKTA KELAHIRAN', fileName: 'akta_ahmad_santoso.pdf', filePath: '/storage/documents/akta_ahmad_santoso.pdf' },
  ]).onConflictDoNothing();

  // 5. Parent-Student Relations
  await db.insert(schema.coreParentStudentRelations).values([
    { userId: 4, studentId: 1, relationType: 'father' },
    { userId: 4, studentId: 2, relationType: 'father' },
    { userId: 5, studentId: 1, relationType: 'mother' },
    { userId: 5, studentId: 2, relationType: 'mother' },
  ]).onConflictDoNothing();

  // 6. Level Grades
  await db.insert(schema.coreLevelGrades).values([
    { id: 1, schoolId: 1, name: 'Kelas 11', levelOrder: 11 },
    { id: 2, schoolId: 1, name: 'Kelas 12', levelOrder: 12 },
    { id: 3, schoolId: 2, name: 'Kelas 8', levelOrder: 8 },
  ]).onConflictDoNothing();

  // 7. Classes & Histories
  await db.insert(schema.coreClasses).values([
    { id: 1, schoolId: 1, levelGradeId: 1, name: '11 IPA 1' },
    { id: 2, schoolId: 1, levelGradeId: 2, name: '12 IPA 1' },
    { id: 3, schoolId: 2, levelGradeId: 3, name: '8A' },
  ]).onConflictDoNothing();

  await db.insert(schema.coreStudentClassHistories).values([
    { studentId: 1, classId: 1, levelGradeId: 1, academicYearId: 1, status: 'completed' },
    { studentId: 1, classId: 2, levelGradeId: 2, academicYearId: 2, status: 'active' },
    { studentId: 2, classId: 3, levelGradeId: 3, academicYearId: 2, status: 'active' },
  ]).onConflictDoNothing();

  // 8. Payment Methods
  await db.insert(schema.tuitionPaymentMethods).values([
    { id: 1, name: 'Credit Card', code: 'CC', category: 'Credit Card', coa: '1101.02.001' },
    { id: 2, name: 'GoPay', code: 'GOPAY', category: 'e-Wallet', coa: '1101.02.002' },
    { id: 3, name: 'Bank Transfer BCA', code: 'BCA_TF', category: 'Virtual Account', coa: '1101.01.001' },
  ]).onConflictDoNothing();

  // 9. Payment Instruction Groups
  await db.insert(schema.tuitionPaymentInstructionGroups).values([
    { id: 1, paymentMethodId: 2, title: 'Pembayaran melalui Aplikasi Gojek' },
    { id: 2, paymentMethodId: 3, title: 'Pembayaran melalui m-BCA' },
    { id: 3, paymentMethodId: 3, title: 'Pembayaran melalui ATM BCA' },
  ]).onConflictDoNothing();

  await db.insert(schema.tuitionPaymentInstructionSteps).values([
    { groupId: 1, stepNumber: 1, instructionText: 'Buka aplikasi Gojek di HP Anda.' },
    { groupId: 1, stepNumber: 2, instructionText: 'Pilih menu Bayar lalu scan QRIS yang muncul di layar.' },
    { groupId: 1, stepNumber: 3, instructionText: 'Konfirmasi nominal pembayaran dan masukkan PIN GoPay Anda.' },
    { groupId: 2, stepNumber: 1, instructionText: 'Buka aplikasi m-BCA dan lakukan login.' },
    { groupId: 2, stepNumber: 2, instructionText: 'Pilih menu M-Transfer > BCA Virtual Account.' },
    { groupId: 2, stepNumber: 3, instructionText: 'Masukkan nomor Virtual Account yang tertera pada halaman pembayaran.' },
    { groupId: 2, stepNumber: 4, instructionText: 'Periksa detail tagihan, lalu masukkan PIN m-BCA Anda untuk menyelesaikan transaksi.' },
    { groupId: 3, stepNumber: 1, instructionText: 'Masukkan kartu ATM dan PIN BCA Anda.' },
    { groupId: 3, stepNumber: 2, instructionText: 'Pilih Transaksi Lainnya > Transfer > ke Rekening BCA Virtual Account.' },
    { groupId: 3, stepNumber: 3, instructionText: 'Masukkan nomor Virtual Account.' },
    { groupId: 3, stepNumber: 4, instructionText: 'Pastikan nama dan nominal sesuai, lalu tekan Benar.' },
  ]).onConflictDoNothing();

  // 10. Products
  await db.insert(schema.tuitionProducts).values([
    { id: 1, schoolId: 1, name: 'SPP SMA', paymentType: 'monthly', coa: '4101.01.000' },
    { id: 2, schoolId: 1, name: 'Building Fee SMA', paymentType: 'installment', coa: '4102.01.000' },
    { id: 3, schoolId: 2, name: 'SPP SMP', paymentType: 'monthly', coa: '4101.02.000' },
  ]).onConflictDoNothing();

  // 11. Bills
  await db.insert(schema.tuitionBills).values([
    { id: 1, studentId: 1, productId: 1, academicYearId: 2, title: 'SPP October 2024', totalAmount: '1500000', paidAmount: '1500000', minPayment: '0', status: 'paid', relatedMonth: '2024-10-01' },
    { id: 2, studentId: 1, productId: 1, academicYearId: 2, title: 'SPP November 2024', totalAmount: '1500000', paidAmount: '0', minPayment: '0', status: 'unpaid', relatedMonth: '2024-11-01' },
    { id: 3, studentId: 1, productId: 2, academicYearId: 2, title: 'Building Fee', totalAmount: '15000000', paidAmount: '5000000', minPayment: '500000', status: 'partial', relatedMonth: null },
    { id: 4, studentId: 2, productId: 3, academicYearId: 2, title: 'SPP October 2024', totalAmount: '1000000', paidAmount: '0', minPayment: '0', status: 'unpaid', relatedMonth: '2024-10-01' },
  ]).onConflictDoNothing();

  // 12. Transactions
  await db.insert(schema.tuitionTransactions).values([
    { id: 1, userId: 4, academicYearId: 2, referenceNo: 'TRX-BUDI-001', totalAmount: '1500000', paymentMethodId: 1, status: 'success', paymentDate: new Date('2024-10-05T10:00:00') },
  ]).onConflictDoNothing();

  await db.insert(schema.tuitionTransactionDetails).values([
    { transactionId: 1, billId: 1, amountPaid: '1500000' },
  ]).onConflictDoNothing();

  // 14. Notification Templates
  await db.insert(schema.notifTemplates).values([
    { id: 1, schoolId: null, name: 'Payment Success WA', type: 'whatsapp', triggerEvent: 'PAYMENT_SUCCESS', content: 'Halo {name}, pembayaran untuk {bill_title} sebesar {amount} telah berhasil diterima. Terima kasih.' },
  ]).onConflictDoNothing();

  console.log('✅ Seeding complete!');
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
