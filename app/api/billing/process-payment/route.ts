import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(req: NextRequest) {
  const { billIds, payAmount, methodCode, userId, academicYearId } = await req.json();

  if (!billIds || billIds.length === 0) {
    return NextResponse.json({ error: 'No bills selected' }, { status: 400 });
  }

  try {
    const bills = await sql`
      SELECT b.id, b.total_amount, b.paid_amount, b.student_id, b.product_id, b.academic_year_id
      FROM tuition_bills b
      WHERE b.id = ANY(${billIds})
    `;

    if (bills.length === 0) {
      return NextResponse.json({ error: 'Tagihan tidak ditemukan' }, { status: 400 });
    }

    let totalOwed = 0;
    for (const b of bills) {
      totalOwed += Number(b.total_amount) - Number(b.paid_amount);
    }

    if (payAmount < totalOwed) {
      return NextResponse.json(
        { error: 'Nominal kurang dari total tagihan terpilih' },
        { status: 400 }
      );
    }

    const uid = userId ?? 1;
    const ayId = academicYearId ?? bills[0].academic_year_id;

    const [pm] = await sql`
      SELECT id FROM tuition_payment_methods
      WHERE code = ${methodCode || 'BCA_TF'}
      LIMIT 1
    `;
    const paymentMethodId = pm?.id ?? null;

    const referenceNo = `TRX-${Date.now()}`;
    const createdAt = new Date();

    const [tx] = await sql`
      INSERT INTO tuition_transactions (
        user_id,
        academic_year_id,
        reference_no,
        total_amount,
        payment_method_id,
        status,
        payment_date,
        created_at
      )
      VALUES (
        ${uid},
        ${ayId},
        ${referenceNo},
        ${totalOwed},
        ${paymentMethodId},
        'success',
        NOW(),
        ${createdAt}
      )
      RETURNING id, created_at
    `;

    const txId = tx.id as number;
    const txCreatedAt = tx.created_at as Date;

    for (const b of bills) {
      const paid = Number(b.total_amount) - Number(b.paid_amount);
      await sql`
        INSERT INTO tuition_transaction_details (
          transaction_id,
          transaction_created_at,
          bill_id,
          product_id,
          amount_paid,
          created_at
        )
        VALUES (
          ${txId},
          ${txCreatedAt},
          ${b.id},
          ${b.product_id},
          ${paid},
          ${createdAt}
        )
      `;

      await sql`
        UPDATE tuition_bills
        SET
          paid_amount = total_amount,
          status = 'paid',
          updated_at = NOW()
        WHERE id = ${b.id}
      `;
    }

    return NextResponse.json({
      success: true,
      transaction_id: txId,
      transaction_created_at: txCreatedAt,
      reference_no: referenceNo,
    });
  } catch (error: unknown) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
