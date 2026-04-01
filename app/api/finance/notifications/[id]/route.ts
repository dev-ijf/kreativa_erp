import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await sql`SELECT * FROM notif_templates WHERE id=${Number(id)}`;
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = (await req.json().catch(() => null)) as any;

  if (!data?.name || !data?.type || !data?.trigger_event || !data?.content) {
    return NextResponse.json({ error: 'name, type, trigger_event, content wajib diisi' }, { status: 400 });
  }

  const [row] = await sql`
    UPDATE notif_templates SET
      school_id=${data.school_id ?? null},
      name=${String(data.name)},
      type=${String(data.type)},
      trigger_event=${String(data.trigger_event)},
      subject=${data.subject ? String(data.subject) : null},
      content=${String(data.content)},
      is_active=${data.is_active ?? true},
      updated_at=now()
    WHERE id=${Number(id)}
    RETURNING *
  `;
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await sql`DELETE FROM notif_templates WHERE id=${Number(id)}`;
  return NextResponse.json({ success: true });
}

