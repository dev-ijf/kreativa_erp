/** PRNG deterministik untuk acak yang dapat diulang (seed opsional). */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleInPlace<T>(arr: T[], rand: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export interface StudentPoolRow {
  student_id: number;
  gender: string | null;
  history_id: number;
}

/**
 * Bagi siswa ke beberapa kelas tujuan: acak per gender, lalu round-robin
 * sehingga jumlah per kelas selisihnya maksimal 1 per gender.
 */
export function assignStudentsToTargets(
  pool: StudentPoolRow[],
  targetClassIds: number[],
  options: { shuffle: boolean; seed?: number }
): { student_id: number; history_id: number; target_class_id: number }[] {
  if (targetClassIds.length === 0) {
    throw new Error('Minimal satu kelas tujuan');
  }
  const targets = [...targetClassIds].sort((a, b) => a - b);
  const k = targets.length;
  const seed = options.seed ?? Date.now();
  const rand = options.shuffle ? mulberry32(seed) : () => 0.5;

  const male: StudentPoolRow[] = [];
  const female: StudentPoolRow[] = [];
  const other: StudentPoolRow[] = [];
  for (const row of pool) {
    const g = (row.gender || '').toUpperCase();
    if (g === 'L' || g === 'LAKI' || g === 'M') male.push(row);
    else if (g === 'P' || g === 'PEREMPUAN' || g === 'F') female.push(row);
    else other.push(row);
  }
  if (options.shuffle) {
    shuffleInPlace(male, rand);
    shuffleInPlace(female, rand);
    shuffleInPlace(other, rand);
  }

  const out: { student_id: number; history_id: number; target_class_id: number }[] = [];
  let mi = 0;
  let fi = 0;
  let oi = 0;
  for (const row of male) {
    out.push({ student_id: row.student_id, history_id: row.history_id, target_class_id: targets[mi % k]! });
    mi++;
  }
  for (const row of female) {
    out.push({ student_id: row.student_id, history_id: row.history_id, target_class_id: targets[fi % k]! });
    fi++;
  }
  for (const row of other) {
    out.push({ student_id: row.student_id, history_id: row.history_id, target_class_id: targets[oi % k]! });
    oi++;
  }
  return out;
}
