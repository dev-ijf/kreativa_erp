'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Input, Button } from '@/components/ui/FormFields';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

export default function EditTeacherPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [form, setForm] = useState({ nip: '', join_date: '', latest_education: '' });
  const [meta, setMeta] = useState({ user_full_name: '', user_email: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/master/teachers/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) return;
        setMeta({ user_full_name: d.user_full_name || '', user_email: d.user_email || '' });
        setForm({
          nip: d.nip || '',
          join_date: d.join_date ? String(d.join_date).slice(0, 10) : '',
          latest_education: d.latest_education || '',
        });
        setLoading(false);
      });
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/master/teachers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nip: form.nip || null,
        join_date: form.join_date || null,
        latest_education: form.latest_education || null,
      }),
    });
    setSaving(false);
    router.push('/master/teachers');
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Loading...</div>;

  return (
    <div className="p-6 max-w-[640px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/master/teachers">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Edit Guru</h2>
          <p className="text-slate-400 text-[13px]">
            {meta.user_full_name} · {meta.user_email}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden">
        <div className="p-6 space-y-5">
          <Field label="NIP">
            <Input value={form.nip} onChange={(e) => setForm((f) => ({ ...f, nip: e.target.value }))} />
          </Field>
          <Field label="Tanggal bergabung">
            <Input type="date" value={form.join_date} onChange={(e) => setForm((f) => ({ ...f, join_date: e.target.value }))} />
          </Field>
          <Field label="Pendidikan terakhir">
            <Input
              value={form.latest_education}
              onChange={(e) => setForm((f) => ({ ...f, latest_education: e.target.value }))}
            />
          </Field>
        </div>
        <div className="bg-slate-50 border-t border-[#E2E8F1] p-5 flex justify-end gap-3">
          <Link href="/master/teachers">
            <Button variant="ghost" type="button">
              Batal
            </Button>
          </Link>
          <Button loading={saving} type="submit">
            Update
          </Button>
        </div>
      </form>
    </div>
  );
}
