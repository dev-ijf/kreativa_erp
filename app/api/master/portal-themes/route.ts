import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get('page');
  const q = (searchParams.get('q') || '').trim();

  if (!page) {
    if (q) {
      const like = '%' + q + '%';
      const rows = await sql`
        SELECT id, host_domain, portal_title, logo_url, primary_color, login_bg_url, favicon_url, welcome_text, created_at, updated_at
        FROM core_portal_themes
        WHERE host_domain ILIKE ${like} OR portal_title ILIKE ${like}
        ORDER BY id
      `;
      return NextResponse.json(rows);
    }
    const rows = await sql`
      SELECT id, host_domain, portal_title, logo_url, primary_color, login_bg_url, favicon_url, welcome_text, created_at, updated_at
      FROM core_portal_themes ORDER BY id
    `;
    return NextResponse.json(rows);
  }

  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));
  const pageNum = Math.max(1, Number(page) || 1);
  const offset = (pageNum - 1) * limit;
  const pattern = q ? '%' + q + '%' : null;

  const [countRows, rows] = await Promise.all([
    sql`
    SELECT COUNT(*)::int AS c FROM core_portal_themes
    WHERE (${pattern}::text IS NULL OR host_domain ILIKE ${pattern} OR portal_title ILIKE ${pattern})
  `,
    sql`
    SELECT id, host_domain, portal_title, logo_url, primary_color, login_bg_url, favicon_url, welcome_text, created_at, updated_at
    FROM core_portal_themes
    WHERE (${pattern}::text IS NULL OR host_domain ILIKE ${pattern} OR portal_title ILIKE ${pattern})
    ORDER BY id ASC
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
  const favicon_url =
    b.favicon_url != null && String(b.favicon_url).trim() !== '' ? String(b.favicon_url).trim() : null;
  const welcome_text =
    b.welcome_text != null && String(b.welcome_text).trim() !== '' ? String(b.welcome_text).trim() : null;

  try {
    const [row] = await sql`
      INSERT INTO core_portal_themes (host_domain, portal_title, logo_url, primary_color, login_bg_url, favicon_url, welcome_text)
      VALUES (${host_domain}, ${portal_title}, ${logo_url}, ${primary_color}, ${login_bg_url}, ${favicon_url}, ${welcome_text})
      RETURNING id, host_domain, portal_title, logo_url, primary_color, login_bg_url, favicon_url, welcome_text, created_at, updated_at
    `;
    return NextResponse.json(row, { status: 201 });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === '23505') {
      return NextResponse.json({ error: 'host_domain sudah terdaftar' }, { status: 409 });
    }
    throw e;
  }
}
