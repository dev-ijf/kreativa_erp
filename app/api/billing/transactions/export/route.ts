import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import {
  MAX_TRANSACTION_EXPORT,
  parseTransactionListSearchParams,
  selectTuitionTransactionsForExport,
} from '@/lib/billing-transactions-query';

const HEADERS = [
  'No',
  'Referensi',
  'Waktu',
  'Siswa',
  'NIS',
  'Kelas',
  'Sekolah',
  'Pembayar',
  'Email Pembayar',
  'Tahun Ajaran',
  'Metode',
  'VA',
  'WA checkout',
  'WA lunas',
  'Total',
  'Status',
  'Tanggal Bayar',
] as const;

function fmtTimestamp(v: unknown): string {
  if (!v) return '';
  const d = v instanceof Date ? v : new Date(String(v));
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

function toNumber(v: unknown): number {
  if (v == null || v === '') return 0;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const parsed = parseTransactionListSearchParams(sp);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const rows = await selectTuitionTransactionsForExport(parsed.filters, MAX_TRANSACTION_EXPORT);

    const aoa: (string | number)[][] = [Array.from(HEADERS)];
    rows.forEach((r, idx) => {
      aoa.push([
        idx + 1,
        String(r.referensi ?? ''),
        fmtTimestamp(r.waktu_transaksi),
        String(r.siswa ?? ''),
        String(r.nis ?? ''),
        String(r.kelas ?? ''),
        String(r.sekolah ?? ''),
        String(r.pembayar ?? ''),
        String(r.email_pembayar ?? ''),
        String(r.tahun_ajaran ?? ''),
        String(r.metode_pembayaran ?? ''),
        String(r.va_no ?? ''),
        r.wa_checkout === true ? 'Ya' : 'Tidak',
        r.wa_paid === true ? 'Ya' : 'Tidak',
        toNumber(r.total),
        String(r.status ?? ''),
        fmtTimestamp(r.tanggal_bayar),
      ]);
    });

    if (rows.length === 0) {
      aoa.push(['(Tidak ada data pada filter ini)']);
    }

    const sheet = XLSX.utils.aoa_to_sheet(aoa);
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
