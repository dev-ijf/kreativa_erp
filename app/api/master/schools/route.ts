import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { parseCurriculumThemeId } from '@/lib/school-curriculum-theme';

export async function GET() {
  const rows = await sql`SELECT * FROM core_schools ORDER BY id`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, address, bankChannelCode, schoolCode, schoolLogoUrl, themeId } = body;
  const theme_id = parseCurriculumThemeId(themeId);
  if (themeId != null && themeId !== '' && theme_id == null) {
    return NextResponse.json({ error: 'theme_id harus 1 (International), 2 (Nasional), atau kosong' }, { status: 400 });
  }
  const [row] = await sql`
    INSERT INTO core_schools (theme_id, name, address, bank_channel_code, school_code, school_logo_url)
    VALUES (
      ${theme_id},
      ${name},
      ${address},
      ${bankChannelCode ?? null},
      ${schoolCode ?? null},
      ${schoolLogoUrl ?? null}
    )
    RETURNING *
  `;
  return NextResponse.json(row, { status: 201 });
}
