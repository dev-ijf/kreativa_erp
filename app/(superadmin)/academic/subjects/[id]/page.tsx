'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Input, Button } from '@/components/ui/FormFields';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditSubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [form, setForm] = useState({ code: '', name_en: '', name_id: '', color_theme: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/academic/subjects/${id}`)
      .then((r) => r.json())
      .then((item) => {
        if (item?.error) return;
        setForm({
          code: item.code ?? '',
          name_en: item.name_en ?? '',
          name_id: item.name_id ?? '',
          color_theme: item.color_theme ?? '',
        });
        setLoading(false);
      });
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/academic/subjects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: form.code || null,
        name_en: form.name_en,
        name_id: form.name_id,
        color_theme: form.color_theme || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert((j as { error?: string }).error || 'Gagal menyimpan');
      return;
    }
    router.push('/academic/subjects');
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Memuat…</div>;

  return (
    <div className="p-6 max-w-[800px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/academic/subjects">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Edit Mapel</h2>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden">
        <div className="p-6 space-y-5">
          <Field label="Kode">
            <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
          </Field>
          <Field label="Nama (Bahasa Indonesia)" required>
            <Input value={form.name_id} onChange={(e) => setForm((f) => ({ ...f, name_id: e.target.value }))} autoFocus />
          </Field>
          <Field label="Nama (English)" required>
            <Input value={form.name_en} onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))} />
          </Field>
          <Field label="Tema warna">
            <Input value={form.color_theme} onChange={(e) => setForm((f) => ({ ...f, color_theme: e.target.value }))} />
          </Field>
        </div>
        <div className="bg-slate-50 border-t border-[#E2E8F1] p-5 flex justify-end gap-3">
          <Link href="/academic/subjects">
            <Button variant="ghost" type="button">
              Batal
            </Button>
          </Link>
          <Button loading={saving} type="submit" disabled={!form.name_en || !form.name_id}>
            Update
          </Button>
        </div>
      </form>
    </div>
  );
}
