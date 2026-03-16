import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const rows = await sql`SELECT * FROM core_schools ORDER BY id`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { name, address } = await req.json();
  const [row] = await sql`INSERT INTO core_schools (name, address) VALUES (${name}, ${address}) RETURNING *`;
  return NextResponse.json(row, { status: 201 });
}
