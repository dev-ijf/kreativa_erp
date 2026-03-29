import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get('page');
  const moduleId = searchParams.get('module_id');
  const schoolId = searchParams.get('school_id');
  const levelGradeId = searchParams.get('level_grade_id');
  const visible = searchParams.get('is_visible');
  const q = searchParams.get('q')?.trim() ?? '';

  if (!page) {
    const rows = await sql`
      SELECT
        ma.id,
        ma.module_id,
        ma.school_id,
        ma.level_grade_id,
        ma.is_visible,
        m.module_code,
        m.module_name,
        s.name AS school_name,
        lg.name AS level_grade_name
      FROM core_module_access ma
      JOIN core_app_modules m ON ma.module_id = m.id
      LEFT JOIN core_schools s ON ma.school_id = s.id
      LEFT JOIN core_level_grades lg ON ma.level_grade_id = lg.id
      ORDER BY m.module_code, ma.id
    `;
    return NextResponse.json(rows);
  }

  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));
  const pageNum = Math.max(1, Number(page) || 1);
  const offset = (pageNum - 1) * limit;
  const pattern = q ? `%${q}%` : null;
  const mid = moduleId ? Number(moduleId) : null;
  const sid = schoolId ? Number(schoolId) : null;
  const lid = levelGradeId ? Number(levelGradeId) : null;
  const visStr = visible === 'true' || visible === 'false' ? visible : null;

  const [countRows, rows] = await Promise.all([
    sql`
    SELECT COUNT(*)::int AS c
    FROM core_module_access ma
    JOIN core_app_modules m ON ma.module_id = m.id
    LEFT JOIN core_schools s ON ma.school_id = s.id
    LEFT JOIN core_level_grades lg ON ma.level_grade_id = lg.id
    WHERE (${mid}::int IS NULL OR ma.module_id = ${mid})
      AND (${sid}::int IS NULL OR ma.school_id = ${sid})
      AND (${lid}::int IS NULL OR ma.level_grade_id = ${lid})
      AND (${visStr}::text IS NULL OR (${visStr}::text = 'true' AND ma.is_visible = true) OR (${visStr}::text = 'false' AND ma.is_visible = false))
      AND (${pattern}::text IS NULL OR m.module_code ILIKE ${pattern} OR m.module_name ILIKE ${pattern}
        OR COALESCE(s.name, '') ILIKE ${pattern} OR COALESCE(lg.name, '') ILIKE ${pattern})
  `,
    sql`
    SELECT
      ma.id,
      ma.module_id,
      ma.school_id,
      ma.level_grade_id,
      ma.is_visible,
      m.module_code,
      m.module_name,
      s.name AS school_name,
      lg.name AS level_grade_name
    FROM core_module_access ma
    JOIN core_app_modules m ON ma.module_id = m.id
    LEFT JOIN core_schools s ON ma.school_id = s.id
    LEFT JOIN core_level_grades lg ON ma.level_grade_id = lg.id
    WHERE (${mid}::int IS NULL OR ma.module_id = ${mid})
      AND (${sid}::int IS NULL OR ma.school_id = ${sid})
      AND (${lid}::int IS NULL OR ma.level_grade_id = ${lid})
      AND (${visStr}::text IS NULL OR (${visStr}::text = 'true' AND ma.is_visible = true) OR (${visStr}::text = 'false' AND ma.is_visible = false))
      AND (${pattern}::text IS NULL OR m.module_code ILIKE ${pattern} OR m.module_name ILIKE ${pattern}
        OR COALESCE(s.name, '') ILIKE ${pattern} OR COALESCE(lg.name, '') ILIKE ${pattern})
    ORDER BY m.module_code ASC, ma.id ASC
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
  const module_id = Number(b.module_id);
  if (!Number.isFinite(module_id)) {
    return NextResponse.json({ error: 'module_id wajib' }, { status: 400 });
  }
  const school_id =
    b.school_id != null && b.school_id !== '' ? Number(b.school_id) : null;
  const level_grade_id =
    b.level_grade_id != null && b.level_grade_id !== '' ? Number(b.level_grade_id) : null;
  const is_visible = b.is_visible === false ? false : true;

  if (school_id != null && !Number.isFinite(school_id)) {
    return NextResponse.json({ error: 'school_id tidak valid' }, { status: 400 });
  }
  if (level_grade_id != null && !Number.isFinite(level_grade_id)) {
    return NextResponse.json({ error: 'level_grade_id tidak valid' }, { status: 400 });
  }

  try {
    const [row] = await sql`
      INSERT INTO core_module_access (module_id, school_id, level_grade_id, is_visible)
      VALUES (${module_id}, ${school_id}, ${level_grade_id}, ${is_visible})
      RETURNING id, module_id, school_id, level_grade_id, is_visible
    `;
    return NextResponse.json(row, { status: 201 });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === '23505') {
      return NextResponse.json(
        { error: 'Kombinasi modul + sekolah + tingkat sudah ada' },
        { status: 409 }
      );
    }
    throw e;
  }
}
