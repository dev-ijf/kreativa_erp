import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const rows = await sql`
    SELECT s.*, sch.name as school_name
    FROM core_students s
    LEFT JOIN core_schools sch ON s.school_id = sch.id
    ORDER BY s.id DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const [row] = await sql`
    INSERT INTO core_students (
      school_id, full_name, nis, nisn, gender, date_of_birth, phone, address
    ) VALUES (
      ${data.school_id}, ${data.full_name}, ${data.nis}, ${data.nisn || null}, 
      ${data.gender}, ${data.date_of_birth || null}, ${data.phone || null}, ${data.address || null}
    ) RETURNING *
  `;
  return NextResponse.json(row, { status: 201 });
}
