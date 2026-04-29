import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { parseCurriculumThemeId } from '@/lib/school-curriculum-theme';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { name, address, bankChannelCode, schoolCode, schoolLogoUrl, themeId } = body;
  const theme_id = parseCurriculumThemeId(themeId);
  if (themeId != null && themeId !== '' && theme_id == null) {
    return NextResponse.json({ error: 'theme_id harus 1 (International), 2 (Nasional), atau kosong' }, { status: 400 });
  }
  const [row] = await sql`
    UPDATE core_schools
    SET
      theme_id = ${theme_id},
      name = ${name},
      address = ${address},
      bank_channel_code = ${bankChannelCode ?? null},
      school_code = ${schoolCode ?? null},
      school_logo_url = ${schoolLogoUrl ?? null}
    WHERE id = ${Number(id)}
    RETURNING *
  `;
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await sql`DELETE FROM core_schools WHERE id=${Number(id)}`;
  return NextResponse.json({ success: true });
}
