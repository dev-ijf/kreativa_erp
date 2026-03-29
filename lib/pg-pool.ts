import pg from 'pg';

let pool: pg.Pool | null = null;

/** Pool TCP untuk transaksi (promosi/lulus). Pakai DATABASE_URL_UNPOOLED bila tersedia. */
export function getPgPool(): pg.Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL_UNPOOLED atau DATABASE_URL wajib untuk transaksi');
    pool = new pg.Pool({ connectionString: url, max: 3 });
  }
  return pool;
}

export async function withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const p = getPgPool();
  const client = await p.connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
