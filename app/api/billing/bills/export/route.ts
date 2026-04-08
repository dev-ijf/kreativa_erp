import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import {
  parseBillListSearchParams,
  selectTuitionBillsForExport,
} from '@/lib/billing-bills-query';

const MAX_EXPORT = 10000;

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const filters = parseBillListSearchParams(sp);

  try {
    const rows = await selectTuitionBillsForExport(filters, MAX_EXPORT);
    const sheet = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, 'Tagihan');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="tagihan.xlsx"',
      },
    });
  } catch (e: unknown) {
    console.error(e);
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
