import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import {
  MAX_TRANSACTION_EXPORT,
  parseTransactionListSearchParams,
  selectTuitionTransactionsForExport,
} from '@/lib/billing-transactions-query';

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const parsed = parseTransactionListSearchParams(sp);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const rows = await selectTuitionTransactionsForExport(parsed.filters, MAX_TRANSACTION_EXPORT);
    const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ pesan: 'Tidak ada data' }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, 'Transaksi');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="riwayat-pembayaran.xlsx"',
      },
    });
  } catch (e: unknown) {
    console.error(e);
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
