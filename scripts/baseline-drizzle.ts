/**
 * Gunakan jika `npm run db:migrate` gagal dengan error "relation ... already exists":
 * database sudah punya tabel tetapi drizzle.__drizzle_migrations kosong.
 *
 * Lebih aman untuk dev penuh: npm run db:reset -- --confirm
 *
 *   npm run db:baseline
 */
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { config } from 'dotenv';
import { pgConnectionString } from './pg-url';

config({ path: path.join(process.cwd(), '.env.local') });

const rawUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!rawUrl) {
  console.error('DATABASE_URL_UNPOOLED atau DATABASE_URL tidak set di .env.local');
  process.exit(1);
}
const url = pgConnectionString(rawUrl);

async function main() {
  const client = new pg.Client({ connectionString: url });
  await client.connect();

  try {
    await client.query('CREATE SCHEMA IF NOT EXISTS drizzle');
    await client.query(`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `);

    const migrationsDir = path.join(process.cwd(), 'scripts', 'migrations');
    const journalPath = path.join(migrationsDir, 'meta', '_journal.json');
    const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8')) as {
      entries: { tag: string; when: number }[];
    };

    for (const entry of journal.entries) {
      const migrationPath = path.join(migrationsDir, `${entry.tag}.sql`);
      const q = fs.readFileSync(migrationPath, 'utf8');
      const hash = crypto.createHash('sha256').update(q).digest('hex');

      const existing = await client.query(
        'SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = $1 LIMIT 1',
        [hash]
      );
      if (existing.rowCount && existing.rowCount > 0) {
        console.log(`Skipping ${entry.tag}: hash already in drizzle.__drizzle_migrations`);
        continue;
      }

      await client.query(
        'INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)',
        [hash, entry.when]
      );
      console.log(`✓ Baseline: ${entry.tag} (created_at=${entry.when})`);
    }

    console.log('Selesai. Jalankan npm run db:migrate untuk migrasi baru (jika ada).');
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
