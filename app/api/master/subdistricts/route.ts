import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get('page');
  const districtId = searchParams.get('district_id');

  if (!page) {
    if (!districtId) {
      return NextResponse.json({ error: 'district_id wajib' }, { status: 400 });
    }
    const rows = await sql`
      SELECT id, district_id, name, postal_code FROM core_subdistricts
      WHERE district_id = ${Number(districtId)}
      ORDER BY name
    `;
    return NextResponse.json(rows);
  }

  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));
  const pageNum = Math.max(1, Number(page) || 1);
  const offset = (pageNum - 1) * limit;
  const q = searchParams.get('q')?.trim() ?? '';
  const pattern = q ? `%${q}%` : null;
  const did = districtId ? Number(districtId) : null;
  const cityId = searchParams.get('city_id');
  const cid = cityId ? Number(cityId) : null;
  const provinceId = searchParams.get('province_id');
  const pid = provinceId ? Number(provinceId) : null;

  const [countRows, rows] = await Promise.all([
    sql`
    SELECT COUNT(*)::int AS c
    FROM core_subdistricts s
    JOIN core_districts d ON s.district_id = d.id
    JOIN core_cities c ON d.city_id = c.id
    JOIN core_provinces p ON c.province_id = p.id
    WHERE (${did}::int IS NULL OR s.district_id = ${did})
      AND (${cid}::int IS NULL OR d.city_id = ${cid})
      AND (${pid}::int IS NULL OR c.province_id = ${pid})
      AND (${pattern}::text IS NULL OR s.name ILIKE ${pattern}
        OR COALESCE(s.postal_code, '') ILIKE ${pattern}
        OR d.name ILIKE ${pattern}
        OR c.name ILIKE ${pattern}
        OR p.name ILIKE ${pattern})
  `,
    sql`
    SELECT
      s.id,
      s.district_id,
      s.name,
      s.postal_code,
      d.name AS district_name,
      d.city_id,
      c.name AS city_name,
      c.province_id,
      p.name AS province_name
    FROM core_subdistricts s
    JOIN core_districts d ON s.district_id = d.id
    JOIN core_cities c ON d.city_id = c.id
    JOIN core_provinces p ON c.province_id = p.id
    WHERE (${did}::int IS NULL OR s.district_id = ${did})
      AND (${cid}::int IS NULL OR d.city_id = ${cid})
      AND (${pid}::int IS NULL OR c.province_id = ${pid})
      AND (${pattern}::text IS NULL OR s.name ILIKE ${pattern}
        OR COALESCE(s.postal_code, '') ILIKE ${pattern}
        OR d.name ILIKE ${pattern}
        OR c.name ILIKE ${pattern}
        OR p.name ILIKE ${pattern})
    ORDER BY p.name ASC, c.name ASC, d.name ASC, s.name ASC
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
  const { district_id, name, postal_code } = await req.json();
  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });
  }
  const did = Number(district_id);
  if (!Number.isFinite(did)) {
    return NextResponse.json({ error: 'Kecamatan wajib dipilih' }, { status: 400 });
  }
  const pc =
    postal_code != null && String(postal_code).trim() !== ''
      ? String(postal_code).trim().slice(0, 10)
      : null;
  const [row] = await sql`
    INSERT INTO core_subdistricts (district_id, name, postal_code)
    VALUES (${did}, ${name.trim()}, ${pc})
    RETURNING id, district_id, name, postal_code
  `;
  return NextResponse.json(row, { status: 201 });
}
