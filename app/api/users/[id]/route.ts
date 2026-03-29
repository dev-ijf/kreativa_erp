import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { hashPassword } from '@/lib/password';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await sql`
    SELECT u.id, u.school_id, u.full_name, u.email, u.phone, u.role, u.created_at,
      s.name AS school_name
    FROM core_users u
    LEFT JOIN core_schools s ON u.school_id = s.id
    WHERE u.id = ${Number(id)}
  `;
  if (!row) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await req.json();
  const full_name = String(b.full_name ?? '').trim();
  const email = String(b.email ?? '').trim().toLowerCase();
  const phone = b.phone != null && String(b.phone).trim() !== '' ? String(b.phone).trim().slice(0, 20) : null;
  const role = String(b.role ?? '').trim();
  const school_id =
    b.school_id != null && b.school_id !== '' ? Number(b.school_id) : null;
  const password = b.password != null ? String(b.password) : '';

  if (!full_name || !email || !role) {
    return NextResponse.json({ error: 'Nama, email, dan peran wajib' }, { status: 400 });
  }
  if (password && password.length < 6) {
    return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
  }

  try {
    if (password) {
      const password_hash = hashPassword(password);
      const [row] = await sql`
        UPDATE core_users
        SET school_id = ${school_id},
            full_name = ${full_name},
            email = ${email},
            phone = ${phone},
            role = ${role},
            password_hash = ${password_hash}
        WHERE id = ${Number(id)}
        RETURNING id, school_id, full_name, email, phone, role, created_at
      `;
      if (!row) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
      return NextResponse.json(row);
    }
    const [row] = await sql`
      UPDATE core_users
      SET school_id = ${school_id},
          full_name = ${full_name},
          email = ${email},
          phone = ${phone},
          role = ${role}
      WHERE id = ${Number(id)}
      RETURNING id, school_id, full_name, email, phone, role, created_at
    `;
    if (!row) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
    return NextResponse.json(row);
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === '23505') {
      return NextResponse.json({ error: 'Email sudah dipakai pengguna lain' }, { status: 409 });
    }
    throw e;
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const [gone] = await sql`DELETE FROM core_users WHERE id = ${Number(id)} RETURNING id`;
    if (!gone) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === '23503') {
      return NextResponse.json(
        { error: 'Pengguna masih direferensi data lain (siswa, relasi orang tua, dll.)' },
        { status: 409 }
      );
    }
    throw e;
  }
  return NextResponse.json({ success: true });
}
