import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import sql from '@/lib/db';
import {
  SPP_MONTHS,
  billYearForMonth,
  billMonthNumber,
  parseAcademicYearStartYear,
} from '@/lib/billing-spp';
import { resolveTariffAmount } from '@/lib/billing-tariff';

/** Konteks unduhan (sama dengan pilihan dropdown); diulang tiap baris. Label hanya referensi — impor memakai ID + FormData. */
const CONTEXT_HEADERS = [
  'school_id',
  'school_label',
  'cohort_id',
  'cohort_label',
  'academic_year_id',
  'academic_year_label',
  'class_id',
  'class_label',
  'product_id',
  'product_label',
] as const;

const ROW_HEADERS = [
  'nis',
  'student_name',
  'class_name',
  'title',
  'amount',
  'discount_amount',
  'min_payment',
  'status',
  'notes',
  'bill_month',
  'bill_year',
] as const;

const HEADERS = [...CONTEXT_HEADERS, ...ROW_HEADERS];

function applyColumnWidths(sheet: XLSX.WorkSheet) {
  sheet['!cols'] = HEADERS.map((h, i) => ({
    wch: Math.min(36, Math.max(10, String(h).length + 2, i < CONTEXT_HEADERS.length ? 16 : 14)),
  }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const schoolIdStr = searchParams.get('school_id');
  const cohortIdStr = searchParams.get('cohort_id');
  const classIdStr = searchParams.get('class_id');
  const productIdStr = searchParams.get('product_id');
  const ayIdStr = searchParams.get('academic_year_id');

  // Tanpa parameter: hanya header (konteks master diisi di aplikasi saat unduh template penuh & saat unggah)
  if (!schoolIdStr || !cohortIdStr || !classIdStr || !productIdStr || !ayIdStr) {
    const wb = XLSX.utils.book_new();
    const aoa = [HEADERS as unknown as string[]];
    const sheet = XLSX.utils.aoa_to_sheet(aoa);
    applyColumnWidths(sheet);
    XLSX.utils.book_append_sheet(wb, sheet, 'Import');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="template-import-tagihan.xlsx"',
      },
    });
  }

  const schoolId = Number(schoolIdStr);
  const cohortId = Number(cohortIdStr);
  const classId = Number(classIdStr);
  const productId = Number(productIdStr);
  const ayId = Number(ayIdStr);

  const [school] = await sql`SELECT id, name FROM core_schools WHERE id = ${schoolId}`;
  const [cohort] = await sql`SELECT id, name FROM core_cohorts WHERE id = ${cohortId}`;
  const [product] = await sql`SELECT id, name, payment_type FROM tuition_products WHERE id = ${productId}`;
  const [ay] = await sql`SELECT id, name FROM core_academic_years WHERE id = ${ayId}`;
  const [cls] = await sql`SELECT id, name FROM core_classes WHERE id = ${classId}`;

  if (!product || !ay || !school || !cohort) {
    return NextResponse.json({ error: 'Master data (sekolah/angkatan/produk/TA) tidak ditemukan' }, { status: 404 });
  }

  const students = await sql`
    SELECT DISTINCT s.id, s.nis, s.full_name
    FROM core_students s
    JOIN core_student_class_histories ch ON ch.student_id = s.id
    WHERE s.school_id = ${schoolId}
      AND s.cohort_id = ${cohortId}
      AND ch.class_id = ${classId}
      AND ch.academic_year_id = ${ayId}
      AND ch.status = 'active'
    ORDER BY s.full_name ASC
  `;

  const ayStartYear = parseAcademicYearStartYear(String(ay.name));
  const aoa: (string | number | null)[][] = [HEADERS as unknown as string[]];

  const contextPrefix: (string | number)[] = [
    schoolId,
    String(school.name),
    cohortId,
    String(cohort.name),
    ayId,
    String(ay.name),
    classId,
    String(cls?.name ?? ''),
    productId,
    String(product.name),
  ];

  for (const s of students) {
    const studentId = s.id as number;
    const tariff = await resolveTariffAmount(studentId, productId, ayId);
    const amount = tariff.ok ? (tariff.amount as string) : '';
    const minFromTariff = tariff.ok ? String(tariff.minPayment ?? '0') : '';

    const baseRow = [
      s.nis as string,
      s.full_name as string,
      cls?.name as string,
    ];

    if (product.payment_type === 'monthly') {
      for (const monthName of SPP_MONTHS) {
        const by = billYearForMonth(monthName, ayStartYear);
        const bm = billMonthNumber(monthName);
        const title = product.name.toLowerCase().includes('spp')
          ? `SPP ${monthName}`
          : `${product.name} ${monthName}`;

        aoa.push([
          ...contextPrefix,
          ...baseRow,
          title,
          amount,
          '0', // discount_amount
          minFromTariff, // min_payment (dari matriks; boleh diedit di Excel)
          'unpaid',
          '',
          bm,
          by,
        ]);
      }
    } else {
      const title = product.payment_type === 'annualy' ? `${product.name} ${ay.name}` : `${product.name}`;
      aoa.push([
        ...contextPrefix,
        ...baseRow,
        title,
        amount,
        '0',
        minFromTariff,
        'unpaid',
        '',
        null,
        product.payment_type === 'annualy' ? ayStartYear : null,
      ]);
    }
  }

  const wb = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  applyColumnWidths(sheet);
  XLSX.utils.book_append_sheet(wb, sheet, 'Import');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="template_tagihan_${String(product.name).replace(/\s+/g, '_')}.xlsx"`,
    },
  });
}
