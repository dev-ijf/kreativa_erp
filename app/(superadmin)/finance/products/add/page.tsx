'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Select, Button, Input } from '@/components/ui/FormFields';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface School { id: number; name: string; }

export default function AddProductPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [form, setForm] = useState({ school_id: '', name: '', payment_type: 'monthly', category: 'spp' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/master/schools').then(r => r.json()).then(d => {
      setSchools(d);
      if (d.length > 0) setForm(f => ({ ...f, school_id: String(d[0].id) }));
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/finance/products', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ ...form, school_id: parseInt(form.school_id) }) 
    });
    setSaving(false);
    router.push('/finance/products');
  };

  return (
    <div className="p-6 max-w-[800px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/products">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center"><ArrowLeft size={16} /></Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Tambah Komponen Biaya</h2>
          <p className="text-slate-400 text-[13px]">Input jenis tagihan baru untuk siswa</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden">
        <div className="p-6 space-y-5">
          <Field label="Sekolah" required>
            <Select value={form.school_id} onChange={e => setForm(f => ({ ...f, school_id: e.target.value }))}>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label="Nama Komponen Biaya" required hint="Contoh: SPP Sekolah Dasar, Uang Gedung 2024">
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
          </Field>
          <Field label="Kategori" required>
            <Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              <option value="spp">SPP Bulanan</option>
              <option value="buku">Buku & Seragam</option>
              <option value="kegiatan">Kegiatan Siswa</option>
              <option value="pangkal">Uang Pangkal / Pembangunan</option>
              <option value="lainnya">Lainnya</option>
            </Select>
          </Field>
          <Field label="Tipe Pembayaran" required>
            <Select value={form.payment_type} onChange={e => setForm(f => ({ ...f, payment_type: e.target.value }))}>
              <option value="monthly">Bulanan (Ditagihkan tiap bulan)</option>
              <option value="one_time">Sekali Bayar (Lunas sekaligus)</option>
              <option value="installment">Bisa Dicicil (Bayar bertahap)</option>
            </Select>
          </Field>
        </div>
        <div className="bg-slate-50 border-t border-[#E2E8F1] p-5 flex justify-end gap-3">
          <Link href="/finance/products"><Button variant="ghost" type="button">Batal</Button></Link>
          <Button loading={saving} type="submit" disabled={!form.name || !form.school_id}>Simpan Data</Button>
        </div>
      </form>
    </div>
  );
}
