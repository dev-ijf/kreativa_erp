import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await sql`
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
    WHERE s.id = ${Number(id)}
  `;
  if (!row) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
    UPDATE core_subdistricts
    SET district_id = ${did}, name = ${name.trim()}, postal_code = ${pc}
    WHERE id = ${Number(id)}
    RETURNING id, district_id, name, postal_code
  `;
  if (!row) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const [gone] = await sql`DELETE FROM core_subdistricts WHERE id = ${Number(id)} RETURNING id`;
    if (!gone) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === '23503') {
      return NextResponse.json({ error: 'Kelurahan masih dipakai data siswa' }, { status: 409 });
    }
    throw e;
  }
  return NextResponse.json({ success: true });
}
