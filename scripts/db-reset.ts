/**
 * Menghapus seluruh objek di schema `public` dan `drizzle`, lalu menjalankan `drizzle-kit migrate`.
 * Semua data di database ini akan hilang.
 *
 *   npm run db:reset -- --confirm
 *   npm run db:seed
 */
import pg from 'pg';
import { config } from 'dotenv';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { pgConnectionString } from './pg-url';

config({ path: path.join(process.cwd(), '.env.local') });

async function main() {
  if (!process.argv.includes('--confirm')) {
    console.error('');
    console.error('PERINGATAN: perintah ini menghapus SEMUA tabel dan data di database target.');
    console.error('Untuk melanjutkan, jalankan:');
    console.error('  npm run db:reset -- --confirm');
    console.error('');
    process.exit(1);
  }

  const rawUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!rawUrl) {
    console.error('Set DATABASE_URL_UNPOOLED atau DATABASE_URL di .env.local');
    process.exit(1);
  }
  const url = pgConnectionString(rawUrl);

  console.log('Menghapus schema drizzle & public (semua data dihapus)...');
  const client = new pg.Client({ connectionString: url });
  await client.connect();

  try {
    await client.query('DROP SCHEMA IF EXISTS drizzle CASCADE');
    await client.query('DROP SCHEMA IF EXISTS public CASCADE');
    await client.query('CREATE SCHEMA public');
    await client.query('GRANT ALL ON SCHEMA public TO public');
  } finally {
    await client.end();
  }

  console.log('Menjalankan drizzle-kit migrate...');
  const result = spawnSync('npx', ['drizzle-kit', 'migrate'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL_UNPOOLED: url,
    },
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  console.log('');
  console.log('Selesai. Isi data awal: npm run db:seed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
