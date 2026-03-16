'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Select, Button, Input, Textarea } from '@/components/ui/FormFields';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AddStudentPage() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [schools, setSchools] = useState<any[]>([]);
  const [form, setForm] = useState({ school_id: '', full_name: '', nis: '', nisn: '', gender: 'L', date_of_birth: '', phone: '', address: '' });
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
    await fetch('/api/students', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ ...form, school_id: parseInt(form.school_id) }) 
    });
    setSaving(false);
    router.push('/students');
  };

  return (
    <div className="p-6 max-w-[900px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/students">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center"><ArrowLeft size={16} /></Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Tambah Siswa</h2>
          <p className="text-slate-400 text-[13px]">Input data induk siswa</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden">
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Sekolah" required>
            <Select value={form.school_id} onChange={e => setForm(f => ({ ...f, school_id: e.target.value }))}>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label="Pilih Jenis Kelamin" required>
            <Select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
              <option value="L">Laki-laki</option><option value="P">Perempuan</option>
            </Select>
          </Field>
          <Field label="Nama Lengkap" required><Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} autoFocus /></Field>
          <Field label="No. Telpon / WA"><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></Field>
          <Field label="NIS" required><Input value={form.nis} onChange={e => setForm(f => ({ ...f, nis: e.target.value }))} /></Field>
          <Field label="NISN"><Input value={form.nisn} onChange={e => setForm(f => ({ ...f, nisn: e.target.value }))} /></Field>
          <Field label="Tanggal Lahir"><Input type="date" value={form.date_of_birth} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} /></Field>
          <div className="md:col-span-2">
            <Field label="Alamat"><Textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></Field>
          </div>
        </div>
        <div className="bg-slate-50 border-t border-[#E2E8F1] p-5 flex justify-end gap-3">
          <Link href="/students"><Button variant="ghost" type="button">Batal</Button></Link>
          <Button loading={saving} type="submit" disabled={!form.full_name || !form.nis || !form.school_id}>Simpan Data</Button>
        </div>
      </form>
    </div>
  );
}
