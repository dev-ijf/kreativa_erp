/** Label bulan untuk dropdown (nilai 1–12) */
export const BILL_MONTH_LABELS_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;

export const billMonthSelectOptions = BILL_MONTH_LABELS_ID.map((label, i) => ({
  value: String(i + 1),
  label,
}));

/** Tahun untuk dropdown: rentang lebar untuk filter & form tagihan */
export function billYearSelectOptions(
  startYear = new Date().getFullYear() - 8,
  endYear = new Date().getFullYear() + 6
): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  for (let y = endYear; y >= startYear; y--) {
    out.push({ value: String(y), label: String(y) });
  }
  return out;
}
