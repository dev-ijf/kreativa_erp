import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { monthBoundsForTimestamp } from '@/lib/billing-period';

/**
 * GET — detail satu transaksi + baris detail.
 * Wajib: query created_at (ISO) agar scan mengarah ke partisi yang benar.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const txId = Number(id);
  if (!Number.isFinite(txId)) {
    return NextResponse.json({ error: 'id tidak valid' }, { status: 400 });
  }

  const createdAtStr = new URL(req.url).searchParams.get('created_at');
  if (!createdAtStr) {
    return NextResponse.json(
      { error: 'Parameter created_at wajib (ISO timestamp header transaksi)' },
      { status: 400 }
    );
  }

  const createdAt = new Date(createdAtStr);
  if (Number.isNaN(createdAt.getTime())) {
    return NextResponse.json({ error: 'created_at tidak valid' }, { status: 400 });
  }

  const { monthStart, monthEndExclusive } = monthBoundsForTimestamp(createdAt);

  try {
    const [tx] = await sql`
      SELECT
        t.*,
        u.full_name AS payer_name,
        u.email AS payer_email
      FROM tuition_transactions t
      LEFT JOIN core_users u ON u.id = t.user_id
      WHERE t.id = ${txId}
        AND t.created_at >= ${monthStart}
        AND t.created_at < ${monthEndExclusive}
    `;

    if (!tx) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    const txCreatedAt = tx.created_at as Date | string;

    let details = await sql`
      SELECT
        d.id,
        d.created_at,
        d.amount_paid,
        d.bill_id,
        d.product_id,
        b.title AS bill_title,
        b.student_id,
        s.full_name AS student_name,
        s.nis,
        p.name AS product_name
      FROM tuition_transaction_details d
      JOIN tuition_bills b ON b.id = d.bill_id
      JOIN core_students s ON s.id = b.student_id
      JOIN tuition_products p ON p.id = d.product_id
      WHERE d.transaction_id = ${txId}
        AND d.transaction_created_at = ${txCreatedAt}
      ORDER BY d.id
    `;

    if (details.length === 0) {
      details = await sql`
        SELECT
          d.id,
          d.created_at,
          d.amount_paid,
          d.bill_id,
          d.product_id,
          b.title AS bill_title,
          b.student_id,
          s.full_name AS student_name,
          s.nis,
          p.name AS product_name
        FROM tuition_transaction_details d
        JOIN tuition_bills b ON b.id = d.bill_id
        JOIN core_students s ON s.id = b.student_id
        JOIN tuition_products p ON p.id = d.product_id
        WHERE d.transaction_id = ${txId}
        ORDER BY d.id
      `;
    }

    return NextResponse.json({ transaction: tx, details });
  } catch (error) {
    console.error('transaction detail error:', error);
    return NextResponse.json({ error: 'Gagal memuat detail transaksi' }, { status: 500 });
  }
}
