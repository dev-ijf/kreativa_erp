'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Input, Textarea, Button } from '@/components/ui/FormFields';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { SchoolLogoFormField } from '@/components/master/SchoolLogoFormField';
import { uploadPublicBlob } from '@/lib/blob-upload';

export default function AddSchoolPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', address: '', bankChannelCode: '', schoolCode: '' });
  const [themeId, setThemeId] = useState<'' | '1' | '2'>('');
  const [pendingLogo, setPendingLogo] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let schoolLogoUrl: string | null = null;
      if (pendingLogo) {
        schoolLogoUrl = await uploadPublicBlob(pendingLogo, 'schools/new/logo');
      }
      const res = await fetch('/api/master/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          schoolLogoUrl,
          themeId: themeId === '' ? null : Number(themeId),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error || 'Gagal menyimpan');
      }
      toast.success('Sekolah ditambahkan');
      router.push('/master/schools');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-[800px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/master/schools">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center"><ArrowLeft size={16} /></Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Tambah Sekolah</h2>
          <p className="text-slate-400 text-[13px]">Input data sekolah baru</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden">
        <div className="p-6 space-y-5">
          <Field label="Nama Sekolah" required>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="SMA Cendekia..." autoFocus />
          </Field>
          <Field
            label="Kurikulum (opsional)"
            hint="Disimpan di kolom theme_id: 1 = International, 2 = Nasional."
          >
            <div className="flex flex-wrap gap-5 text-[13px] text-slate-700">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="school_curriculum"
                  className="accent-violet-600"
                  checked={themeId === ''}
                  onChange={() => setThemeId('')}
                />
                Belum diatur
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="school_curriculum"
                  className="accent-violet-600"
                  checked={themeId === '1'}
                  onChange={() => setThemeId('1')}
                />
                International
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="school_curriculum"
                  className="accent-violet-600"
                  checked={themeId === '2'}
                  onChange={() => setThemeId('2')}
                />
                Nasional
              </label>
            </div>
          </Field>
          <SchoolLogoFormField
            existingUrl={null}
            pendingFile={pendingLogo}
            onPendingFileChange={setPendingLogo}
            disabled={saving}
          />
          <Field label="Kode channel bank">
            <Input
              value={form.bankChannelCode}
              onChange={(e) => setForm((f) => ({ ...f, bankChannelCode: e.target.value }))}
              placeholder="Kode dari bank / payment channel"
              className="font-mono text-sm"
            />
          </Field>
          <Field label="Kode sekolah">
            <Input
              value={form.schoolCode}
              onChange={(e) => setForm((f) => ({ ...f, schoolCode: e.target.value }))}
              placeholder="Kode unik sekolah (eksternal)"
              className="font-mono text-sm"
            />
          </Field>
          <Field label="Alamat">
            <Textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Jl. Mawar No 1..." />
          </Field>
        </div>
        <div className="bg-slate-50 border-t border-[#E2E8F1] p-5 flex justify-end gap-3">
          <Link href="/master/schools"><Button variant="ghost" type="button">Batal</Button></Link>
          <Button loading={saving} type="submit" disabled={!form.name}>Simpan Data</Button>
        </div>
      </form>
    </div>
  );
}
