import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const rows = await sql`
    SELECT t.*,
      sub.name_id AS subject_name,
      st.full_name AS student_name,
      st.nis
    FROM academic_adaptive_tests t
    JOIN academic_subjects sub ON sub.id = t.subject_id
    JOIN core_students st ON st.id = t.student_id
    ORDER BY t.id DESC
  `;
  return NextResponse.json(rows);
}
