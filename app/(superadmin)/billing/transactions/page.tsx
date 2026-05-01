'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { format, subMonths } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Field, Input, Button, Select } from '@/components/ui/FormFields';
import {
  Receipt,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  Download,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
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
  student_name?: string | null;
  nis?: string | null;
  class_name?: string | null;
  school_name?: string | null;
  is_whatsapp_checkout?: boolean | null;
  is_whatsapp_paid?: boolean | null;
  vendor_payment_id?: string | null;
};

function waFlagEmoji(v: boolean | null | undefined) {
  const ok = v === true;
  return (
    <span className="text-base leading-none" title={ok ? 'Ya' : 'Tidak'} aria-label={ok ? 'Ya' : 'Tidak'}>
      {ok ? '✅' : '❌'}
    </span>
  );
}

export default function BillingTransactionsPage() {
  const defaultTo = format(new Date(), 'yyyy-MM-dd');
  const defaultFrom = format(subMonths(new Date(), 12), 'yyyy-MM-dd');

  const [schools, setSchools] = useState<{ id: number; name: string }[]>([]);
  const [academicYears, setAcademicYears] = useState<{ id: number; name: string }[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<{ id: number; name: string }[]>([]);

  const [showFilters, setShowFilters] = useState(false);

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [status, setStatus] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [userId, setUserId] = useState('');
  const [referenceQ, setReferenceQ] = useState('');
  const [waCheckout, setWaCheckout] = useState('');
  const [waPaid, setWaPaid] = useState('');

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
    waCheckout: '',
    waPaid: '',
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const pageSizeOptions = [10, 20, 50, 100];
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch('/api/master/schools').then((r) => r.json()),
      fetch('/api/master/academic-years').then((r) => r.json()),
    ]).then(([sch, ay]) => {
      setSchools(Array.isArray(sch) ? sch : []);
      setAcademicYears(Array.isArray(ay) ? ay : []);
    });
  }, []);

  useEffect(() => {
    const u = `/api/finance/payment-methods?limit=500&page=1${
      applied.schoolId ? `&school_id=${encodeURIComponent(applied.schoolId)}` : ''
    }`;
    fetch(u)
      .then((r) => r.json())
      .then((pm) => {
        const list = pm?.data ?? pm?.items ?? pm;
        setPaymentMethods(
          Array.isArray(list) ? list.map((x: { id: number; name: string }) => ({ id: x.id, name: x.name })) : []
        );
      })
      .catch(() => setPaymentMethods([]));
  }, [applied.schoolId]);

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
    if (applied.waCheckout === 'true' || applied.waCheckout === 'false') {
      q.set('whatsapp_checkout', applied.waCheckout);
    }
    if (applied.waPaid === 'true' || applied.waPaid === 'false') {
      q.set('whatsapp_paid', applied.waPaid);
    }
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
  const currentPage = Math.min(page, totalPages);

  const pageNumbers = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

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
      waCheckout,
      waPaid,
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
    if (applied.waCheckout === 'true' || applied.waCheckout === 'false') {
      q.set('whatsapp_checkout', applied.waCheckout);
    }
    if (applied.waPaid === 'true' || applied.waPaid === 'false') {
      q.set('whatsapp_paid', applied.waPaid);
    }
    window.open(`/api/billing/transactions/export?${q.toString()}`, '_blank');
  };

  const openReceipt = (r: Row) => {
    const url = `/api/billing/transactions/${r.id}/receipt-pdf?created_at=${encodeURIComponent(
      r.created_at
    )}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
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
              {Math.round(MAX_TRANSACTION_RANGE_MONTHS / 12)} tahun).
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
            className={showFilters ? 'bg-slate-100' : ''}
          >
            <FileSpreadsheet size={14} className="mr-1" />
            {showFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={exportXlsx}>
            <Download size={14} className="mr-1" /> Export XLSX
          </Button>
        </div>
      </div>

      {showFilters && (
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
                <option value="success">success</option>
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
            <Field label="WA checkout" hint="Filter transaksi lewat checkout WhatsApp">
              <Select value={waCheckout} onChange={(e) => setWaCheckout(e.target.value)}>
                <option value="">Semua</option>
                <option value="true">Ya ✅</option>
                <option value="false">Tidak ❌</option>
              </Select>
            </Field>
            <Field label="WA lunas" hint="Filter status lunas via WhatsApp">
              <Select value={waPaid} onChange={(e) => setWaPaid(e.target.value)}>
                <option value="">Semua</option>
                <option value="true">Ya ✅</option>
                <option value="false">Tidak ❌</option>
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
            <Field label="Sekolah">
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
          <div className="flex justify-end">
            <Button type="button" onClick={applyFilter}>
              Terapkan filter
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-left border-b border-slate-200 text-[11px] uppercase tracking-wide">
                <th className="px-3 py-3 font-semibold w-10">No</th>
                <th className="px-3 py-3 font-semibold">Referensi</th>
                <th className="px-3 py-3 font-semibold min-w-[100px]">ID vendor</th>
                <th className="px-3 py-3 font-semibold">Waktu</th>
                <th className="px-3 py-3 font-semibold min-w-[180px]">Siswa</th>
                <th className="px-3 py-3 font-semibold">Kelas</th>
                <th className="px-3 py-3 font-semibold min-w-[140px]">Sekolah</th>
                <th className="px-3 py-3 font-semibold">Pembayar</th>
                <th className="px-3 py-3 font-semibold">TA</th>
                <th className="px-3 py-3 font-semibold">Metode</th>
                <th className="px-3 py-3 font-semibold text-center whitespace-nowrap">WA checkout</th>
                <th className="px-3 py-3 font-semibold text-center whitespace-nowrap">WA lunas</th>
                <th className="px-3 py-3 font-semibold text-right">Total</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold text-right w-32">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={15} className="px-4 py-10 text-center text-slate-400">
                    Memuat…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-4 py-10 text-center text-slate-400">
                    Tidak ada transaksi pada filter ini.
                  </td>
                </tr>
              ) : (
                items.map((r, i) => (
                  <tr key={`${r.id}-${r.created_at}`} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="px-3 py-3 text-slate-400 tabular-nums">
                      {(currentPage - 1) * limit + i + 1}
                    </td>
                    <td className="px-3 py-3 font-mono text-[12px] text-slate-700">{r.reference_no}</td>
                    <td className="px-3 py-3 font-mono text-[11px] text-slate-600 break-all max-w-[140px]">
                      {r.vendor_payment_id || '—'}
                    </td>
                    <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{fmtDt(r.created_at)}</td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-800">{r.student_name || '—'}</div>
                      {r.nis ? (
                        <div className="text-[11px] text-slate-400 font-mono">{r.nis}</div>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-slate-600">{r.class_name || '—'}</td>
                    <td className="px-3 py-3 text-slate-700">{r.school_name || '—'}</td>
                    <td className="px-3 py-3 text-slate-700">{r.payer_name || '—'}</td>
                    <td className="px-3 py-3 text-slate-600 text-[12px]">{r.academic_year_name || '—'}</td>
                    <td className="px-3 py-3 text-slate-600 text-[12px]">{r.payment_method_name || '—'}</td>
                    <td className="px-3 py-3 text-center text-slate-600">{waFlagEmoji(r.is_whatsapp_checkout)}</td>
                    <td className="px-3 py-3 text-center text-slate-600">{waFlagEmoji(r.is_whatsapp_paid)}</td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums whitespace-nowrap">
                      {fmtMoney(r.total_amount)}
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-semibold uppercase">
                        {r.status || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openReceipt(r)}
                          title="Cetak Bukti Pembayaran"
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[12px] text-slate-700 hover:bg-slate-50"
                        >
                          <Printer size={12} /> Cetak
                        </button>
                        <Link
                          href={`/billing/transactions/${r.id}?created_at=${encodeURIComponent(r.created_at)}`}
                          className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[12px] text-blue-700 hover:bg-blue-100"
                          title="Lihat detail"
                        >
                          Detail <ExternalLink size={12} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3.5 border-t border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[12px] text-slate-400">
              {total} data · Halaman {currentPage} dari {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-slate-400">Baris per halaman:</span>
              <div className="min-w-[4.5rem] text-slate-500">
                <Select
                  variant="compact"
                  value={String(limit)}
                  disabled={loading}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  {pageSizeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(1)}
              disabled={currentPage === 1 || loading}
              aria-label="Halaman pertama"
              title="Halaman pertama"
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-all"
            >
              <ChevronsLeft size={15} />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              aria-label="Halaman sebelumnya"
              title="Halaman sebelumnya"
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={15} />
            </button>
            {pageNumbers().map((p, idx) =>
              p === '...' ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 text-[13px]">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  disabled={loading}
                  onClick={() => setPage(p)}
                  className={`min-w-[32px] h-8 rounded-lg text-[12px] font-medium transition-all ${
                    currentPage === p
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
              aria-label="Halaman berikutnya"
              title="Halaman berikutnya"
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-all"
            >
              <ChevronRight size={15} />
            </button>
            <button
              type="button"
              onClick={() => setPage(totalPages)}
              disabled={currentPage === totalPages || loading}
              aria-label="Halaman terakhir"
              title="Halaman terakhir"
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-all"
            >
              <ChevronsRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
