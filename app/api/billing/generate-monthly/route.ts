import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(req: NextRequest) {
  const { class_id, academic_year_id, product_id } = await req.json();

  try {
    // 1. Get all students in this class
    const students = await sql`
      SELECT student_id 
      FROM core_student_class_histories 
      WHERE class_id = ${class_id} AND academic_year_id = ${academic_year_id} AND status = 'active'
    `;

    if (students.length === 0) {
      return NextResponse.json({ error: 'Tidak ada siswa aktif di kelas ini' }, { status: 400 });
    }

    // 2. We'll generate 12 months from July to June (assuming typical year)
    // Actually using a simple loop to build the batch payload for raw sql
    let billsCreated = 0;
    const months = ['July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June'];
    
    // For raw SQL batching, we will do it serially per student inside a transaction or just simple inserts
    // Note: in a real environment Neon allows transactions via 'sql.begin(async (sql) => {...})' but standard 'neon' function doesn't easily support connection-based transactions out of the box in serverless HTTP mode.
    // For this ERP task, we'll insert them one-by-one or in a simple loop.
    
    // Get product amount - simple mockup amount of 1.5M if we can't get it from products.
    // Actually since we don't have predefined amounts in products in PRD (only category), we will put a base total_amount.
    // Wait, the PRD says 'total_amount DECIMAL(15,2) NOT NULL' in bills. We will assume 1,000,000 for standard SPP.

    for (const student of students) {
      for (const month of months) {
        const title = `SPP ${month}`;
        
        // Simple deduplication check in this mock
        const existing = await sql`
          SELECT id FROM tuition_bills 
          WHERE student_id=${student.student_id} AND product_id=${product_id} 
          AND academic_year_id=${academic_year_id} AND title=${title} LIMIT 1
        `;

        if (existing.length === 0) {
          await sql`
            INSERT INTO tuition_bills (student_id, product_id, academic_year_id, title, total_amount, paid_amount, status)
            VALUES (${student.student_id}, ${product_id}, ${academic_year_id}, ${title}, 1500000, 0, 'unpaid')
          `;
          billsCreated++;
        }
      }
    }

    return NextResponse.json({ success: true, students_processed: students.length, bills_created: billsCreated });
  } catch (err: any) {
    console.error('Billing gen err', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
