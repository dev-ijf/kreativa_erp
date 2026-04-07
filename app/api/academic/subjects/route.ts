import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const rows = await sql`SELECT * FROM academic_subjects ORDER BY id`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b?.name_en || !b?.name_id) {
    return NextResponse.json({ error: 'name_en dan name_id wajib' }, { status: 400 });
  }
  const code = b?.code != null ? String(b.code).trim() || null : null;
  const color = b?.color_theme != null ? String(b.color_theme).trim() || null : null;
  const [row] = await sql`
    INSERT INTO academic_subjects (code, name_en, name_id, color_theme)
    VALUES (${code}, ${String(b!.name_en)}, ${String(b!.name_id)}, ${color})
    RETURNING *
  `;
  return NextResponse.json(row, { status: 201 });
}
