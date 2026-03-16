import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const [row] = await sql`
    UPDATE tuition_products SET 
      school_id=${data.school_id}, name=${data.name}, payment_type=${data.payment_type}, 
      coa=${data.coa || null}, description=${data.description || null}
    WHERE id=${Number(id)} RETURNING *
  `;
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await sql`DELETE FROM tuition_products WHERE id=${Number(id)}`;
  return NextResponse.json({ success: true });
}
