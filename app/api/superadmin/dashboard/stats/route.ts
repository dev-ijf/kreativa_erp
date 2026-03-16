import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    const [schools] = await sql`SELECT COUNT(*)::int AS count FROM core_schools`;
    const [students] = await sql`SELECT COUNT(*)::int AS count FROM core_students`;
    const [users] = await sql`SELECT COUNT(*)::int AS count FROM core_users`;
    const [bills] = await sql`SELECT COUNT(*)::int AS total, 
      SUM(CASE WHEN status='paid' THEN 1 ELSE 0 END)::int AS paid,
      SUM(CASE WHEN status='unpaid' THEN 1 ELSE 0 END)::int AS unpaid,
      SUM(CASE WHEN status='partial' THEN 1 ELSE 0 END)::int AS partial,
      COALESCE(SUM(paid_amount), 0) AS revenue
    FROM tuition_bills`;

    return NextResponse.json({
      totalSchools: schools.count,
      totalStudents: students.count,
      totalUsers: users.count,
      totalBills: bills.total,
      paidBills: bills.paid,
      unpaidBills: bills.unpaid,
      partialBills: bills.partial,
      totalRevenue: bills.revenue,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
