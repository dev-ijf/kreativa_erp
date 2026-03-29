import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { hashPassword } from '@/lib/password';
import crypto from 'node:crypto';

function randomPassword(): string {
  return crypto.randomBytes(9).toString('base64url').slice(0, 12);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sid = Number(id);
  const body = (await req.json()) as {
    email?: string;
    relation_type?: string;
    full_name?: string;
    password?: string;
    phone?: string | null;
  };

  const email = String(body.email ?? '')
    .trim()
    .toLowerCase();
  const relationType = String(body.relation_type ?? 'father').trim();
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Email wajib dan valid' }, { status: 400 });
  }
  if (!['father', 'mother', 'guardian'].includes(relationType)) {
    return NextResponse.json({ error: 'relation_type tidak valid' }, { status: 400 });
  }

  const [studentRow] = await sql`
    SELECT school_id FROM core_students WHERE id = ${sid}
  `;
  const student = studentRow as { school_id: number } | undefined;
  if (!student) {
    return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 });
  }
  const schoolId = student.school_id;

  const [existingRow] = await sql`
    SELECT id, role, school_id FROM core_users WHERE email = ${email}
  `;
  const existing = existingRow as { id: number; role: string; school_id: number | null } | undefined;

  let userId: number;
  let generatedPassword: string | undefined;

  if (existing) {
    if (existing.role !== 'parent') {
      return NextResponse.json({ error: 'Email sudah dipakai peran lain' }, { status: 409 });
    }
    if (existing.school_id != null && existing.school_id !== schoolId) {
      return NextResponse.json({ error: 'Akun ortu terikat sekolah lain' }, { status: 409 });
    }
    userId = existing.id;
  } else {
    const plain = body.password && body.password.length >= 6 ? body.password : randomPassword();
    if (!body.password || body.password.length < 6) {
      generatedPassword = plain;
    }
    const password_hash = hashPassword(plain);
    const full_name = (body.full_name && body.full_name.trim()) || email.split('@')[0] || 'Orang Tua';
    const phone = body.phone != null && String(body.phone).trim() ? String(body.phone).trim().slice(0, 20) : null;
    const [row] = await sql`
      INSERT INTO core_users (school_id, full_name, email, password_hash, phone, role)
      VALUES (${schoolId}, ${full_name}, ${email}, ${password_hash}, ${phone}, 'parent')
      RETURNING id
    `;
    if (!row) {
      return NextResponse.json({ error: 'Gagal membuat akun' }, { status: 500 });
    }
    userId = row.id;
  }

  await sql`
    INSERT INTO core_parent_student_relations (user_id, student_id, relation_type)
    VALUES (${userId}, ${sid}, ${relationType})
    ON CONFLICT (user_id, student_id) DO UPDATE SET relation_type = EXCLUDED.relation_type
  `;

  return NextResponse.json({
    success: true,
    user_id: userId,
    ...(generatedPassword ? { generated_password: generatedPassword } : {}),
  });
}
