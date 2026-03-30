'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Button, Input, Select } from '@/components/ui/FormFields';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function AddSubdistrictPage() {
  const router = useRouter();
  const [provinces, setProvinces] = useState<{ id: number; name: string }[]>([]);
  const [cities, setCities] = useState<{ id: number; name: string }[]>([]);
  const [districts, setDistricts] = useState<{ id: number; name: string }[]>([]);
  const [form, setForm] = useState({
    province_id: '',
    city_id: '',
    district_id: '',
    name: '',
    postal_code: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/master/provinces')
      .then((r) => r.json())
      .then((d) => setProvinces(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    if (!form.province_id) {
      setCities([]);
      setForm((f) => ({ ...f, city_id: '', district_id: '' }));
      return;
    }
    fetch(`/api/master/cities?province_id=${form.province_id}`)
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : [];
        setCities(list);
        setForm((f) => ({
          ...f,
          city_id: list.length > 0 ? String(list[0].id) : '',
          district_id: '',
        }));
      });
  }, [form.province_id]);

  useEffect(() => {
    if (!form.city_id) {
      setDistricts([]);
      setForm((f) => ({ ...f, district_id: '' }));
      return;
    }
    fetch(`/api/master/districts?city_id=${form.city_id}`)
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : [];
        setDistricts(list);
        setForm((f) => ({
          ...f,
          district_id: list.length > 0 ? String(list[0].id) : '',
        }));
      });
  }, [form.city_id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const r = await fetch('/api/master/subdistricts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        district_id: Number(form.district_id),
        name: form.name,
        postal_code: form.postal_code.trim() || null,
      }),
    });
    setSaving(false);
    if (!r.ok) {
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      toast.error(j.error || 'Gagal menyimpan kelurahan/desa');
      return;
    }
    toast.success('Kelurahan/desa berhasil ditambahkan');
    router.push('/master/subdistricts');
  };

  return (
    <div className="p-6 max-w-[800px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/master/subdistricts">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Tambah Kelurahan / Desa</h2>
          <p className="text-slate-400 text-[13px]">Cascade: provinsi → kab/kota → kecamatan</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden">
        <div className="p-6 space-y-5">
          <Field label="Provinsi" required>
            <Select
              value={form.province_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, province_id: e.target.value, city_id: '', district_id: '' }))
              }
            >
              <option value="">— Pilih provinsi —</option>
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
              onChange={(e) => setForm((f) => ({ ...f, city_id: e.target.value, district_id: '' }))}
              disabled={!form.province_id}
            >
              <option value="">— Pilih kab/kota —</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Kecamatan" required>
            <Select
              value={form.district_id}
              onChange={(e) => setForm((f) => ({ ...f, district_id: e.target.value }))}
              disabled={!form.city_id}
            >
              <option value="">— Pilih kecamatan —</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nama Kelurahan / Desa" required>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Contoh: Dago"
            />
          </Field>
          <Field label="Kode pos" hint="Opsional">
            <Input
              value={form.postal_code}
              onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value }))}
              placeholder="40135"
              maxLength={10}
            />
          </Field>
        </div>
        <div className="bg-slate-50 border-t border-[#E2E8F1] p-5 flex justify-end gap-3">
          <Link href="/master/subdistricts">
            <Button variant="ghost" type="button">
              Batal
            </Button>
          </Link>
          <Button loading={saving} type="submit" disabled={!form.district_id || !form.name.trim()}>
            Simpan
          </Button>
        </div>
      </form>
    </div>
  );
}
