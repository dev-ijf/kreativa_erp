import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

function schoolFilterParts(raw: string | null) {
  if (!raw || raw === '') {
    return { mode: 'all' as const, sid: 0 };
  }
  if (raw === '__global__') {
    return { mode: 'global' as const, sid: 0 };
  }
  const sid = Number(raw);
  if (!Number.isFinite(sid)) {
    return { mode: 'all' as const, sid: 0 };
  }
  return { mode: 'school' as const, sid };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get('page');
  const q = (searchParams.get('q') || '').trim();
  const { mode: schoolMode, sid: sidNum } = schoolFilterParts(searchParams.get('school_id'));

  if (!page) {
    const like = q ? '%' + q + '%' : null;
    const rows = await sql`
      SELECT cs.id, cs.school_id, cs.setting_key, cs.setting_value, cs.description, cs.created_at, cs.updated_at,
        s.name AS school_name
      FROM core_settings cs
      LEFT JOIN core_schools s ON cs.school_id = s.id
      WHERE (${like}::text IS NULL OR cs.setting_key ILIKE ${like} OR COALESCE(cs.setting_value, '') ILIKE ${like}
        OR COALESCE(cs.description, '') ILIKE ${like})
        AND (
          (${schoolMode}::text = 'all')
          OR (${schoolMode}::text = 'global' AND cs.school_id IS NULL)
          OR (${schoolMode}::text = 'school' AND cs.school_id = ${sidNum})
        )
      ORDER BY cs.school_id NULLS FIRST, cs.setting_key
    `;
    return NextResponse.json(rows);
  }

  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));
  const pageNum = Math.max(1, Number(page) || 1);
  const offset = (pageNum - 1) * limit;
  const pattern = q ? '%' + q + '%' : null;

  const [countRows, rows] = await Promise.all([
    sql`
    SELECT COUNT(*)::int AS c FROM core_settings cs
    WHERE (${pattern}::text IS NULL OR cs.setting_key ILIKE ${pattern} OR COALESCE(cs.setting_value, '') ILIKE ${pattern}
      OR COALESCE(cs.description, '') ILIKE ${pattern})
      AND (
        (${schoolMode}::text = 'all')
        OR (${schoolMode}::text = 'global' AND cs.school_id IS NULL)
        OR (${schoolMode}::text = 'school' AND cs.school_id = ${sidNum})
      )
  `,
    sql`
    SELECT cs.id, cs.school_id, cs.setting_key, cs.setting_value, cs.description, cs.created_at, cs.updated_at,
      s.name AS school_name
    FROM core_settings cs
    LEFT JOIN core_schools s ON cs.school_id = s.id
    WHERE (${pattern}::text IS NULL OR cs.setting_key ILIKE ${pattern} OR COALESCE(cs.setting_value, '') ILIKE ${pattern}
      OR COALESCE(cs.description, '') ILIKE ${pattern})
      AND (
        (${schoolMode}::text = 'all')
        OR (${schoolMode}::text = 'global' AND cs.school_id IS NULL)
        OR (${schoolMode}::text = 'school' AND cs.school_id = ${sidNum})
      )
    ORDER BY cs.school_id NULLS FIRST, cs.setting_key
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
      INSERT INTO core_settings (school_id, setting_key, setting_value, description)
      VALUES (${school_id}, ${setting_key.slice(0, 100)}, ${setting_value}, ${description})
      RETURNING id, school_id, setting_key, setting_value, description, created_at, updated_at
    `;
    return NextResponse.json(row, { status: 201 });
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
