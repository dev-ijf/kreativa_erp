import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get('page');
  const cityId = searchParams.get('city_id');

  if (!page) {
    if (!cityId) {
      return NextResponse.json({ error: 'city_id wajib' }, { status: 400 });
    }
    const rows = await sql`
      SELECT id, city_id, name FROM core_districts
      WHERE city_id = ${Number(cityId)}
      ORDER BY name
    `;
    return NextResponse.json(rows);
  }

  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));
  const pageNum = Math.max(1, Number(page) || 1);
  const offset = (pageNum - 1) * limit;
  const q = searchParams.get('q')?.trim() ?? '';
  const pattern = q ? `%${q}%` : null;
  const cid = cityId ? Number(cityId) : null;
  const provinceId = searchParams.get('province_id');
  const pid = provinceId ? Number(provinceId) : null;

  const [countRows, rows] = await Promise.all([
    sql`
    SELECT COUNT(*)::int AS c
    FROM core_districts d
    JOIN core_cities c ON d.city_id = c.id
    JOIN core_provinces p ON c.province_id = p.id
    WHERE (${cid}::int IS NULL OR d.city_id = ${cid})
      AND (${pid}::int IS NULL OR c.province_id = ${pid})
      AND (${pattern}::text IS NULL OR d.name ILIKE ${pattern} OR c.name ILIKE ${pattern} OR p.name ILIKE ${pattern})
  `,
    sql`
    SELECT
      d.id,
      d.city_id,
      d.name,
      c.name AS city_name,
      c.province_id,
      p.name AS province_name
    FROM core_districts d
    JOIN core_cities c ON d.city_id = c.id
    JOIN core_provinces p ON c.province_id = p.id
    WHERE (${cid}::int IS NULL OR d.city_id = ${cid})
      AND (${pid}::int IS NULL OR c.province_id = ${pid})
      AND (${pattern}::text IS NULL OR d.name ILIKE ${pattern} OR c.name ILIKE ${pattern} OR p.name ILIKE ${pattern})
    ORDER BY p.name ASC, c.name ASC, d.name ASC
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
  const { city_id, name } = await req.json();
  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });
  }
  const cid = Number(city_id);
  if (!Number.isFinite(cid)) {
    return NextResponse.json({ error: 'Kabupaten/kota wajib dipilih' }, { status: 400 });
  }
  const [row] = await sql`
    INSERT INTO core_districts (city_id, name) VALUES (${cid}, ${name.trim()})
    RETURNING id, city_id, name
  `;
  return NextResponse.json(row, { status: 201 });
}
