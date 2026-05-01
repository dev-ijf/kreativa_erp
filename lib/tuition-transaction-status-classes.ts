/** Kelas Tailwind konsisten untuk badge status transaksi tuition (daftar & detail). */
export function tuitionTransactionStatusBadgeClass(status: string | null | undefined): string {
  const base =
    'inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase border';
  const s = (status || '').toLowerCase().trim();
  if (s === 'success' || s === 'paid') {
    return `${base} bg-emerald-50 text-emerald-800 border-emerald-100`;
  }
  if (s === 'pending') {
    return `${base} bg-amber-50 text-amber-900 border-amber-200`;
  }
  if (s === 'failed' || s === 'cancelled' || s === 'expired') {
    return `${base} bg-red-50 text-red-800 border-red-100`;
  }
  return `${base} bg-slate-100 text-slate-700 border-slate-200`;
}
