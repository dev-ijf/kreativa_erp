import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const rows = await sql`
    SELECT t.*,
      p.is_installment AS product_is_installment,
      s.name AS school_name,
      p.name AS product_name,
      ay.name AS academic_year_name,
      c.name AS cohort_name
    FROM tuition_product_tariffs t
    JOIN core_schools s ON t.school_id = s.id
    JOIN tuition_products p ON t.product_id = p.id
    JOIN core_academic_years ay ON t.academic_year_id = ay.id
    JOIN core_cohorts c ON t.cohort_id = c.id
    ORDER BY s.name, ay.name, c.name, p.name
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    school_id,
    product_id,
    academic_year_id,
    cohort_id,
    amount,
    min_payment,
  } = body;
  const minPay = min_payment != null && min_payment !== '' ? Number(min_payment) : 0;
  const [row] = await sql`
    INSERT INTO tuition_product_tariffs (
      school_id, product_id, academic_year_id, cohort_id, amount, min_payment
    ) VALUES (
      ${school_id}, ${product_id}, ${academic_year_id}, ${cohort_id}, ${amount}, ${minPay}
    )
    ON CONFLICT ON CONSTRAINT unique_tariff_matrix
    DO UPDATE SET
      amount = EXCLUDED.amount,
      min_payment = EXCLUDED.min_payment,
      updated_at = NOW()
    RETURNING *
  `;
  return NextResponse.json(row, { status: 201 });
}
