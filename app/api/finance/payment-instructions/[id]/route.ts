import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await sql`
    SELECT
      pi.*,
      pm.name AS payment_channel_name,
      pm.code AS payment_channel_code
    FROM tuition_payment_instructions pi
    JOIN tuition_payment_methods pm ON pm.id = pi.payment_channel_id
    WHERE pi.id=${Number(id)}
  `;
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = (await req.json().catch(() => null)) as any;

  if (!data?.title || !data?.description || !data?.payment_channel_id) {
    return NextResponse.json({ error: 'title, description, payment_channel_id wajib diisi' }, { status: 400 });
  }

  const [row] = await sql`
    UPDATE tuition_payment_instructions SET
      title=${String(data.title)},
      description=${String(data.description)},
      step_order=${data.step_order === null || data.step_order === undefined || data.step_order === '' ? null : Number(data.step_order)},
      payment_channel_id=${Number(data.payment_channel_id)},
      updated_at=now()
    WHERE id=${Number(id)}
    RETURNING *
  `;
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await sql`DELETE FROM tuition_payment_instructions WHERE id=${Number(id)}`;
  return NextResponse.json({ success: true });
}

