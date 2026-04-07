'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Input, Button, Select, Textarea } from '@/components/ui/FormFields';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AddAnnouncementPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<{ id: number; name: string }[]>([]);
  const [form, setForm] = useState({
    school_id: '',
    publish_date: '',
    title_en: '',
    title_id: '',
    content_en: '',
    content_id: '',
    featured_image: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/master/schools')
      .then((r) => r.json())
      .then((d) => setSchools(Array.isArray(d) ? d : []));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/academic/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        school_id: Number(form.school_id),
        publish_date: form.publish_date,
        title_en: form.title_en,
        title_id: form.title_id,
        content_en: form.content_en,
        content_id: form.content_id,
        featured_image: form.featured_image || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert((j as { error?: string }).error || 'Gagal menyimpan');
      return;
    }
    router.push('/academic/announcements');
  };

  return (
    <div className="p-6 max-w-[800px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/academic/announcements">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Tambah Pengumuman</h2>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden">
        <div className="p-6 space-y-5">
          <Field label="Sekolah" required>
            <Select
              value={form.school_id}
              onChange={(e) => setForm((f) => ({ ...f, school_id: e.target.value }))}
              required
            >
              <option value="">Pilih sekolah</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tanggal terbit" required>
            <Input
              type="date"
              value={form.publish_date}
              onChange={(e) => setForm((f) => ({ ...f, publish_date: e.target.value }))}
            />
          </Field>
          <Field label="Judul (ID)" required>
            <Input value={form.title_id} onChange={(e) => setForm((f) => ({ ...f, title_id: e.target.value }))} />
          </Field>
          <Field label="Judul (EN)" required>
            <Input value={form.title_en} onChange={(e) => setForm((f) => ({ ...f, title_en: e.target.value }))} />
          </Field>
          <Field label="Isi (ID)" required>
            <Textarea
              rows={5}
              value={form.content_id}
              onChange={(e) => setForm((f) => ({ ...f, content_id: e.target.value }))}
            />
          </Field>
          <Field label="Isi (EN)" required>
            <Textarea
              rows={5}
              value={form.content_en}
              onChange={(e) => setForm((f) => ({ ...f, content_en: e.target.value }))}
            />
          </Field>
          <Field label="URL gambar unggulan">
            <Input
              value={form.featured_image}
              onChange={(e) => setForm((f) => ({ ...f, featured_image: e.target.value }))}
            />
          </Field>
        </div>
        <div className="bg-slate-50 border-t border-[#E2E8F1] p-5 flex justify-end gap-3">
          <Link href="/academic/announcements">
            <Button variant="ghost" type="button">
              Batal
            </Button>
          </Link>
          <Button
            loading={saving}
            type="submit"
            disabled={
              !form.school_id ||
              !form.publish_date ||
              !form.title_en ||
              !form.title_id ||
              !form.content_en ||
              !form.content_id
            }
          >
            Simpan
          </Button>
        </div>
      </form>
    </div>
  );
}
