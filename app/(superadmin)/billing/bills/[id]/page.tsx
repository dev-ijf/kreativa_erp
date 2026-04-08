'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Field, Button, Input, Select } from '@/components/ui/FormFields';
import { billMonthSelectOptions, billYearSelectOptions } from '@/lib/billing-period-ui';
import { ArrowLeft } from 'lucide-react';
import { toast, Toaster } from 'sonner';

type BillDetail = {
  id: number;
  title: string;
  total_amount: string;
  paid_amount: string;
  min_payment: string;
  due_date: string | null;
  status: string | null;
  bill_month: number | null;
  bill_year: number | null;
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
  const [form, setForm] = useState({
    title: '',
    total_amount: '',
    min_payment: '',
    due_date: '',
    bill_month: '',
    bill_year: '',
  });

  useEffect(() => {
    if (!id) return;
    fetch(`/api/billing/bills/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          toast.error(d.error);
          return;
        }
        setRow(d);
        setForm({
          title: d.title || '',
          total_amount: String(d.total_amount ?? ''),
          min_payment: String(d.min_payment ?? ''),
          due_date: d.due_date ? String(d.due_date).slice(0, 10) : '',
          bill_month: d.bill_month != null ? String(d.bill_month) : '',
          bill_year: d.bill_year != null ? String(d.bill_year) : '',
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  const paid = row ? parseFloat(String(row.paid_amount)) : 0;
  const readOnly = paid > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/billing/bills/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          total_amount: form.total_amount,
          min_payment: form.min_payment || undefined,
          due_date: form.due_date || null,
          bill_month: form.bill_month ? parseInt(form.bill_month, 10) : null,
          bill_year: form.bill_year ? parseInt(form.bill_year, 10) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Gagal menyimpan');
        return;
      }
      toast.success('Disimpan');
      router.push('/billing/bills');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-xl mx-auto text-slate-500">Memuat…</div>
    );
  }

  if (!row) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <p className="text-slate-600">Data tidak ditemukan</p>
        <Link href="/billing/bills" className="text-emerald-600 text-sm mt-2 inline-block">
          Kembali ke daftar
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <Toaster richColors position="top-center" />
      <div className="flex items-center gap-4">
        <Link href="/billing/bills">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Edit tagihan #{row.id}</h2>
          <p className="text-slate-400 text-[13px]">
            {row.student_name} — {row.product_name} — {row.academic_year_name}
          </p>
        </div>
      </div>

      {readOnly && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm px-4 py-3">
          Tagihan sudah ada pembayaran. Total tidak boleh di bawah jumlah yang sudah dibayar (
          {parseFloat(String(row.paid_amount)).toLocaleString('id-ID')})
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
        <Field label="Judul">
          <Input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </Field>
        <Field label="Total">
          <Input
            type="number"
            step="0.01"
            required
            value={form.total_amount}
            onChange={(e) => setForm((f) => ({ ...f, total_amount: e.target.value }))}
          />
        </Field>
        <Field label="Min. pembayaran">
          <Input
            type="number"
            step="0.01"
            value={form.min_payment}
            onChange={(e) => setForm((f) => ({ ...f, min_payment: e.target.value }))}
          />
        </Field>
        <Field label="Jatuh tempo">
          <Input
            type="date"
            value={form.due_date}
            onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Bulan tagihan">
            <Select
              value={form.bill_month}
              onChange={(e) => setForm((f) => ({ ...f, bill_month: e.target.value }))}
            >
              <option value="">—</option>
              {billMonthSelectOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tahun tagihan">
            <Select
              value={form.bill_year}
              onChange={(e) => setForm((f) => ({ ...f, bill_year: e.target.value }))}
            >
              <option value="">—</option>
              {billYearSelectOptions().map((y) => (
                <option key={y.value} value={y.value}>
                  {y.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="flex gap-2">
          <Button type="submit" loading={saving}>
            Simpan
          </Button>
          <Link href="/billing/bills">
            <Button type="button" variant="ghost">
              Batal
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
