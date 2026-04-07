import { NextResponse } from 'next/server';
import sql from '@/lib/db';

/** User yang belum punya baris core_teachers (untuk dropdown link akun). */
export async function GET() {
  const rows = await sql`
    SELECT u.id, u.full_name, u.email, u.role, u.school_id
    FROM core_users u
    WHERE NOT EXISTS (SELECT 1 FROM core_teachers t WHERE t.user_id = u.id)
    ORDER BY u.full_name ASC
  `;
  return NextResponse.json(rows);
}
