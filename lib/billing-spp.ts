import sql from '@/lib/db';

/** Urutan bulan tahun ajaran (Juli–Juni), sama dengan generate tagihan lama */
export const SPP_MONTHS = [
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
] as const;

export type SppMonthName = (typeof SPP_MONTHS)[number];

export function billYearForMonth(monthName: string, academicYearStart: number): number {
  const idx = SPP_MONTHS.indexOf(monthName as SppMonthName);
  if (idx < 0) return academicYearStart;
  return idx < 6 ? academicYearStart : academicYearStart + 1;
}

export function billMonthNumber(monthName: string): number {
  const m: Record<string, number> = {
    January: 1,
    February: 2,
    March: 3,
    April: 4,
    May: 5,
    June: 6,
    July: 7,
    August: 8,
    September: 9,
    October: 10,
    November: 11,
    December: 12,
  };
  return m[monthName] ?? 1;
}

/** Parse tahun mulai dari nama TA, mis. "2024/2025" → 2024 */
export function parseAcademicYearStartYear(ayName: string): number {
  return parseInt(String(ayName).split('/')[0]?.trim() || '0', 10);
}

const EN_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export function englishMonthNameFromNumber(billMonth: number): string {
  if (billMonth < 1 || billMonth > 12) return 'January';
  return EN_MONTHS[billMonth - 1];
}

export type InsertBillParams = {
  studentId: number;
  productId: number;
  academicYearId: number;
  title: string;
  amount: string | number;
  billMonth: number | null;
  billYear: number | null;
  relatedMonth: string | null;
};

/**
 * Sisip satu tagihan jika belum ada (kunci duplikat: student + product + TA + title).
 */
export async function insertTuitionBillIfNotExists(
  p: InsertBillParams
): Promise<{ created: boolean }> {
  const existing = await sql`
    SELECT id FROM tuition_bills
    WHERE student_id = ${p.studentId}
      AND product_id = ${p.productId}
      AND academic_year_id = ${p.academicYearId}
      AND title = ${p.title}
    LIMIT 1
  `;
  if (existing.length > 0) return { created: false };

  await sql`
    INSERT INTO tuition_bills (
      student_id, product_id, academic_year_id, title,
      total_amount, paid_amount, status,
      bill_month, bill_year, related_month
    )
    VALUES (
      ${p.studentId},
      ${p.productId},
      ${p.academicYearId},
      ${p.title},
      ${p.amount},
      0,
      'unpaid',
      ${p.billMonth},
      ${p.billYear},
      ${p.relatedMonth}
    )
  `;
  return { created: true };
}

export function relatedMonthDate(billYear: number, billMonth: number): string {
  return `${billYear}-${String(billMonth).padStart(2, '0')}-01`;
}

export async function insertSppMonthBill(
  studentId: number,
  productId: number,
  academicYearId: number,
  monthName: string,
  academicYearStart: number,
  amount: string | number
): Promise<{ created: boolean }> {
  const title = `SPP ${monthName}`;
  const billYear = billYearForMonth(monthName, academicYearStart);
  const billMonth = billMonthNumber(monthName);
  return insertTuitionBillIfNotExists({
    studentId,
    productId,
    academicYearId,
    title,
    amount,
    billMonth,
    billYear,
    relatedMonth: relatedMonthDate(billYear, billMonth),
  });
}

/**
 * Generate 12 bulan SPP untuk satu siswa (skip duplikat per bulan).
 */
export async function generateSpp12ForStudent(
  studentId: number,
  productId: number,
  academicYearId: number,
  academicYearStart: number,
  amount: string | number
): Promise<{ bills_created: number }> {
  let bills_created = 0;
  for (const month of SPP_MONTHS) {
    const { created } = await insertSppMonthBill(
      studentId,
      productId,
      academicYearId,
      month,
      academicYearStart,
      amount
    );
    if (created) bills_created++;
  }
  return { bills_created };
}
