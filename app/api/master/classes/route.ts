import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const rows = await sql`
    SELECT c.*, s.name as school_name, lg.name as level_name 
    FROM core_classes c
    JOIN core_schools s ON c.school_id = s.id
    JOIN core_level_grades lg ON c.level_grade_id = lg.id
    ORDER BY s.name ASC, lg.level_order ASC, c.name ASC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { school_id, level_grade_id, name } = await req.json();
  const [row] = await sql`
    INSERT INTO core_classes (school_id, level_grade_id, name) 
    VALUES (${school_id}, ${level_grade_id}, ${name}) RETURNING *
  `;
  return NextResponse.json(row, { status: 201 });
}
