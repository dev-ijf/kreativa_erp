'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Field, Select, Button, Input, Textarea } from '@/components/ui/FormFields';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { use } from 'react';

export default function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [schools, setSchools] = useState<any[]>([]);
  const [form, setForm] = useState({ school_id: '', full_name: '', nis: '', nisn: '', gender: 'L', date_of_birth: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/students').then(r => r.json()),
      fetch('/api/master/schools').then(r => r.json())
    ]).then(([studs, sch]) => {
      setSchools(sch);
      const item = studs.find((s: any) => String(s.id) === id);
      if (item) {
        setForm({ 
          school_id: String(item.school_id), 
          full_name: item.full_name, 
          nis: item.nis, 
          nisn: item.nisn || '', 
          gender: item.gender, 
          date_of_birth: item.date_of_birth ? format(new Date(item.date_of_birth), 'yyyy-MM-dd') : '', 
          phone: item.phone || '', 
          address: item.address || ''
        });
      }
      setLoading(false);
    });
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/students/${id}`, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ ...form, school_id: parseInt(form.school_id) }) 
    });
    setSaving(false);
    router.push('/students');
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Loading...</div>;

  return (
    <div className="p-6 max-w-[900px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/students">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center"><ArrowLeft size={16} /></Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Edit Siswa</h2>
          <p className="text-slate-400 text-[13px]">Modifikasi data induk siswa</p>
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
          <Button loading={saving} type="submit" disabled={!form.full_name || !form.nis || !form.school_id}>Update Data</Button>
        </div>
      </form>
    </div>
  );
}
