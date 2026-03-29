'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { format, subMonths } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Field, Input, Button } from '@/components/ui/FormFields';
import { Receipt, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

type Row = {
  id: string | number;
  created_at: string;
  reference_no: string;
  total_amount: string;
  status: string | null;
  payer_name: string | null;
  payment_date: string | null;
};

export default function BillingTransactionsPage() {
  const defaultTo = format(new Date(), 'yyyy-MM-dd');
  const defaultFrom = format(subMonths(new Date(), 12), 'yyyy-MM-dd');
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [appliedFrom, setAppliedFrom] = useState(defaultFrom);
  const [appliedTo, setAppliedTo] = useState(defaultTo);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        from: appliedFrom,
        to: appliedTo,
        page: String(page),
        limit: String(limit),
      });
      const res = await fetch(`/api/billing/transactions?${q}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat');
      setItems(data.items || []);
      setTotal(data.total ?? 0);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [appliedFrom, appliedTo, page, limit]);

  useEffect(() => {
    load();
  }, [load]);

  const fmtMoney = (s: string) =>
    'Rp ' + parseFloat(s).toLocaleString('id-ID', { minimumFractionDigits: 0 });

  const fmtDt = (iso: string) =>
    format(new Date(iso), 'd MMM yyyy HH:mm', { locale: idLocale });

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const applyFilter = () => {
    setAppliedFrom(from);
    setAppliedTo(to);
    setPage(1);
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-start gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
          <Receipt size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Riwayat Transaksi</h1>
          <p className="text-slate-500 text-[13px] mt-0.5">
            Pencarian memakai rentang tanggal (header <code className="text-[12px]">created_at</code>) agar
            database memakai partisi bulanan secara efisien.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end gap-4 flex-wrap">
          <Field label="Dari tanggal">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="Sampai tanggal">
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <Button type="button" onClick={applyFilter} className="md:mb-0.5">
            Terapkan
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-left border-b border-slate-200">
                <th className="px-4 py-3 font-semibold">Referensi</th>
                <th className="px-4 py-3 font-semibold">Waktu</th>
                <th className="px-4 py-3 font-semibold">Pembayar</th>
                <th className="px-4 py-3 font-semibold text-right">Total</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold w-24" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Memuat…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Tidak ada transaksi pada periode ini.
                  </td>
                </tr>
              ) : (
                items.map((r) => (
                  <tr key={`${r.id}-${r.created_at}`} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-mono text-[12px] text-slate-700">{r.reference_no}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmtDt(r.created_at)}</td>
                    <td className="px-4 py-3 text-slate-700">{r.payer_name || '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{fmtMoney(r.total_amount)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-semibold uppercase">
                        {r.status || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/billing/transactions/${r.id}?created_at=${encodeURIComponent(r.created_at)}`}
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
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-[13px] text-slate-600">
          <span>
            Total {total} transaksi · halaman {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} /> Sebelumnya
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Berikutnya <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
