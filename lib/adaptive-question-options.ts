/** Ubah options_json (array string atau campuran) jadi daftar label pilihan untuk UI. */
export function parseOptionsJson(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => {
    if (typeof x === 'string') return x;
    if (x && typeof x === 'object') {
      const o = x as Record<string, unknown>;
      if (typeof o.text === 'string') return o.text;
      if (typeof o.label === 'string') return o.label;
      if (typeof o.value === 'string') return o.value;
    }
    return String(x);
  });
}

export function optionLetter(index: number): string {
  if (index < 0) return '?';
  if (index < 26) return String.fromCharCode(65 + index);
  return `${optionLetter(Math.floor(index / 26) - 1)}${String.fromCharCode(65 + (index % 26))}`;
}

export function answersEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (a == null || b == null) return false;
  return String(a).trim() === String(b).trim();
}
