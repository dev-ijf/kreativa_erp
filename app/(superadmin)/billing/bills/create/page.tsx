'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Field, Select, Button, Input, MoneyInput } from '@/components/ui/FormFields';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { billMonthSelectOptions, billYearSelectOptions } from '@/lib/billing-period-ui';

const TABS = [
  { id: 'single', label: 'Satu siswa' },
  { id: 'class', label: 'Satu kelas' },
  { id: 'spp12s', label: 'SPP 12 bln (siswa)' },
  { id: 'spp12c', label: 'SPP 12 bln (kelas)' },
  { id: 'import', label: 'Impor XLSX' },
] as const;

export default function CreateBillPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('single');
  const [schools, setSchools] = useState<{ id: number; name: string }[]>([]);
  const [academicYears, setAcademicYears] = useState<{ id: number; name: string }[]>([]);
  const [classes, setClasses] = useState<{ id: number; name: string; school_id: number }[]>([]);
  const [products, setProducts] = useState<{ id: number; name: string; payment_type: string }[]>([]);
  const [students, setStudents] = useState<{ id: number; full_name: string; nis: string; cohort_id?: number }[]>(
    []
  );
  const [cohortList, setCohortList] = useState<{ id: number; name: string; school_id: number }[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  const [schoolId, setSchoolId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [classId, setClassId] = useState('');
  const [cohortFilterId, setCohortFilterId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [productId, setProductId] = useState('');
  const [billMonth, setBillMonth] = useState('');
  const [billYear, setBillYear] = useState('');
  const [title, setTitle] = useState('');
  const [amountOverride, setAmountOverride] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [minPayment, setMinPayment] = useState('');

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
      if (active) setAcademicYearId(String(active.id));
      if (sch.length > 0) setSchoolId(String(sch[0].id));
    });
  }, []);

  useEffect(() => {
    setCohortFilterId('');
    if (!schoolId) {
      setCohortList([]);
      return;
    }
    fetch(`/api/master/cohorts?school_id=${schoolId}`)
      .then((r) => r.json())
      .then((d) => setCohortList(Array.isArray(d) ? d : []))
      .catch(() => setCohortList([]));
  }, [schoolId]);

  useEffect(() => {
    if (!academicYearId || !schoolId) {
      setStudents([]);
      return;
    }
    setLoadingStudents(true);
    const q = new URLSearchParams({
      school_id: schoolId,
      academic_year_id: academicYearId,
      limit: '200',
      page: '1',
    });
    if (classId) q.set('class_id', classId);
    fetch(`/api/students?${q}`)
      .then((r) => r.json())
      .then((d) => {
        setStudents(d.data || []);
      })
      .catch(() => setStudents([]))
      .finally(() => setLoadingStudents(false));
  }, [schoolId, academicYearId, classId]);

  const selectedProduct = products.find((p) => String(p.id) === productId);
  const pt = selectedProduct?.payment_type;

  const studentsFiltered = cohortFilterId
    ? students.filter((s) => String(s.cohort_id ?? '') === cohortFilterId)
    : students;

  const submitSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !productId || !academicYearId) {
      toast.error('Lengkapi siswa, produk, dan tahun ajaran');
      return;
    }
    const body: Record<string, unknown> = {
      mode: 'single',
      student_id: parseInt(studentId, 10),
      product_id: parseInt(productId, 10),
      academic_year_id: parseInt(academicYearId, 10),
    };
    if (title.trim()) body.title = title.trim();
    if (amountOverride.trim()) body.amount_override = amountOverride.trim();
    if (pt === 'monthly') {
      body.bill_month = parseInt(billMonth, 10);
      body.bill_year = parseInt(billYear, 10);
    }
    if (pt === 'annualy' && billYear.trim()) body.bill_year = parseInt(billYear, 10);
    if (discountAmount.trim()) body.discount_amount = discountAmount.trim();
    if (minPayment.trim()) body.min_payment = minPayment.trim();

    setSaving(true);
    try {
      const res = await fetch('/api/billing/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Gagal');
        return;
      }
      toast.success('Tagihan dibuat');
    } finally {
      setSaving(false);
    }
  };

  const submitClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId || !productId || !academicYearId) {
      toast.error('Lengkapi kelas, produk, dan tahun ajaran');
      return;
    }
    const body: Record<string, unknown> = {
      mode: 'class_single_period',
      class_id: parseInt(classId, 10),
      product_id: parseInt(productId, 10),
      academic_year_id: parseInt(academicYearId, 10),
    };
    if (title.trim()) body.title = title.trim();
    if (pt === 'monthly') {
      body.bill_month = parseInt(billMonth, 10);
      body.bill_year = parseInt(billYear, 10);
    }
    if (pt === 'annualy' && billYear.trim()) body.bill_year = parseInt(billYear, 10);
    if (discountAmount.trim()) body.discount_amount = discountAmount.trim();
    if (minPayment.trim()) body.min_payment = minPayment.trim();

    setSaving(true);
    try {
      const res = await fetch('/api/billing/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Gagal');
        return;
      }
      toast.success(
        `Berhasil: ${data.bills_created} tagihan untuk ${data.students_processed} siswa`
      );
    } finally {
      setSaving(false);
    }
  };

  const submitSpp12Student = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !productId || !academicYearId) {
      toast.error('Lengkapi siswa, produk SPP, dan tahun ajaran');
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        mode: 'spp_12_student',
        student_id: parseInt(studentId, 10),
        product_id: parseInt(productId, 10),
        academic_year_id: parseInt(academicYearId, 10),
      };
      if (discountAmount.trim()) body.discount_amount = discountAmount.trim();
      if (minPayment.trim()) body.min_payment = minPayment.trim();

      const res = await fetch('/api/billing/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Gagal');
        return;
      }
      toast.success(`${data.bills_created} tagihan SPP dibuat`);
    } finally {
      setSaving(false);
    }
  };

  const submitSpp12Class = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId || !productId || !academicYearId) {
      toast.error('Lengkapi kelas, produk SPP, dan tahun ajaran');
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        mode: 'spp_12_class',
        class_id: parseInt(classId, 10),
        product_id: parseInt(productId, 10),
        academic_year_id: parseInt(academicYearId, 10),
      };
      if (discountAmount.trim()) body.discount_amount = discountAmount.trim();
      if (minPayment.trim()) body.min_payment = minPayment.trim();

      const res = await fetch('/api/billing/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Gagal');
        return;
      }
      toast.success(
        `Berhasil: ${data.bills_created} tagihan untuk ${data.students_processed} siswa`
      );
    } finally {
      setSaving(false);
    }
  };

  const billImportContextReady =
    Boolean(schoolId) &&
    Boolean(cohortFilterId) &&
    Boolean(academicYearId) &&
    Boolean(classId) &&
    Boolean(productId);

  const appendBillImportContext = (fd: FormData) => {
    fd.set('school_id', schoolId);
    fd.set('cohort_id', cohortFilterId);
    fd.set('academic_year_id', academicYearId);
    fd.set('class_id', classId);
    fd.set('product_id', productId);
  };

  const downloadBillImportTemplate = () => {
    if (!billImportContextReady) {
      toast.error('Lengkapi Sekolah, Angkatan, Tahun ajaran, Kelas, dan Produk biaya');
      return;
    }
    const p = new URLSearchParams({
      school_id: schoolId,
      cohort_id: cohortFilterId,
      class_id: classId,
      academic_year_id: academicYearId,
      product_id: productId,
    });
    window.open(`/api/billing/bills/template?${p}`, '_blank');
  };

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!billImportContextReady) {
      toast.error(
        'Isi konteks impor di atas (sama seperti saat unduh template). File Excel tidak perlu berisi ID sekolah/produk.'
      );
      return;
    }
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      appendBillImportContext(fd);
      const res = await fetch('/api/billing/bills/import', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Impor gagal');
        return;
      }
      toast.success(`Impor: ${data.inserted} baru, ${data.skipped} duplikat`);
      if (data.errors?.length) {
        toast.message(data.errors.slice(0, 3).join('\n'), { duration: 6000 });
      }
    } finally {
      setImporting(false);
    }
  };

  const availableClasses = classes.filter((c) => !schoolId || String(c.school_id) === schoolId);

  const periodFields =
    pt === 'monthly' ? (
      <div className="grid grid-cols-2 gap-4">
        <Field label="Bulan" required>
          <Select value={billMonth} onChange={(e) => setBillMonth(e.target.value)}>
            <option value="">Pilih bulan</option>
            {billMonthSelectOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tahun" required>
          <Select value={billYear} onChange={(e) => setBillYear(e.target.value)}>
            <option value="">Pilih tahun</option>
            {billYearSelectOptions().map((y) => (
              <option key={y.value} value={y.value}>
                {y.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    ) : pt === 'annualy' ? (
      <Field label="Tahun kalender (opsional)">
        <Select value={billYear} onChange={(e) => setBillYear(e.target.value)}>
          <option value="">—</option>
          {billYearSelectOptions().map((y) => (
            <option key={y.value} value={y.value}>
              {y.label}
            </option>
          ))}
        </Select>
      </Field>
    ) : null;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Toaster richColors position="top-center" />
      <div className="flex items-center gap-4">
        <Link href="/billing/bills">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Tambah tagihan</h2>
          <p className="text-slate-400 text-[13px]">Pilih mode dan isi form — nominal dari Matriks Tarif</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'single' && (
        <form onSubmit={submitSingle} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <Field label="Sekolah" required>
            <Select value={schoolId} onChange={(e) => setSchoolId(e.target.value)}>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Angkatan (filter daftar siswa, opsional)">
            <Select
              value={cohortFilterId}
              onChange={(e) => {
                setCohortFilterId(e.target.value);
                setStudentId('');
              }}
            >
              <option value="">Semua angkatan</option>
              {cohortList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tahun ajaran" required>
            <Select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)}>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Kelas (opsional, untuk mempersempit daftar siswa)">
            <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">—</option>
              {availableClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Siswa" required>
            <Select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              disabled={loadingStudents}
            >
              <option value="">{loadingStudents ? 'Memuat…' : 'Pilih siswa'}</option>
              {studentsFiltered.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} — {s.nis}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Produk biaya" required>
            <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">Pilih</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.payment_type})
                </option>
              ))}
            </Select>
          </Field>
          {periodFields}
          <Field label="Judul (opsional, override)">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Nominal override (opsional)">
            <Input value={amountOverride} onChange={(e) => setAmountOverride(e.target.value)} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Diskon (opsional)">
              <MoneyInput value={discountAmount} onChange={(v) => setDiscountAmount(v)} placeholder="0" />
            </Field>
            <Field label="Min. bayar override (opsional)">
              <MoneyInput value={minPayment} onChange={(v) => setMinPayment(v)} placeholder="0" />
            </Field>
          </div>
          <Button type="submit" loading={saving}>
            Simpan tagihan
          </Button>
        </form>
      )}

      {tab === 'class' && (
        <form onSubmit={submitClass} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <Field label="Sekolah" required>
            <Select value={schoolId} onChange={(e) => setSchoolId(e.target.value)}>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Angkatan (opsional)">
            <Select value={cohortFilterId} onChange={(e) => setCohortFilterId(e.target.value)}>
              <option value="">Semua angkatan</option>
              {cohortList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tahun ajaran" required>
            <Select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)}>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Kelas" required>
            <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Pilih kelas</option>
              {availableClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Produk biaya" required>
            <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">Pilih</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.payment_type})
                </option>
              ))}
            </Select>
          </Field>
          {periodFields}
          <Field label="Judul (opsional)">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Diskon sama untuk semua (opsional)">
              <MoneyInput value={discountAmount} onChange={(v) => setDiscountAmount(v)} placeholder="0" />
            </Field>
            <Field label="Min. bayar sama untuk semua (opsional)">
              <MoneyInput value={minPayment} onChange={(v) => setMinPayment(v)} placeholder="0" />
            </Field>
          </div>
          <Button type="submit" loading={saving}>
            Buat tagihan untuk semua siswa kelas
          </Button>
        </form>
      )}

      {tab === 'spp12s' && (
        <form onSubmit={submitSpp12Student} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <p className="text-sm text-slate-500">
            Membuat 12 tagihan bulanan (SPP Juli–Juni) untuk satu siswa. Produk biasanya SPP bulanan.
          </p>
          <Field label="Sekolah" required>
            <Select value={schoolId} onChange={(e) => setSchoolId(e.target.value)}>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Angkatan (filter siswa, opsional)">
            <Select
              value={cohortFilterId}
              onChange={(e) => {
                setCohortFilterId(e.target.value);
                setStudentId('');
              }}
            >
              <option value="">Semua angkatan</option>
              {cohortList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tahun ajaran" required>
            <Select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)}>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Kelas (opsional)">
            <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">—</option>
              {availableClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Siswa" required>
            <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">Pilih</option>
              {studentsFiltered.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} — {s.nis}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Produk SPP (bulanan)" required>
            <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">Pilih</option>
              {products
                .filter((p) => p.payment_type === 'monthly')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </Select>
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Diskon per bulan (sama, opsional)">
              <MoneyInput value={discountAmount} onChange={(v) => setDiscountAmount(v)} placeholder="0" />
            </Field>
            <Field label="Min. bayar per bulan (override matriks, opsional)">
              <MoneyInput value={minPayment} onChange={(v) => setMinPayment(v)} placeholder="0" />
            </Field>
          </div>
          <Button type="submit" loading={saving}>
            Generate 12 bulan
          </Button>
        </form>
      )}

      {tab === 'spp12c' && (
        <form onSubmit={submitSpp12Class} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <p className="text-sm text-slate-500">
            Sama seperti menu Generate Tagihan: 12 bulan untuk setiap siswa aktif di kelas.
          </p>
          <Field label="Sekolah" required>
            <Select value={schoolId} onChange={(e) => setSchoolId(e.target.value)}>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Angkatan (opsional)">
            <Select value={cohortFilterId} onChange={(e) => setCohortFilterId(e.target.value)}>
              <option value="">Semua angkatan</option>
              {cohortList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tahun ajaran" required>
            <Select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)}>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Kelas" required>
            <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Pilih</option>
              {availableClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Produk SPP (bulanan)" required>
            <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">Pilih</option>
              {products
                .filter((p) => p.payment_type === 'monthly')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </Select>
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Diskon per bulan (sama, opsional)">
              <MoneyInput value={discountAmount} onChange={(v) => setDiscountAmount(v)} placeholder="0" />
            </Field>
            <Field label="Min. bayar per bulan (override matriks, opsional)">
              <MoneyInput value={minPayment} onChange={(v) => setMinPayment(v)} placeholder="0" />
            </Field>
          </div>
          <Button type="submit" loading={saving}>
            Generate untuk kelas
          </Button>
        </form>
      )}

      {tab === 'import' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <p className="text-sm text-slate-600 leading-relaxed">
            Pilih konteks tagihan di bawah (seperti impor siswa). File unduhan memuat kolom{' '}
            <span className="font-medium">school_id</span> / <span className="font-medium">school_label</span> dan
            pasangan ID–label untuk angkatan, tahun ajaran, kelas, dan produk (sama dengan dropdown), lalu baris siswa
            dan nominal dari Matriks Tarif. Saat unggah, sistem tetap mengirim ID dari form ini; kolom ID di Excel
            boleh dipakai sebagai cadangan jika isinya konsisten.
          </p>
          <Field label="Sekolah" required>
            <Select value={schoolId} onChange={(e) => setSchoolId(e.target.value)}>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Angkatan" required>
            <Select
              value={cohortFilterId}
              onChange={(e) => setCohortFilterId(e.target.value)}
              disabled={!schoolId}
            >
              <option value="">— Pilih angkatan —</option>
              {cohortList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tahun ajaran" required>
            <Select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)}>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Kelas (rombel)" required>
            <Select value={classId} onChange={(e) => setClassId(e.target.value)} disabled={!schoolId}>
              <option value="">— Pilih kelas —</option>
              {availableClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Produk biaya" required>
            <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">— Pilih produk —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.payment_type})
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex flex-wrap gap-2 items-center pt-2">
            <Button type="button" variant="outline" onClick={downloadBillImportTemplate} disabled={!billImportContextReady}>
              Unduh template .xlsx
            </Button>
            <label
              className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium ${
                !billImportContextReady || importing
                  ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              <input
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={onImportFile}
                disabled={importing || !billImportContextReady}
              />
              {importing ? <Loader2 size={16} className="animate-spin" /> : null}
              Unggah .xlsx
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
