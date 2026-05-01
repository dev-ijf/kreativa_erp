import sql from '@/lib/db';
import { monthBoundsForTimestamp } from '@/lib/billing-period';

export type ReceiptHeaderRow = Record<string, unknown> & {
  reference_no?: string | null;
  payment_method_category?: string | null;
};

export type ReceiptItemRow = Record<string, unknown>;

export type ReceiptPayload = {
  header: ReceiptHeaderRow & { cash: boolean };
  items: ReceiptItemRow[];
};

/**
 * Muat header + detail transaksi untuk bukti pembayaran (JSON / PDF).
 * `created_at` harus timestamp header transaksi (partition key).
 */
export async function loadReceiptPayload(
  txId: number,
  createdAt: Date
): Promise<ReceiptPayload | null> {
  const { monthStart, monthEndExclusive } = monthBoundsForTimestamp(createdAt);

  const [header] = await sql`
    SELECT
      t.id,
      t.created_at,
      t.reference_no,
      t.total_amount,
      t.status,
      t.payment_date,
      t.va_no,
      t.payment_method_id,
      pm.name AS payment_method_name,
      pm.category AS payment_method_category,
      u.full_name AS payer_name,
      u.email AS payer_email,
      s.id AS student_id,
      s.full_name AS student_name,
      s.nis,
      s.program,
      sch.id AS school_id,
      sch.name AS school_name,
      sch.address AS school_address,
      sch.school_logo_url AS school_logo_url,
      sch.bank_channel_code,
      sch.school_code,
      ay.id AS academic_year_id,
      ay.name AS academic_year_name,
      (SELECT cls.name FROM core_student_class_histories ch
        JOIN core_classes cls ON cls.id = ch.class_id
        WHERE ch.student_id = s.id
          AND ch.academic_year_id = t.academic_year_id
          AND ch.status = 'active'
        LIMIT 1) AS class_name
    FROM tuition_transactions t
    LEFT JOIN core_users u               ON u.id  = t.user_id
    LEFT JOIN core_students s            ON s.id  = t.student_id
    LEFT JOIN core_schools sch           ON sch.id = s.school_id
    LEFT JOIN tuition_payment_methods pm ON pm.id = t.payment_method_id
    LEFT JOIN core_academic_years ay     ON ay.id = t.academic_year_id
    WHERE t.id = ${txId}
      AND t.created_at >= ${monthStart}
      AND t.created_at < ${monthEndExclusive}
    LIMIT 1
  `;

  if (!header) return null;

  const headerCreatedAt = header.created_at as Date | string;

  let items = await sql`
    SELECT
      d.id,
      d.amount_paid,
      d.bill_id,
      d.product_id,
      b.title AS bill_title,
      b.bill_month,
      b.bill_year,
      b.related_month,
      p.name AS product_name,
      p.payment_type AS product_payment_type
    FROM tuition_transaction_details d
    JOIN tuition_bills b     ON b.id = d.bill_id
    JOIN tuition_products p  ON p.id = d.product_id
    WHERE d.transaction_id = ${txId}
      AND d.transaction_created_at = ${headerCreatedAt}
    ORDER BY d.id
  `;

  if (items.length === 0) {
    items = await sql`
      SELECT
        d.id,
        d.amount_paid,
        d.bill_id,
        d.product_id,
        b.title AS bill_title,
        b.bill_month,
        b.bill_year,
        b.related_month,
        p.name AS product_name,
        p.payment_type AS product_payment_type
      FROM tuition_transaction_details d
      JOIN tuition_bills b     ON b.id = d.bill_id
      JOIN tuition_products p  ON p.id = d.product_id
      WHERE d.transaction_id = ${txId}
      ORDER BY d.id
    `;
  }

  const category = String(
    (header as Record<string, unknown>).payment_method_category ?? ''
  ).toLowerCase();
  const cash = /cash|tunai/.test(category);

  return {
    header: { ...(header as ReceiptHeaderRow), cash },
    items: items as ReceiptItemRow[],
  };
}
