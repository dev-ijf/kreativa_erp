import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const rows = await sql`
    SELECT * FROM tuition_products
    ORDER BY id DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { name, payment_type, coa, coa_another, description } = await req.json();
  const [row] = await sql`
    INSERT INTO tuition_products (name, payment_type, coa, coa_another, description)
    VALUES (${name}, ${payment_type}, ${coa || null}, ${coa_another || null}, ${description || null})
    RETURNING *
  `;
  return NextResponse.json(row, { status: 201 });
}
