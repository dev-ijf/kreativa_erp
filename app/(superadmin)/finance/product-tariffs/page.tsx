'use client';

import { useEffect, useMemo, useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import { Button, Field, Select, MoneyInput } from '@/components/ui/FormFields';
import { Plus, Trash2, ArrowLeft, Edit2, X } from 'lucide-react';
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
  min_payment?: string;
  product_is_installment?: boolean;
  school_name: string;
  product_name: string;
  academic_year_name: string;
  cohort_name: string;
}

interface Opt {
  id: number;
  name: string;
}

interface ProductOpt extends Opt {
  is_installment?: boolean;
}

const emptyForm = {
  school_id: '',
  product_id: '',
  academic_year_id: '',
  cohort_id: '',
  amount: '',
  min_payment: '',
};

export default function ProductTariffsPage() {
  const [rows, setRows] = useState<TariffRow[]>([]);
  const [schools, setSchools] = useState<Opt[]>([]);
  const [products, setProducts] = useState<ProductOpt[]>([]);
  const [years, setYears] = useState<Opt[]>([]);
  const [cohorts, setCohorts] = useState<Opt[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === Number(form.product_id)),
    [products, form.product_id]
  );
  const showMinPayment = Boolean(selectedProduct?.is_installment);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/finance/product-tariffs').then((r) => r.json()),
      fetch('/api/master/schools').then((r) => r.json()),
      fetch('/api/finance/products').then((r) => r.json()),
      fetch('/api/master/academic-years').then((r) => r.json()),
    ]).then(([t, sch, prod, ay]) => {
      setRows(Array.isArray(t) ? t : []);
      setSchools(sch);
      setProducts(Array.isArray(prod) ? prod : []);
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

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const startEdit = (r: TariffRow) => {
    setEditingId(r.id);
    setForm({
      school_id: String(r.school_id),
      product_id: String(r.product_id),
      academic_year_id: String(r.academic_year_id),
      cohort_id: String(r.cohort_id),
      amount: String(r.amount ?? ''),
      min_payment: String(r.min_payment ?? '0'),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      school_id: Number(form.school_id),
      product_id: Number(form.product_id),
      academic_year_id: Number(form.academic_year_id),
      cohort_id: Number(form.cohort_id),
      amount: Number(form.amount),
      min_payment: showMinPayment ? Number(form.min_payment || 0) : 0,
    };

    const res =
      editingId != null
        ? await fetch(`/api/finance/product-tariffs/${editingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/finance/product-tariffs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

    setSaving(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error(j.error || 'Gagal menyimpan tarif');
      return;
    }
    toast.success(editingId != null ? 'Tarif diperbarui' : 'Tarif berhasil disimpan');
    cancelEdit();
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
        if (editingId === id) cancelEdit();
        load();
      },
    });
  };

  const fmtIdr = (v: string | number | undefined) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(v ?? 0));

  const columns = [
    { key: 'school_name', label: 'Sekolah', sortable: true },
    { key: 'academic_year_name', label: 'Tahun Ajaran', sortable: true },
    { key: 'cohort_name', label: 'Angkatan', sortable: true },
    { key: 'product_name', label: 'Produk', sortable: true },
    {
      key: 'amount',
      label: 'Nominal',
      className: 'text-right font-medium',
      render: (r: TariffRow) => <span>{fmtIdr(r.amount)}</span>,
    },
    {
      key: 'min_payment',
      label: 'Min. bayar',
      className: 'text-right text-slate-600',
      render: (r: TariffRow) => (
        <span>{r.product_is_installment ? fmtIdr(r.min_payment) : '—'}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'text-right w-28',
      render: (r: TariffRow) => (
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            title="Edit"
            onClick={() => startEdit(r)}
          >
            <Edit2 size={13} />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="danger"
            loading={deleting === r.id}
            onClick={() => handleDelete(r.id)}
          >
            <Trash2 size={13} />
          </Button>
        </div>
      ),
    },
  ];

  const dimsLocked = editingId != null;

  return (
    <div className="p-6 space-y-6 max-w-[1280px] mx-auto">
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
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-[#E2E8F1] p-5 space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
          <Field label="Sekolah">
            <Select
              value={form.school_id}
              onChange={(e) => setForm((f) => ({ ...f, school_id: e.target.value }))}
              required
              disabled={dimsLocked}
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
              disabled={dimsLocked}
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
              disabled={dimsLocked}
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
              disabled={dimsLocked}
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
          {showMinPayment ? (
            <Field label="Min. bayar (cicilan)">
              <MoneyInput
                value={form.min_payment}
                onChange={(val) => setForm((f) => ({ ...f, min_payment: val }))}
                placeholder="0"
              />
            </Field>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" loading={saving} disabled={!form.school_id || !form.amount}>
            {editingId != null ? (
              <>
                <Edit2 size={15} /> Perbarui
              </>
            ) : (
              <>
                <Plus size={15} /> Simpan
              </>
            )}
          </Button>
          {editingId != null ? (
            <Button type="button" variant="outline" onClick={cancelEdit}>
              <X size={15} /> Batal
            </Button>
          ) : null}
        </div>
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
