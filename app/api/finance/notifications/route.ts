import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') ?? '').trim();

  const rows = await sql`
    SELECT *
    FROM notif_templates
    WHERE (${q}::text = '' OR name ILIKE ${'%' + q + '%'})
    ORDER BY id DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const data = (await req.json().catch(() => null)) as any;
  if (!data?.name || !data?.type || !data?.trigger_event || !data?.content) {
    return NextResponse.json({ error: 'name, type, trigger_event, content wajib diisi' }, { status: 400 });
  }

  const [row] = await sql`
    INSERT INTO notif_templates (school_id, name, type, trigger_event, subject, content, is_active, updated_at)
    VALUES (
      ${data.school_id ?? null},
      ${String(data.name)},
      ${String(data.type)},
      ${String(data.trigger_event)},
      ${data.subject ? String(data.subject) : null},
      ${String(data.content)},
      ${data.is_active ?? true},
      now()
    )
    RETURNING *
  `;
  return NextResponse.json(row, { status: 201 });
}

