import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const rows = await sql`SELECT * FROM academic_semesters ORDER BY id`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b?.academic_year || !b?.semester_label) {
    return NextResponse.json({ error: 'academic_year dan semester_label wajib' }, { status: 400 });
  }
  const isActive = Boolean(b?.is_active);
  const [row] = await sql`
    INSERT INTO academic_semesters (academic_year, semester_label, is_active)
    VALUES (${String(b!.academic_year)}, ${String(b!.semester_label)}, ${isActive})
    RETURNING *
  `;
  return NextResponse.json(row, { status: 201 });
}
