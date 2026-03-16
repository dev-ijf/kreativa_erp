import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { school_id, level_grade_id, name } = await req.json();
  const [row] = await sql`UPDATE core_classes SET school_id=${school_id}, level_grade_id=${level_grade_id}, name=${name} WHERE id=${Number(id)} RETURNING *`;
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await sql`DELETE FROM core_classes WHERE id=${Number(id)}`;
  return NextResponse.json({ success: true });
}
