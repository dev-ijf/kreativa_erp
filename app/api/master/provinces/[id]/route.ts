import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await sql`SELECT id, name FROM core_provinces WHERE id = ${Number(id)}`;
  if (!row) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name } = await req.json();
  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });
  }
  const [row] = await sql`
    UPDATE core_provinces SET name = ${name.trim()} WHERE id = ${Number(id)} RETURNING id, name
  `;
  if (!row) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const [gone] = await sql`DELETE FROM core_provinces WHERE id = ${Number(id)} RETURNING id`;
    if (!gone) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === '23503') {
      return NextResponse.json(
        { error: 'Provinsi masih dipakai kabupaten/kota atau data siswa' },
        { status: 409 }
      );
    }
    throw e;
  }
  return NextResponse.json({ success: true });
}
