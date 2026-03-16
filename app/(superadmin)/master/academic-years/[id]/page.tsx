'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Field, Select, Button, Input } from '@/components/ui/FormFields';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

export default function EditAcademicYearPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [form, setForm] = useState({ name: '', is_active: false });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/master/academic-years')
      .then(r => r.json())
      .then(d => {
        const item = d.find((s: any) => String(s.id) === id);
        if (item) setForm({ name: item.name, is_active: item.is_active });
        setLoading(false);
      });
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/master/academic-years/${id}`, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(form) 
    });
    setSaving(false);
    router.push('/master/academic-years');
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Loading...</div>;

  return (
    <div className="p-6 max-w-[800px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/master/academic-years">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center"><ArrowLeft size={16} /></Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Edit Tahun Ajaran</h2>
          <p className="text-slate-400 text-[13px]">Modifikasi setelan tahun ajaran</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden">
        <div className="p-6 space-y-5">
          <Field label="Tahun Ajaran" required hint="Contoh: 2024/2025">
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
          </Field>
          <Field label="Status Aktif">
            <Select value={form.is_active ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'true' }))}>
              <option value="false">Tidak Aktif</option>
              <option value="true">Aktif</option>
            </Select>
          </Field>
        </div>
        <div className="bg-slate-50 border-t border-[#E2E8F1] p-5 flex justify-end gap-3">
          <Link href="/master/academic-years"><Button variant="ghost" type="button">Batal</Button></Link>
          <Button loading={saving} type="submit" disabled={!form.name}>Update Data</Button>
        </div>
      </form>
    </div>
  );
}
