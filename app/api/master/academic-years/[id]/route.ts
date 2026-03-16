import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name, is_active } = await req.json();
  
  if (is_active) {
    await sql`UPDATE core_academic_years SET is_active = false`;
  }
  
  const [row] = await sql`UPDATE core_academic_years SET name=${name}, is_active=${is_active} WHERE id=${Number(id)} RETURNING *`;
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await sql`DELETE FROM core_academic_years WHERE id=${Number(id)}`;
  return NextResponse.json({ success: true });
}
