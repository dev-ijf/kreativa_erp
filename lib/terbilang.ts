/**
 * Konversi angka ke teks Indonesia (mata uang Rupiah).
 *
 *   terbilang(800000)         === 'Delapan Ratus Ribu Rupiah'
 *   terbilang(1234567)        === 'Satu Juta Dua Ratus Tiga Puluh Empat Ribu Lima Ratus Enam Puluh Tujuh Rupiah'
 *   terbilang(0)              === 'Nol Rupiah'
 *   terbilang(1500.5)         === 'Seribu Lima Ratus Rupiah'    (pecahan dibulatkan ke bawah)
 *
 * Fungsi pure tanpa dependency. Tiap kata dimulai huruf besar (Title Case).
 */

const SATUAN = [
  '',
  'Satu',
  'Dua',
  'Tiga',
  'Empat',
  'Lima',
  'Enam',
  'Tujuh',
  'Delapan',
  'Sembilan',
];

function bawahSeribu(n: number): string {
  if (n < 12) {
    if (n === 10) return 'Sepuluh';
    if (n === 11) return 'Sebelas';
    return SATUAN[n] ?? '';
  }
  if (n < 20) return `${SATUAN[n - 10]} Belas`;
  if (n < 100) {
    const puluh = Math.floor(n / 10);
    const sisa = n % 10;
    const head = `${SATUAN[puluh]} Puluh`;
    return sisa ? `${head} ${SATUAN[sisa]}` : head;
  }
  if (n < 200) {
    const sisa = n - 100;
    return sisa ? `Seratus ${bawahSeribu(sisa)}` : 'Seratus';
  }
  // 200..999
  const ratus = Math.floor(n / 100);
  const sisa = n % 100;
  const head = `${SATUAN[ratus]} Ratus`;
  return sisa ? `${head} ${bawahSeribu(sisa)}` : head;
}

function rekursif(n: number): string {
  if (n < 1000) return bawahSeribu(n);

  if (n < 1_000_000) {
    const ribu = Math.floor(n / 1000);
    const sisa = n % 1000;
    const head = ribu === 1 ? 'Seribu' : `${bawahSeribu(ribu)} Ribu`;
    return sisa ? `${head} ${bawahSeribu(sisa)}` : head;
  }

  if (n < 1_000_000_000) {
    const juta = Math.floor(n / 1_000_000);
    const sisa = n % 1_000_000;
    const head = `${rekursif(juta)} Juta`;
    return sisa ? `${head} ${rekursif(sisa)}` : head;
  }

  if (n < 1_000_000_000_000) {
    const miliar = Math.floor(n / 1_000_000_000);
    const sisa = n % 1_000_000_000;
    const head = `${rekursif(miliar)} Miliar`;
    return sisa ? `${head} ${rekursif(sisa)}` : head;
  }

  const triliun = Math.floor(n / 1_000_000_000_000);
  const sisa = n % 1_000_000_000_000;
  const head = `${rekursif(triliun)} Triliun`;
  return sisa ? `${head} ${rekursif(sisa)}` : head;
}

export function terbilang(value: number | string | null | undefined): string {
  const n = typeof value === 'number' ? value : Number(value ?? 0);
  if (!Number.isFinite(n)) return 'Nol Rupiah';
  const abs = Math.floor(Math.abs(n));
  if (abs === 0) return 'Nol Rupiah';
  const teks = rekursif(abs).replace(/\s+/g, ' ').trim();
  const sign = n < 0 ? 'Minus ' : '';
  return `${sign}${teks} Rupiah`;
}
