import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { hashPassword } from '@/lib/password';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get('page');
  const q = (searchParams.get('q') || '').trim();
  const schoolId = searchParams.get('school_id');
  const role = searchParams.get('role');

  if (!page) {
    const like = q ? '%' + q + '%' : null;
    const sid = schoolId ? Number(schoolId) : null;
    const roleF = role && role !== '' ? role : null;
    const rows = await sql`
      SELECT u.id, u.school_id, u.full_name, u.email, u.phone, u.role, u.created_at,
        s.name AS school_name
      FROM core_users u
      LEFT JOIN core_schools s ON u.school_id = s.id
      WHERE (${like}::text IS NULL OR u.full_name ILIKE ${like} OR u.email ILIKE ${like} OR COALESCE(u.phone, '') ILIKE ${like})
        AND (${sid}::int IS NULL OR u.school_id = ${sid})
        AND (${roleF}::text IS NULL OR u.role = ${roleF})
      ORDER BY u.id
    `;
    return NextResponse.json(rows);
  }

  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));
  const pageNum = Math.max(1, Number(page) || 1);
  const offset = (pageNum - 1) * limit;
  const pattern = q ? '%' + q + '%' : null;
  const sid = schoolId ? Number(schoolId) : null;
  const roleF = role && role !== '' ? role : null;

  const [countRows, rows] = await Promise.all([
    sql`
    SELECT COUNT(*)::int AS c FROM core_users u
    WHERE (${pattern}::text IS NULL OR u.full_name ILIKE ${pattern} OR u.email ILIKE ${pattern}
      OR COALESCE(u.phone, '') ILIKE ${pattern})
      AND (${sid}::int IS NULL OR u.school_id = ${sid})
      AND (${roleF}::text IS NULL OR u.role = ${roleF})
  `,
    sql`
    SELECT u.id, u.school_id, u.full_name, u.email, u.phone, u.role, u.created_at,
      s.name AS school_name
    FROM core_users u
    LEFT JOIN core_schools s ON u.school_id = s.id
    WHERE (${pattern}::text IS NULL OR u.full_name ILIKE ${pattern} OR u.email ILIKE ${pattern}
      OR COALESCE(u.phone, '') ILIKE ${pattern})
      AND (${sid}::int IS NULL OR u.school_id = ${sid})
      AND (${roleF}::text IS NULL OR u.role = ${roleF})
    ORDER BY u.id ASC
    LIMIT ${limit} OFFSET ${offset}
  `,
  ]);
  const total = Number(countRows[0]?.c ?? 0);

  return NextResponse.json({
    data: rows,
    page: pageNum,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  });
}

export async function POST(req: NextRequest) {
  const b = await req.json();
  const full_name = String(b.full_name ?? '').trim();
  const email = String(b.email ?? '').trim().toLowerCase();
  const password = String(b.password ?? '');
  const phone = b.phone != null && String(b.phone).trim() !== '' ? String(b.phone).trim().slice(0, 20) : null;
  const role = String(b.role ?? '').trim();
  const school_id =
    b.school_id != null && b.school_id !== '' ? Number(b.school_id) : null;

  if (!full_name || !email || !password || password.length < 6) {
    return NextResponse.json(
      { error: 'Nama, email, dan password (min. 6 karakter) wajib' },
      { status: 400 }
    );
  }
  if (!role) {
    return NextResponse.json({ error: 'Peran wajib diisi' }, { status: 400 });
  }

  const password_hash = hashPassword(password);

  try {
    const [row] = await sql`
      INSERT INTO core_users (school_id, full_name, email, password_hash, phone, role)
      VALUES (${school_id}, ${full_name}, ${email}, ${password_hash}, ${phone}, ${role})
      RETURNING id, school_id, full_name, email, phone, role, created_at
    `;
    return NextResponse.json(row, { status: 201 });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === '23505') {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 });
    }
    throw e;
  }
}
