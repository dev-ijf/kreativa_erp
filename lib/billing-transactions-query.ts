import sql from '@/lib/db';
import { parseTransactionPeriod } from '@/lib/billing-period';

export const MAX_TRANSACTION_EXPORT = 10000;

export type TransactionListFilters = {
  rangeStart: Date;
  rangeEndExclusive: Date;
  fromStr: string | null;
  toStr: string | null;
  userId: number | null;
  studentId: number | null;
  schoolId: number | null;
  status: string | null;
  paymentMethodId: number | null;
  academicYearId: number | null;
  referenceQ: string | null;
};

function referencePattern(q: string | null): string | null {
  if (!q || !q.trim()) return null;
  return `%${q.trim()}%`;
}

function num(sp: URLSearchParams, key: string): number | null {
  const v = sp.get(key);
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function str(sp: URLSearchParams, key: string): string | null {
  const v = sp.get(key);
  return v != null && v !== '' ? v : null;
}

export function parseTransactionListSearchParams(
  sp: URLSearchParams
): { ok: true; filters: TransactionListFilters } | { ok: false; error: string } {
  const fromStr = sp.get('from');
  const toStr = sp.get('to');
  let bounds: { rangeStart: Date; rangeEndExclusive: Date };
  try {
    bounds = parseTransactionPeriod(fromStr, toStr);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Periode tidak valid';
    return { ok: false, error: msg };
  }

  const studentId = num(sp, 'student_id');
  const userId = num(sp, 'user_id');
  const schoolId = num(sp, 'school_id');
  const paymentMethodId = num(sp, 'payment_method_id');
  const academicYearId = num(sp, 'academic_year_id');

  if (sp.get('student_id') && studentId === null) {
    return { ok: false, error: 'student_id tidak valid' };
  }
  if (sp.get('user_id') && userId === null) {
    return { ok: false, error: 'user_id tidak valid' };
  }
  if (sp.get('school_id') && schoolId === null) {
    return { ok: false, error: 'school_id tidak valid' };
  }
  if (sp.get('payment_method_id') && paymentMethodId === null) {
    return { ok: false, error: 'payment_method_id tidak valid' };
  }
  if (sp.get('academic_year_id') && academicYearId === null) {
    return { ok: false, error: 'academic_year_id tidak valid' };
  }

  return {
    ok: true,
    filters: {
      rangeStart: bounds.rangeStart,
      rangeEndExclusive: bounds.rangeEndExclusive,
      fromStr,
      toStr,
      userId,
      studentId,
      schoolId,
      status: str(sp, 'status'),
      paymentMethodId,
      academicYearId,
      referenceQ: str(sp, 'reference_q'),
    },
  };
}

export async function countTuitionTransactions(f: TransactionListFilters): Promise<number> {
  const ref = referencePattern(f.referenceQ);
  const [row] = await sql`
    SELECT COUNT(*)::int AS c
    FROM tuition_transactions t
    WHERE t.created_at >= ${f.rangeStart}
      AND t.created_at < ${f.rangeEndExclusive}
      AND (${f.userId}::int IS NULL OR t.user_id = ${f.userId})
      AND (${f.studentId}::int IS NULL OR t.student_id = ${f.studentId})
      AND (${f.status}::text IS NULL OR t.status = ${f.status})
      AND (${f.paymentMethodId}::int IS NULL OR t.payment_method_id = ${f.paymentMethodId})
      AND (${f.academicYearId}::int IS NULL OR t.academic_year_id = ${f.academicYearId})
      AND (${ref}::text IS NULL OR t.reference_no ILIKE ${ref})
      AND (${f.schoolId}::int IS NULL OR EXISTS (
        SELECT 1 FROM core_students s2
        WHERE s2.id = t.student_id AND s2.school_id = ${f.schoolId}
      ))
  `;
  return (row?.c as number) ?? 0;
}

export async function selectTuitionTransactions(
  f: TransactionListFilters,
  limit: number,
  offset: number
): Promise<Record<string, unknown>[]> {
  const ref = referencePattern(f.referenceQ);
  const rows = await sql`
    SELECT
      t.id,
      t.created_at,
      t.user_id,
      t.student_id,
      t.academic_year_id,
      t.reference_no,
      t.total_amount,
      t.payment_method_id,
      t.status,
      t.payment_date,
      u.full_name AS payer_name,
      ay.name AS academic_year_name,
      pm.name AS payment_method_name,
      s.full_name AS student_name,
      s.nis,
      sch.name AS school_name,
      (SELECT cls.name FROM core_student_class_histories ch
        JOIN core_classes cls ON cls.id = ch.class_id
        WHERE ch.student_id = s.id
          AND ch.academic_year_id = t.academic_year_id
          AND ch.status = 'active'
        LIMIT 1) AS class_name
    FROM tuition_transactions t
    LEFT JOIN core_users u             ON u.id  = t.user_id
    LEFT JOIN core_academic_years ay   ON ay.id = t.academic_year_id
    LEFT JOIN tuition_payment_methods pm ON pm.id = t.payment_method_id
    LEFT JOIN core_students s          ON s.id  = t.student_id
    LEFT JOIN core_schools sch         ON sch.id = s.school_id
    WHERE t.created_at >= ${f.rangeStart}
      AND t.created_at < ${f.rangeEndExclusive}
      AND (${f.userId}::int IS NULL OR t.user_id = ${f.userId})
      AND (${f.studentId}::int IS NULL OR t.student_id = ${f.studentId})
      AND (${f.status}::text IS NULL OR t.status = ${f.status})
      AND (${f.paymentMethodId}::int IS NULL OR t.payment_method_id = ${f.paymentMethodId})
      AND (${f.academicYearId}::int IS NULL OR t.academic_year_id = ${f.academicYearId})
      AND (${ref}::text IS NULL OR t.reference_no ILIKE ${ref})
      AND (${f.schoolId}::int IS NULL OR s.school_id = ${f.schoolId})
    ORDER BY t.created_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;
  return rows as Record<string, unknown>[];
}

export async function selectTuitionTransactionsForExport(
  f: TransactionListFilters,
  maxRows: number
): Promise<Record<string, unknown>[]> {
  const ref = referencePattern(f.referenceQ);
  const rows = await sql`
    SELECT
      t.id AS transaction_id,
      t.created_at AS waktu_transaksi,
      t.reference_no AS referensi,
      t.total_amount AS total,
      t.status,
      t.payment_date AS tanggal_bayar,
      u.full_name AS pembayar,
      u.email AS email_pembayar,
      ay.name AS tahun_ajaran,
      pm.name AS metode_pembayaran,
      t.va_no AS va_no,
      s.full_name AS siswa,
      s.nis AS nis,
      sch.name AS sekolah,
      (SELECT cls.name FROM core_student_class_histories ch
        JOIN core_classes cls ON cls.id = ch.class_id
        WHERE ch.student_id = s.id
          AND ch.academic_year_id = t.academic_year_id
          AND ch.status = 'active'
        LIMIT 1) AS kelas
    FROM tuition_transactions t
    LEFT JOIN core_users u             ON u.id  = t.user_id
    LEFT JOIN core_academic_years ay   ON ay.id = t.academic_year_id
    LEFT JOIN tuition_payment_methods pm ON pm.id = t.payment_method_id
    LEFT JOIN core_students s          ON s.id  = t.student_id
    LEFT JOIN core_schools sch         ON sch.id = s.school_id
    WHERE t.created_at >= ${f.rangeStart}
      AND t.created_at < ${f.rangeEndExclusive}
      AND (${f.userId}::int IS NULL OR t.user_id = ${f.userId})
      AND (${f.studentId}::int IS NULL OR t.student_id = ${f.studentId})
      AND (${f.status}::text IS NULL OR t.status = ${f.status})
      AND (${f.paymentMethodId}::int IS NULL OR t.payment_method_id = ${f.paymentMethodId})
      AND (${f.academicYearId}::int IS NULL OR t.academic_year_id = ${f.academicYearId})
      AND (${ref}::text IS NULL OR t.reference_no ILIKE ${ref})
      AND (${f.schoolId}::int IS NULL OR s.school_id = ${f.schoolId})
    ORDER BY t.created_at DESC
    LIMIT ${maxRows}
  `;
  return rows as Record<string, unknown>[];
}
