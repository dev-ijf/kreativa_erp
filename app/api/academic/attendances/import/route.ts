import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { withTransaction } from '@/lib/pg-pool';
import { cellStr, cellNum, parseDate, type XlsxRowIn } from '@/lib/xlsx-import-row';

const VALID_STATUSES = ['hadir', 'izin', 'sakit', 'alpha', 'terlambat'];

export async function POST(req: NextRequest) {
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
        { error: 'File harus berupa workbook Excel .xlsx (bukan CSV atau format lain)' },
        { status: 400 }
      );
    }
    workbook = XLSX.read(ab, { type: 'array' });
  } else {
    const body = (await req.json()) as { base64?: string };
    if (!body.base64) {
      return NextResponse.json({ error: 'Kirim multipart file atau JSON { base64 }' }, { status: 400 });
    }
    const buf = Buffer.from(body.base64, 'base64');
    if (buf.length < 4 || buf[0] !== 0x50 || buf[1] !== 0x4b) {
      return NextResponse.json(
        { error: 'Isi base64 harus berupa file .xlsx (bukan CSV atau format lain)' },
        { status: 400 }
      );
    }
    workbook = XLSX.read(buf, { type: 'buffer' });
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return NextResponse.json({ error: 'Spreadsheet kosong' }, { status: 400 });
  }
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<XlsxRowIn>(sheet, { defval: '' });
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Tidak ada baris data' }, { status: 400 });
  }

  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  try {
    await withTransaction(async (c) => {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i]!;
        const rowNum = i + 2;

        const studentId = cellNum(r, ['student_id', 'Student ID', 'id_siswa']);
        const attendanceDate = parseDate(r, ['attendance_date', 'Attendance Date', 'tanggal', 'date']);
        const status = cellStr(r, ['status', 'Status']).toLowerCase();

        if (!studentId) {
          skipped++;
          errors.push(`Baris ${rowNum}: student_id wajib`);
          continue;
        }
        if (!attendanceDate) {
          skipped++;
          errors.push(`Baris ${rowNum}: attendance_date wajib (format YYYY-MM-DD)`);
          continue;
        }
        if (!status || !VALID_STATUSES.includes(status)) {
          skipped++;
          errors.push(`Baris ${rowNum}: status harus salah satu dari: ${VALID_STATUSES.join(', ')}`);
          continue;
        }

        const stCheck = await c.query(`SELECT id FROM core_students WHERE id = $1`, [studentId]);
        if (stCheck.rows.length === 0) {
          skipped++;
          errors.push(`Baris ${rowNum}: student_id ${studentId} tidak ditemukan`);
          continue;
        }

        const noteId = cellStr(r, ['note', 'note_id', 'catatan']) || null;

        await c.query(
          `DELETE FROM academic_attendances WHERE student_id = $1 AND attendance_date = $2::date`,
          [studentId, attendanceDate]
        );

        await c.query(
          `INSERT INTO academic_attendances (student_id, attendance_date, status, note_id)
           VALUES ($1, $2::date, $3, $4)`,
          [studentId, attendanceDate, status, noteId]
        );

        inserted++;
      }
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Import gagal';
    return NextResponse.json({ error: msg, inserted, skipped, errors }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    inserted,
    skipped,
    errors: errors.slice(0, 50),
  });
}
