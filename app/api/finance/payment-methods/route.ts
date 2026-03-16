import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const rows = await sql`SELECT * FROM tuition_payment_methods ORDER BY id DESC`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const [row] = await sql`
    INSERT INTO tuition_payment_methods (name, code, category, coa, is_active)
    VALUES (${data.name}, ${data.code}, ${data.category}, ${data.coa || null}, ${data.is_active})
    RETURNING *
  `;
  return NextResponse.json(row, { status: 201 });
}
