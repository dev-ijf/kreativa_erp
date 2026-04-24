import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

function parseActive(b: Record<string, unknown> | null | undefined): boolean {
  if (b?.active === false || b?.active === 'false') return false;
  return true;
}

export async function GET() {
  const rows = await sql`
    SELECT a.*, s.name AS school_name
    FROM academic_announcements a
    JOIN core_schools s ON s.id = a.school_id
    ORDER BY a.publish_date DESC, a.id DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const schoolId = Number(b?.school_id);
  const publishDate = b?.publish_date != null ? String(b.publish_date).slice(0, 10) : '';
  const titleEn = b?.title_en != null ? String(b.title_en).trim() : '';
  const titleId = b?.title_id != null ? String(b.title_id).trim() : '';
  const contentEn = b?.content_en != null ? String(b.content_en) : '';
  const contentId = b?.content_id != null ? String(b.content_id) : '';
  if (!schoolId || !publishDate || !titleEn || !titleId || !contentEn || !contentId) {
    return NextResponse.json(
      { error: 'school_id, publish_date, title_en, title_id, content_en, content_id wajib' },
      { status: 400 }
    );
  }
  const [sch] = await sql`SELECT id FROM core_schools WHERE id = ${schoolId}`;
  if (!sch) return NextResponse.json({ error: 'Sekolah tidak ditemukan' }, { status: 400 });
  const featuredImage =
    b?.featured_image != null && String(b.featured_image).trim() !== ''
      ? String(b.featured_image).trim()
      : null;
  const active = parseActive(b);
  const [row] = await sql`
    INSERT INTO academic_announcements (
      school_id, publish_date, title_en, title_id, content_en, content_id, featured_image, active
    )
    VALUES (${schoolId}, ${publishDate}, ${titleEn}, ${titleId}, ${contentEn}, ${contentId}, ${featuredImage}, ${active})
    RETURNING *
  `;
  return NextResponse.json(row, { status: 201 });
}
