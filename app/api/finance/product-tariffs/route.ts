import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const rows = await sql`
    SELECT t.*,
      s.name AS school_name,
      p.name AS product_name,
      ay.name AS academic_year_name,
      lg.name AS level_grade_name
    FROM tuition_product_tariffs t
    JOIN core_schools s ON t.school_id = s.id
    JOIN tuition_products p ON t.product_id = p.id
    JOIN core_academic_years ay ON t.academic_year_id = ay.id
    JOIN core_level_grades lg ON t.level_grade_id = lg.id
    ORDER BY s.name, ay.name, lg.level_order, p.name
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    school_id,
    product_id,
    academic_year_id,
    level_grade_id,
    amount,
  } = body;
  const [row] = await sql`
    INSERT INTO tuition_product_tariffs (
      school_id, product_id, academic_year_id, level_grade_id, amount
    ) VALUES (
      ${school_id}, ${product_id}, ${academic_year_id}, ${level_grade_id}, ${amount}
    )
    ON CONFLICT ON CONSTRAINT unique_tariff_matrix
    DO UPDATE SET amount = EXCLUDED.amount, updated_at = NOW()
    RETURNING *
  `;
  return NextResponse.json(row, { status: 201 });
}
