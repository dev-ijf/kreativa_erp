'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Button } from '@/components/ui/FormFields';
import { ArrowLeft, Download, ExternalLink, FileText } from 'lucide-react';
import { toast, Toaster } from 'sonner';

type Bill = {
  id: number;
  title: string;
  total_amount: string;
  paid_amount: string;
  status: string | null;
  bill_month: number | null;
  bill_year: number | null;
  student_name: string;
  nis: string;
  product_name: string;
  academic_year_name: string;
};

type Line = {
  id: string | number;
  created_at: string;
  amount_paid: string;
  transaction_id: string | number;
  transaction_created_at: string;
  product_name: string;
  reference_no: string;
  transaction_status: string | null;
  payment_date: string | null;
  transaction_total: string;
  payer_name: string | null;
};

type TxRow = {
  id: string | number;
  created_at: string;
  reference_no: string;
  status: string | null;
  payment_date: string | null;
  total_amount: string;
  payer_name: string | null;
};

export default function BillPaymentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [bill, setBill] = useState<Bill | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [transactions, setTransactions] = useState<TxRow[]>([]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/billing/bills/${id}/payment-breakdown`);
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || 'Gagal memuat');
          return;
        }
        if (!cancelled) {
          setBill(data.bill);
          setLines(data.lines || []);
          setTransactions(data.transactions || []);
        }
      } catch {
        toast.error('Gagal memuat');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const fmtMoney = (s: string) =>
    'Rp ' + parseFloat(String(s || '0')).toLocaleString('id-ID', { minimumFractionDigits: 0 });

  const fmtDt = (iso: string) =>
    format(new Date(iso), 'd MMM yyyy HH:mm', { locale: idLocale });

  const exportXlsx = () => {
    window.open(`/api/billing/bills/${id}/payment-breakdown/export`, '_blank');
  };

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-slate-500 text-[13px]">Memuat…</div>
    );
  }

  if (!bill) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <p className="text-slate-600">Data tidak ditemukan</p>
        <Link href="/billing/bills" className="text-emerald-600 text-sm mt-2 inline-block">
          Kembali ke daftar
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <Toaster richColors position="top-center" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/billing/bills">
            <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Detail pembayaran tagihan</h1>
              <p className="text-slate-500 text-[13px]">
                #{bill.id} — {bill.student_name} ({bill.nis})
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={exportXlsx}>
            <Download size={14} className="mr-1" /> Export XLSX
          </Button>
          <Link href={`/billing/bills/${id}`}>
            <Button type="button" variant="outline" size="sm">
              Edit tagihan
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
        <div>
          <p className="text-slate-400 text-[11px] uppercase font-bold tracking-wider">Judul</p>
          <p className="text-slate-800 font-medium">{bill.title}</p>
        </div>
        <div>
          <p className="text-slate-400 text-[11px] uppercase font-bold tracking-wider">Produk / TA</p>
          <p className="text-slate-800">
            {bill.product_name} — {bill.academic_year_name}
          </p>
        </div>
        <div>
          <p className="text-slate-400 text-[11px] uppercase font-bold tracking-wider">Total / Terbayar</p>
          <p className="text-slate-800 font-semibold">
            {fmtMoney(bill.total_amount)} / {fmtMoney(bill.paid_amount)}
          </p>
        </div>
        <div>
          <p className="text-slate-400 text-[11px] uppercase font-bold tracking-wider">Status</p>
          <p className="text-slate-800 capitalize">{bill.status || '—'}</p>
        </div>
      </div>

      <div>
        <h2 className="text-[13px] font-bold text-slate-600 mb-3 uppercase tracking-wide">
          Rincian alokasi (tuition_transaction_details)
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-left border-b border-slate-200">
                  <th className="px-4 py-3 font-semibold">Waktu</th>
                  <th className="px-4 py-3 font-semibold">Produk</th>
                  <th className="px-4 py-3 font-semibold">Referensi</th>
                  <th className="px-4 py-3 font-semibold">Pembayar</th>
                  <th className="px-4 py-3 font-semibold text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {lines.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      Belum ada alokasi pembayaran ke tagihan ini.
                    </td>
                  </tr>
                ) : (
                  lines.map((d) => (
                    <tr key={`${d.id}-${d.created_at}`} className="border-b border-slate-100">
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmtDt(d.created_at)}</td>
                      <td className="px-4 py-3 text-slate-700">{d.product_name}</td>
                      <td className="px-4 py-3 font-mono text-[12px] text-slate-700">{d.reference_no}</td>
                      <td className="px-4 py-3 text-slate-700">{d.payer_name || '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">{fmtMoney(d.amount_paid)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-[13px] font-bold text-slate-600 mb-3 uppercase tracking-wide">
          Transaksi terkait (tuition_transactions)
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-left border-b border-slate-200">
                  <th className="px-4 py-3 font-semibold">Referensi</th>
                  <th className="px-4 py-3 font-semibold">Checkout</th>
                  <th className="px-4 py-3 font-semibold">Pembayar</th>
                  <th className="px-4 py-3 font-semibold text-right">Total</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold w-28" />
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      Tidak ada transaksi.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={`${t.id}-${t.created_at}`} className="border-b border-slate-100">
                      <td className="px-4 py-3 font-mono text-[12px] text-slate-700">{t.reference_no}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmtDt(t.created_at)}</td>
                      <td className="px-4 py-3 text-slate-700">{t.payer_name || '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">{fmtMoney(t.total_amount)}</td>
                      <td className="px-4 py-3 capitalize text-slate-700">{t.status || '—'}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/billing/transactions/${t.id}?created_at=${encodeURIComponent(t.created_at)}`}
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          Detail <ExternalLink size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
