'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Select, Button, Input } from '@/components/ui/FormFields';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

interface School { id: number; name: string; }

export default function EditLevelGradePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [schools, setSchools] = useState<School[]>([]);
  const [form, setForm] = useState({ school_id: '', name: '', level_order: '1' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/master/level-grades').then(r => r.json()),
      fetch('/api/master/schools').then(r => r.json())
    ]).then(([grades, sch]) => {
      setSchools(sch);
      const item = grades.find((s: any) => String(s.id) === id);
      if (item) {
        setForm({ 
          school_id: String(item.school_id), 
          name: item.name, 
          level_order: String(item.level_order) 
        });
      }
      setLoading(false);
    });
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/master/level-grades/${id}`, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({
        school_id: parseInt(form.school_id),
        name: form.name,
        level_order: parseInt(form.level_order)
      }) 
    });
    setSaving(false);
    router.push('/master/level-grades');
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Loading...</div>;

  return (
    <div className="p-6 max-w-[800px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/master/level-grades">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center"><ArrowLeft size={16} /></Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Edit Tingkat Kelas</h2>
          <p className="text-slate-400 text-[13px]">Modifikasi tingkat kelas</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden">
        <div className="p-6 space-y-5">
          <Field label="Sekolah" required>
            <Select value={form.school_id} onChange={e => setForm(f => ({ ...f, school_id: e.target.value }))}>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label="Tingkat Kelas" required hint="Contoh: Kelas 10, Primary 1">
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
          </Field>
          <Field label="Urutan Level" required hint="Angka urutan untuk diurutkan (Contoh: 10 untuk kelas 10)">
            <Input type="number" value={form.level_order} onChange={e => setForm(f => ({ ...f, level_order: e.target.value }))} />
          </Field>
        </div>
        <div className="bg-slate-50 border-t border-[#E2E8F1] p-5 flex justify-end gap-3">
          <Link href="/master/level-grades"><Button variant="ghost" type="button">Batal</Button></Link>
          <Button loading={saving} type="submit" disabled={!form.name || !form.school_id}>Update Data</Button>
        </div>
      </form>
    </div>
  );
}
