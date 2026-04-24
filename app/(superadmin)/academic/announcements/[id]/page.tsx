'use client';

import { useEffect, useRef, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Input, Button, Select } from '@/components/ui/FormFields';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { ArrowLeft, ImagePlus, X } from 'lucide-react';
import Link from 'next/link';

export default function EditAnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [schools, setSchools] = useState<{ id: number; name: string }[]>([]);
  const [form, setForm] = useState({
    school_id: '',
    publish_date: '',
    title_en: '',
    title_id: '',
    content_en: '',
    content_id: '',
    active: true,
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [serverImage, setServerImage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/master/schools').then((r) => r.json()),
      fetch(`/api/academic/announcements/${id}`).then((r) => r.json()),
    ]).then(([sch, row]) => {
      setSchools(Array.isArray(sch) ? sch : []);
      if (row && !row.error) {
        setForm({
          school_id: String(row.school_id ?? ''),
          publish_date: String(row.publish_date || '').slice(0, 10),
          title_en: row.title_en ?? '',
          title_id: row.title_id ?? '',
          content_en: row.content_en ?? '',
          content_id: row.content_id ?? '',
          active: row.active !== false && row.active !== 'false',
        });
        const img = row.featured_image ?? '';
        setServerImage(img);
        setImagePreview(img);
      }
      setLoading(false);
    });
  }, [id]);

  const handlePickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview('');
    setServerImage('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let featuredImage: string | null = null;

    if (imageFile) {
      const fd = new FormData();
      fd.append('file', imageFile);
      fd.append('prefix', 'announcements');
      const upRes = await fetch('/api/upload/blob', { method: 'POST', body: fd });
      if (!upRes.ok) {
        const j = await upRes.json().catch(() => ({}));
        alert((j as { error?: string }).error || 'Gagal mengunggah gambar');
        setSaving(false);
        return;
      }
      const upData = (await upRes.json()) as { url: string };
      featuredImage = upData.url;
    } else if (imagePreview && !imageFile) {
      featuredImage = serverImage || null;
    }

    const res = await fetch(`/api/academic/announcements/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        school_id: Number(form.school_id),
        publish_date: form.publish_date,
        title_en: form.title_en,
        title_id: form.title_id,
        content_en: form.content_en,
        content_id: form.content_id,
        featured_image: featuredImage,
        active: form.active,
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

  if (loading) return <div className="p-10 text-center text-slate-400">Memuat…</div>;

  return (
    <div className="p-6 max-w-[800px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/academic/announcements">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Edit Pengumuman</h2>
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
          <label className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              className="rounded border-slate-300"
            />
            Pengumuman aktif (ditampilkan)
          </label>
          <Field label="Isi (ID)" required>
            <RichTextEditor
              value={form.content_id}
              onChange={(html) => setForm((f) => ({ ...f, content_id: html }))}
              uploadPrefix="announcements"
            />
          </Field>
          <Field label="Isi (EN)" required>
            <RichTextEditor
              value={form.content_en}
              onChange={(html) => setForm((f) => ({ ...f, content_en: html }))}
              uploadPrefix="announcements"
            />
          </Field>
          <Field label="Gambar unggulan">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handlePickImage}
              className="hidden"
              title="Pilih gambar unggulan"
            />
            {imagePreview ? (
              <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Preview" className="w-full max-h-[240px] object-contain" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-300 transition-all shadow-sm"
                  title="Hapus gambar"
                >
                  <X size={14} />
                </button>
                {imageFile && (
                  <div className="px-3 py-2 text-[12px] text-slate-500 border-t border-slate-200 bg-white truncate">
                    {imageFile.name} ({(imageFile.size / 1024).toFixed(0)} KB)
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-violet-300 hover:text-violet-500 transition-colors"
              >
                <ImagePlus size={28} strokeWidth={1.5} />
                <span className="text-[13px] font-medium">Klik untuk pilih gambar</span>
                <span className="text-[11px]">PNG, JPG, WebP — maks 10 MB</span>
              </button>
            )}
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
            Update
          </Button>
        </div>
      </form>
    </div>
  );
}
