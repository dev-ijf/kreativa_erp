'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Field, Select, Button, Input } from '@/components/ui/FormFields';
import { FileText, Plus, Download, Upload, Edit2, Trash2, Loader2, Eye, FileSpreadsheet, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { confirmToast } from '@/components/ui/confirmToast';
import { billMonthSelectOptions, billYearSelectOptions } from '@/lib/billing-period-ui';
import Modal from '@/components/ui/Modal';

type BillRow = {
  id: number;
  title: string;
  total_amount: string;
  paid_amount: string;
  status: string | null;
  bill_month: number | null;
  bill_year: number | null;
  student_name: string;
  nis: string;
  school_name: string;
  product_name: string;
  payment_type: string;
  academic_year_name: string;
  class_name: string | null;
};

export default function BillsPage() {
  const [schools, setSchools] = useState<{ id: number; name: string }[]>([]);
  const [cohorts, setCohorts] = useState<{ id: number; name: string; school_id: number }[]>([]);
  const [academicYears, setAcademicYears] = useState<{ id: number; name: string; is_active?: boolean }[]>([]);
  const [classes, setClasses] = useState<{ id: number; name: string; school_id: number }[]>([]);
  const [products, setProducts] = useState<{ id: number; name: string; payment_type: string }[]>([]);

  const [showFilters, setShowFilters] = useState(false);

  // Template Modal State
  const [templateOpen, setTemplateOpen] = useState(false);
  const [tSchoolId, setTSchoolId] = useState('');
  const [tCohortId, setTCohortId] = useState('');
  const [tClassId, setTClassId] = useState('');
  const [tProductId, setTProductId] = useState('');
  const [tAyId, setTAyId] = useState('');

  const [schoolId, setSchoolId] = useState('');
  const [cohortId, setCohortId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [classId, setClassId] = useState('');
  const [productId, setProductId] = useState('');
  const [status, setStatus] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [isInstallment, setIsInstallment] = useState('');
  const [billMonth, setBillMonth] = useState('');
  const [billYear, setBillYear] = useState('');
  const [q, setQ] = useState('');

  const [applied, setApplied] = useState({
    schoolId: '',
    cohortId: '',
    academicYearId: '',
    classId: '',
    productId: '',
    status: '',
    paymentType: '',
    isInstallment: '',
    billMonth: '',
    billYear: '',
    q: '',
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<BillRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{
    rows: any[];
    total: number;
    valid: number;
    invalid: number;
  } | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const pageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  useEffect(() => {
    Promise.all([
      fetch('/api/master/schools').then((r) => r.json()),
      fetch('/api/master/cohorts').then((r) => r.json()),
      fetch('/api/master/academic-years').then((r) => r.json()),
      fetch('/api/master/classes').then((r) => r.json()),
      fetch('/api/finance/products').then((r) => r.json()),
    ]).then(([sch, coh, ay, cls, prod]) => {
      setSchools(sch);
      setCohorts(coh);
      setAcademicYears(ay);
      setClasses(cls);
      setProducts(prod);
      const active = ay.find((y: { is_active?: boolean }) => y.is_active);
      if (active) {
        const id = String(active.id);
        setAcademicYearId(id);
        setApplied((a) => ({ ...a, academicYearId: id }));
        setTAyId(id);
      }
    });
  }, []);

  const buildParams = useCallback(() => {
    const p = new URLSearchParams();
    p.set('page', String(page));
    p.set('limit', String(limit));
    const f = applied;
    if (f.schoolId) p.set('school_id', f.schoolId);
    if (f.cohortId) p.set('cohort_id', f.cohortId);
    if (f.academicYearId) p.set('academic_year_id', f.academicYearId);
    if (f.classId) p.set('class_id', f.classId);
    if (f.productId) p.set('product_id', f.productId);
    if (f.status) p.set('status', f.status);
    if (f.paymentType) p.set('payment_type', f.paymentType);
    if (f.isInstallment) p.set('is_installment', f.isInstallment);
    if (f.billMonth) p.set('bill_month', f.billMonth);
    if (f.billYear) p.set('bill_year', f.billYear);
    if (f.q.trim()) p.set('q', f.q.trim());
    return p;
  }, [page, limit, applied]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/billing/bills?${buildParams()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat');
      setItems(data.data || []);
      setTotal(data.total ?? 0);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal memuat');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    load();
  }, [load]);

  const applyFilter = () => {
    setApplied({
      schoolId,
      cohortId,
      academicYearId,
      classId,
      productId,
      status,
      paymentType,
      isInstallment,
      billMonth,
      billYear,
      q,
    });
    setPage(1);
  };

  const fmtMoney = (s: string | number) =>
    'Rp ' + parseFloat(String(s) || '0').toLocaleString('id-ID', { minimumFractionDigits: 0 });

  const exportXlsx = () => {
    const p = buildParams();
    p.delete('page');
    p.delete('limit');
    window.open(`/api/billing/bills/export?${p.toString()}`, '_blank');
  };

  const downloadTemplate = () => {
    if (!tSchoolId || !tCohortId || !tClassId || !tProductId || !tAyId) {
      toast.error('Gagal mendownload template: Pastikan semua pilihan filter diisi.');
      return;
    }
    const p = new URLSearchParams({
      school_id: tSchoolId,
      cohort_id: tCohortId,
      class_id: tClassId,
      product_id: tProductId,
      academic_year_id: tAyId,
    });
    window.open(`/api/billing/bills/template?${p.toString()}`, '_blank');
  };

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImporting(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/billing/bills/import?preview=true', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Preview impor gagal');
        return;
      }
      setPreviewData(data);
      setPendingFile(file);
      setPreviewOpen(true);
    } catch {
      toast.error('Gagal memproses file impor');
    } finally {
      setImporting(false);
    }
  };

  const confirmImport = async () => {
    if (!pendingFile) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append('file', pendingFile);
      const res = await fetch('/api/billing/bills/import', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Impor gagal');
        return;
      }
      toast.success(`Impor: ${data.inserted} baru, ${data.skipped} duplikat`);
      if (data.errors?.length) {
        toast.message(data.errors.slice(0, 5).join('\n'), { duration: 8000 });
        if (data.errors.length > 5) {
          toast.message(`… dan ${data.errors.length - 5} error lain`, { duration: 4000 });
        }
      }
      setPreviewOpen(false);
      setPreviewData(null);
      setPendingFile(null);
      load();
    } catch {
      toast.error('Impor gagal');
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = (id: number) => {
    confirmToast('Hapus tagihan ini?', {
      confirmLabel: 'Hapus',
      onConfirm: async () => {
        setDeleting(id);
        const res = await fetch(`/api/billing/bills/${id}`, { method: 'DELETE' });
        setDeleting(null);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(data.error || 'Gagal menghapus');
          return;
        }
        toast.success('Tagihan dihapus');
        load();
      },
    });
  };

  const availableClasses = classes.filter((c) => !schoolId || String(c.school_id) === schoolId);
  const availableCohorts = cohorts.filter((c) => !schoolId || String(c.school_id) === schoolId);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-5">
      <Toaster richColors position="top-center" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-emerald-600" /> Bill (Tagihan)
          </h2>
          <p className="text-slate-400 text-[13px]">Daftar tagihan siswa — filter, ekspor, dan kelola</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-slate-100' : ''}
          >
            <FileSpreadsheet size={14} className="mr-1" />
            {showFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setTemplateOpen(true)}>
            <Download size={14} className="mr-1" /> Template
          </Button>
          <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <input
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={onImportFile}
              disabled={importing}
            />
            {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {importing ? 'Memproses...' : 'Impor'}
          </label>
          <Button type="button" variant="outline" size="sm" onClick={exportXlsx}>
            <Download size={14} className="mr-1" /> Export XLSX
          </Button>
          <Link href="/billing/bills/create">
            <Button size="sm">
              <Plus size={14} className="mr-1" /> Tambah
            </Button>
          </Link>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <Field label="Angkatan">
              <Select value={cohortId} onChange={(e) => setCohortId(e.target.value)}>
                <option value="">Semua</option>
                {availableCohorts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
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
            <Field label="Kelas (rombel)">
              <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
                <option value="">Semua</option>
                {availableClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Produk biaya">
              <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
                <option value="">Semua</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Semua</option>
                <option value="unpaid">Belum bayar</option>
                <option value="partial">Sebagian</option>
                <option value="paid">Lunas</option>
              </Select>
            </Field>
            <Field label="Frekuensi">
              <Select value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                <option value="">Semua</option>
                <option value="monthly">Bulanan</option>
                <option value="annualy">Tahunan</option>
                <option value="one_time">Sekali bayar</option>
              </Select>
            </Field>
            <Field label="Mode">
              <Select value={isInstallment} onChange={(e) => setIsInstallment(e.target.value)}>
                <option value="">Semua</option>
                <option value="true">Hanya Cicilan</option>
                <option value="false">Bukan Cicilan</option>
              </Select>
            </Field>
            <Field label="Bulan tagihan">
              <Select value={billMonth} onChange={(e) => setBillMonth(e.target.value)}>
                <option value="">Semua</option>
                {billMonthSelectOptions.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tahun tagihan">
              <Select value={billYear} onChange={(e) => setBillYear(e.target.value)}>
                <option value="">Semua</option>
                {billYearSelectOptions().map((y) => (
                  <option key={y.value} value={y.value}>
                    {y.label}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="lg:col-span-2">
              <Field label="Cari nama / NIS">
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nama atau NIS" />
              </Field>
            </div>
          </div>
          <Button type="button" onClick={applyFilter}>
            Terapkan filter
          </Button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-3 font-semibold text-slate-600">ID</th>
                <th className="text-left p-3 font-semibold text-slate-600">Siswa</th>
                <th className="text-left p-3 font-semibold text-slate-600">Judul</th>
                <th className="text-left p-3 font-semibold text-slate-600">Produk</th>
                <th className="text-left p-3 font-semibold text-slate-600">TA</th>
                <th className="text-right p-3 font-semibold text-slate-600">Total</th>
                <th className="text-left p-3 font-semibold text-slate-600">Status</th>
                <th className="text-right p-3 font-semibold text-slate-600 w-36">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Memuat…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                items.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="p-3 font-mono text-xs text-slate-400">{r.id}</td>
                    <td className="p-3">
                      <div className="font-medium text-slate-800">{r.student_name}</div>
                      <div className="text-xs text-slate-500">{r.nis}</div>
                    </td>
                    <td className="p-3 max-w-[200px] truncate" title={r.title}>
                      {r.title}
                    </td>
                    <td className="p-3 text-slate-600">{r.product_name}</td>
                    <td className="p-3 text-slate-600 text-xs">{r.academic_year_name}</td>
                    <td className="p-3 text-right font-medium">{fmtMoney(r.total_amount)}</td>
                    <td className="p-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded border ${
                          r.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : r.status === 'partial'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {r.status || '—'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/billing/bills/${r.id}/detail`} title="Detail pembayaran">
                          <Button size="sm" variant="outline">
                            <Eye size={13} />
                          </Button>
                        </Link>
                        <Link href={`/billing/bills/${r.id}`}>
                          <Button size="sm" variant="outline">
                            <Edit2 size={13} />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="danger"
                          loading={deleting === r.id}
                          onClick={() => handleDelete(r.id)}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 0 && (
          <div className="px-5 py-3.5 border-t border-[#E2E8F1] flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-3">
              <p className="text-[12px] text-slate-400">
                {total} data · Halaman {page} dari {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-slate-400">Baris per halaman:</span>
                <div className="min-w-[4.5rem] text-slate-500">
                  <Select
                    variant="compact"
                    value={String(limit)}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                  >
                    {[10, 20, 50, 100].map((opt) => (
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
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-all font-semibold"
              >
                <ChevronsLeft size={15} />
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-all font-semibold"
              >
                <ChevronLeft size={15} />
              </button>
              {pageNumbers().map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-slate-400 text-[13px]">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`min-w-[32px] h-8 rounded-lg text-[12px] font-bold transition-all ${
                      page === p
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-all font-semibold"
              >
                <ChevronRight size={15} />
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-all font-semibold"
              >
                <ChevronsRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        title="Download Template Import"
        subtitle="Pilih filter untuk menyesuaikan template tagihan"
      >
        <div className="space-y-4">
          <Field label="Pilih Sekolah">
            <Select
              value={tSchoolId}
              onChange={(e) => {
                setTSchoolId(e.target.value);
                setTCohortId('');
                setTClassId('');
              }}
            >
              <option value="">— Pilih Sekolah —</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Angkatan (Cohort)">
            <Select
              value={tCohortId}
              onChange={(e) => setTCohortId(e.target.value)}
              disabled={!tSchoolId}
            >
              <option value="">— Pilih Angkatan —</option>
              {cohorts
                .filter((c) => String(c.school_id) === tSchoolId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </Select>
          </Field>

          <Field label="Kelas (Rombel)">
            <Select
              value={tClassId}
              onChange={(e) => setTClassId(e.target.value)}
              disabled={!tSchoolId}
            >
              <option value="">— Pilih Kelas —</option>
              {classes
                .filter((c) => String(c.school_id) === tSchoolId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </Select>
          </Field>

          <Field label="Produk Biaya">
            <Select value={tProductId} onChange={(e) => setTProductId(e.target.value)}>
              <option value="">— Pilih Produk —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.payment_type})
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Tahun Ajaran">
            <Select value={tAyId} onChange={(e) => setTAyId(e.target.value)}>
              <option value="">— Pilih TA —</option>
              {academicYears.map((ay) => (
                <option key={ay.id} value={ay.id}>
                  {ay.name}
                </option>
              ))}
            </Select>
          </Field>

          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setTemplateOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => {
                downloadTemplate();
                setTemplateOpen(false);
              }}
              disabled={!tSchoolId || !tCohortId || !tClassId || !tProductId || !tAyId}
            >
              <Download size={16} className="mr-2" />
              Download Excel
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Preview Import"
        subtitle={`Ditemukan ${previewData?.total} baris. ${previewData?.valid} valid, ${previewData?.invalid} error.`}
        className="max-w-5xl"
      >
        <div className="space-y-4">
          <div className="max-h-[400px] overflow-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="p-2 text-left">Baris</th>
                  <th className="p-2 text-left">Siswa</th>
                  <th className="p-2 text-left">Keterangan</th>
                  <th className="p-2 text-right">Nominal</th>
                  <th className="p-2 text-right">Diskon</th>
                  <th className="p-2 text-left">Status (Excel)</th>
                  <th className="p-2 text-left">Validitas</th>
                </tr>
              </thead>
              <tbody>
                {previewData?.rows.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-2 text-slate-400">{row.line}</td>
                    <td className="p-2">
                       <div className="font-medium">{row.studentName || '—'}</div>
                       <div className="text-[10px] text-slate-400">{row.nis}</div>
                    </td>
                    <td className="p-2 truncate max-w-[150px]" title={row.title}>{row.title}</td>
                    <td className="p-2 text-right font-medium">{fmtMoney(row.amount)}</td>
                    <td className="p-2 text-right text-slate-500">{fmtMoney(row.discountAmount)}</td>
                    <td className="p-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] border ${
                        row.statusLabel === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {row.statusLabel}
                      </span>
                    </td>
                    <td className="p-2">
                      {row.status === 'valid' ? (
                        <span className="text-emerald-600 font-medium">OK</span>
                      ) : (
                        <span className="text-red-500 font-medium" title={row.error}>Error: {row.error}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center pt-2">
            <p className="text-xs text-slate-500">
              * Baris dengan status <span className="text-red-500 font-bold">Error</span> akan dilewati saat impor.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                Batal
              </Button>
              <Button 
                onClick={confirmImport} 
                disabled={importing || previewData?.valid === 0}
                loading={importing}
              >
                Lanjutkan Impor ({previewData?.valid} baris)
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
