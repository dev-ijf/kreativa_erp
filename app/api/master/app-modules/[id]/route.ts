import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await sql`SELECT id, module_code, module_name FROM core_app_modules WHERE id = ${Number(id)}`;
  if (!row) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await req.json();
  const module_code = String(b.module_code ?? '').trim();
  const module_name = String(b.module_name ?? '').trim();
  if (!module_code || !module_name) {
    return NextResponse.json({ error: 'module_code dan module_name wajib' }, { status: 400 });
  }
  try {
    const [row] = await sql`
      UPDATE core_app_modules
      SET module_code = ${module_code.slice(0, 50)}, module_name = ${module_name.slice(0, 100)}
      WHERE id = ${Number(id)}
      RETURNING id, module_code, module_name
    `;
    if (!row) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
    return NextResponse.json(row);
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === '23505') {
      return NextResponse.json({ error: 'module_code sudah dipakai entri lain' }, { status: 409 });
    }
    throw e;
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const [gone] = await sql`DELETE FROM core_app_modules WHERE id = ${Number(id)} RETURNING id`;
    if (!gone) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === '23503') {
      return NextResponse.json({ error: 'Modul masih dipakai di akses modul (core_module_access)' }, { status: 409 });
    }
    throw e;
  }
  return NextResponse.json({ success: true });
}
