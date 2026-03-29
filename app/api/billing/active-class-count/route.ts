import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const classId = searchParams.get('class_id');
  const academicYearId = searchParams.get('academic_year_id');
  if (!classId || !academicYearId) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }
  const [row] = await sql`
    SELECT COUNT(*)::int AS c
    FROM core_student_class_histories
    WHERE class_id = ${Number(classId)}
      AND academic_year_id = ${Number(academicYearId)}
      AND status = 'active'
  `;
  return NextResponse.json({ count: row?.c ?? 0 });
}
