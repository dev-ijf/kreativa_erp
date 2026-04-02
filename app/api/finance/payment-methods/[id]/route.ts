import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await sql`
    SELECT * FROM tuition_payment_methods WHERE id=${Number(id)}
  `;
  if (!row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const [row] = await sql`
    UPDATE tuition_payment_methods SET 
      name=${data.name}, code=${data.code}, category=${data.category}, 
      coa=${data.coa || null}, vendor=${data.vendor || null},
      is_redirect=${data.is_redirect ?? false}, 
      is_publish=${data.is_publish ?? true},
      is_active=${data.is_active}
    WHERE id=${Number(id)} RETURNING *
  `;
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await sql`DELETE FROM tuition_payment_methods WHERE id=${Number(id)}`;
  return NextResponse.json({ success: true });
}
