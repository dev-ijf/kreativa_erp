import { neon } from '@neondatabase/serverless';

// Raw SQL query helper for Next.js API routes
// Usage: const rows = await sql`SELECT * FROM core_schools`
const sql = neon(process.env.DATABASE_URL!);

export default sql;

// Helper for typed queries
export async function query<T = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  const result = await sql(strings, ...values);
  return result as T[];
}
