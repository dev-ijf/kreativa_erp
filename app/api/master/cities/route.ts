import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get('page');
  const provinceId = searchParams.get('province_id');

  if (!page) {
    if (!provinceId) {
      return NextResponse.json({ error: 'province_id wajib' }, { status: 400 });
    }
    const rows = await sql`
      SELECT id, province_id, name FROM core_cities
      WHERE province_id = ${Number(provinceId)}
      ORDER BY name
    `;
    return NextResponse.json(rows);
  }

  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));
  const pageNum = Math.max(1, Number(page) || 1);
  const offset = (pageNum - 1) * limit;
  const q = searchParams.get('q')?.trim() ?? '';
  const pattern = q ? `%${q}%` : null;
  const pid = provinceId ? Number(provinceId) : null;

  const [countRows, rows] = await Promise.all([
    sql`
    SELECT COUNT(*)::int AS c
    FROM core_cities c
    JOIN core_provinces p ON c.province_id = p.id
    WHERE (${pid}::int IS NULL OR c.province_id = ${pid})
      AND (${pattern}::text IS NULL OR c.name ILIKE ${pattern} OR p.name ILIKE ${pattern})
  `,
    sql`
    SELECT c.id, c.province_id, c.name, p.name AS province_name
    FROM core_cities c
    JOIN core_provinces p ON c.province_id = p.id
    WHERE (${pid}::int IS NULL OR c.province_id = ${pid})
      AND (${pattern}::text IS NULL OR c.name ILIKE ${pattern} OR p.name ILIKE ${pattern})
    ORDER BY p.name ASC, c.name ASC
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
  const { province_id, name } = await req.json();
  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });
  }
  const pid = Number(province_id);
  if (!Number.isFinite(pid)) {
    return NextResponse.json({ error: 'Provinsi wajib dipilih' }, { status: 400 });
  }
  const [row] = await sql`
    INSERT INTO core_cities (province_id, name) VALUES (${pid}, ${name.trim()})
    RETURNING id, province_id, name
  `;
  return NextResponse.json(row, { status: 201 });
}
