import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { school_id, name, level_order } = await req.json();
  const [row] = await sql`UPDATE core_level_grades SET school_id=${school_id}, name=${name}, level_order=${level_order} WHERE id=${Number(id)} RETURNING *`;
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await sql`DELETE FROM core_level_grades WHERE id=${Number(id)}`;
  return NextResponse.json({ success: true });
}
