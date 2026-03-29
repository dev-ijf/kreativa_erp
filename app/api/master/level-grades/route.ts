import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const rows = await sql`
    SELECT lg.*, s.name as school_name 
    FROM core_level_grades lg
    JOIN core_schools s ON lg.school_id = s.id
    ORDER BY s.name ASC, lg.level_order ASC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { school_id, name, level_order, is_terminal } = await req.json();
  const [row] = await sql`
    INSERT INTO core_level_grades (school_id, name, level_order, is_terminal) 
    VALUES (${school_id}, ${name}, ${level_order}, ${Boolean(is_terminal)}) RETURNING *
  `;
  return NextResponse.json(row, { status: 201 });
}
