import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    const [[schools], [students], [users], [bills], [txMonth]] = await Promise.all([
      sql`SELECT COUNT(*)::int AS count FROM core_schools`,
      sql`SELECT COUNT(*)::int AS count FROM core_students`,
      sql`SELECT COUNT(*)::int AS count FROM core_users`,
      sql`SELECT COUNT(*)::int AS total, 
      SUM(CASE WHEN status='paid' THEN 1 ELSE 0 END)::int AS paid,
      SUM(CASE WHEN status='unpaid' THEN 1 ELSE 0 END)::int AS unpaid,
      SUM(CASE WHEN status='partial' THEN 1 ELSE 0 END)::int AS partial,
      COALESCE(SUM(paid_amount), 0) AS revenue
    FROM tuition_bills`,
      sql`
      SELECT COALESCE(SUM(total_amount::numeric), 0) AS amount
      FROM tuition_transactions
      WHERE created_at >= date_trunc('month', CURRENT_TIMESTAMP)
        AND created_at < date_trunc('month', CURRENT_TIMESTAMP) + interval '1 month'
        AND status IN ('success', 'paid', 'completed')
    `,
    ]);

    return NextResponse.json({
      totalSchools: schools.count,
      totalStudents: students.count,
      totalUsers: users.count,
      totalBills: bills.total,
      paidBills: bills.paid,
      unpaidBills: bills.unpaid,
      partialBills: bills.partial,
      totalRevenue: bills.revenue,
      transactionVolumeThisMonth: txMonth?.amount ?? 0,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
