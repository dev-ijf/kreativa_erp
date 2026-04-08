import { NextRequest, NextResponse } from 'next/server';
import {
  countTuitionTransactions,
  parseTransactionListSearchParams,
  selectTuitionTransactions,
} from '@/lib/billing-transactions-query';

/**
 * GET — daftar transaksi dengan filter periode (created_at) untuk partition pruning.
 * Query: from, to (YYYY-MM-DD), student_id?, user_id?, school_id?, status?,
 * payment_method_id?, academic_year_id?, reference_q?, page?, limit?
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parsed = parseTransactionListSearchParams(searchParams);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));
  const offset = (page - 1) * limit;

  const { filters } = parsed;

  try {
    const [total, rows] = await Promise.all([
      countTuitionTransactions(filters),
      selectTuitionTransactions(filters, limit, offset),
    ]);

    return NextResponse.json({
      items: rows,
      total,
      page,
      limit,
      from: filters.fromStr,
      to: filters.toStr,
    });
  } catch (error) {
    console.error('transactions list error:', error);
    return NextResponse.json({ error: 'Gagal memuat transaksi' }, { status: 500 });
  }
}
