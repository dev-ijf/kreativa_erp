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
      SELECT c.school_id, c.level_grade_id
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

    const [tariff] = await sql`
      SELECT amount FROM tuition_product_tariffs
      WHERE school_id = ${cls.school_id}
        AND product_id = ${Number(product_id)}
        AND academic_year_id = ${Number(academic_year_id)}
        AND level_grade_id = ${cls.level_grade_id}
      LIMIT 1
    `;
    if (!tariff) {
      return NextResponse.json(
        {
          error:
            'Tarif tidak ditemukan untuk kombinasi sekolah, produk, tahun ajaran, dan tingkat kelas ini. Atur di Matriks Tarif.',
        },
        { status: 400 }
      );
    }

    const amount = tariff.amount;

    const students = await sql`
      SELECT student_id
      FROM core_student_class_histories
      WHERE class_id = ${Number(class_id)}
        AND academic_year_id = ${Number(academic_year_id)}
        AND status = 'active'
    `;

    if (students.length === 0) {
      return NextResponse.json({ error: 'Tidak ada siswa aktif di kelas ini' }, { status: 400 });
    }

    let billsCreated = 0;

    for (const student of students) {
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

    return NextResponse.json({
      success: true,
      students_processed: students.length,
      bills_created: billsCreated,
      unit_amount: amount,
    });
  } catch (err: unknown) {
    console.error('Billing gen err', err);
    const message = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
