import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await sql`
    SELECT cs.id, cs.school_id, cs.setting_key, cs.setting_value, cs.description, cs.created_at, cs.updated_at,
      s.name AS school_name
    FROM core_settings cs
    LEFT JOIN core_schools s ON cs.school_id = s.id
    WHERE cs.id = ${Number(id)}
  `;
  if (!row) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await req.json();
  const setting_key = String(b.setting_key ?? '').trim();
  const setting_value =
    b.setting_value != null && String(b.setting_value).trim() !== ''
      ? String(b.setting_value)
      : null;
  const description =
    b.description != null && String(b.description).trim() !== ''
      ? String(b.description).trim().slice(0, 255)
      : null;
  const school_id =
    b.school_id != null && b.school_id !== '' ? Number(b.school_id) : null;

  if (!setting_key) {
    return NextResponse.json({ error: 'setting_key wajib' }, { status: 400 });
  }

  try {
    const [row] = await sql`
      UPDATE core_settings
      SET school_id = ${school_id},
          setting_key = ${setting_key.slice(0, 100)},
          setting_value = ${setting_value},
          description = ${description},
          updated_at = NOW()
      WHERE id = ${Number(id)}
      RETURNING id, school_id, setting_key, setting_value, description, created_at, updated_at
    `;
    if (!row) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
    return NextResponse.json(row);
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === '23505') {
      return NextResponse.json(
        { error: 'Kombinasi sekolah + kunci pengaturan sudah ada' },
        { status: 409 }
      );
    }
    throw e;
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [gone] = await sql`DELETE FROM core_settings WHERE id = ${Number(id)} RETURNING id`;
  if (!gone) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  return NextResponse.json({ success: true });
}
