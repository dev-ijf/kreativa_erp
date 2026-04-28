import { NextRequest, NextResponse } from 'next/server';
import { loadReceiptPayload } from '@/lib/billing-receipt-query';

/**
 * GET — data lengkap untuk template Bukti Pembayaran (JSON).
 * Wajib query `created_at` (ISO timestamp) untuk partition pruning.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  try {
    const payload = await loadReceiptPayload(txId, createdAt);
    if (!payload) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({
      header: payload.header,
      items: payload.items,
    });
  } catch (error) {
    console.error('receipt-data error:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data bukti pembayaran' },
      { status: 500 }
    );
  }
}
