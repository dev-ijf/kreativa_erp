'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Field, Select, Button, Input, Textarea } from '@/components/ui/FormFields';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [form, setForm] = useState({
    name: '',
    payment_type: 'monthly',
    is_installment: false,
    coa: '',
    coa_another: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/finance/products')
      .then((r) => r.json())
      .then((prods) => {
        const item = prods.find((s: { id: number }) => String(s.id) === id);
        if (item) {
          setForm({
            name: item.name,
            payment_type: item.payment_type,
            is_installment: !!item.is_installment,
            coa: item.coa || '',
            coa_another: item.coa_another || '',
            description: item.description || '',
          });
        }
        setLoading(false);
      });
  }, [id]);

  const setType = (type: string) => {
    setForm(f => ({
      ...f,
      payment_type: type,
      is_installment: type === 'monthly' ? false : f.is_installment
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/finance/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    router.push('/finance/products');
  };

  if (loading) return (
    <div className="p-10 text-center space-y-4">
      <div className="animate-spin h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full mx-auto" />
      <p className="text-slate-400 font-medium tracking-tight animate-pulse">Menyiapkan editor as-is-field-database...</p>
    </div>
  );

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/products">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Edit Komponen Biaya</h2>
          <p className="text-slate-400 text-[13px]">Modifikasi master produk global</p>
        </div>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden"
      >
        <div className="p-6 space-y-6">
          <Field label="Nama Komponen Biaya" required>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>

          <div className="grid grid-cols-2 gap-6 items-end">
            <Field label="Frekuensi Tagihan" required>
              <Select
                value={form.payment_type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="monthly">Bulanan (Monthly)</option>
                <option value="annualy">Tahunan (Annualy)</option>
                <option value="one_time">Sekali Bayar (One-time)</option>
              </Select>
            </Field>

            <div className="pb-3 flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
              <input
                type="checkbox"
                id="is_installment"
                className="w-4 h-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500 disabled:opacity-50"
                checked={form.is_installment}
                disabled={form.payment_type === 'monthly'}
                onChange={(e) => setForm(f => ({ ...f, is_installment: e.target.checked }))}
              />
              <label htmlFor="is_installment" className={`text-sm font-bold ${form.payment_type === 'monthly' ? 'text-slate-400' : 'text-slate-700 cursor-pointer'}`}>
                Dapat Dicicil? (Installment)
              </label>
            </div>
          </div>
          <Field label="COA (opsional)">
            <Input value={form.coa} onChange={(e) => setForm((f) => ({ ...f, coa: e.target.value }))} />
          </Field>
          <Field label="COA alternatif (opsional)">
            <Input
              value={form.coa_another}
              onChange={(e) => setForm((f) => ({ ...f, coa_another: e.target.value }))}
            />
          </Field>
          <Field label="Keterangan">
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
            />
          </Field>
        </div>
        <div className="bg-slate-50 border-t border-[#E2E8F1] p-5 flex justify-end gap-3">
          <Link href="/finance/products">
            <Button variant="ghost" type="button">
              Batal
            </Button>
          </Link>
          <Button loading={saving} type="submit" disabled={!form.name}>
            Update Data
          </Button>
        </div>
      </form>
    </div>
  );
}
