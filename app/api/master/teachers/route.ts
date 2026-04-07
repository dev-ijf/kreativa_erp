import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const rows = await sql`
    SELECT
      t.id,
      t.user_id,
      t.nip,
      t.join_date,
      t.latest_education,
      u.full_name AS user_full_name,
      u.email AS user_email,
      u.role AS user_role,
      u.school_id AS user_school_id
    FROM core_teachers t
    JOIN core_users u ON u.id = t.user_id
    ORDER BY t.id ASC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });

  const nip = body.nip != null ? String(body.nip).trim() || null : null;
  const joinDate = body.join_date != null && String(body.join_date).trim() !== '' ? String(body.join_date) : null;
  const latestEducation =
    body.latest_education != null && String(body.latest_education).trim() !== ''
      ? String(body.latest_education).trim().slice(0, 100)
      : null;

  const userIdRaw = body.user_id;
  if (userIdRaw != null && userIdRaw !== '') {
    const userId = Number(userIdRaw);
    if (!Number.isFinite(userId)) {
      return NextResponse.json({ error: 'user_id tidak valid' }, { status: 400 });
    }
    const [exists] = await sql`SELECT id FROM core_teachers WHERE user_id = ${userId} LIMIT 1`;
    if (exists) {
      return NextResponse.json({ error: 'User ini sudah terdaftar sebagai guru' }, { status: 409 });
    }
    const [row] = await sql`
      INSERT INTO core_teachers (user_id, nip, join_date, latest_education)
      VALUES (${userId}, ${nip}, ${joinDate}, ${latestEducation})
      RETURNING *
    `;
    return NextResponse.json(row, { status: 201 });
  }

  const fullName = body.full_name != null ? String(body.full_name).trim() : '';
  const email = body.email != null ? String(body.email).trim().toLowerCase() : '';
  if (!fullName || !email) {
    return NextResponse.json({ error: 'full_name dan email wajib untuk buat akun baru' }, { status: 400 });
  }
  const passwordHash =
    body.password_hash != null && String(body.password_hash).trim() !== ''
      ? String(body.password_hash).trim()
      : 'hash';
  const schoolId =
    body.school_id != null && body.school_id !== '' ? Number(body.school_id) : null;

  const [dup] = await sql`SELECT id FROM core_users WHERE email = ${email} LIMIT 1`;
  if (dup) {
    return NextResponse.json({ error: 'Email sudah terdaftar; gunakan user_id atau email lain' }, { status: 409 });
  }

  const [user] = await sql`
    INSERT INTO core_users (school_id, full_name, email, password_hash, role)
    VALUES (${schoolId}, ${fullName}, ${email}, ${passwordHash}, 'teacher')
    RETURNING id
  `;
  const newUserId = (user as { id: number }).id;

  const [row] = await sql`
    INSERT INTO core_teachers (user_id, nip, join_date, latest_education)
    VALUES (${newUserId}, ${nip}, ${joinDate}, ${latestEducation})
    RETURNING *
  `;
  return NextResponse.json({ ...row, created_user_id: newUserId }, { status: 201 });
}
