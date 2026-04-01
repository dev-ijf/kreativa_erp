import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const [{ has_sort_order }] = (await sql`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema='public'
        AND table_name='tuition_payment_methods'
        AND column_name='sort_order'
    ) AS has_sort_order
  `) as { has_sort_order: boolean }[];

  const rows = has_sort_order
    ? await sql`
        SELECT * FROM tuition_payment_methods
        ORDER BY sort_order NULLS LAST, id DESC
      `
    : await sql`SELECT * FROM tuition_payment_methods ORDER BY id DESC`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const [{ has_sort_order }] = (await sql`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema='public'
        AND table_name='tuition_payment_methods'
        AND column_name='sort_order'
    ) AS has_sort_order
  `) as { has_sort_order: boolean }[];

  const [row] = has_sort_order
    ? await sql`
        INSERT INTO tuition_payment_methods (name, code, category, coa, is_active, sort_order)
        VALUES (
          ${data.name},
          ${data.code},
          ${data.category},
          ${data.coa || null},
          ${data.is_active},
          (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM tuition_payment_methods)
        )
        RETURNING *
      `
    : await sql`
        INSERT INTO tuition_payment_methods (name, code, category, coa, is_active)
        VALUES (${data.name}, ${data.code}, ${data.category}, ${data.coa || null}, ${data.is_active})
        RETURNING *
      `;
  return NextResponse.json(row, { status: 201 });
}
