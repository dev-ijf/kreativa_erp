'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Select, Button, Input } from '@/components/ui/FormFields';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface School { id: number; name: string; }

export default function AddLevelGradePage() {
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [form, setForm] = useState({ school_id: '', name: '', level_order: '1', is_terminal: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/master/schools').then(r => r.json()).then(d => {
      setSchools(d);
      if (d.length > 0) setForm(f => ({ ...f, school_id: String(d[0].id) }));
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/master/level-grades', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({
        school_id: parseInt(form.school_id),
        name: form.name,
        level_order: parseInt(form.level_order),
        is_terminal: form.is_terminal,
      }) 
    });
    setSaving(false);
    router.push('/master/level-grades');
  };

  return (
    <div className="p-6 max-w-[800px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/master/level-grades">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center"><ArrowLeft size={16} /></Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Tambah Tingkat Kelas</h2>
          <p className="text-slate-400 text-[13px]">Input tingkatan kelas baru</p>
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
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Kelas 10" />
          </Field>
          <Field label="Urutan Level" required hint="Angka urutan untuk diurutkan (Contoh: 10 untuk kelas 10)">
            <Input type="number" value={form.level_order} onChange={e => setForm(f => ({ ...f, level_order: e.target.value }))} placeholder="1" />
          </Field>
          <label className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_terminal}
              onChange={(e) => setForm((f) => ({ ...f, is_terminal: e.target.checked }))}
            />
            Tingkat akhir (boleh lulus / keluar)
          </label>
        </div>
        <div className="bg-slate-50 border-t border-[#E2E8F1] p-5 flex justify-end gap-3">
          <Link href="/master/level-grades"><Button variant="ghost" type="button">Batal</Button></Link>
          <Button loading={saving} type="submit" disabled={!form.name || !form.school_id}>Simpan Data</Button>
        </div>
      </form>
    </div>
  );
}
