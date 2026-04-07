import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await sql`
    SELECT
      t.id,
      t.user_id,
      t.nip,
      t.join_date,
      t.latest_education,
      u.full_name AS user_full_name,
      u.email AS user_email,
      u.role AS user_role,
      u.school_id AS user_school_id
    FROM core_teachers t
    JOIN core_users u ON u.id = t.user_id
    WHERE t.id = ${Number(id)}
  `;
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });

  const nip = body.nip != null ? String(body.nip).trim() || null : null;
  const joinDate = body.join_date != null && String(body.join_date).trim() !== '' ? String(body.join_date) : null;
  const latestEducation =
    body.latest_education != null && String(body.latest_education).trim() !== ''
      ? String(body.latest_education).trim().slice(0, 100)
      : null;

  const [row] = await sql`
    UPDATE core_teachers
    SET nip = ${nip}, join_date = ${joinDate}, latest_education = ${latestEducation}
    WHERE id = ${Number(id)}
    RETURNING *
  `;
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await sql`DELETE FROM core_teachers WHERE id = ${Number(id)}`;
  return NextResponse.json({ success: true });
}
