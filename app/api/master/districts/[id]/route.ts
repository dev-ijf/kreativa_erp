import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await sql`
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
    WHERE d.id = ${Number(id)}
  `;
  if (!row) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { city_id, name } = await req.json();
  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });
  }
  const cid = Number(city_id);
  if (!Number.isFinite(cid)) {
    return NextResponse.json({ error: 'Kabupaten/kota wajib dipilih' }, { status: 400 });
  }
  const [row] = await sql`
    UPDATE core_districts SET city_id = ${cid}, name = ${name.trim()}
    WHERE id = ${Number(id)}
    RETURNING id, city_id, name
  `;
  if (!row) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const [gone] = await sql`DELETE FROM core_districts WHERE id = ${Number(id)} RETURNING id`;
    if (!gone) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === '23503') {
      return NextResponse.json(
        { error: 'Kecamatan masih dipakai kelurahan atau data siswa' },
        { status: 409 }
      );
    }
    throw e;
  }
  return NextResponse.json({ success: true });
}
