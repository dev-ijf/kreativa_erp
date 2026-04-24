import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { withTransaction } from '@/lib/pg-pool';
import {
  cellStr,
  cellNum,
  parseDate,
  parseBoolCell,
  type XlsxRowIn,
} from '@/lib/xlsx-import-row';
import {
  HABIT_DATE_PARTITION_END,
  HABIT_DATE_PARTITION_START,
} from '@/lib/academic-habits-partition-bounds';

function inPartitionBounds(isoDate: string): boolean {
  return isoDate >= HABIT_DATE_PARTITION_START && isoDate <= HABIT_DATE_PARTITION_END;
}

export async function POST(req: NextRequest) {
  const ct = req.headers.get('content-type') || '';
  let workbook: XLSX.WorkBook;
  let schoolIdOpt: number | null = null;

  if (ct.includes('multipart/form-data')) {
    const form = await req.formData();
    const file = form.get('file');
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Field file wajib (.xlsx)' }, { status: 400 });
    }
    const schoolRaw = form.get('school_id');
    if (schoolRaw != null && String(schoolRaw).trim() !== '') {
      const n = Number(schoolRaw);
      if (Number.isFinite(n)) schoolIdOpt = n;
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
        const habitDate = parseDate(r, ['habit_date', 'Habit Date', 'tanggal', 'date']);

        if (!studentId) {
          skipped++;
          errors.push(`Baris ${rowNum}: student_id wajib`);
          continue;
        }
        if (!habitDate) {
          skipped++;
          errors.push(`Baris ${rowNum}: habit_date wajib (format YYYY-MM-DD)`);
          continue;
        }
        if (!inPartitionBounds(habitDate)) {
          skipped++;
          errors.push(
            `Baris ${rowNum}: habit_date harus antara ${HABIT_DATE_PARTITION_START} dan ${HABIT_DATE_PARTITION_END}`
          );
          continue;
        }

        const stSql =
          schoolIdOpt != null
            ? `SELECT id FROM core_students WHERE id = $1 AND school_id = $2`
            : `SELECT id FROM core_students WHERE id = $1`;
        const stParams = schoolIdOpt != null ? [studentId, schoolIdOpt] : [studentId];
        const stCheck = await c.query(stSql, stParams);
        if (stCheck.rows.length === 0) {
          skipped++;
          errors.push(
            schoolIdOpt != null
              ? `Baris ${rowNum}: student_id ${studentId} tidak ditemukan atau bukan di sekolah terpilih`
              : `Baris ${rowNum}: student_id ${studentId} tidak ditemukan`
          );
          continue;
        }

        const fajr = parseBoolCell(r, ['fajr', 'Fajr']);
        const dhuhr = parseBoolCell(r, ['dhuhr', 'Dhuhr']);
        const asr = parseBoolCell(r, ['asr', 'Asr']);
        const maghrib = parseBoolCell(r, ['maghrib', 'Maghrib']);
        const isha = parseBoolCell(r, ['isha', 'Isha']);
        const dhuha = parseBoolCell(r, ['dhuha', 'Dhuha']);
        const tahajud = parseBoolCell(r, ['tahajud', 'Tahajud']);
        const readQuran = parseBoolCell(r, ['read_quran', 'read quran', 'Read Quran']);
        const sunnahFasting = parseBoolCell(r, ['sunnah_fasting', 'sunnah fasting']);
        const wakeUpEarly = parseBoolCell(r, ['wake_up_early', 'wake up early']);
        const helpParents = parseBoolCell(r, ['help_parents', 'help parents']);
        const prayWithParents = parseBoolCell(r, ['pray_with_parents', 'pray with parents']);
        const giveGreetings = parseBoolCell(r, ['give_greetings', 'give greetings']);
        const smileGreetPolite = parseBoolCell(r, ['smile_greet_polite', 'smile greet polite']);
        const parentHugPray = parseBoolCell(r, ['parent_hug_pray', 'parent hug pray']);
        const childTellParents = parseBoolCell(r, ['child_tell_parents', 'child tell parents']);

        let onTimeArrival = cellStr(r, ['on_time_arrival', 'on time arrival']);
        if (onTimeArrival.length > 255) onTimeArrival = onTimeArrival.slice(0, 255);
        const onTimeDb = onTimeArrival === '' ? null : onTimeArrival;

        let quranJuzInfo = cellStr(r, ['quran_juz_info', 'quran juz info']);
        const quranDb = quranJuzInfo === '' ? null : quranJuzInfo;

        await c.query(
          `INSERT INTO academic_habits (
            student_id, habit_date,
            fajr, dhuhr, asr, maghrib, isha, dhuha, tahajud, read_quran, sunnah_fasting,
            wake_up_early, help_parents, pray_with_parents, give_greetings, smile_greet_polite,
            on_time_arrival, parent_hug_pray, child_tell_parents, quran_juz_info
          ) VALUES (
            $1, $2::date,
            $3, $4, $5, $6, $7, $8, $9, $10, $11,
            $12, $13, $14, $15, $16,
            $17, $18, $19, $20
          )
          ON CONFLICT (student_id, habit_date) DO UPDATE SET
            fajr = EXCLUDED.fajr,
            dhuhr = EXCLUDED.dhuhr,
            asr = EXCLUDED.asr,
            maghrib = EXCLUDED.maghrib,
            isha = EXCLUDED.isha,
            dhuha = EXCLUDED.dhuha,
            tahajud = EXCLUDED.tahajud,
            read_quran = EXCLUDED.read_quran,
            sunnah_fasting = EXCLUDED.sunnah_fasting,
            wake_up_early = EXCLUDED.wake_up_early,
            help_parents = EXCLUDED.help_parents,
            pray_with_parents = EXCLUDED.pray_with_parents,
            give_greetings = EXCLUDED.give_greetings,
            smile_greet_polite = EXCLUDED.smile_greet_polite,
            on_time_arrival = EXCLUDED.on_time_arrival,
            parent_hug_pray = EXCLUDED.parent_hug_pray,
            child_tell_parents = EXCLUDED.child_tell_parents,
            quran_juz_info = EXCLUDED.quran_juz_info,
            updated_at = now()`,
          [
            studentId,
            habitDate,
            fajr,
            dhuhr,
            asr,
            maghrib,
            isha,
            dhuha,
            tahajud,
            readQuran,
            sunnahFasting,
            wakeUpEarly,
            helpParents,
            prayWithParents,
            giveGreetings,
            smileGreetPolite,
            onTimeDb,
            parentHugPray,
            childTellParents,
            quranDb,
          ]
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
