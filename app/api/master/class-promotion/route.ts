import { NextRequest, NextResponse } from 'next/server';
import { withTransaction } from '@/lib/pg-pool';
import { assignStudentsToTargets, type StudentPoolRow } from '@/lib/shuffle-assign';

type Body = {
  school_id: number;
  source_academic_year_id: number;
  target_academic_year_id: number;
  source_class_ids: number[];
  target_class_ids: number[];
  shuffle?: boolean;
  seed?: number;
  preview?: boolean;
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Body;
  const schoolId = Number(body.school_id);
  const srcAy = Number(body.source_academic_year_id);
  const tgtAy = Number(body.target_academic_year_id);
  const srcClasses = Array.isArray(body.source_class_ids)
    ? body.source_class_ids.map((x) => Number(x)).filter((n) => Number.isFinite(n))
    : [];
  const tgtClasses = Array.isArray(body.target_class_ids)
    ? body.target_class_ids.map((x) => Number(x)).filter((n) => Number.isFinite(n))
    : [];
  const shuffle = Boolean(body.shuffle);
  const seed = body.seed != null ? Number(body.seed) : undefined;
  const preview = Boolean(body.preview);

  if (!schoolId || !srcAy || !tgtAy || srcClasses.length === 0 || tgtClasses.length === 0) {
    return NextResponse.json(
      { error: 'school_id, tahun sumber/tujuan, dan kelas sumber/tujuan wajib diisi' },
      { status: 400 }
    );
  }
  if (srcAy === tgtAy) {
    return NextResponse.json({ error: 'Tahun ajaran sumber dan tujuan harus berbeda' }, { status: 400 });
  }

  try {
    const result = await withTransaction(async (c) => {
      const schoolCheck = await c.query<{ c: string }>(
        `SELECT COUNT(*)::text AS c FROM core_classes WHERE school_id = $1 AND id = ANY($2::int[])`,
        [schoolId, srcClasses]
      );
      if (Number(schoolCheck.rows[0]?.c) !== srcClasses.length) {
        throw new Error('Semua kelas sumber harus milik sekolah yang dipilih');
      }
      const schoolCheckT = await c.query<{ c: string }>(
        `SELECT COUNT(*)::text AS c FROM core_classes WHERE school_id = $1 AND id = ANY($2::int[])`,
        [schoolId, tgtClasses]
      );
      if (Number(schoolCheckT.rows[0]?.c) !== tgtClasses.length) {
        throw new Error('Semua kelas tujuan harus milik sekolah yang dipilih');
      }

      const srcLevel = await c.query<{ min_o: number; max_o: number }>(
        `SELECT MIN(lg.level_order)::int AS min_o, MAX(lg.level_order)::int AS max_o
         FROM core_classes c
         JOIN core_level_grades lg ON lg.id = c.level_grade_id
         WHERE c.id = ANY($1::int[])`,
        [srcClasses]
      );
      const tgtLevel = await c.query<{ min_o: number; max_o: number }>(
        `SELECT MIN(lg.level_order)::int AS min_o, MAX(lg.level_order)::int AS max_o
         FROM core_classes c
         JOIN core_level_grades lg ON lg.id = c.level_grade_id
         WHERE c.id = ANY($1::int[])`,
        [tgtClasses]
      );
      const smin = srcLevel.rows[0]?.min_o;
      const smax = srcLevel.rows[0]?.max_o;
      const tmin = tgtLevel.rows[0]?.min_o;
      const tmax = tgtLevel.rows[0]?.max_o;
      if (smin == null || tmin == null || smin !== smax || tmin !== tmax) {
        throw new Error('Kelas sumber (atau tujuan) harus satu tingkat yang sama per operasi');
      }
      if (tmin !== smin + 1) {
        throw new Error(`Tingkat tujuan harus tepat satu urutan di atas sumber (sumber=${smin}, tujuan=${tmin})`);
      }

      const poolRes = await c.query<{
        student_id: number;
        gender: string | null;
        history_id: number;
      }>(
        `SELECT s.id AS student_id, s.gender, ch.id AS history_id
         FROM core_students s
         INNER JOIN core_student_class_histories ch ON ch.student_id = s.id
           AND ch.academic_year_id = $1
           AND ch.status = 'active'
           AND ch.class_id = ANY($2::int[])
         WHERE s.school_id = $3`,
        [srcAy, srcClasses, schoolId]
      );

      const pool: StudentPoolRow[] = poolRes.rows.map((r) => ({
        student_id: r.student_id,
        gender: r.gender,
        history_id: r.history_id,
      }));

      const tgtMeta = await c.query<{ id: number; level_grade_id: number }>(
        `SELECT id, level_grade_id FROM core_classes WHERE id = ANY($1::int[])`,
        [tgtClasses]
      );
      const levelByClass = new Map<number, number>();
      for (const row of tgtMeta.rows) {
        levelByClass.set(row.id, row.level_grade_id);
      }

      const assignments = assignStudentsToTargets(pool, tgtClasses, { shuffle, seed });

      const previewRows = assignments.map((a) => ({
        student_id: a.student_id,
        target_class_id: a.target_class_id,
      }));

      if (preview) {
        return { preview: true, count: assignments.length, assignments: previewRows };
      }

      for (const a of assignments) {
        const lgId = levelByClass.get(a.target_class_id);
        if (lgId == null) throw new Error('Kelas tujuan tidak valid');
        await c.query(`UPDATE core_student_class_histories SET status = 'completed' WHERE id = $1`, [
          a.history_id,
        ]);
        await c.query(
          `INSERT INTO core_student_class_histories (student_id, class_id, level_grade_id, academic_year_id, status)
           VALUES ($1, $2, $3, $4, 'active')`,
          [a.student_id, a.target_class_id, lgId, tgtAy]
        );
        await c.query(
          `UPDATE core_students SET active_academic_year_id = $1, updated_at = NOW() WHERE id = $2`,
          [tgtAy, a.student_id]
        );
      }

      return { preview: false, moved: assignments.length };
    });

    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Gagal memproses promosi';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
