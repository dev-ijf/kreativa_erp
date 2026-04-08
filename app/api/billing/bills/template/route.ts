import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

const HEADERS = [
  'nis',
  'school_id',
  'academic_year_id',
  'product_id',
  'bill_month',
  'bill_year',
  'title',
  'amount',
  'notes',
];

const EXAMPLE_ROW = [
  '12345',
  '',
  '1',
  '1',
  '7',
  '2025',
  '',
  '',
  'Isi school_id jika NIS tidak unik antar sekolah',
];

export async function GET() {
  const wb = XLSX.utils.book_new();
  const aoa = [HEADERS, EXAMPLE_ROW];
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  XLSX.utils.book_append_sheet(wb, sheet, 'Import');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="template-import-tagihan.xlsx"',
    },
  });
}
