'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Field, Input, Textarea, Button } from '@/components/ui/FormFields';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';
import { toast } from 'sonner';
import { SchoolLogoFormField } from '@/components/master/SchoolLogoFormField';
import { uploadPublicBlob } from '@/lib/blob-upload';

export default function EditSchoolPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [form, setForm] = useState({
    name: '',
    address: '',
    bankChannelCode: '',
    schoolCode: '',
    schoolLogoUrl: '' as string,
  });
  const [themeId, setThemeId] = useState<'' | '1' | '2'>('');
  const [pendingLogo, setPendingLogo] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/master/schools')
      .then(r => r.json())
      .then(d => {
        const item = d.find((s: any) => String(s.id) === id);
        if (item) {
          setForm({
            name: item.name,
            address: item.address || '',
            bankChannelCode: item.bank_channel_code || '',
            schoolCode: item.school_code || '',
            schoolLogoUrl: item.school_logo_url || '',
          });
          const tid = item.theme_id;
          setThemeId(tid === 1 || tid === 2 ? String(tid) as '1' | '2' : '');
        }
        setLoading(false);
      });
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let schoolLogoUrl: string | null = form.schoolLogoUrl.trim() || null;
      if (pendingLogo) {
        schoolLogoUrl = await uploadPublicBlob(pendingLogo, `schools/${id}/logo`);
      }
      const res = await fetch(`/api/master/schools/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          address: form.address,
          bankChannelCode: form.bankChannelCode,
          schoolCode: form.schoolCode,
          schoolLogoUrl,
          themeId: themeId === '' ? null : Number(themeId),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error || 'Gagal menyimpan');
      }
      toast.success('Data sekolah diperbarui');
      router.push('/master/schools');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Loading...</div>;

  return (
    <div className="p-6 max-w-[800px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/master/schools">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center"><ArrowLeft size={16} /></Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Edit Sekolah</h2>
          <p className="text-slate-400 text-[13px]">Modifikasi data sekolah</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden">
        <div className="p-6 space-y-5">
          <Field label="Nama Sekolah" required>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
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
            existingUrl={form.schoolLogoUrl || null}
            pendingFile={pendingLogo}
            onPendingFileChange={setPendingLogo}
            disabled={saving}
          />
          <Field label="Kode channel bank">
            <Input
              value={form.bankChannelCode}
              onChange={(e) => setForm((f) => ({ ...f, bankChannelCode: e.target.value }))}
              className="font-mono text-sm"
            />
          </Field>
          <Field label="Kode sekolah">
            <Input
              value={form.schoolCode}
              onChange={(e) => setForm((f) => ({ ...f, schoolCode: e.target.value }))}
              className="font-mono text-sm"
            />
          </Field>
          <Field label="Alamat">
            <Textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          </Field>
        </div>
        <div className="bg-slate-50 border-t border-[#E2E8F1] p-5 flex justify-end gap-3">
          <Link href="/master/schools"><Button variant="ghost" type="button">Batal</Button></Link>
          <Button loading={saving} type="submit" disabled={!form.name}>Update Data</Button>
        </div>
      </form>
    </div>
  );
}
