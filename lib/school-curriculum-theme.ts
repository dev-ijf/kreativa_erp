/** Nilai `core_schools.theme_id` untuk kurikulum (bukan FK portal di skema ini). */
export function parseCurriculumThemeId(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  if (n === 1 || n === 2) return n;
  return null;
}
