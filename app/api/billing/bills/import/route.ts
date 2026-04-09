import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import sql from '@/lib/db';
import { resolveTariffAmount } from '@/lib/billing-tariff';
import { insertOneBillForProductType } from '@/lib/billing-insert-product-type';

type RowIn = Record<string, unknown>;

function cellStr(r: RowIn, keys: string[]): string {
  for (const k of keys) {
    const v = r[k];
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

function cellNum(r: RowIn, keys: string[]): number | null {
  const s = cellStr(r, keys);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const preview = searchParams.get('preview') === 'true';

  const ct = req.headers.get('content-type') || '';
  let workbook: XLSX.WorkBook;

  if (ct.includes('multipart/form-data')) {
    const form = await req.formData();
    const file = form.get('file');
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Field file wajib (.xlsx)' }, { status: 400 });
    }
    if (file instanceof File) {
      const lower = file.name.toLowerCase();
      if (!lower.endsWith('.xlsx')) {
        return NextResponse.json(
          { error: 'Format impor harus Microsoft Excel (.xlsx)' },
          { status: 400 }
        );
      }
    }
    const ab = await file.arrayBuffer();
    const u8 = new Uint8Array(ab);
    if (u8.length < 4 || u8[0] !== 0x50 || u8[1] !== 0x4b) {
      return NextResponse.json(
        { error: 'File harus berupa workbook Excel .xlsx' },
        { status: 400 }
      );
    }
    workbook = XLSX.read(ab, { type: 'array' });
  } else {
    return NextResponse.json({ error: 'Kirim multipart form dengan field file' }, { status: 400 });
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return NextResponse.json({ error: 'Spreadsheet kosong' }, { status: 400 });
  }
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<RowIn>(sheet, { defval: '' });
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Tidak ada baris data' }, { status: 400 });
  }

  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];
  const previewRows: any[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const line = i + 2;
    const nis = cellStr(r, ['nis', 'NIS', 'Nis']);
    const academicYearId = cellNum(r, ['academic_year_id', 'academic_year', 'tahun_ajaran_id']);
    const productId = cellNum(r, ['product_id', 'product', 'produk_id']);
    const schoolId = cellNum(r, ['school_id', 'sekolah_id']);
    const cohortId = cellNum(r, ['cohort_id', 'angkatan_id']);
    const billMonth = cellNum(r, ['bill_month', 'bulan']);
    const billYear = cellNum(r, ['bill_year', 'tahun']);
    const title = cellStr(r, ['title', 'judul']) || undefined;
    const amountOverride = cellStr(r, ['amount', 'nominal', 'jumlah']);
    const discountAmount = cellStr(r, ['discount_amount', 'potongan', 'diskon']) || '0';
    const statusImport = cellStr(r, ['status', 'Status', 'keterangan_bayar']) || 'unpaid';
    const studentNameHelper = cellStr(r, ['student_name', 'nama_siswa']);

    let rowError = '';
    let rowStatus: 'valid' | 'invalid' = 'valid';

    if (!nis || !academicYearId || !productId) {
      rowError = `nis, academic_year_id, dan product_id wajib`;
      rowStatus = 'invalid';
    }

    let studentId: number | null = null;
    let studentFullName = studentNameHelper;
    let productData: any = null;
    let ayData: any = null;

    if (rowStatus === 'valid') {
      let studentRows = await sql`
        SELECT id, full_name FROM core_students WHERE nis = ${nis}
      `;
      if (schoolId != null) {
        studentRows = await sql`
          SELECT id, full_name FROM core_students WHERE nis = ${nis} AND school_id = ${schoolId}
        `;
      }

      if (studentRows.length === 0) {
        rowError = `Siswa dengan NIS ${nis} tidak ditemukan`;
        rowStatus = 'invalid';
      } else if (studentRows.length > 1) {
        rowError = `Lebih dari satu siswa dengan NIS ${nis} — isi school_id`;
        rowStatus = 'invalid';
      } else {
        studentId = studentRows[0].id as number;
        studentFullName = studentRows[0].full_name as string;
      }
    }

    if (rowStatus === 'valid') {
      [productData] = await sql`
        SELECT id, name, payment_type FROM tuition_products WHERE id = ${productId}
      `;
      if (!productData) {
        rowError = `Produk ID ${productId} tidak ditemukan`;
        rowStatus = 'invalid';
      }
    }

    if (rowStatus === 'valid') {
      [ayData] = await sql`
        SELECT id, name FROM core_academic_years WHERE id = ${academicYearId}
      `;
      if (!ayData) {
        rowError = `Tahun Ajaran ID ${academicYearId} tidak ditemukan`;
        rowStatus = 'invalid';
      }
    }

    if (rowStatus === 'valid') {
      const pt = String(productData.payment_type);
      if (pt === 'monthly') {
        if (!Number.isFinite(billMonth!) || !Number.isFinite(billYear!)) {
          rowError = `Produk bulanan memerlukan bill_month dan bill_year`;
          rowStatus = 'invalid';
        }
      }
    }

    let resolvedAmount = amountOverride;
    if (rowStatus === 'valid' && amountOverride === '') {
      const t = await resolveTariffAmount(studentId!, productId!, academicYearId!);
      if (!t.ok) {
        rowError = t.error || 'Tarif tidak ditemukan';
        rowStatus = 'invalid';
      } else {
        resolvedAmount = t.amount;
      }
    }

    if (preview) {
      previewRows.push({
        line,
        nis,
        studentName: studentFullName,
        title: title || (productData ? (productData.payment_type === 'monthly' ? `${productData.name} ${billMonth}` : productData.name) : '—'),
        amount: resolvedAmount,
        discountAmount,
        statusLabel: statusImport,
        status: rowStatus,
        error: rowError,
      });
      continue;
    }

    if (rowStatus === 'invalid') {
      errors.push(`Baris ${line}: ${rowError}`);
      continue;
    }

    try {
      const res = await insertOneBillForProductType({
        studentId: studentId!,
        productId: productId!,
        academicYearId: academicYearId!,
        productName: String(productData.name),
        paymentType: String(productData.payment_type),
        ayName: String(ayData.name),
        amount: resolvedAmount,
        discountAmount,
        status: statusImport,
        bill_month: billMonth ?? undefined,
        bill_year: billYear ?? undefined,
        title,
      });
      if (res.created) inserted++;
      else skipped++;
    } catch (e: unknown) {
      errors.push(
        `Baris ${line}: ${e instanceof Error ? e.message : 'gagal'}`
      );
    }
  }

  if (preview) {
    return NextResponse.json({
      preview: true,
      rows: previewRows,
      total: previewRows.length,
      valid: previewRows.filter((r) => r.status === 'valid').length,
      invalid: previewRows.filter((r) => r.status === 'invalid').length,
    });
  }

  return NextResponse.json({
    success: errors.length === 0 || inserted > 0 || skipped > 0,
    inserted,
    skipped,
    errors,
  });
}
