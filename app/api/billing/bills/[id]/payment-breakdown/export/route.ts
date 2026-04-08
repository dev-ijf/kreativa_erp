import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
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
        d.id AS detail_id,
        d.created_at AS waktu_detail,
        d.amount_paid AS jumlah,
        d.transaction_id,
        d.transaction_created_at,
        p.name AS produk,
        t.reference_no AS referensi_transaksi,
        t.status AS status_transaksi,
        t.payment_date AS tanggal_bayar,
        t.total_amount AS total_keranjang,
        u.full_name AS pembayar
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
        t.id AS transaction_id,
        t.created_at AS waktu_checkout,
        t.reference_no AS referensi,
        t.status,
        t.payment_date AS tanggal_bayar,
        t.total_amount AS total,
        u.full_name AS pembayar
      FROM tuition_transaction_details d
      JOIN tuition_transactions t
        ON t.id = d.transaction_id AND t.created_at = d.transaction_created_at
      LEFT JOIN core_users u ON u.id = t.user_id
      WHERE d.bill_id = ${billId}
      ORDER BY d.transaction_id, d.transaction_created_at, d.id DESC
    `;

    const wb = XLSX.utils.book_new();

    const summarySheet = XLSX.utils.json_to_sheet([
      {
        id_tagihan: bill.id,
        judul: bill.title,
        siswa: bill.student_name,
        nis: bill.nis,
        produk: bill.product_name,
        tahun_ajaran: bill.academic_year_name,
        total: bill.total_amount,
        terbayar: bill.paid_amount,
        status: bill.status,
        bulan: bill.bill_month,
        tahun: bill.bill_year,
      },
    ]);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Ringkasan');

    const linesSheet = XLSX.utils.json_to_sheet(
      lines.length ? lines : [{ pesan: 'Tidak ada baris alokasi' }]
    );
    XLSX.utils.book_append_sheet(wb, linesSheet, 'Rincian_alokasi');

    const txSheet = XLSX.utils.json_to_sheet(
      transactions.length ? transactions : [{ pesan: 'Tidak ada transaksi' }]
    );
    XLSX.utils.book_append_sheet(wb, txSheet, 'Transaksi_terkait');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="bill-${billId}-pembayaran.xlsx"`,
      },
    });
  } catch (e) {
    console.error('payment-breakdown export:', e);
    return NextResponse.json({ error: 'Gagal mengekspor' }, { status: 500 });
  }
}
