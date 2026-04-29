'use client';

import { Suspense, use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { ArrowLeft, Receipt, Printer } from 'lucide-react';
import { Button } from '@/components/ui/FormFields';

type Tx = {
  id: string | number;
  created_at: string;
  reference_no: string;
  total_amount: string;
  status: string | null;
  payer_name: string | null;
  payer_email: string | null;
  payment_date: string | null;
  is_whatsapp_checkout?: boolean | null;
  is_whatsapp_paid?: boolean | null;
};

type Detail = {
  id: string | number;
  amount_paid: string;
  bill_title: string;
  student_name: string;
  nis: string;
  product_name: string;
};

function BillingTransactionDetailInner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const createdAt = searchParams.get('created_at');
  const [tx, setTx] = useState<Tx | null>(null);
  const [details, setDetails] = useState<Detail[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!createdAt) {
      setError('Parameter created_at hilang. Buka dari daftar Riwayat Transaksi.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/billing/transactions/${id}?created_at=${encodeURIComponent(createdAt)}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal memuat');
        if (!cancelled) {
          setTx(data.transaction);
          setDetails(data.details || []);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, createdAt]);

  const fmtMoney = (s: string) =>
    'Rp ' + parseFloat(s).toLocaleString('id-ID', { minimumFractionDigits: 0 });

  const fmtDt = (iso: string) =>
    format(new Date(iso), 'd MMMM yyyy HH:mm', { locale: idLocale });

  const openReceipt = () => {
    if (!createdAt) return;
    const url = `/api/billing/transactions/${id}/receipt-pdf?created_at=${encodeURIComponent(createdAt)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
      <Link
        href="/billing/transactions"
        className="inline-flex items-center gap-1 text-[13px] text-slate-500 hover:text-slate-800 mb-4"
      >
        <ArrowLeft size={14} /> Kembali ke riwayat pembayaran
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
            <Receipt size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Detail transaksi</h1>
            {tx && (
              <p className="text-slate-500 text-[13px] mt-0.5 font-mono">{tx.reference_no}</p>
            )}
          </div>
        </div>
        {tx && createdAt ? (
          <div className="shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={openReceipt}>
              <Printer size={14} className="mr-1" /> Cetak Bukti
            </Button>
          </div>
        ) : null}
      </div>

      {loading && <p className="text-slate-400 text-[13px]">Memuat…</p>}
      {error && <p className="text-red-600 text-[13px]">{error}</p>}

      {!loading && tx && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 text-[13px]">
            <div>
              <p className="text-slate-400 text-[11px] uppercase font-bold tracking-wider">Waktu</p>
              <p className="text-slate-800 font-medium">{fmtDt(tx.created_at)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[11px] uppercase font-bold tracking-wider">Total</p>
              <p className="text-slate-800 font-bold text-lg">{fmtMoney(tx.total_amount)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[11px] uppercase font-bold tracking-wider">Pembayar</p>
              <p className="text-slate-800">{tx.payer_name || '—'}</p>
              {tx.payer_email && <p className="text-slate-500 text-[12px]">{tx.payer_email}</p>}
            </div>
            <div>
              <p className="text-slate-400 text-[11px] uppercase font-bold tracking-wider">Status</p>
              <p className="text-slate-800 capitalize">{tx.status || '—'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[11px] uppercase font-bold tracking-wider">WA checkout</p>
              <p className="text-slate-800 text-xl" title={tx.is_whatsapp_checkout === true ? 'Ya' : 'Tidak'}>
                {tx.is_whatsapp_checkout === true ? '✅' : '❌'}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-[11px] uppercase font-bold tracking-wider">WA lunas</p>
              <p className="text-slate-800 text-xl" title={tx.is_whatsapp_paid === true ? 'Ya' : 'Tidak'}>
                {tx.is_whatsapp_paid === true ? '✅' : '❌'}
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-[13px] font-bold text-slate-600 mb-3 uppercase tracking-wide">Rincian tagihan</h2>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-left border-b border-slate-200">
                    <th className="px-4 py-3 font-semibold">Siswa</th>
                    <th className="px-4 py-3 font-semibold">Tagihan</th>
                    <th className="px-4 py-3 font-semibold">Produk</th>
                    <th className="px-4 py-3 font-semibold text-right">Nilai</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((d) => (
                    <tr key={d.id} className="border-b border-slate-100">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{d.student_name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{d.nis}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{d.bill_title}</td>
                      <td className="px-4 py-3 text-slate-600">{d.product_name}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">{fmtMoney(d.amount_paid)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={openReceipt}>
              <Printer size={14} className="mr-1" /> Cetak Bukti
            </Button>
            <Link href="/billing/transactions">
              <Button type="button" variant="outline">
                Tutup
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BillingTransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400 text-[13px]">Memuat…</div>}>
      <BillingTransactionDetailInner params={params} />
    </Suspense>
  );
}
