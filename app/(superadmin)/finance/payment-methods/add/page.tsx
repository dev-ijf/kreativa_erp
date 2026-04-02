'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Select, Button, Input } from '@/components/ui/FormFields';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AddPaymentMethodPage() {
  const router = useRouter();
  const [form, setForm] = useState({ 
    name: '', 
    code: '', 
    category: 'bank_transfer', 
    coa: '', 
    vendor: '',
    is_publish: true,
    is_redirect: false,
    is_active: true 
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/finance/payment-methods', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(form) 
    });
    setSaving(false);
    router.push('/finance/payment-methods');
  };

  return (
    <div className="p-6 max-w-[800px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/payment-methods">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center"><ArrowLeft size={16} /></Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Tambah Metode Pembayaran</h2>
          <p className="text-slate-400 text-[13px]">Input rekening bank / VA / E-wallet</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden">
        <div className="p-6 space-y-5">
          <Field label="Nama Bank / E-Wallet" required hint="Contoh: Bank BSI, BCA, GoPay, Tunai">
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
          </Field>
          <Field label="Vendor / Penyedia" hint="Contoh: Zains, Midtrans, atau Nama Bank">
            <Input value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} />
          </Field>
          <Field label="Kode COA (Accounting)" hint="Contoh: 1-1101 (Kas) atau 1-1102 (Bank)">
            <Input value={form.coa} onChange={e => setForm(f => ({ ...f, coa: e.target.value }))} />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Status Publish">
              <Select value={form.is_publish ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, is_publish: e.target.value === 'true' }))}>
                <option value="true">Published - Muncul di Portal</option>
                <option value="false">Draft - Disembunyikan</option>
              </Select>
            </Field>
            <Field label="Redirect ke Vendor?">
              <Select value={form.is_redirect ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, is_redirect: e.target.value === 'true' }))}>
                <option value="false">Tidak - Tetap di App</option>
                <option value="true">Ya - Buka Halaman Vendor</option>
              </Select>
            </Field>
          </div>
          <Field label="Status Aktif">
            <Select value={form.is_active ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'true' }))}>
              <option value="true">Aktif - Bisa digunakan</option>
              <option value="false">Tidak Aktif - Nonaktifkan Permanen</option>
            </Select>
          </Field>
        </div>
        <div className="bg-slate-50 border-t border-[#E2E8F1] p-5 flex justify-end gap-3">
          <Link href="/finance/payment-methods"><Button variant="ghost" type="button">Batal</Button></Link>
          <Button loading={saving} type="submit" disabled={!form.name || !form.code}>Simpan Data</Button>
        </div>
      </form>
    </div>
  );
}
