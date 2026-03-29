import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await sql`
    SELECT id, host_domain, portal_title, logo_url, primary_color, login_bg_url, welcome_text, created_at, updated_at
    FROM core_portal_themes WHERE id = ${Number(id)}
  `;
  if (!row) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await req.json();
  const host_domain = String(b.host_domain ?? '').trim();
  const portal_title = String(b.portal_title ?? '').trim();
  if (!host_domain || !portal_title) {
    return NextResponse.json({ error: 'host_domain dan portal_title wajib' }, { status: 400 });
  }
  const logo_url = b.logo_url != null && String(b.logo_url).trim() !== '' ? String(b.logo_url).trim() : null;
  const primary_color =
    b.primary_color != null && String(b.primary_color).trim() !== ''
      ? String(b.primary_color).trim().slice(0, 20)
      : null;
  const login_bg_url =
    b.login_bg_url != null && String(b.login_bg_url).trim() !== '' ? String(b.login_bg_url).trim() : null;
  const welcome_text =
    b.welcome_text != null && String(b.welcome_text).trim() !== '' ? String(b.welcome_text).trim() : null;

  try {
    const [row] = await sql`
      UPDATE core_portal_themes
      SET host_domain = ${host_domain},
          portal_title = ${portal_title},
          logo_url = ${logo_url},
          primary_color = ${primary_color},
          login_bg_url = ${login_bg_url},
          welcome_text = ${welcome_text},
          updated_at = NOW()
      WHERE id = ${Number(id)}
      RETURNING id, host_domain, portal_title, logo_url, primary_color, login_bg_url, welcome_text, created_at, updated_at
    `;
    if (!row) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
    return NextResponse.json(row);
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === '23505') {
      return NextResponse.json({ error: 'host_domain sudah dipakai entri lain' }, { status: 409 });
    }
    throw e;
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const [gone] = await sql`DELETE FROM core_portal_themes WHERE id = ${Number(id)} RETURNING id`;
    if (!gone) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === '23503') {
      return NextResponse.json(
        { error: 'Tema masih dipakai sekolah (core_schools.theme_id)' },
        { status: 409 }
      );
    }
    throw e;
  }
  return NextResponse.json({ success: true });
}
