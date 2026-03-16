import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const class_id = searchParams.get('class_id');
  const academic_year_id = searchParams.get('academic_year_id');

  if (!class_id || !academic_year_id) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  try {
    // 1. Get all students in the class
    const students = await sql`
      SELECT s.id, s.full_name, s.nis 
      FROM core_student_class_histories ch
      JOIN core_students s ON ch.student_id = s.id
      WHERE ch.class_id = ${Number(class_id)} 
        AND ch.academic_year_id = ${Number(academic_year_id)}
        AND ch.status = 'active'
      ORDER BY s.full_name
    `;

    // 2. Get all SPP bills for these students for the given academic year
    // We filter by title containing 'SPP' to identify monthly bills
    const studentIds = students.length > 0 ? students.map(s => s.id) : [0];
    const stdFilter = `(${studentIds.join(',')})`;
    const bills = await sql.query(`
      SELECT student_id, title, status, total_amount, paid_amount 
      FROM tuition_bills 
      WHERE academic_year_id = $1 
        AND student_id IN ${stdFilter}
        AND title LIKE 'SPP %'
    `, [Number(academic_year_id)]);

    // 3. Format matrix response
    const matrix = students.map(student => {
      const studentBills = bills.rows.filter(b => b.student_id === student.id);
      
      const months: Record<string, string> = {
        July: 'unpaid', August: 'unpaid', September: 'unpaid', October: 'unpaid', 
        November: 'unpaid', December: 'unpaid', January: 'unpaid', February: 'unpaid', 
        March: 'unpaid', April: 'unpaid', May: 'unpaid', June: 'unpaid'
      };

      let arrears = 0;

      for (const b of studentBills) {
        // extract month from title (e.g., 'SPP July')
        const parts = b.title.split(' ');
        if (parts.length > 1) {
          const m = parts[1];
          months[m] = b.status; // 'paid', 'partial', 'unpaid'
          
          if (b.status === 'unpaid' || b.status === 'partial') {
            arrears += (parseFloat(b.total_amount) - parseFloat(b.paid_amount));
          }
        }
      }

      return {
        student_id: student.id,
        student_name: student.full_name,
        nis: student.nis,
        months,
        arrears
      };
    });

    return NextResponse.json(matrix);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
