import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { parseTransactionPeriod } from '@/lib/billing-period';

/**
 * GET — daftar transaksi dengan filter periode (created_at) untuk partition pruning.
 * Query: from, to (YYYY-MM-DD), student_id?, user_id?, page?, limit?
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fromStr = searchParams.get('from');
  const toStr = searchParams.get('to');
  const studentId = searchParams.get('student_id');
  const userId = searchParams.get('user_id');
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));
  const offset = (page - 1) * limit;

  let bounds;
  try {
    bounds = parseTransactionPeriod(fromStr, toStr);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Periode tidak valid';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { rangeStart, rangeEndExclusive } = bounds;
  const sid = studentId ? Number(studentId) : null;
  const uidNum: number | null =
    userId != null && userId !== '' && !Number.isNaN(Number(userId)) ? Number(userId) : null;

  if (studentId && (sid === null || Number.isNaN(sid))) {
    return NextResponse.json({ error: 'student_id tidak valid' }, { status: 400 });
  }

  try {
    if (sid != null) {
      const [[countRow], rows] = await Promise.all([
        sql`
        SELECT COUNT(*)::int AS c
        FROM tuition_transactions t
        WHERE t.created_at >= ${rangeStart}
          AND t.created_at < ${rangeEndExclusive}
          AND (${uidNum}::integer IS NULL OR t.user_id = ${uidNum})
          AND EXISTS (
            SELECT 1
            FROM tuition_transaction_details d
            JOIN tuition_bills b ON b.id = d.bill_id
            WHERE d.transaction_id = t.id
              AND d.transaction_created_at = t.created_at
              AND d.created_at >= ${rangeStart}
              AND d.created_at < ${rangeEndExclusive}
              AND b.student_id = ${sid}
          )
      `,
        sql`
        SELECT
          t.id,
          t.created_at,
          t.user_id,
          t.academic_year_id,
          t.reference_no,
          t.total_amount,
          t.payment_method_id,
          t.status,
          t.payment_date,
          u.full_name AS payer_name
        FROM tuition_transactions t
        LEFT JOIN core_users u ON u.id = t.user_id
        WHERE t.created_at >= ${rangeStart}
          AND t.created_at < ${rangeEndExclusive}
          AND (${uidNum}::integer IS NULL OR t.user_id = ${uidNum})
          AND EXISTS (
            SELECT 1
            FROM tuition_transaction_details d
            JOIN tuition_bills b ON b.id = d.bill_id
            WHERE d.transaction_id = t.id
              AND d.transaction_created_at = t.created_at
              AND d.created_at >= ${rangeStart}
              AND d.created_at < ${rangeEndExclusive}
              AND b.student_id = ${sid}
          )
        ORDER BY t.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `,
      ]);

      return NextResponse.json({
        items: rows,
        total: countRow?.c ?? 0,
        page,
        limit,
        from: fromStr,
        to: toStr,
      });
    }

    const [[countRow], rows] = await Promise.all([
      sql`
      SELECT COUNT(*)::int AS c
      FROM tuition_transactions t
      WHERE t.created_at >= ${rangeStart}
        AND t.created_at < ${rangeEndExclusive}
        AND (${uidNum}::integer IS NULL OR t.user_id = ${uidNum})
    `,
      sql`
      SELECT
        t.id,
        t.created_at,
        t.user_id,
        t.academic_year_id,
        t.reference_no,
        t.total_amount,
        t.payment_method_id,
        t.status,
        t.payment_date,
        u.full_name AS payer_name
      FROM tuition_transactions t
      LEFT JOIN core_users u ON u.id = t.user_id
      WHERE t.created_at >= ${rangeStart}
        AND t.created_at < ${rangeEndExclusive}
        AND (${uidNum}::integer IS NULL OR t.user_id = ${uidNum})
      ORDER BY t.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `,
    ]);

    return NextResponse.json({
      items: rows,
      total: countRow?.c ?? 0,
      page,
      limit,
      from: fromStr,
      to: toStr,
    });
  } catch (error) {
    console.error('transactions list error:', error);
    return NextResponse.json({ error: 'Gagal memuat transaksi' }, { status: 500 });
  }
}
