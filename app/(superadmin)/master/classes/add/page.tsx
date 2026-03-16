'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Select, Button, Input } from '@/components/ui/FormFields';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface School { id: number; name: string; }
interface LevelGrade { id: number; school_id: number; name: string; }

export default function AddClassPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [levels, setLevels] = useState<LevelGrade[]>([]);
  const [form, setForm] = useState({ school_id: '', level_grade_id: '', name: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/master/schools').then(r => r.json()),
      fetch('/api/master/level-grades').then(r => r.json())
    ]).then(([sch, lvl]) => {
      setSchools(sch);
      setLevels(lvl);
      if (sch.length > 0) setForm(f => ({ ...f, school_id: String(sch[0].id) }));
    });
  }, []);

  useEffect(() => {
    if (form.school_id) {
      const filteredLevels = levels.filter(l => String(l.school_id) === form.school_id);
      if (filteredLevels.length > 0 && !filteredLevels.find(l => String(l.id) === form.level_grade_id)) {
        setForm(f => ({ ...f, level_grade_id: String(filteredLevels[0].id) }));
      }
    }
  }, [form.school_id, levels]);

  const filteredLevels = levels.filter(l => String(l.school_id) === form.school_id);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/master/classes', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({
        school_id: parseInt(form.school_id),
        level_grade_id: parseInt(form.level_grade_id),
        name: form.name
      }) 
    });
    setSaving(false);
    router.push('/master/classes');
  };

  return (
    <div className="p-6 max-w-[800px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/master/classes">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center"><ArrowLeft size={16} /></Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Tambah Kelas</h2>
          <p className="text-slate-400 text-[13px]">Input kelas baru</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden">
        <div className="p-6 space-y-5">
          <Field label="Sekolah" required>
            <Select value={form.school_id} onChange={e => setForm(f => ({ ...f, school_id: e.target.value }))}>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label="Tingkat Kelas" required>
            <Select value={form.level_grade_id} onChange={e => setForm(f => ({ ...f, level_grade_id: e.target.value }))}>
              <option value="">-- Pilih Tingkat --</option>
              {filteredLevels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </Select>
          </Field>
          <Field label="Nama Kelas" required hint="Contoh: 10 IPA 1, 1A">
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="10 IPA 1" />
          </Field>
        </div>
        <div className="bg-slate-50 border-t border-[#E2E8F1] p-5 flex justify-end gap-3">
          <Link href="/master/classes"><Button variant="ghost" type="button">Batal</Button></Link>
          <Button loading={saving} type="submit" disabled={!form.level_grade_id || !form.name}>Simpan Data</Button>
        </div>
      </form>
    </div>
  );
}
