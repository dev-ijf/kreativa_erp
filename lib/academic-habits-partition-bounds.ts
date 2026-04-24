/** Selaras scripts/migrations/0012_academic_habits_partition.sql (partisi bulanan). */
export const HABIT_DATE_PARTITION_START = '2025-01-01';
export const HABIT_DATE_PARTITION_END = '2027-12-31';

/** Bila start_date & end_date tidak dikirim, batasi ke rentang partisi (pruning). */
export function resolveHabitDateRangeFromSearchParams(sp: URLSearchParams): {
  startDate: string | null;
  endDate: string | null;
} {
  const startRaw = sp.get('start_date');
  const endRaw = sp.get('end_date');
  const hasStart = startRaw != null && String(startRaw).trim() !== '';
  const hasEnd = endRaw != null && String(endRaw).trim() !== '';
  if (!hasStart && !hasEnd) {
    return {
      startDate: HABIT_DATE_PARTITION_START,
      endDate: HABIT_DATE_PARTITION_END,
    };
  }
  return {
    startDate: hasStart ? String(startRaw).trim().slice(0, 10) : null,
    endDate: hasEnd ? String(endRaw).trim().slice(0, 10) : null,
  };
}
