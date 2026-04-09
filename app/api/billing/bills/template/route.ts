import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import sql from '@/lib/db';
import {
  SPP_MONTHS,
  billYearForMonth,
  billMonthNumber,
  parseAcademicYearStartYear,
  relatedMonthDate,
} from '@/lib/billing-spp';
import { resolveTariffAmount } from '@/lib/billing-tariff';

const HEADERS = [
  'nis',
  'student_name', // helper
  'class_name', // helper
  'title',
  'amount',
  'discount_amount',
  'status',
  'notes',
  'bill_month',
  'bill_year',
  'school_id',
  'academic_year_id',
  'product_id',
  'cohort_id',
  'school_label', // helper
  'academic_year_label', // helper
  'product_label', // helper
  'cohort_label', // helper
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const schoolIdStr = searchParams.get('school_id');
  const cohortIdStr = searchParams.get('cohort_id');
  const classIdStr = searchParams.get('class_id');
  const productIdStr = searchParams.get('product_id');
  const ayIdStr = searchParams.get('academic_year_id');

  // Jika tidak ada parameter, kembalikan template kosong dengan headers saja
  if (!schoolIdStr || !cohortIdStr || !classIdStr || !productIdStr || !ayIdStr) {
    const wb = XLSX.utils.book_new();
    const aoa = [HEADERS];
    const sheet = XLSX.utils.aoa_to_sheet(aoa);
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
  const aoa: (string | number | null)[][] = [HEADERS];

  const commonLabels = [
    school.name as string,
    ay.name as string,
    product.name as string,
    cohort.name as string,
  ];

  for (const s of students) {
    const studentId = s.id as number;
    const tariff = await resolveTariffAmount(studentId, productId, ayId);
    const amount = tariff.ok ? (tariff.amount as string) : '';

    const baseRow = [
      s.nis as string,
      s.full_name as string,
      cls?.name as string,
    ];

    const techIds = [
      schoolId,
      ayId,
      productId,
      cohortId,
    ];

    if (product.payment_type === 'monthly') {
      for (const monthName of SPP_MONTHS) {
        const by = billYearForMonth(monthName, ayStartYear);
        const bm = billMonthNumber(monthName);
        const title = product.name.toLowerCase().includes('spp')
          ? `SPP ${monthName}`
          : `${product.name} ${monthName}`;

        aoa.push([
          ...baseRow,
          title,
          amount,
          '0', // discount_amount
          'unpaid', // status
          '', // notes
          bm,
          by,
          ...techIds,
          ...commonLabels,
        ]);
      }
    } else {
      const title = product.payment_type === 'annualy' ? `${product.name} ${ay.name}` : `${product.name}`;
      aoa.push([
        ...baseRow,
        title,
        amount,
        '0', // discount_amount
        'unpaid', // status
        '', // notes
        null, // bill_month
        product.payment_type === 'annualy' ? ayStartYear : null, // bill_year
        ...techIds,
        ...commonLabels,
      ]);
    }
  }

  const wb = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
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
