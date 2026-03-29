import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await sql`
    SELECT c.id, c.province_id, c.name, p.name AS province_name
    FROM core_cities c
    JOIN core_provinces p ON c.province_id = p.id
    WHERE c.id = ${Number(id)}
  `;
  if (!row) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { province_id, name } = await req.json();
  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });
  }
  const pid = Number(province_id);
  if (!Number.isFinite(pid)) {
    return NextResponse.json({ error: 'Provinsi wajib dipilih' }, { status: 400 });
  }
  const [row] = await sql`
    UPDATE core_cities SET province_id = ${pid}, name = ${name.trim()}
    WHERE id = ${Number(id)}
    RETURNING id, province_id, name
  `;
  if (!row) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const [gone] = await sql`DELETE FROM core_cities WHERE id = ${Number(id)} RETURNING id`;
    if (!gone) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === '23503') {
      return NextResponse.json(
        { error: 'Kabupaten/kota masih dipakai kecamatan atau data siswa' },
        { status: 409 }
      );
    }
    throw e;
  }
  return NextResponse.json({ success: true });
}
