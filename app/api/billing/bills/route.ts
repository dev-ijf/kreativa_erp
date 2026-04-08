import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { resolveTariffAmount } from '@/lib/billing-tariff';
import { generateSpp12ForStudent, parseAcademicYearStartYear } from '@/lib/billing-spp';
import { insertOneBillForProductType } from '@/lib/billing-insert-product-type';
import {
  countTuitionBills,
  parseBillListSearchParams,
  selectTuitionBills,
} from '@/lib/billing-bills-query';

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const filters = parseBillListSearchParams(sp);
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(sp.get('limit') || '20', 10)));
  const offset = (page - 1) * limit;

  try {
    const [total, rows] = await Promise.all([
      countTuitionBills(filters),
      selectTuitionBills(filters, limit, offset),
    ]);
    return NextResponse.json({
      data: rows,
      total,
      page,
      limit,
      total_pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (e: unknown) {
    console.error(e);
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

type CreateMode =
  | 'single'
  | 'class_single_period'
  | 'spp_12_student'
  | 'spp_12_class';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const mode = body.mode as CreateMode;

  try {
    if (mode === 'spp_12_class') {
      return await handleSpp12Class(body);
    }
    if (mode === 'spp_12_student') {
      return await handleSpp12Student(body);
    }
    if (mode === 'class_single_period') {
      return await handleClassSinglePeriod(body);
    }
    if (mode === 'single') {
      return await handleSingle(body);
    }
    return NextResponse.json({ error: 'mode tidak dikenal' }, { status: 400 });
  } catch (e: unknown) {
    console.error(e);
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleSpp12Class(body: Record<string, unknown>) {
  const class_id = Number(body.class_id);
  const academic_year_id = Number(body.academic_year_id);
  const product_id = Number(body.product_id);
  if (![class_id, academic_year_id, product_id].every((n) => Number.isFinite(n))) {
    return NextResponse.json({ error: 'class_id, academic_year_id, product_id wajib' }, { status: 400 });
  }

  const [cls] = await sql`
    SELECT c.school_id FROM core_classes c WHERE c.id = ${class_id}
  `;
  if (!cls) {
    return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 400 });
  }

  const [ay] = await sql`
    SELECT id, name FROM core_academic_years WHERE id = ${academic_year_id}
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
    WHERE ch.class_id = ${class_id}
      AND ch.academic_year_id = ${academic_year_id}
      AND ch.status = 'active'
  `;

  if (students.length === 0) {
    return NextResponse.json({ error: 'Tidak ada siswa aktif di kelas ini' }, { status: 400 });
  }

  const cohortIds = [...new Set(students.map((s) => s.cohort_id))];
  const tariffs = await sql`
    SELECT cohort_id, amount 
    FROM tuition_product_tariffs
    WHERE school_id = ${cls.school_id}
      AND product_id = ${product_id}
      AND academic_year_id = ${academic_year_id}
      AND cohort_id = ANY(${cohortIds}::int[])
  `;
  const tariffMap = new Map(tariffs.map((t) => [t.cohort_id, t.amount]));

  let bills_created = 0;
  let students_processed = 0;

  for (const student of students) {
    const amount = tariffMap.get(student.cohort_id);
    if (amount == null) continue;
    students_processed++;
    const r = await generateSpp12ForStudent(
      student.student_id,
      product_id,
      academic_year_id,
      startYear,
      amount
    );
    bills_created += r.bills_created;
  }

  if (students_processed === 0) {
    return NextResponse.json(
      {
        error:
          'Tidak ada siswa yang diproses. Pastikan tarif angkatan di Matriks Tarif sudah diatur.',
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    students_processed,
    students_skipped: students.length - students_processed,
    bills_created,
  });
}

async function handleSpp12Student(body: Record<string, unknown>) {
  const student_id = Number(body.student_id);
  const academic_year_id = Number(body.academic_year_id);
  const product_id = Number(body.product_id);
  if (![student_id, academic_year_id, product_id].every((n) => Number.isFinite(n))) {
    return NextResponse.json({ error: 'student_id, academic_year_id, product_id wajib' }, { status: 400 });
  }

  const [ay] = await sql`
    SELECT id, name FROM core_academic_years WHERE id = ${academic_year_id}
  `;
  if (!ay) {
    return NextResponse.json({ error: 'Tahun ajaran tidak ditemukan' }, { status: 400 });
  }

  const startYear = parseAcademicYearStartYear(String(ay.name));
  if (!startYear) {
    return NextResponse.json({ error: 'Format tahun ajaran tidak valid' }, { status: 400 });
  }

  const t = await resolveTariffAmount(student_id, product_id, academic_year_id);
  if (!t.ok) {
    return NextResponse.json({ error: t.error }, { status: 400 });
  }

  const { bills_created } = await generateSpp12ForStudent(
    student_id,
    product_id,
    academic_year_id,
    startYear,
    t.amount
  );

  return NextResponse.json({ success: true, bills_created });
}

async function handleClassSinglePeriod(body: Record<string, unknown>) {
  const class_id = Number(body.class_id);
  const academic_year_id = Number(body.academic_year_id);
  const product_id = Number(body.product_id);
  if (![class_id, academic_year_id, product_id].every((n) => Number.isFinite(n))) {
    return NextResponse.json({ error: 'class_id, academic_year_id, product_id wajib' }, { status: 400 });
  }

  const [cls] = await sql`
    SELECT c.school_id FROM core_classes c WHERE c.id = ${class_id}
  `;
  if (!cls) {
    return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 400 });
  }

  const [product] = await sql`
    SELECT id, name, payment_type FROM tuition_products WHERE id = ${product_id}
  `;
  if (!product) {
    return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 400 });
  }

  const [ay] = await sql`
    SELECT id, name FROM core_academic_years WHERE id = ${academic_year_id}
  `;
  if (!ay) {
    return NextResponse.json({ error: 'Tahun ajaran tidak ditemukan' }, { status: 400 });
  }

  const pt = String(product.payment_type);
  if (pt === 'monthly') {
    const bm = body.bill_month != null ? Number(body.bill_month) : NaN;
    const by = body.bill_year != null ? Number(body.bill_year) : NaN;
    if (!Number.isFinite(bm) || !Number.isFinite(by)) {
      return NextResponse.json(
        { error: 'Produk bulanan memerlukan bill_month dan bill_year' },
        { status: 400 }
      );
    }
  }

  const students = await sql`
    SELECT ch.student_id
    FROM core_student_class_histories ch
    WHERE ch.class_id = ${class_id}
      AND ch.academic_year_id = ${academic_year_id}
      AND ch.status = 'active'
  `;

  if (students.length === 0) {
    return NextResponse.json({ error: 'Tidak ada siswa aktif di kelas ini' }, { status: 400 });
  }

  let bills_created = 0;
  let students_processed = 0;
  const paymentType = String(product.payment_type);

  for (const row of students) {
    const sid = row.student_id as number;
    const t = await resolveTariffAmount(sid, product_id, academic_year_id);
    if (!t.ok) continue;
    students_processed++;
    const r = await insertOneBillForProductType({
      studentId: sid,
      productId: product_id,
      academicYearId: academic_year_id,
      productName: String(product.name),
      paymentType,
      ayName: String(ay.name),
      amount: t.amount,
      bill_month: body.bill_month != null ? Number(body.bill_month) : undefined,
      bill_year: body.bill_year != null ? Number(body.bill_year) : undefined,
      title: body.title != null ? String(body.title) : undefined,
    });
    if (r.created) bills_created++;
  }

  if (students_processed === 0) {
    return NextResponse.json(
      { error: 'Tidak ada siswa dengan tarif di Matriks Tarif untuk kombinasi ini.' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    students_processed,
    students_skipped: students.length - students_processed,
    bills_created,
  });
}

async function handleSingle(body: Record<string, unknown>) {
  const student_id = Number(body.student_id);
  const academic_year_id = Number(body.academic_year_id);
  const product_id = Number(body.product_id);
  if (![student_id, academic_year_id, product_id].every((n) => Number.isFinite(n))) {
    return NextResponse.json({ error: 'student_id, academic_year_id, product_id wajib' }, { status: 400 });
  }

  const [product] = await sql`
    SELECT id, name, payment_type FROM tuition_products WHERE id = ${product_id}
  `;
  if (!product) {
    return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 400 });
  }

  const [ay] = await sql`
    SELECT id, name FROM core_academic_years WHERE id = ${academic_year_id}
  `;
  if (!ay) {
    return NextResponse.json({ error: 'Tahun ajaran tidak ditemukan' }, { status: 400 });
  }

  const pt = String(product.payment_type);
  if (pt === 'monthly') {
    const bm = body.bill_month != null ? Number(body.bill_month) : NaN;
    const by = body.bill_year != null ? Number(body.bill_year) : NaN;
    if (!Number.isFinite(bm) || !Number.isFinite(by)) {
      return NextResponse.json(
        { error: 'Produk bulanan memerlukan bill_month dan bill_year' },
        { status: 400 }
      );
    }
  }

  const amountOverride = body.amount_override != null ? String(body.amount_override) : null;
  const t = amountOverride
    ? { ok: true as const, amount: amountOverride }
    : await resolveTariffAmount(student_id, product_id, academic_year_id);
  if (!t.ok) {
    return NextResponse.json({ error: t.error }, { status: 400 });
  }

  const r = await insertOneBillForProductType({
    studentId: student_id,
    productId: product_id,
    academicYearId: academic_year_id,
    productName: String(product.name),
    paymentType: String(product.payment_type),
    ayName: String(ay.name),
    amount: t.amount,
    bill_month: body.bill_month != null ? Number(body.bill_month) : undefined,
    bill_year: body.bill_year != null ? Number(body.bill_year) : undefined,
    title: body.title != null ? String(body.title) : undefined,
  });

  if (!r.created) {
    return NextResponse.json(
      { error: 'Tagihan dengan judul yang sama sudah ada untuk siswa ini' },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, bills_created: 1 });
}
