import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const paymentChannelId = searchParams.get('payment_channel_id');
  const q = (searchParams.get('q') ?? '').trim();

  const [{ has_table }] = (await sql`
    SELECT to_regclass('public.tuition_payment_instructions') IS NOT NULL AS has_table
  `) as { has_table: boolean }[];

  if (!has_table) {
    return NextResponse.json(
      {
        error:
          'Tabel tuition_payment_instructions belum ada. Jalankan migrasi database (npm run db:migrate) terlebih dahulu.',
      },
      { status: 503 }
    );
  }

  const rows = await sql`
    SELECT
      pi.*,
      pm.name AS payment_channel_name,
      pm.code AS payment_channel_code
    FROM tuition_payment_instructions pi
    JOIN tuition_payment_methods pm ON pm.id = pi.payment_channel_id
    WHERE
      (${paymentChannelId}::text IS NULL OR ${paymentChannelId}::text = '' OR pi.payment_channel_id = ${Number(paymentChannelId)})
      AND (${q}::text = '' OR pi.title ILIKE ${'%' + q + '%'})
    ORDER BY pi.payment_channel_id ASC, pi.step_order NULLS LAST, pi.id DESC
  `;

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const [{ has_table }] = (await sql`
    SELECT to_regclass('public.tuition_payment_instructions') IS NOT NULL AS has_table
  `) as { has_table: boolean }[];

  if (!has_table) {
    return NextResponse.json(
      {
        error:
          'Tabel tuition_payment_instructions belum ada. Jalankan migrasi database (npm run db:migrate) terlebih dahulu.',
      },
      { status: 503 }
    );
  }

  const data = (await req.json().catch(() => null)) as any;
  if (!data?.title || !data?.description || !data?.payment_channel_id) {
    return NextResponse.json({ error: 'title, description, payment_channel_id wajib diisi' }, { status: 400 });
  }

  const [row] = await sql`
    INSERT INTO tuition_payment_instructions (title, description, step_order, payment_channel_id)
    VALUES (
      ${String(data.title)},
      ${String(data.description)},
      ${data.step_order === null || data.step_order === undefined || data.step_order === '' ? null : Number(data.step_order)},
      ${Number(data.payment_channel_id)}
    )
    RETURNING *
  `;
  return NextResponse.json(row, { status: 201 });
}

