import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import {
  insertSppMonthBill,
  parseAcademicYearStartYear,
  SPP_MONTHS,
} from '@/lib/billing-spp';

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

    const startYear = parseAcademicYearStartYear(String(ay.name));
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

    const cohortIds = [...new Set(students.map((s) => s.cohort_id))];

    const tariffs = await sql`
      SELECT cohort_id, amount, min_payment
      FROM tuition_product_tariffs
      WHERE school_id = ${cls.school_id}
        AND product_id = ${Number(product_id)}
        AND academic_year_id = ${Number(academic_year_id)}
        AND cohort_id = ANY(${cohortIds}::int[])
    `;

    const tariffMap = new Map(
      tariffs.map((t) => [
        t.cohort_id,
        { amount: t.amount, minPayment: String(t.min_payment ?? 0) },
      ])
    );

    let billsCreated = 0;
    let studentsProcessed = 0;

    for (const student of students) {
      const slot = tariffMap.get(student.cohort_id);

      if (slot == null) continue;

      studentsProcessed++;

      for (const month of SPP_MONTHS) {
        const { created } = await insertSppMonthBill(
          student.student_id,
          Number(product_id),
          Number(academic_year_id),
          month,
          startYear,
          slot.amount,
          slot.minPayment
        );
        if (created) billsCreated++;
      }
    }

    if (studentsProcessed === 0) {
      return NextResponse.json(
        {
          error:
            'Tidak ada siswa yang diproses. Pastikan tagihan untuk angkatan siswa di kelas ini sudah diatur di Matriks Tarif.',
        },
        { status: 400 }
      );
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
