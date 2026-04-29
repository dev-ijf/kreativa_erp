export type InstructionLang = 'EN' | 'ID';

export function normalizeInstructionLangInput(x: unknown): InstructionLang | null {
  if (x === undefined || x === null || x === '') return null;
  const s = String(x).trim().toUpperCase();
  if (s === 'EN' || s === 'ID') return s;
  return null;
}

/** Kosong/null → 'ID'; nilai eksplisit salah → error object. */
export function resolveInstructionLangForWrite(raw: unknown): InstructionLang | { error: string } {
  if (raw === undefined || raw === null || String(raw).trim() === '') return 'ID';
  const n = normalizeInstructionLangInput(raw);
  if (n === null) return { error: 'lang harus ID atau EN' };
  return n;
}

export function isInstructionLangFilter(x: string): x is InstructionLang {
  return x === 'EN' || x === 'ID';
}
