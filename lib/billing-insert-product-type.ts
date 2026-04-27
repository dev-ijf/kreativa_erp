import {
  englishMonthNameFromNumber,
  insertTuitionBillIfNotExists,
  parseAcademicYearStartYear,
  relatedMonthDate,
} from '@/lib/billing-spp';

export async function insertOneBillForProductType(args: {
  studentId: number;
  productId: number;
  academicYearId: number;
  productName: string;
  paymentType: string;
  ayName: string;
  amount: string;
  minPayment?: string | number | null;
  discountAmount?: string | number;
  paidAmount?: string | number;
  status?: string;
  bill_month?: number;
  bill_year?: number;
  title?: string;
}): Promise<{ created: boolean }> {
  const pt = args.paymentType;
  const startYear = parseAcademicYearStartYear(args.ayName);

  const common = {
    studentId: args.studentId,
    productId: args.productId,
    academicYearId: args.academicYearId,
    amount: args.amount,
    minPayment: args.minPayment,
    discountAmount: args.discountAmount,
    paidAmount: args.paidAmount,
    status: args.status,
  };

  if (pt === 'monthly') {
    const bm = args.bill_month;
    const by = args.bill_year;
    if (!Number.isFinite(bm) || !Number.isFinite(by)) {
      throw new Error('Untuk produk bulanan, bill_month dan bill_year wajib');
    }
    const monthName = englishMonthNameFromNumber(bm!);
    const title =
      args.title?.trim() ||
      (args.productName.toLowerCase().includes('spp')
        ? `SPP ${monthName}`
        : `${args.productName} ${monthName}`);
    return insertTuitionBillIfNotExists({
      ...common,
      title,
      billMonth: bm!,
      billYear: by!,
      relatedMonth: relatedMonthDate(by!, bm!),
    });
  }

  if (pt === 'annualy') {
    const title = args.title?.trim() || `${args.productName} ${args.ayName}`;
    const by = Number.isFinite(args.bill_year!) ? args.bill_year! : startYear;
    return insertTuitionBillIfNotExists({
      ...common,
      title,
      billMonth: null,
      billYear: Number.isFinite(by) ? by : null,
      relatedMonth: null,
    });
  }

  if (pt === 'one_time' || pt === 'installment') {
    const title = args.title?.trim() || `${args.productName}`;
    return insertTuitionBillIfNotExists({
      ...common,
      title,
      billMonth: null,
      billYear: null,
      relatedMonth: null,
    });
  }

  throw new Error(`Tipe pembayaran tidak didukung: ${pt}`);
}
