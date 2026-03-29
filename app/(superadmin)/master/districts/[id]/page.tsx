'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Button, Input, Select } from '@/components/ui/FormFields';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

export default function EditDistrictPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [provinces, setProvinces] = useState<{ id: number; name: string }[]>([]);
  const [cities, setCities] = useState<{ id: number; name: string }[]>([]);
  const [form, setForm] = useState({ province_id: '', city_id: '', name: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/master/provinces')
      .then((r) => r.json())
      .then((d) => setProvinces(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    if (!form.province_id) {
      setCities([]);
      return;
    }
    fetch(`/api/master/cities?province_id=${form.province_id}`)
      .then((r) => r.json())
      .then((d) => setCities(Array.isArray(d) ? d : []));
  }, [form.province_id]);

  useEffect(() => {
    fetch(`/api/master/districts/${id}`)
      .then((r) => r.json())
      .then((row) => {
        if (row && row.city_id != null) {
          setForm({
            province_id: row.province_id != null ? String(row.province_id) : '',
            city_id: String(row.city_id),
            name: row.name ?? '',
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const r = await fetch(`/api/master/districts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city_id: Number(form.city_id), name: form.name }),
    });
    setSaving(false);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      alert((j as { error?: string }).error || 'Gagal menyimpan');
      return;
    }
    router.push('/master/districts');
  };

  if (loading) {
    return <div className="p-6 text-slate-400 text-[13px]">Memuat...</div>;
  }

  return (
    <div className="p-6 max-w-[800px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/master/districts">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Edit Kecamatan</h2>
          <p className="text-slate-400 text-[13px]">ID #{id}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden">
        <div className="p-6 space-y-5">
          <Field label="Provinsi" required>
            <Select
              value={form.province_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, province_id: e.target.value, city_id: '' }))
              }
            >
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Kabupaten / Kota" required>
            <Select
              value={form.city_id}
              onChange={(e) => setForm((f) => ({ ...f, city_id: e.target.value }))}
              disabled={!form.province_id}
            >
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nama Kecamatan" required>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Contoh: Coblong"
            />
          </Field>
        </div>
        <div className="bg-slate-50 border-t border-[#E2E8F1] p-5 flex justify-end gap-3">
          <Link href="/master/districts">
            <Button variant="ghost" type="button">
              Batal
            </Button>
          </Link>
          <Button loading={saving} type="submit" disabled={!form.city_id || !form.name.trim()}>
            Simpan
          </Button>
        </div>
      </form>
    </div>
  );
}
