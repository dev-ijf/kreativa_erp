import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const rows = await sql`SELECT * FROM core_academic_years ORDER BY name DESC`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const { name, is_active } = data;

  if (is_active) {
    await sql`UPDATE core_academic_years SET is_active = false`;
  }

  const [row] = await sql`INSERT INTO core_academic_years (name, is_active) VALUES (${name}, ${is_active}) RETURNING *`;
  return NextResponse.json(row, { status: 201 });
}
