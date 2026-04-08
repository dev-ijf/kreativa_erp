import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const billId = Number(id);
  if (!Number.isFinite(billId)) {
    return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
  }

  const [bill] = await sql`
    SELECT
      b.id,
      b.title,
      b.total_amount,
      b.paid_amount,
      b.status,
      b.bill_month,
      b.bill_year,
      s.full_name AS student_name,
      s.nis,
      p.name AS product_name,
      ay.name AS academic_year_name
    FROM tuition_bills b
    JOIN core_students s ON s.id = b.student_id
    JOIN tuition_products p ON p.id = b.product_id
    JOIN core_academic_years ay ON ay.id = b.academic_year_id
    WHERE b.id = ${billId}
  `;

  if (!bill) {
    return NextResponse.json({ error: 'Tagihan tidak ditemukan' }, { status: 404 });
  }

  try {
    const lines = await sql`
      SELECT
        d.id,
        d.created_at,
        d.amount_paid,
        d.transaction_id,
        d.transaction_created_at,
        d.product_id,
        p.name AS product_name,
        t.reference_no,
        t.status AS transaction_status,
        t.payment_date,
        t.total_amount AS transaction_total,
        u.full_name AS payer_name
      FROM tuition_transaction_details d
      JOIN tuition_transactions t
        ON t.id = d.transaction_id AND t.created_at = d.transaction_created_at
      JOIN tuition_products p ON p.id = d.product_id
      LEFT JOIN core_users u ON u.id = t.user_id
      WHERE d.bill_id = ${billId}
      ORDER BY d.created_at DESC, d.id DESC
    `;

    const transactions = await sql`
      SELECT DISTINCT ON (d.transaction_id, d.transaction_created_at)
        t.id,
        t.created_at,
        t.reference_no,
        t.status,
        t.payment_date,
        t.total_amount,
        u.full_name AS payer_name
      FROM tuition_transaction_details d
      JOIN tuition_transactions t
        ON t.id = d.transaction_id AND t.created_at = d.transaction_created_at
      LEFT JOIN core_users u ON u.id = t.user_id
      WHERE d.bill_id = ${billId}
      ORDER BY d.transaction_id, d.transaction_created_at, d.id DESC
    `;

    return NextResponse.json({ bill, lines, transactions });
  } catch (e) {
    console.error('payment-breakdown:', e);
    return NextResponse.json({ error: 'Gagal memuat breakdown pembayaran' }, { status: 500 });
  }
}
