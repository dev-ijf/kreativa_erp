import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const rows = await sql`SELECT * FROM core_schools ORDER BY id`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { name, address, bankChannelCode, schoolCode, schoolLogoUrl } = await req.json();
  const [row] = await sql`
    INSERT INTO core_schools (name, address, bank_channel_code, school_code, school_logo_url)
    VALUES (
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
