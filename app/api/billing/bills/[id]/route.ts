import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) {
    return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
  }

  const [row] = await sql`
    SELECT
      b.*,
      s.full_name AS student_name,
      s.nis,
      sch.name AS school_name,
      p.name AS product_name,
      p.payment_type,
      ay.name AS academic_year_name,
      (SELECT c.name FROM core_student_class_histories ch
       JOIN core_classes c ON c.id = ch.class_id
       WHERE ch.student_id = s.id AND ch.academic_year_id = b.academic_year_id AND ch.status = 'active'
       LIMIT 1) AS class_name
    FROM tuition_bills b
    JOIN core_students s ON b.student_id = s.id
    JOIN core_schools sch ON s.school_id = sch.id
    JOIN tuition_products p ON b.product_id = p.id
    JOIN core_academic_years ay ON b.academic_year_id = ay.id
    WHERE b.id = ${numId}
  `;

  if (!row) {
    return NextResponse.json({ error: 'Tagihan tidak ditemukan' }, { status: 404 });
  }
  return NextResponse.json(row);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) {
    return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
  }

  const body = (await req.json()) as {
    student_id?: number | string;
    product_id?: number | string;
    academic_year_id?: number | string;
    school_id?: number | string;
    cohort_id?: number | string;
    title?: string;
    total_amount?: string | number;
    due_date?: string | null;
    min_payment?: string | number;
    bill_month?: number | null;
    bill_year?: number | null;
    discount_amount?: string | number;
    paid_amount?: string | number;
    status?: string | null;
    notes?: string | null;
    related_month?: string | null;
  };

  const [existing] = await sql`
    SELECT * FROM tuition_bills WHERE id = ${numId}
  `;
  if (!existing) {
    return NextResponse.json({ error: 'Tagihan tidak ditemukan' }, { status: 404 });
  }

  const paid = parseFloat(String(body.paid_amount !== undefined ? body.paid_amount : (existing.paid_amount ?? '0')));
  if (paid > 0 && body.total_amount !== undefined) {
    const nextTotal = parseFloat(String(body.total_amount));
    if (nextTotal < paid) {
      return NextResponse.json(
        { error: 'Total tidak boleh lebih kecil dari jumlah yang sudah dibayar' },
        { status: 400 }
      );
    }
  }

  const nextStudentId = body.student_id !== undefined ? Number(body.student_id) : existing.student_id;
  const nextProductId = body.product_id !== undefined ? Number(body.product_id) : existing.product_id;
  const nextAYId = body.academic_year_id !== undefined ? Number(body.academic_year_id) : existing.academic_year_id;
  const nextSchoolId = body.school_id !== undefined ? Number(body.school_id) : existing.school_id;
  const nextCohortId = body.cohort_id !== undefined ? Number(body.cohort_id) : existing.cohort_id;

  const nextTitle = body.title !== undefined ? body.title : existing.title;
  const nextTotal =
    body.total_amount !== undefined ? String(body.total_amount) : existing.total_amount;
  const nextDue = body.due_date !== undefined ? body.due_date : existing.due_date;
  const nextMin =
    body.min_payment !== undefined ? String(body.min_payment) : existing.min_payment;
  const nextBillMonth =
    body.bill_month !== undefined ? body.bill_month : existing.bill_month;
  const nextBillYear =
    body.bill_year !== undefined ? body.bill_year : existing.bill_year;
  const nextDiscount =
    body.discount_amount !== undefined ? String(body.discount_amount) : existing.discount_amount;
  const nextPaid =
    body.paid_amount !== undefined ? String(body.paid_amount) : existing.paid_amount;
  const nextStatus =
    body.status !== undefined ? body.status : existing.status;
  const nextNotes =
    body.notes !== undefined ? body.notes : existing.notes;
  const nextRelated =
    body.related_month !== undefined ? body.related_month : existing.related_month;

  const [updated] = await sql`
    UPDATE tuition_bills SET
      student_id = ${nextStudentId},
      product_id = ${nextProductId},
      academic_year_id = ${nextAYId},
      school_id = ${nextSchoolId},
      cohort_id = ${nextCohortId},
      title = ${nextTitle},
      total_amount = ${nextTotal},
      due_date = ${nextDue},
      min_payment = ${nextMin},
      bill_month = ${nextBillMonth},
      bill_year = ${nextBillYear},
      discount_amount = ${nextDiscount},
      paid_amount = ${nextPaid},
      status = ${nextStatus},
      notes = ${nextNotes},
      related_month = ${nextRelated},
      updated_at = NOW()
    WHERE id = ${numId}
    RETURNING *
  `;

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) {
    return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
  }

  const [existing] = await sql`
    SELECT id, paid_amount FROM tuition_bills WHERE id = ${numId}
  `;
  if (!existing) {
    return NextResponse.json({ error: 'Tagihan tidak ditemukan' }, { status: 404 });
  }

  const paid = parseFloat(String(existing.paid_amount ?? '0'));
  if (paid > 0) {
    return NextResponse.json(
      { error: 'Tidak dapat menghapus tagihan yang sudah ada pembayaran' },
      { status: 400 }
    );
  }

  await sql`DELETE FROM tuition_bills WHERE id = ${numId}`;
  return NextResponse.json({ ok: true });
}
