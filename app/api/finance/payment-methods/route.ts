import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') || '1'));
  const limit = Math.max(1, Number(searchParams.get('limit') || '15'));
  const q = (searchParams.get('q') || '').trim();
  const offset = (page - 1) * limit;

  // Search filter
  const filter = q ? sql`WHERE (name ILIKE ${`%${q}%`} OR code ILIKE ${`%${q}%`} OR category ILIKE ${`%${q}%`})` : sql``;

  // Total count
  const [{ count }] = (await sql`
    SELECT COUNT(*)::int as count FROM tuition_payment_methods ${filter}
  `) as { count: number }[];

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
        ${filter}
        ORDER BY sort_order ASC NULLS LAST, id DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    : await sql`
        SELECT * FROM tuition_payment_methods 
        ${filter}
        ORDER BY id DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

  return NextResponse.json({
    data: rows,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  });
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
        INSERT INTO tuition_payment_methods (name, code, category, coa, vendor, is_redirect, is_publish, is_active, sort_order)
        VALUES (
          ${data.name},
          ${data.code},
          ${data.category},
          ${data.coa || null},
          ${data.vendor || null},
          ${data.is_redirect ?? false},
          ${data.is_publish ?? true},
          ${data.is_active},
          (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM tuition_payment_methods)
        )
        RETURNING *
      `
    : await sql`
        INSERT INTO tuition_payment_methods (name, code, category, coa, vendor, is_redirect, is_publish, is_active)
        VALUES (
          ${data.name}, 
          ${data.code}, 
          ${data.category}, 
          ${data.coa || null},
          ${data.vendor || null},
          ${data.is_redirect ?? false},
          ${data.is_publish ?? true},
          ${data.is_active}
        )
        RETURNING *
      `;
  return NextResponse.json(row, { status: 201 });
}
