import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

const MONTHS = [
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
] as const;

function billYearForMonth(monthName: string, academicYearStart: number): number {
  const idx = MONTHS.indexOf(monthName as (typeof MONTHS)[number]);
  if (idx < 0) return academicYearStart;
  return idx < 6 ? academicYearStart : academicYearStart + 1;
}

function billMonthNumber(monthName: string): number {
  const m: Record<string, number> = {
    January: 1,
    February: 2,
    March: 3,
    April: 4,
    May: 5,
    June: 6,
    July: 7,
    August: 8,
    September: 9,
    October: 10,
    November: 11,
    December: 12,
  };
  return m[monthName] ?? 1;
}

export async function POST(req: NextRequest) {
  const { class_id, academic_year_id, product_id } = await req.json();

  try {
    const [cls] = await sql`
      SELECT c.school_id
      FROM core_classes c
      WHERE c.id = ${Number(class_id)}
    `;
    if (!cls) {
      return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 400 });
    }

    const [ay] = await sql`
      SELECT id, name FROM core_academic_years WHERE id = ${Number(academic_year_id)}
    `;
    if (!ay) {
      return NextResponse.json({ error: 'Tahun ajaran tidak ditemukan' }, { status: 400 });
    }

    const startYear = parseInt(String(ay.name).split('/')[0]?.trim() || '0', 10);
    if (!startYear) {
      return NextResponse.json({ error: 'Format tahun ajaran tidak valid' }, { status: 400 });
    }

    const students = await sql`
      SELECT ch.student_id, s.cohort_id
      FROM core_student_class_histories ch
      JOIN core_students s ON ch.student_id = s.id
      WHERE ch.class_id = ${Number(class_id)}
        AND ch.academic_year_id = ${Number(academic_year_id)}
        AND ch.status = 'active'
    `;

    if (students.length === 0) {
      return NextResponse.json({ error: 'Tidak ada siswa aktif di kelas ini' }, { status: 400 });
    }

    // Get unique cohorts in this class
    const cohortIds = [...new Set(students.map((s) => s.cohort_id))];

    // Fetch tariffs for these cohorts
    const tariffs = await sql`
      SELECT cohort_id, amount 
      FROM tuition_product_tariffs
      WHERE school_id = ${cls.school_id}
        AND product_id = ${Number(product_id)}
        AND academic_year_id = ${Number(academic_year_id)}
        AND cohort_id = ANY(${cohortIds}::int[])
    `;

    const tariffMap = new Map(tariffs.map((t) => [t.cohort_id, t.amount]));

    let billsCreated = 0;
    let studentsProcessed = 0;

    for (const student of students) {
      const amount = tariffMap.get(student.cohort_id);
      
      // If a student's cohort does not have a tariff, we log/skip them, but still process others
      // Alternatively, we could fail the entire process if strict consistency is needed. 
      // For now, we skip generating bills for students without matching tariff matrices.
      if (amount == null) continue;
      
      studentsProcessed++;

      for (const month of MONTHS) {
        const title = `SPP ${month}`;
        const billYear = billYearForMonth(month, startYear);
        const billMonth = billMonthNumber(month);

        const existing = await sql`
          SELECT id FROM tuition_bills
          WHERE student_id = ${student.student_id}
            AND product_id = ${Number(product_id)}
            AND academic_year_id = ${Number(academic_year_id)}
            AND title = ${title}
          LIMIT 1
        `;

        if (existing.length === 0) {
          await sql`
            INSERT INTO tuition_bills (
              student_id, product_id, academic_year_id, title,
              total_amount, paid_amount, status,
              bill_month, bill_year, related_month
            )
            VALUES (
              ${student.student_id},
              ${Number(product_id)},
              ${Number(academic_year_id)},
              ${title},
              ${amount},
              0,
              'unpaid',
              ${billMonth},
              ${billYear},
              ${`${billYear}-${String(billMonth).padStart(2, '0')}-01`}
            )
          `;
          billsCreated++;
        }
      }
    }

    if (studentsProcessed === 0) {
      return NextResponse.json({ 
        error: 'Tidak ada siswa yang diproses. Pastikan tagihan untuk angkatan siswa di kelas ini sudah diatur di Matriks Tarif.' 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      students_processed: studentsProcessed,
      students_skipped: students.length - studentsProcessed,
      bills_created: billsCreated,
    });
  } catch (err: unknown) {
    console.error('Billing gen err', err);
    const message = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
