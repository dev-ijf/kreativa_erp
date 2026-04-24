import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const habitDateRaw = req.nextUrl.searchParams.get('habit_date')?.trim();
  const habitDate =
    habitDateRaw && habitDateRaw.length >= 10 ? habitDateRaw.slice(0, 10) : null;

  const [row] = habitDate
    ? await sql`
        SELECT h.*, s.full_name AS student_name, s.nis
        FROM academic_habits h
        JOIN core_students s ON s.id = h.student_id
        WHERE h.id = ${Number(id)} AND h.habit_date = ${habitDate}::date
      `
    : await sql`
        SELECT h.*, s.full_name AS student_name, s.nis
        FROM academic_habits h
        JOIN core_students s ON s.id = h.student_id
        WHERE h.id = ${Number(id)}
      `;
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}
