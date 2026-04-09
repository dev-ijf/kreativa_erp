'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import { Button, Field, Input, Select, MoneyInput } from '@/components/ui/FormFields';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { confirmToast } from '@/components/ui/confirmToast';

interface TariffRow {
  id: number;
  school_id: number;
  product_id: number;
  academic_year_id: number;
  cohort_id: number;
  amount: string;
  school_name: string;
  product_name: string;
  academic_year_name: string;
  cohort_name: string;
}

interface Opt {
  id: number;
  name: string;
}

export default function ProductTariffsPage() {
  const [rows, setRows] = useState<TariffRow[]>([]);
  const [schools, setSchools] = useState<Opt[]>([]);
  const [products, setProducts] = useState<Opt[]>([]);
  const [years, setYears] = useState<Opt[]>([]);
  const [cohorts, setCohorts] = useState<Opt[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [form, setForm] = useState({
    school_id: '',
    product_id: '',
    academic_year_id: '',
    cohort_id: '',
    amount: '',
  });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/finance/product-tariffs').then((r) => r.json()),
      fetch('/api/master/schools').then((r) => r.json()),
      fetch('/api/finance/products').then((r) => r.json()),
      fetch('/api/master/academic-years').then((r) => r.json()),
    ]).then(([t, sch, prod, ay]) => {
      setRows(t);
      setSchools(sch);
      setProducts(prod);
      setYears(ay);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!form.school_id) {
      setCohorts([]);
      return;
    }
    fetch(`/api/master/cohorts?school_id=${form.school_id}`)
      .then((r) => r.json())
      .then((data) => setCohorts(Array.isArray(data) ? data : []))
      .catch(() => setCohorts([]));
  }, [form.school_id]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/finance/product-tariffs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        school_id: Number(form.school_id),
        product_id: Number(form.product_id),
        academic_year_id: Number(form.academic_year_id),
        cohort_id: Number(form.cohort_id),
        amount: Number(form.amount),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error(j.error || 'Gagal menyimpan tarif');
      return;
    }
    toast.success('Tarif berhasil disimpan');
    setForm((f) => ({ ...f, amount: '' }));
    load();
  };

  const handleDelete = async (id: number) => {
    confirmToast('Hapus baris tarif ini?', {
      confirmLabel: 'Hapus',
      onConfirm: async () => {
        setDeleting(id);
        const res = await fetch(`/api/finance/product-tariffs/${id}`, { method: 'DELETE' });
        setDeleting(null);
        if (!res.ok) {
          toast.error('Gagal menghapus tarif');
          return;
        }
        toast.success('Tarif dihapus');
        load();
      },
    });
  };

  const columns = [
    { key: 'school_name', label: 'Sekolah', sortable: true },
    { key: 'academic_year_name', label: 'Tahun Ajaran', sortable: true },
    { key: 'cohort_name', label: 'Angkatan', sortable: true },
    { key: 'product_name', label: 'Produk', sortable: true },
    {
      key: 'amount',
      label: 'Nominal',
      className: 'text-right font-medium',
      render: (r: TariffRow) => (
        <span>
          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(r.amount))}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'text-right w-16',
      render: (r: TariffRow) => (
        <Button
          size="sm"
          variant="danger"
          loading={deleting === r.id}
          onClick={() => handleDelete(r.id)}
        >
          <Trash2 size={13} />
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/finance/products">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Matriks Tarif</h2>
          <p className="text-slate-400 text-[13px]">
            Harga per sekolah, tahun ajaran, dan angkatan siswa
          </p>
        </div>
      </div>

      <form
        onSubmit={handleAdd}
        className="bg-white rounded-2xl border border-[#E2E8F1] p-5 grid grid-cols-1 md:grid-cols-6 gap-3 items-end"
      >
        <Field label="Sekolah">
          <Select
            value={form.school_id}
            onChange={(e) => setForm((f) => ({ ...f, school_id: e.target.value }))}
            required
          >
            <option value="">—</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tahun Ajaran">
          <Select
            value={form.academic_year_id}
            onChange={(e) => setForm((f) => ({ ...f, academic_year_id: e.target.value }))}
            required
          >
            <option value="">—</option>
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Angkatan">
          <Select
            value={form.cohort_id}
            onChange={(e) => setForm((f) => ({ ...f, cohort_id: e.target.value }))}
            required
          >
            <option value="">—</option>
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Produk">
          <Select
            value={form.product_id}
            onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))}
            required
          >
            <option value="">—</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Nominal Tarif">
          <MoneyInput
            value={form.amount}
            onChange={(val) => setForm((f) => ({ ...f, amount: val }))}
            required
            placeholder="0"
          />
        </Field>
        <Button type="submit" loading={saving} disabled={!form.school_id || !form.amount}>
          <Plus size={15} /> Simpan
        </Button>
      </form>

      <DataTable
        data={rows}
        columns={columns}
        loading={loading}
        rowKey={(r) => r.id}
        emptyText="Belum ada tarif — tambahkan di atas"
        showRowNumber
      />
    </div>
  );
}
