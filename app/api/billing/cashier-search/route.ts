import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  
  if (!q) return NextResponse.json({ error: 'Missing query' }, { status: 400 });

  try {
    // Attempt to find student by NIS or Name
    const [student] = await sql`
      SELECT s.*, c.name as class_name
      FROM core_students s
      LEFT JOIN core_student_class_histories ch ON ch.student_id = s.id AND ch.status = 'active'
      LEFT JOIN core_classes c ON ch.class_id = c.id
      WHERE s.nis = ${q} OR s.full_name ILIKE ${'%' + q + '%'}
      LIMIT 1
    `;

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Get unpaid/partial bills
    const bills = await sql`
      SELECT b.*, p.name as product_name
      FROM tuition_bills b
      LEFT JOIN tuition_products p ON b.product_id = p.id
      WHERE b.student_id = ${student.id} AND b.status IN ('unpaid', 'partial')
      ORDER BY b.created_at ASC
    `;

    return NextResponse.json({ student, bills });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
