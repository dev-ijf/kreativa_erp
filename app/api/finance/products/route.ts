import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const rows = await sql`
    SELECT p.*, s.name as school_name 
    FROM tuition_products p
    JOIN core_schools s ON p.school_id = s.id
    ORDER BY s.name ASC, p.id DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { school_id, name, payment_type, category } = await req.json();
  const [row] = await sql`
    INSERT INTO tuition_products (school_id, name, payment_type, category) 
    VALUES (${school_id}, ${name}, ${payment_type}, ${category}) RETURNING *
  `;
  return NextResponse.json(row, { status: 201 });
}
