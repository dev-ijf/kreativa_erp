import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

function parseSchoolFilter(searchParams: URLSearchParams): number | null {
  const raw = searchParams.get('school_id')?.trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') || '1'));
  const limit = Math.max(1, Number(searchParams.get('limit') || '15'));
  const q = (searchParams.get('q') || '').trim();
  const schoolIdNum = parseSchoolFilter(searchParams);
  const offset = (page - 1) * limit;

  const hasSearch = q.length > 0;
  const hasSchool = schoolIdNum != null;

  const filter =
    hasSearch && hasSchool
      ? sql`WHERE (m.name ILIKE ${`%${q}%`} OR m.code ILIKE ${`%${q}%`} OR m.category ILIKE ${`%${q}%`})
          AND (m.school_id IS NULL OR m.school_id = ${schoolIdNum!})`
      : hasSearch
        ? sql`WHERE (m.name ILIKE ${`%${q}%`} OR m.code ILIKE ${`%${q}%`} OR m.category ILIKE ${`%${q}%`})`
        : hasSchool
          ? sql`WHERE (m.school_id IS NULL OR m.school_id = ${schoolIdNum!})`
          : sql``;

  const [{ count }] = (await sql`
    SELECT COUNT(*)::int as count
    FROM tuition_payment_methods m
    ${filter}
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
        SELECT m.*, sch.name AS school_name
        FROM tuition_payment_methods m
        LEFT JOIN core_schools sch ON sch.id = m.school_id
        ${filter}
        ORDER BY m.sort_order ASC NULLS LAST, m.id DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    : await sql`
        SELECT m.*, sch.name AS school_name
        FROM tuition_payment_methods m
        LEFT JOIN core_schools sch ON sch.id = m.school_id
        ${filter}
        ORDER BY m.id DESC
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
  const schoolId =
    data.school_id != null && data.school_id !== ''
      ? Number(data.school_id)
      : null;
  const schoolIdVal = schoolId != null && Number.isFinite(schoolId) ? schoolId : null;

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
        INSERT INTO tuition_payment_methods (
          name, code, school_id, category, coa, vendor, is_redirect, is_publish, is_active, sort_order
        )
        VALUES (
          ${data.name},
          ${data.code},
          ${schoolIdVal},
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
        INSERT INTO tuition_payment_methods (
          name, code, school_id, category, coa, vendor, is_redirect, is_publish, is_active
        )
        VALUES (
          ${data.name},
          ${data.code},
          ${schoolIdVal},
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
