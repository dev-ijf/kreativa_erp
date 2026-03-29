import { NextRequest, NextResponse } from 'next/server';
import { withTransaction } from '@/lib/pg-pool';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sid = Number(id);

  try {
    const out = await withTransaction(async (c) => {
      const elig = await c.query<{ n: string }>(
        `SELECT COUNT(*)::text AS n
         FROM core_student_class_histories ch
         INNER JOIN core_classes cl ON cl.id = ch.class_id
         INNER JOIN core_level_grades lg ON lg.id = cl.level_grade_id
         WHERE ch.student_id = $1 AND ch.status = 'active' AND COALESCE(lg.is_terminal, false) = true`,
        [sid]
      );
      if (Number(elig.rows[0]?.n) < 1) {
        throw new Error('Siswa tidak berada di tingkat akhir (is_terminal) atau tidak ada rombel aktif');
      }

      await c.query(
        `UPDATE core_students SET
          is_alumni = true,
          graduated_at = COALESCE(graduated_at, CURRENT_DATE),
          active_academic_year_id = NULL,
          updated_at = NOW()
         WHERE id = $1`,
        [sid]
      );
      await c.query(
        `UPDATE core_student_class_histories SET status = 'graduated'
         WHERE student_id = $1 AND status = 'active'`,
        [sid]
      );

      return { success: true };
    });
    return NextResponse.json(out);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Gagal mencatat kelulusan';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
