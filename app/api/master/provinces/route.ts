import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get('page');
  const q = searchParams.get('q')?.trim() ?? '';

  if (!page) {
    const rows = q
      ? await sql`SELECT id, name FROM core_provinces WHERE name ILIKE ${'%' + q + '%'} ORDER BY name`
      : await sql`SELECT id, name FROM core_provinces ORDER BY name`;
    return NextResponse.json(rows);
  }

  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));
  const pageNum = Math.max(1, Number(page) || 1);
  const offset = (pageNum - 1) * limit;
  const pattern = q ? `%${q}%` : null;

  const [countRows, rows] = await Promise.all([
    sql`
    SELECT COUNT(*)::int AS c FROM core_provinces
    WHERE (${pattern}::text IS NULL OR name ILIKE ${pattern})
  `,
    sql`
    SELECT id, name FROM core_provinces
    WHERE (${pattern}::text IS NULL OR name ILIKE ${pattern})
    ORDER BY name ASC
    LIMIT ${limit} OFFSET ${offset}
  `,
  ]);
  const total = Number(countRows[0]?.c ?? 0);

  return NextResponse.json({
    data: rows,
    page: pageNum,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  });
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });
  }
  const [row] = await sql`
    INSERT INTO core_provinces (name) VALUES (${name.trim()}) RETURNING id, name
  `;
  return NextResponse.json(row, { status: 201 });
}
