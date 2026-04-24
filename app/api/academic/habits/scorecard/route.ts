import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { parseAcademicListFilters, resolveAcademicYearId } from '@/lib/academic-student-filters';
import { resolveHabitDateRangeFromSearchParams } from '@/lib/academic-habits-partition-bounds';

const BOOL_COLS = [
  'fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'dhuha', 'tahajud',
  'read_quran', 'sunnah_fasting', 'wake_up_early', 'help_parents',
  'pray_with_parents', 'give_greetings', 'smile_greet_polite',
  'parent_hug_pray', 'child_tell_parents',
];

const IBADAH_COLS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'dhuha', 'tahajud', 'read_quran', 'sunnah_fasting', 'pray_with_parents'];
const DISIPLIN_COLS = ['wake_up_early', 'smile_greet_polite'];
const KARAKTER_COLS = ['help_parents', 'give_greetings', 'parent_hug_pray', 'child_tell_parents'];

const sumExpr = (cols: string[]) => cols.map((c) => `COALESCE(t.${c}::int,0)`).join('+');

export async function GET(req: NextRequest) {
  const f = parseAcademicListFilters(req);
  const academicYearId = await resolveAcademicYearId(f.academicYearIdParam);
  const { startDate, endDate } = resolveHabitDateRangeFromSearchParams(new URL(req.url).searchParams);

  const totalBoolCount = BOOL_COLS.length;

  const rows = await sql`
    SELECT
      s.id AS student_id,
      s.full_name,
      s.nis,
      (
        SELECT c.name
        FROM core_student_class_histories ch2
        JOIN core_classes c ON c.id = ch2.class_id
        WHERE ch2.student_id = s.id AND ch2.status = 'active'
        ORDER BY ch2.academic_year_id DESC
        LIMIT 1
      ) AS class_name,
      COUNT(t.id)::int AS total_days,
      SUM(${sql.unsafe(sumExpr(BOOL_COLS))})::int AS total_yes,
      (COUNT(t.id) * ${totalBoolCount})::int AS total_possible,
      ROUND(
        SUM(${sql.unsafe(sumExpr(BOOL_COLS))}) * 100.0
        / NULLIF(COUNT(t.id) * ${totalBoolCount}, 0),
        1
      )::float AS score_pct,
      ROUND(
        SUM(${sql.unsafe(sumExpr(IBADAH_COLS))}) * 100.0
        / NULLIF(COUNT(t.id) * ${IBADAH_COLS.length}, 0),
        1
      )::float AS ibadah_pct,
      ROUND(
        SUM(${sql.unsafe(sumExpr(DISIPLIN_COLS))}) * 100.0
        / NULLIF(COUNT(t.id) * ${DISIPLIN_COLS.length}, 0),
        1
      )::float AS disiplin_pct,
      ROUND(
        SUM(${sql.unsafe(sumExpr(KARAKTER_COLS))}) * 100.0
        / NULLIF(COUNT(t.id) * ${KARAKTER_COLS.length}, 0),
        1
      )::float AS karakter_pct
    FROM core_students s
    INNER JOIN academic_habits t ON t.student_id = s.id
    WHERE
      (${f.qPattern}::text IS NULL OR s.full_name ILIKE ${f.qPattern}
        OR s.nis ILIKE ${f.qPattern}
        OR COALESCE(s.username, '') ILIKE ${f.qPattern})
      AND (${f.schoolId}::int IS NULL OR s.school_id = ${f.schoolId})
      AND (${f.studentId}::int IS NULL OR s.id = ${f.studentId})
      AND (${startDate}::date IS NULL OR t.habit_date >= ${startDate}::date)
      AND (${endDate}::date IS NULL OR t.habit_date <= ${endDate}::date)
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
    GROUP BY s.id, s.full_name, s.nis
    ORDER BY score_pct DESC NULLS LAST
  `;

  return NextResponse.json(rows);
}
