import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get('school_id');

  const rows = schoolId
    ? await sql`
        SELECT c.*, s.name as school_name
        FROM core_cohorts c
        JOIN core_schools s ON c.school_id = s.id
        WHERE c.school_id = ${Number(schoolId)}
        ORDER BY c.id DESC
      `
    : await sql`
        SELECT c.*, s.name as school_name
        FROM core_cohorts c
        JOIN core_schools s ON c.school_id = s.id
        ORDER BY s.name ASC, c.id DESC
      `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  try {
    const [row] = await sql`
      INSERT INTO core_cohorts (school_id, name)
      VALUES (${data.school_id}, ${data.name})
      RETURNING *
    `;
    return NextResponse.json(row, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error saving cohort';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
