import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name, address } = await req.json();
  const [row] = await sql`UPDATE core_schools SET name=${name}, address=${address} WHERE id=${Number(id)} RETURNING *`;
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await sql`DELETE FROM core_schools WHERE id=${Number(id)}`;
  return NextResponse.json({ success: true });
}
