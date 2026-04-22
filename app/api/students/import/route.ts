import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { withTransaction } from '@/lib/pg-pool';

type RowIn = Record<string, unknown>;

/**
 * Kolom label / *_name (school_name, cohort_name, "Entry Year (Tahun Masuk)", …) diabaikan.
 * Tahun ajaran penempatan rombel: gunakan entry_academic_year_id (bukan kolom generik academic_year_id).
 */
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
  const rows = XLSX.utils.sheet_to_json<RowIn>(sheet, { defval: '' });
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
        const schoolId = cellNum(r, ['school_id', 'school id', 'School ID', 'id_sekolah']);
        const cohortId = cellNum(r, ['cohort_id', 'angkatan_id', 'Cohort ID']);
        const fullName = cellStr(r, ['full_name', 'nama', 'nama_lengkap', 'Nama Lengkap']);
        const nis = cellStr(r, ['nis', 'NIS']);
        if (!schoolId || !cohortId || !fullName || !nis) {
          skipped++;
          errors.push(
            `Baris ${rowNum}: school_id, cohort_id (angkatan), nama, dan nis wajib`
          );
          continue;
        }

        const entryAy = cellNum(r, [
          'entry_academic_year_id',
          'tahun_masuk_id',
          // file lama yang masih memakai nama kolom ini — diperlakukan sebagai tahun masuk
          'academic_year_id',
          'tahun_ajaran_id',
        ]);
        if (!entryAy) {
          skipped++;
          errors.push(
            `Baris ${rowNum}: entry_academic_year_id (Tahun Masuk) wajib`
          );
          continue;
        }

        const ayOk = await c.query(`SELECT id FROM core_academic_years WHERE id = $1`, [entryAy]);
        if (ayOk.rows.length === 0) {
          skipped++;
          errors.push(`Baris ${rowNum}: entry_academic_year_id ${entryAy} tidak ditemukan`);
          continue;
        }

        const dup = await c.query(`SELECT id FROM core_students WHERE nis = $1`, [nis]);
        if (dup.rows.length > 0) {
          skipped++;
          errors.push(`Baris ${rowNum}: NIS ${nis} sudah ada`);
          continue;
        }

        const sch = await c.query(`SELECT id FROM core_schools WHERE id = $1`, [schoolId]);
        if (sch.rows.length === 0) {
          skipped++;
          errors.push(`Baris ${rowNum}: school_id ${schoolId} tidak ditemukan`);
          continue;
        }

        const coh = await c.query(
          `SELECT id FROM core_cohorts WHERE id = $1 AND school_id = $2`,
          [cohortId, schoolId]
        );
        if (coh.rows.length === 0) {
          skipped++;
          errors.push(
            `Baris ${rowNum}: cohort_id ${cohortId} tidak ditemukan atau tidak sesuai sekolah`
          );
          continue;
        }

        const gender = cellStr(r, ['gender', 'jenis_kelamin', 'jk']) || 'L';
        const nisn = cellStr(r, ['nisn', 'NISN']) || null;
        const username = cellStr(r, ['username']) || null;
        const studentType = cellStr(r, ['student_type', 'tipe']) || 'Reguler';
        const program = cellStr(r, ['program']) || null;
        const activeAyOpt = cellNum(r, ['active_academic_year_id', 'tahun_aktif_id']);
        const activeAy = activeAyOpt ?? entryAy;
        const classId = cellNum(r, ['class_id', 'kelas_id', 'rombel_id']);

        const ins = await c.query(
          `INSERT INTO core_students (
            school_id, cohort_id, full_name, username, nis, nisn, gender, student_type, program,
            entry_academic_year_id, active_academic_year_id, enrollment_status
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'active')
          RETURNING id`,
          [
            schoolId,
            cohortId,
            fullName,
            username,
            nis,
            nisn,
            gender,
            studentType,
            program,
            entryAy,
            activeAy,
          ]
        );
        const newId = ins.rows[0]?.id as number;
        if (!newId) continue;

        if (classId && entryAy) {
          const ay = entryAy;
          const cl = await c.query(
            `SELECT level_grade_id, school_id FROM core_classes WHERE id = $1`,
            [classId]
          );
          const row = cl.rows[0] as { level_grade_id: number; school_id: number } | undefined;
          if (row && row.school_id === schoolId) {
            await c.query(
              `INSERT INTO core_student_class_histories (student_id, class_id, level_grade_id, academic_year_id, status)
               VALUES ($1,$2,$3,$4,'active')`,
              [newId, classId, row.level_grade_id, ay]
            );
          }
        }
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
