export type XlsxRowIn = Record<string, unknown>;

export function cellStr(r: XlsxRowIn, keys: string[]): string {
  for (const k of keys) {
    const v = r[k];
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

export function cellNum(r: XlsxRowIn, keys: string[]): number | null {
  const s = cellStr(r, keys);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function parseDate(r: XlsxRowIn, keys: string[]): string | null {
  for (const k of keys) {
    const v = r[k];
    if (v == null) continue;
    if (typeof v === 'number') {
      const epoch = new Date((v - 25569) * 86400 * 1000);
      if (!isNaN(epoch.getTime())) return epoch.toISOString().slice(0, 10);
    }
    const s = String(v).trim();
    if (!s) continue;
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  return null;
}

/** 1, true, ya, y, yes (case-insensitive) → true; selain itu false */
export function parseBoolCell(r: XlsxRowIn, keys: string[]): boolean {
  const s = cellStr(r, keys).toLowerCase();
  return s === '1' || s === 'true' || s === 'ya' || s === 'y' || s === 'yes';
}
