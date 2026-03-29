import { neon } from '@neondatabase/serverless';

/**
 * Koneksi database untuk route Next.js (App Router) memakai **Neon serverless**:
 * query dijalankan lewat **HTTP** ke Neon, cocok untuk serverless/edge tanpa
 * membuka pool TCP `pg` per request (mengurangi cold start & batas koneksi).
 *
 * Semua handler API mengimpor `sql` dari sini (`import sql from '@/lib/db'`).
 * Skrip lokal (migrate, seed, reset) tetap memakai `pg` / Drizzle TCP — lihat `scripts/`.
 *
 * @see https://neon.tech/docs/serverless/serverless-driver
 */
const sql = neon(process.env.DATABASE_URL!);

export default sql;
export { sql };

/** Helper query bertipe array baris */
export async function query<T = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  const result = await sql(strings, ...values);
  return result as T[];
}
