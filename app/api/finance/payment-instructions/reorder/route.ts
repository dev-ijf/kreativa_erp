import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

type Body = {
  ids: number[];
};

export async function PATCH(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Body | null;
  const ids = Array.isArray(body?.ids) ? body!.ids.map(Number).filter((n) => Number.isFinite(n)) : [];

  if (ids.length === 0) {
    return NextResponse.json({ error: 'ids wajib diisi' }, { status: 400 });
  }

  await sql`BEGIN`;
  try {
    for (let i = 0; i < ids.length; i++) {
      await sql`
        UPDATE tuition_payment_instructions
        SET step_order=${i + 1}
        WHERE id=${ids[i]}
      `;
    }
    await sql`COMMIT`;
  } catch (e) {
    await sql`ROLLBACK`;
    throw e;
  }

  return NextResponse.json({ success: true });
}
