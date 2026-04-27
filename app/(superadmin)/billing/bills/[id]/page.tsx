'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Field, Button, Input, Select, Textarea, MoneyInput } from '@/components/ui/FormFields';
import { billMonthSelectOptions, billYearSelectOptions } from '@/lib/billing-period-ui';
import { ArrowLeft } from 'lucide-react';
import { toast, Toaster } from 'sonner';

type BillDetail = {
  id: number;
  school_id: number;
  cohort_id: number;
  student_id: number;
  product_id: number;
  academic_year_id: number;
  title: string;
  total_amount: string;
  paid_amount: string;
  min_payment: string;
  due_date: string | null;
  status: string | null;
  bill_month: number | null;
  bill_year: number | null;
  discount_amount: string | number;
  notes: string | null;
  related_month: string | null;
  student_name: string;
  nis: string;
  product_name: string;
  payment_type: string;
  academic_year_name: string;
};

export default function EditBillPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [row, setRow] = useState<BillDetail | null>(null);

  // Master data
  const [schools, setSchools] = useState<{ id: number; name: string }[]>([]);
  const [cohorts, setCohorts] = useState<{ id: number; name: string; school_id: number }[]>([]);
  const [academicYears, setAcademicYears] = useState<{ id: number; name: string }[]>([]);
  const [products, setProducts] = useState<{ id: number; name: string }[]>([]);
  const [students, setStudents] = useState<{ id: number; full_name: string; nis: string }[]>([]);

  const [form, setForm] = useState({
    school_id: '',
    cohort_id: '',
    student_id: '',
    product_id: '',
    academic_year_id: '',
    title: '',
    total_amount: '',
    min_payment: '',
    due_date: '',
    bill_month: '',
    bill_year: '',
    discount_amount: '',
    paid_amount: '',
    status: '',
    notes: '',
    related_month: '',
  });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [scl, coh, ay, prod] = await Promise.all([
          fetch('/api/master/schools').then((r) => r.json()),
          fetch('/api/master/cohorts').then((r) => r.json()),
          fetch('/api/master/academic-years').then((r) => r.json()),
          fetch('/api/finance/products').then((r) => r.json()),
        ]);
        if (cancelled) return;
        setSchools(scl || []);
        setCohorts(coh || []);
        setAcademicYears(ay || []);
        setProducts(prod || []);

        const res = await fetch(`/api/billing/bills/${id}`);
        const d = await res.json();
        if (cancelled) return;
        if (d.error) {
          toast.error(d.error);
          setRow(null);
          return;
        }

        const q = new URLSearchParams({
          school_id: String(d.school_id),
          academic_year_id: String(d.academic_year_id),
          limit: '100',
          page: '1',
        });
        const stdRes = await fetch(`/api/students?${q}`);
        const stdJson = await stdRes.json();
        if (cancelled) return;
        const pageList = (stdJson.data || []) as { id: number; full_name: string; nis: string }[];
        const current = {
          id: d.student_id as number,
          full_name: String(d.student_name ?? ''),
          nis: String(d.nis ?? ''),
        };
        const seen = new Set<number>();
        const merged: { id: number; full_name: string; nis: string }[] = [];
        for (const s of [current, ...pageList]) {
          if (seen.has(s.id)) continue;
          seen.add(s.id);
          merged.push(s);
        }
        setStudents(merged);
        setRow(d);
        setForm({
          school_id: String(d.school_id ?? ''),
          cohort_id: String(d.cohort_id ?? ''),
          student_id: String(d.student_id ?? ''),
          product_id: String(d.product_id ?? ''),
          academic_year_id: String(d.academic_year_id ?? ''),
          title: d.title || '',
          total_amount: String(d.total_amount ?? ''),
          min_payment: String(d.min_payment ?? ''),
          due_date: d.due_date ? String(d.due_date).slice(0, 10) : '',
          bill_month: d.bill_month != null ? String(d.bill_month) : '',
          bill_year: d.bill_year != null ? String(d.bill_year) : '',
          discount_amount: String(d.discount_amount ?? '0'),
          paid_amount: String(d.paid_amount ?? '0'),
          status: d.status || 'unpaid',
          notes: d.notes || '',
          related_month: d.related_month ? String(d.related_month).slice(0, 10) : '',
        });
      } catch (e) {
        console.error(e);
        toast.error('Gagal memuat data tagihan');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const paid = row ? parseFloat(String(row.paid_amount)) : 0;
  const readOnlyTotal = paid > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/billing/bills/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_id: form.school_id,
          cohort_id: form.cohort_id,
          student_id: form.student_id,
          product_id: form.product_id,
          academic_year_id: form.academic_year_id,
          title: form.title,
          total_amount: form.total_amount,
          min_payment: form.min_payment || undefined,
          due_date: form.due_date || null,
          bill_month: form.bill_month ? parseInt(form.bill_month, 10) : null,
          bill_year: form.bill_year ? parseInt(form.bill_year, 10) : null,
          discount_amount: form.discount_amount,
          paid_amount: form.paid_amount,
          status: form.status,
          notes: form.notes,
          related_month: form.related_month || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Gagal menyimpan');
        return;
      }
      toast.success('Berhasil diperbarui');
      router.push('/billing/bills');
    } catch {
      toast.error('Gagal menghubungi server');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center space-y-4">
        <div className="animate-spin h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full mx-auto" />
        <p className="text-slate-500 font-medium tracking-wide animate-pulse">Menyiapkan form "Apa Adanya" Dari Database...</p>
      </div>
    );
  }

  if (!row) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center space-y-4">
        <p className="text-slate-600">Data tidak ditemukan</p>
        <Link href="/billing/bills">
          <Button variant="outline" size="sm">Kembali ke daftar</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6 pb-20">
      <Toaster richColors position="top-center" />
      <div className="flex items-center gap-4">
        <Link href="/billing/bills">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Edit Tagihan Database #{row.id}</h2>
          <p className="text-slate-400 text-[13px]">
            Mode Edit: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600 tracking-tighter">as-is-field-database</span>
          </p>
        </div>
      </div>

      {readOnlyTotal && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[13px] px-5 py-3 shadow-sm border-l-4 border-l-amber-500">
          <span className="font-bold">Perhatian:</span> Tagihan ini sudah memiliki riwayat pembayaran (Rp {parseFloat(String(row.paid_amount)).toLocaleString('id-ID')}). Hati-hati saat merubah identitas atau total tagihan.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION: IDENTITAS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.1em] border-b border-slate-50 pb-2 mb-4">I. Data Identitas (FK)</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <Field label="Sekolah (school_id)" required>
              <Select value={form.school_id} onChange={(e) => setForm(f => ({ ...f, school_id: e.target.value }))}>
                <option value="">Pilih Sekolah...</option>
                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </Field>
            <Field label="Angkatan (cohort_id)" required>
              <Select value={form.cohort_id} onChange={(e) => setForm(f => ({ ...f, cohort_id: e.target.value }))}>
                <option value="">Pilih Angkatan...</option>
                {cohorts.filter(c => !form.school_id || c.school_id === Number(form.school_id)).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Siswa (student_id)" required hint="Daftar siswa per sekolah & TA tagihan; siswa saat ini selalu tercantum">
            <Select value={form.student_id} onChange={(e) => setForm(f => ({ ...f, student_id: e.target.value }))}>
              <option value="">Pilih Siswa...</option>
              {students.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.full_name} ({s.nis})
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {/* SECTION: PRODUK & FINANSIAL */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.1em] border-b border-slate-50 pb-2 mb-4">II. Data Produk & Finansial</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <Field label="Produk (product_id)" required>
              <Select value={form.product_id} onChange={(e) => setForm(f => ({ ...f, product_id: e.target.value }))}>
                <option value="">Pilih Produk...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </Field>
            <Field label="Tahun Ajaran (ay_id)" required>
              <Select value={form.academic_year_id} onChange={(e) => setForm(f => ({ ...f, academic_year_id: e.target.value }))}>
                <option value="">Pilih TA...</option>
                {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Total (total_amount)" required>
              <MoneyInput value={form.total_amount} onChange={(val) => setForm(f => ({ ...f, total_amount: val }))} />
            </Field>
            <Field label="Min Pembayaran">
              <MoneyInput value={form.min_payment} onChange={(val) => setForm(f => ({ ...f, min_payment: val }))} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Jumlah DIbayar (paid_amount)">
              <MoneyInput value={form.paid_amount} onChange={(val) => setForm(f => ({ ...f, paid_amount: val }))} />
            </Field>
            <Field label="Diskon (discount_amount)">
              <MoneyInput value={form.discount_amount} onChange={(val) => setForm(f => ({ ...f, discount_amount: val }))} />
            </Field>
          </div>
        </div>

        {/* SECTION: RINCIAN TAGIHAN */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.1em] border-b border-slate-50 pb-2 mb-4">III. Rincian & Status Tagihan</h3>
          
          <Field label="Judul Tagihan (title)" required>
            <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tanggal Jatuh Tempo">
              <Input type="date" value={form.due_date} onChange={(e) => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="unpaid">Belum Bayar (unpaid)</option>
                <option value="partial">Sebagian (partial)</option>
                <option value="paid">Lunas (paid)</option>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Bulan Tagihan">
              <Select value={form.bill_month} onChange={(e) => setForm(f => ({ ...f, bill_month: e.target.value }))}>
                <option value="">—</option>
                {billMonthSelectOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </Select>
            </Field>
            <Field label="Tahun Tagihan">
              <Select value={form.bill_year} onChange={(e) => setForm(f => ({ ...f, bill_year: e.target.value }))}>
                <option value="">—</option>
                {billYearSelectOptions().map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
              </Select>
            </Field>
          </div>
          
          <Field label="Tanggal Terkait (related_month)">
            <Input type="date" value={form.related_month} onChange={(e) => setForm(f => ({ ...f, related_month: e.target.value }))} />
          </Field>
        </div>

        {/* SECTION: LAINNYA */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden">
          <div className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.1em] border-b border-slate-50 pb-2 mb-4">IV. Tambahan</h3>
            <Field label="Catatan (notes)">
              <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Catatan internal..." />
            </Field>
          </div>

          <div className="bg-slate-50 p-6 flex gap-3 border-t border-slate-100">
            <Button type="submit" loading={saving} className="flex-1 justify-center py-3">
              Perbarui Data Tagihan
            </Button>
            <Link href="/billing/bills" className="flex-1">
              <Button type="button" variant="outline" className="w-full justify-center py-3">
                Batal & Kembali
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
