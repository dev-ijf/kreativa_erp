/**
 * Membuat partisi bulanan tuition_transactions & tuition_transaction_details jika belum ada.
 * Jalankan via cron (mis. awal bulan) atau sebelum deploy agar INSERT tidak gagal saat
 * created_at masuk bulan yang belum punya partisi.
 *
 *   npm run db:ensure-partitions
 */
import pg from 'pg';
import path from 'node:path';
import { config } from 'dotenv';
import { addMonths, startOfMonth, format } from 'date-fns';
import { pgConnectionString } from './pg-url';

config({ path: path.join(process.cwd(), '.env.local') });

const MONTHS_AHEAD = 18;

function quoteIdent(name: string): string {
  if (!/^[a-z_][a-z0-9_]*$/i.test(name)) {
    throw new Error(`Nama partisi tidak valid: ${name}`);
  }
  return `"${name.replace(/"/g, '""')}"`;
}

async function ensureMonth(pool: pg.Pool, d: Date) {
  const y = format(d, 'yyyy');
  const m = format(d, 'MM');
  const from = `${y}-${m}-01`;
  const to = format(addMonths(d, 1), 'yyyy-MM-dd');
  const pnameTx = `tuition_transactions_y${y}m${m}`;
  const pnameDet = `tuition_transaction_details_y${y}m${m}`;
  if (!/^tuition_transactions_y\d{4}m\d{2}$/.test(pnameTx)) {
    throw new Error('Invalid partition name');
  }
  if (!/^tuition_transaction_details_y\d{4}m\d{2}$/.test(pnameDet)) {
    throw new Error('Invalid partition name');
  }

  const qTx = `CREATE TABLE ${quoteIdent(pnameTx)} PARTITION OF tuition_transactions FOR VALUES FROM ('${from}'::timestamp) TO ('${to}'::timestamp)`;
  const qDet = `CREATE TABLE ${quoteIdent(pnameDet)} PARTITION OF tuition_transaction_details FOR VALUES FROM ('${from}'::timestamp) TO ('${to}'::timestamp)`;

  try {
    await pool.query(qTx);
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code !== '42P07') throw e;
  }
  try {
    await pool.query(qDet);
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code !== '42P07') throw e;
  }
}

async function main() {
  const rawUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!rawUrl) {
    console.error('Set DATABASE_URL_UNPOOLED atau DATABASE_URL di .env.local');
    process.exit(1);
  }
  const pool = new pg.Pool({ connectionString: pgConnectionString(rawUrl) });
  try {
    const start = startOfMonth(new Date());
    for (let i = 0; i < MONTHS_AHEAD; i++) {
      await ensureMonth(pool, addMonths(start, i));
    }
    console.log(`✅ Partisi tuition (±${MONTHS_AHEAD} bulan dari awal bulan ini) dicek/dibuat.`);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
