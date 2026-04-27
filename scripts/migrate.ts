import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from 'dotenv';
import pg from 'pg';
import { pgConnectionString } from './pg-url';

config({ path: path.join(process.cwd(), '.env.local') });

function logMigratePreflight() {
  console.log(
    '[db:migrate] Produksi: backup/snapshot DB dulu. Sebelum FK tuition_bills (0014), jalankan: npx tsx scripts/check-tuition-bills-orphans.ts'
  );
}

function runDrizzleMigrate() {
  const bin = process.platform === 'win32' ? 'drizzle-kit.cmd' : 'drizzle-kit';
  const binPath = path.join(process.cwd(), 'node_modules', '.bin', bin);

  const result = spawnSync(binPath, ['migrate'], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`drizzle-kit migrate gagal (exit ${result.status ?? 'unknown'})`);
  }
}

function splitSqlStatements(sql: string): string[] {
  const out: string[] = [];
  let buf = '';

  let inSingle = false;
  let inDouble = false;
  let inLineComment = false;
  let inBlockComment = false;
  let dollarTag: string | null = null;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    const next = i + 1 < sql.length ? sql[i + 1] : '';

    if (inLineComment) {
      buf += ch;
      if (ch === '\n') inLineComment = false;
      continue;
    }

    if (inBlockComment) {
      buf += ch;
      if (ch === '*' && next === '/') {
        buf += next;
        i++;
        inBlockComment = false;
      }
      continue;
    }

    if (!inSingle && !inDouble && !dollarTag) {
      if (ch === '-' && next === '-') {
        buf += ch + next;
        i++;
        inLineComment = true;
        continue;
      }
      if (ch === '/' && next === '*') {
        buf += ch + next;
        i++;
        inBlockComment = true;
        continue;
      }
    }

    if (!inDouble && !dollarTag && ch === "'") {
      buf += ch;
      if (inSingle) {
        // escaped '' inside string
        if (next === "'") {
          buf += next;
          i++;
        } else {
          inSingle = false;
        }
      } else {
        inSingle = true;
      }
      continue;
    }

    if (!inSingle && !dollarTag && ch === '"') {
      buf += ch;
      inDouble = !inDouble;
      continue;
    }

    if (!inSingle && !inDouble) {
      if (!dollarTag && ch === '$') {
        const m = sql.slice(i).match(/^\$[a-zA-Z0-9_]*\$/);
        if (m) {
          dollarTag = m[0];
          buf += dollarTag;
          i += dollarTag.length - 1;
          continue;
        }
      } else if (dollarTag && ch === '$') {
        if (sql.startsWith(dollarTag, i)) {
          buf += dollarTag;
          i += dollarTag.length - 1;
          dollarTag = null;
          continue;
        }
      }
    }

    if (!inSingle && !inDouble && !dollarTag && ch === ';') {
      const stmt = buf.trim();
      if (stmt) out.push(stmt);
      buf = '';
      continue;
    }

    buf += ch;
  }

  const tail = buf.trim();
  if (tail) out.push(tail);
  return out;
}

async function runAdditionalSql() {
  const rawUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!rawUrl) {
    console.error('Set DATABASE_URL_UNPOOLED atau DATABASE_URL di .env.local');
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: pgConnectionString(rawUrl) });
  const client = await pool.connect();
  try {
    const sqlPath = path.join(process.cwd(), 'refs', 'additional.sql');
    const sqlText = await readFile(sqlPath, 'utf8');
    const statements = splitSqlStatements(sqlText);

    if (statements.length === 0) {
      console.log('Tidak ada statement di refs/additional.sql (skip).');
      return;
    }

    console.log(`Menjalankan refs/additional.sql (${statements.length} statements)...`);
    await client.query('BEGIN');
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await client.query(stmt);
      } catch (err) {
        const preview = stmt.replace(/\s+/g, ' ').slice(0, 300);
        console.error(`Gagal menjalankan statement #${i + 1}: ${preview}`);
        throw err;
      }
    }
    await client.query('COMMIT');
    console.log('refs/additional.sql selesai.');
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore rollback failures
    }
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

async function maybeCheckTuitionOrphans() {
  if (process.env.CHECK_TUITION_BILLS_ORPHANS !== '1') return;

  const bin = process.platform === 'win32' ? 'tsx.cmd' : 'tsx';
  const binPath = path.join(process.cwd(), 'node_modules', '.bin', bin);
  const result = spawnSync(
    binPath,
    ['scripts/check-tuition-bills-orphans.ts'],
    { stdio: 'inherit', cwd: process.cwd() }
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error('check-tuition-bills-orphans gagal — perbaiki data lalu ulang migrate');
  }
}

async function main() {
  logMigratePreflight();
  await maybeCheckTuitionOrphans();
  runDrizzleMigrate();
  await runAdditionalSql();
}

main().catch((err) => {
  console.error('db:migrate error:', err);
  process.exit(1);
});

