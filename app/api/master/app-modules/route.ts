import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get('page');
  const q = searchParams.get('q')?.trim() ?? '';

  if (!page) {
    const rows = q
      ? await sql`
          SELECT id, module_code, module_name FROM core_app_modules
          WHERE module_code ILIKE ${'%' + q + '%'} OR module_name ILIKE ${'%' + q + '%'}
          ORDER BY module_code
        `
      : await sql`SELECT id, module_code, module_name FROM core_app_modules ORDER BY module_code`;
    return NextResponse.json(rows);
  }

  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));
  const pageNum = Math.max(1, Number(page) || 1);
  const offset = (pageNum - 1) * limit;
  const pattern = q ? `%${q}%` : null;

  const [countRows, rows] = await Promise.all([
    sql`
    SELECT COUNT(*)::int AS c FROM core_app_modules
    WHERE (${pattern}::text IS NULL OR module_code ILIKE ${pattern} OR module_name ILIKE ${pattern})
  `,
    sql`
    SELECT id, module_code, module_name FROM core_app_modules
    WHERE (${pattern}::text IS NULL OR module_code ILIKE ${pattern} OR module_name ILIKE ${pattern})
    ORDER BY module_code ASC
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
  const module_code = String(b.module_code ?? '').trim();
  const module_name = String(b.module_name ?? '').trim();
  if (!module_code || !module_name) {
    return NextResponse.json({ error: 'module_code dan module_name wajib' }, { status: 400 });
  }
  try {
    const [row] = await sql`
      INSERT INTO core_app_modules (module_code, module_name)
      VALUES (${module_code.slice(0, 50)}, ${module_name.slice(0, 100)})
      RETURNING id, module_code, module_name
    `;
    return NextResponse.json(row, { status: 201 });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === '23505') {
      return NextResponse.json({ error: 'module_code sudah ada' }, { status: 409 });
    }
    throw e;
  }
}
