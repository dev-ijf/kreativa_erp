'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Select, Button, Input, Textarea } from '@/components/ui/FormFields';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AddProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    payment_type: 'monthly',
    coa: '',
    coa_another: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/finance/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    router.push('/finance/products');
  };

  return (
    <div className="p-6 max-w-[800px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/products">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Tambah Komponen Biaya</h2>
          <p className="text-slate-400 text-[13px]">Master global — setelah itu atur tarif per sekolah</p>
        </div>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden"
      >
        <div className="p-6 space-y-5">
          <Field label="Nama Komponen Biaya" required hint="Contoh: SPP Bulanan, Uang Gedung">
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              autoFocus
            />
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
            Simpan Data
          </Button>
        </div>
      </form>
    </div>
  );
}
