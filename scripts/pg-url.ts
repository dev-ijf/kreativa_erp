/**
 * Menambahkan uselibpqcompat=true ke URL Postgres agar cocok dengan perilaku libpq
 * dan menghilangkan peringatan SSL dari pg v8+ / pg-connection-string.
 * @see https://github.com/brianc/node-postgres/issues/3439
 */
export function pgConnectionString(raw: string | undefined): string {
  if (!raw) return '';
  try {
    const u = new URL(raw);
    if (!u.searchParams.has('uselibpqcompat')) {
      u.searchParams.set('uselibpqcompat', 'true');
    }
    return u.href;
  } catch {
    return raw;
  }
}
