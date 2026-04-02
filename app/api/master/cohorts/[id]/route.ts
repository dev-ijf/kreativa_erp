import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const data = await req.json();
  const { id } = await params;
  try {
    const [row] = await sql`
      UPDATE core_cohorts
      SET name = ${data.name}
      WHERE id = ${Number(id)}
      RETURNING *
    `;
    if (!row) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    return NextResponse.json(row);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error updating cohort';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // Check constraint before delete
    const [{ count }] = await sql`
      SELECT COUNT(*)::int as count FROM core_students WHERE cohort_id = ${Number(id)}
    ` as { count: number }[];

    if (count > 0) {
      return NextResponse.json(
        { error: `Tidak bisa dihapus karena masih ada ${count} siswa yang terikat di angkatan ini.` },
        { status: 400 }
      );
    }

    const [row] = await sql`
      DELETE FROM core_cohorts WHERE id = ${Number(id)} RETURNING id
    `;
    if (!row) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    return NextResponse.json({ success: true, id: row.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error deleting cohort';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
