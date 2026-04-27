/**
 * Pra-cek sebelum migrasi 0014 (FK tuition_bills).
 * Keluar dengan kode 1 jika ada baris orphan (master tidak ditemukan).
 */
import pg from 'pg';
import { config } from 'dotenv';
import path from 'node:path';
import { pgConnectionString } from './pg-url';

config({ path: path.join(process.cwd(), '.env.local') });

const rawUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!rawUrl) {
  console.error('Set DATABASE_URL_UNPOOLED atau DATABASE_URL di .env.local');
  process.exit(1);
}

const checks = [
  {
    name: 'student_id → core_students',
    sql: `SELECT COUNT(*)::int AS c FROM public.tuition_bills b
          LEFT JOIN public.core_students s ON s.id = b.student_id WHERE s.id IS NULL`,
  },
  {
    name: 'product_id → tuition_products',
    sql: `SELECT COUNT(*)::int AS c FROM public.tuition_bills b
          LEFT JOIN public.tuition_products p ON p.id = b.product_id WHERE p.id IS NULL`,
  },
  {
    name: 'academic_year_id → core_academic_years',
    sql: `SELECT COUNT(*)::int AS c FROM public.tuition_bills b
          LEFT JOIN public.core_academic_years y ON y.id = b.academic_year_id WHERE y.id IS NULL`,
  },
] as const;

async function main() {
  const pool = new pg.Pool({ connectionString: pgConnectionString(rawUrl) });
  try {
    let total = 0;
    for (const { name, sql } of checks) {
      const { rows } = await pool.query<{ c: number }>(sql);
      const c = rows[0]?.c ?? 0;
      console.log(`${name}: ${c} baris orphan`);
      total += c;
    }
    if (total > 0) {
      console.error(
        '\nAda orphan — migrasi 0014 akan gagal. Perbaiki data (lihat scripts/sql/tuition-bills-delete-orphans.sql.example) lalu ulang.'
      );
      process.exit(1);
    }
    console.log('\nTidak ada orphan; aman untuk menjalankan db:migrate.');
  } finally {
    await pool.end();
  }
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
