'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { format, subMonths } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Field, Input, Button, Select } from '@/components/ui/FormFields';
import { Receipt, ChevronLeft, ChevronRight, ExternalLink, Download } from 'lucide-react';
import { MAX_TRANSACTION_RANGE_MONTHS } from '@/lib/billing-period';

type Row = {
  id: string | number;
  created_at: string;
  reference_no: string;
  total_amount: string;
  status: string | null;
  payer_name: string | null;
  payment_date: string | null;
  academic_year_name?: string | null;
  payment_method_name?: string | null;
};

export default function BillingTransactionsPage() {
  const defaultTo = format(new Date(), 'yyyy-MM-dd');
  const defaultFrom = format(subMonths(new Date(), 12), 'yyyy-MM-dd');

  const [schools, setSchools] = useState<{ id: number; name: string }[]>([]);
  const [academicYears, setAcademicYears] = useState<{ id: number; name: string }[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<{ id: number; name: string }[]>([]);

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [status, setStatus] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [userId, setUserId] = useState('');
  const [referenceQ, setReferenceQ] = useState('');

  const [applied, setApplied] = useState({
    from: defaultFrom,
    to: defaultTo,
    status: '',
    paymentMethodId: '',
    academicYearId: '',
    schoolId: '',
    studentId: '',
    userId: '',
    referenceQ: '',
  });

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch('/api/master/schools').then((r) => r.json()),
      fetch('/api/master/academic-years').then((r) => r.json()),
      fetch('/api/finance/payment-methods?limit=500&page=1').then((r) => r.json()),
    ]).then(([sch, ay, pm]) => {
      setSchools(Array.isArray(sch) ? sch : []);
      setAcademicYears(Array.isArray(ay) ? ay : []);
      const list = pm?.data ?? pm?.items ?? pm;
      setPaymentMethods(Array.isArray(list) ? list.map((x: { id: number; name: string }) => ({ id: x.id, name: x.name })) : []);
    });
  }, []);

  const buildParams = useCallback(() => {
    const q = new URLSearchParams();
    q.set('from', applied.from);
    q.set('to', applied.to);
    q.set('page', String(page));
    q.set('limit', String(limit));
    if (applied.status) q.set('status', applied.status);
    if (applied.paymentMethodId) q.set('payment_method_id', applied.paymentMethodId);
    if (applied.academicYearId) q.set('academic_year_id', applied.academicYearId);
    if (applied.schoolId) q.set('school_id', applied.schoolId);
    if (applied.studentId) q.set('student_id', applied.studentId);
    if (applied.userId) q.set('user_id', applied.userId);
    if (applied.referenceQ.trim()) q.set('reference_q', applied.referenceQ.trim());
    return q;
  }, [applied, page, limit]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/billing/transactions?${buildParams()}`);
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
  }, [buildParams]);

  useEffect(() => {
    load();
  }, [load]);

  const fmtMoney = (s: string) =>
    'Rp ' + parseFloat(s).toLocaleString('id-ID', { minimumFractionDigits: 0 });

  const fmtDt = (iso: string) =>
    format(new Date(iso), 'd MMM yyyy HH:mm', { locale: idLocale });

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const applyFilter = () => {
    setApplied({
      from,
      to,
      status,
      paymentMethodId,
      academicYearId,
      schoolId,
      studentId,
      userId,
      referenceQ,
    });
    setPage(1);
  };

  const exportXlsx = () => {
    const q = new URLSearchParams();
    q.set('from', applied.from);
    q.set('to', applied.to);
    if (applied.status) q.set('status', applied.status);
    if (applied.paymentMethodId) q.set('payment_method_id', applied.paymentMethodId);
    if (applied.academicYearId) q.set('academic_year_id', applied.academicYearId);
    if (applied.schoolId) q.set('school_id', applied.schoolId);
    if (applied.studentId) q.set('student_id', applied.studentId);
    if (applied.userId) q.set('user_id', applied.userId);
    if (applied.referenceQ.trim()) q.set('reference_q', applied.referenceQ.trim());
    window.open(`/api/billing/transactions/export?${q.toString()}`, '_blank');
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
            <Receipt size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Riwayat pembayaran</h1>
            <p className="text-slate-500 text-[13px] mt-0.5">
              Filter memakai rentang tanggal header transaksi (<code className="text-[12px]">created_at</code>) agar
              partisi bulanan efisien. Rentang maksimal sekitar {MAX_TRANSACTION_RANGE_MONTHS} bulan (~
              {Math.round(MAX_TRANSACTION_RANGE_MONTHS / 12)} tahun). Tambahan filter di bawah opsional.
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={exportXlsx} className="shrink-0">
          <Download size={14} className="mr-1" /> Export XLSX
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 mb-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Dari tanggal">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="Sampai tanggal">
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Semua</option>
              <option value="pending">pending</option>
              <option value="paid">paid</option>
              <option value="failed">failed</option>
              <option value="cancelled">cancelled</option>
              <option value="expired">expired</option>
            </Select>
          </Field>
          <Field label="Metode pembayaran">
            <Select value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)}>
              <option value="">Semua</option>
              {paymentMethods.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tahun ajaran">
            <Select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)}>
              <option value="">Semua</option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Sekolah (lewat tagihan)">
            <Select value={schoolId} onChange={(e) => setSchoolId(e.target.value)}>
              <option value="">Semua</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="ID siswa">
            <Input
              inputMode="numeric"
              placeholder="opsional"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ''))}
            />
          </Field>
          <Field label="ID user (pembayar)">
            <Input
              inputMode="numeric"
              placeholder="opsional"
              value={userId}
              onChange={(e) => setUserId(e.target.value.replace(/\D/g, ''))}
            />
          </Field>
          <div className="lg:col-span-2">
            <Field label="Cari referensi">
              <Input
                value={referenceQ}
                onChange={(e) => setReferenceQ(e.target.value)}
                placeholder="Sebagian nomor referensi…"
              />
            </Field>
          </div>
        </div>
        <Button type="button" onClick={applyFilter}>
          Terapkan filter
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-left border-b border-slate-200">
                <th className="px-4 py-3 font-semibold">Referensi</th>
                <th className="px-4 py-3 font-semibold">Waktu</th>
                <th className="px-4 py-3 font-semibold">Pembayar</th>
                <th className="px-4 py-3 font-semibold">TA</th>
                <th className="px-4 py-3 font-semibold">Metode</th>
                <th className="px-4 py-3 font-semibold text-right">Total</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold w-24" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                    Memuat…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                    Tidak ada transaksi pada filter ini.
                  </td>
                </tr>
              ) : (
                items.map((r) => (
                  <tr key={`${r.id}-${r.created_at}`} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-mono text-[12px] text-slate-700">{r.reference_no}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmtDt(r.created_at)}</td>
                    <td className="px-4 py-3 text-slate-700">{r.payer_name || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 text-[12px]">{r.academic_year_name || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 text-[12px]">{r.payment_method_name || '—'}</td>
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
