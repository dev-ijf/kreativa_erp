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
            coa: item.coa || '',
            coa_another: item.coa_another || '',
            description: item.description || '',
          });
        }
        setLoading(false);
      });
  }, [id]);

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

  if (loading) return <div className="p-10 text-center text-slate-400">Loading...</div>;

  return (
    <div className="p-6 max-w-[800px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/products">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Edit Komponen Biaya</h2>
          <p className="text-slate-400 text-[13px]">Modifikasi master produk global</p>
        </div>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden"
      >
        <div className="p-6 space-y-5">
          <Field label="Nama Komponen Biaya" required>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Tipe Pembayaran" required>
            <Select
              value={form.payment_type}
              onChange={(e) => setForm((f) => ({ ...f, payment_type: e.target.value }))}
            >
              <option value="monthly">Bulanan</option>
              <option value="annualy">Tahunan</option>
              <option value="one_time">Sekali Bayar</option>
              <option value="installment">Cicilan</option>
            </Select>
          </Field>
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
