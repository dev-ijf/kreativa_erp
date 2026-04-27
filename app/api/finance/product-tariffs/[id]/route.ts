import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const minPay =
    data.min_payment != null && data.min_payment !== '' ? Number(data.min_payment) : 0;
  const [row] = await sql`
    UPDATE tuition_product_tariffs SET
      school_id=${data.school_id},
      product_id=${data.product_id},
      academic_year_id=${data.academic_year_id},
      cohort_id=${data.cohort_id},
      amount=${data.amount},
      min_payment=${minPay},
      updated_at=NOW()
    WHERE id=${Number(id)} RETURNING *
  `;
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await sql`DELETE FROM tuition_product_tariffs WHERE id=${Number(id)}`;
  return NextResponse.json({ success: true });
}
