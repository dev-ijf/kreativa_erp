import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const rows = await sql`
    SELECT h.*, s.full_name AS student_name, s.nis
    FROM academic_habits h
    JOIN core_students s ON s.id = h.student_id
    ORDER BY h.habit_date DESC, h.id DESC
  `;
  return NextResponse.json(rows);
}
