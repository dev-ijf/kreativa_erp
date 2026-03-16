'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Field, Select, Button, Input } from '@/components/ui/FormFields';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

export default function EditPaymentMethodPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [form, setForm] = useState({ name: '', code: '', category: 'bank_transfer', coa: '', is_active: true });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/finance/payment-methods')
      .then(r => r.json())
      .then(d => {
        const item = d.find((s: any) => String(s.id) === id);
        if (item) {
          setForm({ 
            name: item.name, 
            code: item.code, 
            category: item.category, 
            coa: item.coa || '', 
            is_active: item.is_active 
          });
        }
        setLoading(false);
      });
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/finance/payment-methods/${id}`, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(form) 
    });
    setSaving(false);
    router.push('/finance/payment-methods');
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Loading...</div>;

  return (
    <div className="p-6 max-w-[800px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/payment-methods">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center"><ArrowLeft size={16} /></Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Edit Metode Pembayaran</h2>
          <p className="text-slate-400 text-[13px]">Modifikasi data metode pembayaran</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden">
        <div className="p-6 space-y-5">
          <Field label="Nama Bank / E-Wallet" required hint="Contoh: Bank BSI, BCA, GoPay, Tunai">
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
          </Field>
          <Field label="Kode Identifikasi" required hint="Contoh: BSI, BCA, GOPAY (Gunakan huruf kapital blok)">
            <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
          </Field>
          <Field label="Kategori Metode" required>
            <Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              <option value="bank_transfer">Transfer Bank Manual</option>
              <option value="virtual_account">Virtual Account (Otomatis)</option>
              <option value="ewallet">E-Wallet (OVO/GoPay dll)</option>
              <option value="cash">Pembayaran Tunai (Kasir)</option>
            </Select>
          </Field>
          <Field label="Status Aktif">
            <Select value={form.is_active ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'true' }))}>
              <option value="true">Aktif - Bisa digunakan</option>
              <option value="false">Tidak Aktif - Disembunyikan</option>
            </Select>
          </Field>
        </div>
        <div className="bg-slate-50 border-t border-[#E2E8F1] p-5 flex justify-end gap-3">
          <Link href="/finance/payment-methods"><Button variant="ghost" type="button">Batal</Button></Link>
          <Button loading={saving} type="submit" disabled={!form.name || !form.code}>Update Data</Button>
        </div>
      </form>
    </div>
  );
}
