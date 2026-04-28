import { redirect } from 'next/navigation';

/**
 * Rute kompatibilitas: mengalihkan ke endpoint PDF yang di-stream dari server.
 * Pratinjau di tab baru: buka langsung URL `/api/.../receipt-pdf?...`.
 */
export default async function BillingReceiptRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created_at?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const created = sp.created_at;
  if (!created) {
    redirect('/billing/transactions');
  }
  redirect(
    `/api/billing/transactions/${id}/receipt-pdf?created_at=${encodeURIComponent(created)}`
  );
}
