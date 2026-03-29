'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Button, Input, Select } from '@/components/ui/FormFields';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AddCityPage() {
  const router = useRouter();
  const [provinces, setProvinces] = useState<{ id: number; name: string }[]>([]);
  const [form, setForm] = useState({ province_id: '', name: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/master/provinces')
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : [];
        setProvinces(list);
        if (list.length > 0) setForm((f) => ({ ...f, province_id: String(list[0].id) }));
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const r = await fetch('/api/master/cities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ province_id: Number(form.province_id), name: form.name }),
    });
    setSaving(false);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      alert((j as { error?: string }).error || 'Gagal menyimpan');
      return;
    }
    router.push('/master/cities');
  };

  return (
    <div className="p-6 max-w-[800px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/master/cities">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Tambah Kabupaten / Kota</h2>
          <p className="text-slate-400 text-[13px]">Pilih provinsi lalu nama wilayah</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden">
        <div className="p-6 space-y-5">
          <Field label="Provinsi" required>
            <Select
              value={form.province_id}
              onChange={(e) => setForm((f) => ({ ...f, province_id: e.target.value }))}
            >
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nama Kabupaten / Kota" required>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Contoh: Kota Bandung"
            />
          </Field>
        </div>
        <div className="bg-slate-50 border-t border-[#E2E8F1] p-5 flex justify-end gap-3">
          <Link href="/master/cities">
            <Button variant="ghost" type="button">
              Batal
            </Button>
          </Link>
          <Button loading={saving} type="submit" disabled={!form.province_id || !form.name.trim()}>
            Simpan
          </Button>
        </div>
      </form>
    </div>
  );
}
