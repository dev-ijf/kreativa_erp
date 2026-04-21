import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { parseAcademicListFilters, resolveAcademicYearId } from '@/lib/academic-student-filters';

const BOOL_COLS = [
  'fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'dhuha', 'tahajud',
  'read_quran', 'sunnah_fasting', 'wake_up_early', 'help_parents',
  'pray_with_parents', 'give_greetings', 'smile_greet_polite',
  'parent_hug_pray', 'child_tell_parents',
];

const SHOLAT_5 = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

const sumExpr = (cols: string[]) => cols.map((c) => `COALESCE(t.${c}::int,0)`).join('+');

function filterWhere(f: { qPattern: string | null; schoolId: number | null; studentId: number | null; classId: number | null }, academicYearId: number | null) {
  return sql`
    (${f.qPattern}::text IS NULL OR s.full_name ILIKE ${f.qPattern}
      OR s.nis ILIKE ${f.qPattern}
      OR COALESCE(s.username, '') ILIKE ${f.qPattern})
    AND (${f.schoolId}::int IS NULL OR s.school_id = ${f.schoolId})
    AND (${f.studentId}::int IS NULL OR s.id = ${f.studentId})
    AND (
      ${f.classId}::int IS NULL
      OR (
        ${academicYearId}::int IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM core_student_class_histories ch
          WHERE ch.student_id = s.id
            AND ch.class_id = ${f.classId}
            AND ch.academic_year_id = ${academicYearId}
            AND ch.status = 'active'
        )
      )
    )
  `;
}

export async function GET(req: NextRequest) {
  const f = parseAcademicListFilters(req);
  const academicYearId = await resolveAcademicYearId(f.academicYearIdParam);

  const totalBoolCount = BOOL_COLS.length;
  const where = filterWhere(f, academicYearId);

  const [totalsRow] = await sql`
    SELECT
      COUNT(t.id)::int AS total_records,
      COUNT(DISTINCT t.student_id)::int AS total_students,
      ROUND(
        AVG(${sql.unsafe(sumExpr(BOOL_COLS))}) * 100.0 / ${totalBoolCount},
        1
      )::float AS avg_score_pct,
      ROUND(
        SUM(CASE WHEN ${sql.unsafe(sumExpr(SHOLAT_5))} = ${SHOLAT_5.length} THEN 1 ELSE 0 END) * 100.0
        / NULLIF(COUNT(t.id), 0),
        1
      )::float AS full_sholat_pct
    FROM academic_habits t
    JOIN core_students s ON s.id = t.student_id
    WHERE ${where}
  `;

  const DIST_LABELS: Record<string, string> = {
    fajr: 'Subuh', dhuhr: 'Dzuhur', asr: 'Ashar', maghrib: 'Maghrib', isha: 'Isya',
    dhuha: 'Dhuha', tahajud: 'Tahajud', read_quran: 'Baca Quran', sunnah_fasting: 'Puasa Sunnah',
    wake_up_early: 'Bangun Pagi', help_parents: 'Bantu Ortu', pray_with_parents: 'Ngaji Ortu',
    give_greetings: 'Beri Salam', smile_greet_polite: '5S', parent_hug_pray: 'Peluk Doa',
    child_tell_parents: 'Cerita Ortu',
  };

  const sumCols = BOOL_COLS.map((c) => `SUM(COALESCE(t.${c}::int,0)) AS ${c}_yes`).join(', ');

  const [distRaw] = await sql`
    SELECT
      COUNT(t.id)::int AS total,
      ${sql.unsafe(sumCols)}
    FROM academic_habits t
    JOIN core_students s ON s.id = t.student_id
    WHERE ${where}
  `;

  const distribution = BOOL_COLS.map((c) => ({
    key: c,
    label: DIST_LABELS[c] || c,
    yes_count: Number((distRaw as Record<string, unknown>)?.[`${c}_yes`] || 0),
    total: Number((distRaw as Record<string, unknown>)?.total || 0),
  }));

  const daily = await sql`
    SELECT
      t.habit_date::text AS date,
      ROUND(
        AVG(${sql.unsafe(sumExpr(BOOL_COLS))}) * 100.0 / ${totalBoolCount},
        1
      )::float AS avg_score
    FROM academic_habits t
    JOIN core_students s ON s.id = t.student_id
    WHERE ${where}
    GROUP BY t.habit_date
    ORDER BY t.habit_date ASC
  `;

  return NextResponse.json({
    totals: totalsRow || { total_records: 0, total_students: 0, avg_score_pct: 0, full_sholat_pct: 0 },
    distribution,
    daily,
  });
}
