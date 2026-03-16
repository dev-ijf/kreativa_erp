import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const [row] = await sql`
    UPDATE core_students SET 
      school_id=${data.school_id}, full_name=${data.full_name}, nis=${data.nis}, 
      nisn=${data.nisn || null}, gender=${data.gender}, phone=${data.phone || null}, 
      date_of_birth=${data.date_of_birth || null}, address=${data.address || null}
    WHERE id=${Number(id)} RETURNING *
  `;
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await sql`DELETE FROM core_students WHERE id=${Number(id)}`;
  return NextResponse.json({ success: true });
}
