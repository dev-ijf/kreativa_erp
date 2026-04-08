'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Field, Select, Button, Input } from '@/components/ui/FormFields';
import { FileText, Plus, Download, Upload, Edit2, Trash2, Loader2, Eye } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { confirmToast } from '@/components/ui/confirmToast';
import { billMonthSelectOptions, billYearSelectOptions } from '@/lib/billing-period-ui';

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
  const [academicYears, setAcademicYears] = useState<{ id: number; name: string }[]>([]);
  const [classes, setClasses] = useState<{ id: number; name: string; school_id: number }[]>([]);
  const [products, setProducts] = useState<{ id: number; name: string; payment_type: string }[]>([]);

  const [schoolId, setSchoolId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [classId, setClassId] = useState('');
  const [productId, setProductId] = useState('');
  const [status, setStatus] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [billMonth, setBillMonth] = useState('');
  const [billYear, setBillYear] = useState('');
  const [q, setQ] = useState('');
  const [studentId, setStudentId] = useState('');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [dueFrom, setDueFrom] = useState('');
  const [dueTo, setDueTo] = useState('');

  const [applied, setApplied] = useState({
    schoolId: '',
    academicYearId: '',
    classId: '',
    productId: '',
    status: '',
    paymentType: '',
    billMonth: '',
    billYear: '',
    q: '',
    studentId: '',
    createdFrom: '',
    createdTo: '',
    dueFrom: '',
    dueTo: '',
  });

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<BillRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/master/schools').then((r) => r.json()),
      fetch('/api/master/academic-years').then((r) => r.json()),
      fetch('/api/master/classes').then((r) => r.json()),
      fetch('/api/finance/products').then((r) => r.json()),
    ]).then(([sch, ay, cls, prod]) => {
      setSchools(sch);
      setAcademicYears(ay);
      setClasses(cls);
      setProducts(prod);
      const active = ay.find((y: { is_active?: boolean }) => y.is_active);
      if (active) {
        const id = String(active.id);
        setAcademicYearId(id);
        setApplied((a) => ({ ...a, academicYearId: id }));
      }
    });
  }, []);

  const buildParams = useCallback(() => {
    const p = new URLSearchParams();
    p.set('page', String(page));
    p.set('limit', String(limit));
    const f = applied;
    if (f.schoolId) p.set('school_id', f.schoolId);
    if (f.academicYearId) p.set('academic_year_id', f.academicYearId);
    if (f.classId) p.set('class_id', f.classId);
    if (f.productId) p.set('product_id', f.productId);
    if (f.status) p.set('status', f.status);
    if (f.paymentType) p.set('payment_type', f.paymentType);
    if (f.billMonth) p.set('bill_month', f.billMonth);
    if (f.billYear) p.set('bill_year', f.billYear);
    if (f.q.trim()) p.set('q', f.q.trim());
    if (f.studentId) p.set('student_id', f.studentId);
    if (f.createdFrom) p.set('created_from', f.createdFrom);
    if (f.createdTo) p.set('created_to', f.createdTo);
    if (f.dueFrom) p.set('due_from', f.dueFrom);
    if (f.dueTo) p.set('due_to', f.dueTo);
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
      academicYearId,
      classId,
      productId,
      status,
      paymentType,
      billMonth,
      billYear,
      q,
      studentId,
      createdFrom,
      createdTo,
      dueFrom,
      dueTo,
    });
    setPage(1);
  };

  const fmtMoney = (s: string) =>
    'Rp ' + parseFloat(s || '0').toLocaleString('id-ID', { minimumFractionDigits: 0 });

  const exportXlsx = () => {
    const p = buildParams();
    p.delete('page');
    p.delete('limit');
    window.open(`/api/billing/bills/export?${p.toString()}`, '_blank');
  };

  const downloadTemplate = () => {
    window.open('/api/billing/bills/template', '_blank');
  };

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
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
  const totalPages = Math.max(1, Math.ceil(total / limit));

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
          <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
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
            Impor
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
          <Field label="Jenis pembayaran">
            <Select value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
              <option value="">Semua</option>
              <option value="monthly">Bulanan</option>
              <option value="annualy">Tahunan</option>
              <option value="one_time">Sekali bayar</option>
              <option value="installment">Cicilan</option>
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
          <Field label="ID siswa">
            <Input
              inputMode="numeric"
              placeholder="opsional"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ''))}
            />
          </Field>
          <Field label="Dibuat dari">
            <Input type="date" value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)} />
          </Field>
          <Field label="Dibuat sampai">
            <Input type="date" value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} />
          </Field>
          <Field label="Jatuh tempo dari">
            <Input type="date" value={dueFrom} onChange={(e) => setDueFrom(e.target.value)} />
          </Field>
          <Field label="Jatuh tempo sampai">
            <Input type="date" value={dueTo} onChange={(e) => setDueTo(e.target.value)} />
          </Field>
        </div>
        <Button type="button" onClick={applyFilter}>
          Terapkan filter
        </Button>
      </div>

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
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
            <p className="text-xs text-slate-500">
              Total {total} tagihan — hal {page} / {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Sebelumnya
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
