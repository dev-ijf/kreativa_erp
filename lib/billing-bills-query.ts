import { addDays, parseISO, startOfDay } from 'date-fns';
import sql from '@/lib/db';

export type BillListFilters = {
  schoolId: number | null;
  academicYearId: number | null;
  classId: number | null;
  studentId: number | null;
  productId: number | null;
  status: string | null;
  billMonth: number | null;
  billYear: number | null;
  paymentType: string | null;
  q: string | null;
  billCreatedFrom: Date | null;
  billCreatedToExclusive: Date | null;
  dueDateFrom: string | null;
  dueDateTo: string | null;
};

function searchPattern(q: string | null): string | null {
  if (!q || !q.trim()) return null;
  return `%${q.trim()}%`;
}

export async function countTuitionBills(filters: BillListFilters): Promise<number> {
  const sp = searchPattern(filters.q);
  const [row] = await sql`
    SELECT COUNT(*)::int AS c
    FROM tuition_bills b
    JOIN core_students s ON b.student_id = s.id
    JOIN tuition_products p ON b.product_id = p.id
    WHERE (${filters.schoolId}::int IS NULL OR s.school_id = ${filters.schoolId})
      AND (${filters.academicYearId}::int IS NULL OR b.academic_year_id = ${filters.academicYearId})
      AND (${filters.classId}::int IS NULL OR EXISTS (
        SELECT 1 FROM core_student_class_histories ch
        WHERE ch.student_id = s.id
          AND ch.academic_year_id = b.academic_year_id
          AND ch.class_id = ${filters.classId}
          AND ch.status = 'active'
      ))
      AND (${filters.studentId}::int IS NULL OR b.student_id = ${filters.studentId})
      AND (${filters.productId}::int IS NULL OR b.product_id = ${filters.productId})
      AND (${filters.status}::text IS NULL OR b.status = ${filters.status})
      AND (${filters.billMonth}::int IS NULL OR b.bill_month = ${filters.billMonth})
      AND (${filters.billYear}::int IS NULL OR b.bill_year = ${filters.billYear})
      AND (${filters.paymentType}::text IS NULL OR p.payment_type = ${filters.paymentType})
      AND (${filters.billCreatedFrom}::timestamp IS NULL OR b.created_at >= ${filters.billCreatedFrom})
      AND (${filters.billCreatedToExclusive}::timestamp IS NULL OR b.created_at < ${filters.billCreatedToExclusive})
      AND (${filters.dueDateFrom}::date IS NULL OR b.due_date >= ${filters.dueDateFrom}::date)
      AND (${filters.dueDateTo}::date IS NULL OR b.due_date <= ${filters.dueDateTo}::date)
      AND (${sp}::text IS NULL OR s.full_name ILIKE ${sp}
        OR s.nis ILIKE ${sp}
        OR COALESCE(s.nisn, '') ILIKE ${sp})
  `;
  return (row?.c as number) ?? 0;
}

export async function selectTuitionBills(
  filters: BillListFilters,
  limit: number,
  offset: number
): Promise<Record<string, unknown>[]> {
  const sp = searchPattern(filters.q);
  const rows = await sql`
    SELECT
      b.id,
      b.student_id,
      b.product_id,
      b.academic_year_id,
      b.title,
      b.total_amount,
      b.paid_amount,
      b.min_payment,
      b.due_date,
      b.status,
      b.bill_month,
      b.bill_year,
      b.related_month,
      b.created_at,
      b.updated_at,
      s.full_name AS student_name,
      s.nis,
      sch.id AS school_id,
      sch.name AS school_name,
      p.name AS product_name,
      p.payment_type,
      ay.name AS academic_year_name,
      (SELECT c.name FROM core_student_class_histories ch
       JOIN core_classes c ON c.id = ch.class_id
       WHERE ch.student_id = s.id AND ch.academic_year_id = b.academic_year_id AND ch.status = 'active'
       LIMIT 1) AS class_name
    FROM tuition_bills b
    JOIN core_students s ON b.student_id = s.id
    JOIN core_schools sch ON s.school_id = sch.id
    JOIN tuition_products p ON b.product_id = p.id
    JOIN core_academic_years ay ON b.academic_year_id = ay.id
    WHERE (${filters.schoolId}::int IS NULL OR s.school_id = ${filters.schoolId})
      AND (${filters.academicYearId}::int IS NULL OR b.academic_year_id = ${filters.academicYearId})
      AND (${filters.classId}::int IS NULL OR EXISTS (
        SELECT 1 FROM core_student_class_histories ch
        WHERE ch.student_id = s.id
          AND ch.academic_year_id = b.academic_year_id
          AND ch.class_id = ${filters.classId}
          AND ch.status = 'active'
      ))
      AND (${filters.studentId}::int IS NULL OR b.student_id = ${filters.studentId})
      AND (${filters.productId}::int IS NULL OR b.product_id = ${filters.productId})
      AND (${filters.status}::text IS NULL OR b.status = ${filters.status})
      AND (${filters.billMonth}::int IS NULL OR b.bill_month = ${filters.billMonth})
      AND (${filters.billYear}::int IS NULL OR b.bill_year = ${filters.billYear})
      AND (${filters.paymentType}::text IS NULL OR p.payment_type = ${filters.paymentType})
      AND (${filters.billCreatedFrom}::timestamp IS NULL OR b.created_at >= ${filters.billCreatedFrom})
      AND (${filters.billCreatedToExclusive}::timestamp IS NULL OR b.created_at < ${filters.billCreatedToExclusive})
      AND (${filters.dueDateFrom}::date IS NULL OR b.due_date >= ${filters.dueDateFrom}::date)
      AND (${filters.dueDateTo}::date IS NULL OR b.due_date <= ${filters.dueDateTo}::date)
      AND (${sp}::text IS NULL OR s.full_name ILIKE ${sp}
        OR s.nis ILIKE ${sp}
        OR COALESCE(s.nisn, '') ILIKE ${sp})
    ORDER BY b.id DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;
  return rows as Record<string, unknown>[];
}

export async function selectTuitionBillsForExport(
  filters: BillListFilters,
  maxRows: number
): Promise<Record<string, unknown>[]> {
  const sp = searchPattern(filters.q);
  const rows = await sql`
    SELECT
      b.id,
      b.student_id,
      b.product_id,
      b.academic_year_id,
      b.title,
      b.total_amount,
      b.paid_amount,
      b.min_payment,
      b.due_date,
      b.status,
      b.bill_month,
      b.bill_year,
      b.related_month,
      b.created_at,
      s.full_name AS student_name,
      s.nis,
      sch.name AS school_name,
      p.name AS product_name,
      p.payment_type,
      ay.name AS academic_year_name,
      (SELECT c.name FROM core_student_class_histories ch
       JOIN core_classes c ON c.id = ch.class_id
       WHERE ch.student_id = s.id AND ch.academic_year_id = b.academic_year_id AND ch.status = 'active'
       LIMIT 1) AS class_name
    FROM tuition_bills b
    JOIN core_students s ON b.student_id = s.id
    JOIN core_schools sch ON s.school_id = sch.id
    JOIN tuition_products p ON b.product_id = p.id
    JOIN core_academic_years ay ON b.academic_year_id = ay.id
    WHERE (${filters.schoolId}::int IS NULL OR s.school_id = ${filters.schoolId})
      AND (${filters.academicYearId}::int IS NULL OR b.academic_year_id = ${filters.academicYearId})
      AND (${filters.classId}::int IS NULL OR EXISTS (
        SELECT 1 FROM core_student_class_histories ch
        WHERE ch.student_id = s.id
          AND ch.academic_year_id = b.academic_year_id
          AND ch.class_id = ${filters.classId}
          AND ch.status = 'active'
      ))
      AND (${filters.studentId}::int IS NULL OR b.student_id = ${filters.studentId})
      AND (${filters.productId}::int IS NULL OR b.product_id = ${filters.productId})
      AND (${filters.status}::text IS NULL OR b.status = ${filters.status})
      AND (${filters.billMonth}::int IS NULL OR b.bill_month = ${filters.billMonth})
      AND (${filters.billYear}::int IS NULL OR b.bill_year = ${filters.billYear})
      AND (${filters.paymentType}::text IS NULL OR p.payment_type = ${filters.paymentType})
      AND (${filters.billCreatedFrom}::timestamp IS NULL OR b.created_at >= ${filters.billCreatedFrom})
      AND (${filters.billCreatedToExclusive}::timestamp IS NULL OR b.created_at < ${filters.billCreatedToExclusive})
      AND (${filters.dueDateFrom}::date IS NULL OR b.due_date >= ${filters.dueDateFrom}::date)
      AND (${filters.dueDateTo}::date IS NULL OR b.due_date <= ${filters.dueDateTo}::date)
      AND (${sp}::text IS NULL OR s.full_name ILIKE ${sp}
        OR s.nis ILIKE ${sp}
        OR COALESCE(s.nisn, '') ILIKE ${sp})
    ORDER BY b.id DESC
    LIMIT ${maxRows}
  `;
  return rows as Record<string, unknown>[];
}

function optYmd(sp: URLSearchParams, key: string): string | null {
  const v = sp.get(key);
  if (v == null || v === '') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  return v;
}

function optDayStart(sp: URLSearchParams, key: string): Date | null {
  const v = optYmd(sp, key);
  if (!v) return null;
  return startOfDay(parseISO(v));
}

function optDayEndExclusive(sp: URLSearchParams, key: string): Date | null {
  const v = optYmd(sp, key);
  if (!v) return null;
  return addDays(startOfDay(parseISO(v)), 1);
}

export function parseBillListSearchParams(sp: URLSearchParams): BillListFilters {
  const num = (k: string) => {
    const v = sp.get(k);
    if (v == null || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const str = (k: string) => {
    const v = sp.get(k);
    return v != null && v !== '' ? v : null;
  };
  return {
    schoolId: num('school_id'),
    academicYearId: num('academic_year_id'),
    classId: num('class_id'),
    studentId: num('student_id'),
    productId: num('product_id'),
    status: str('status'),
    billMonth: num('bill_month'),
    billYear: num('bill_year'),
    paymentType: str('payment_type'),
    q: str('q'),
    billCreatedFrom: optDayStart(sp, 'created_from'),
    billCreatedToExclusive: optDayEndExclusive(sp, 'created_to'),
    dueDateFrom: optYmd(sp, 'due_from'),
    dueDateTo: optYmd(sp, 'due_to'),
  };
}
