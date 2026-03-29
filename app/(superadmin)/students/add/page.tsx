'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Select, Button, Input } from '@/components/ui/FormFields';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AddStudentPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<{ id: number; name: string }[]>([]);
  const [years, setYears] = useState<{ id: number; name: string }[]>([]);
  const [form, setForm] = useState({
    school_id: '',
    full_name: '',
    nis: '',
    nisn: '',
    gender: 'L',
    student_type: 'Reguler',
    program: '',
    username: '',
    entry_academic_year_id: '',
    active_academic_year_id: '',
    class_id: '',
  });
  const [classes, setClasses] = useState<{ id: number; name: string; level_name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/master/schools').then((r) => r.json()),
      fetch('/api/master/academic-years').then((r) => r.json()),
    ]).then(([sch, ay]) => {
      setSchools(sch);
      setYears(ay);
      if (sch.length > 0) setForm((f) => ({ ...f, school_id: String(sch[0].id) }));
      const active = ay.find((y: { is_active: boolean }) => y.is_active);
      if (active) {
        setForm((f) => ({
          ...f,
          entry_academic_year_id: String(active.id),
          active_academic_year_id: String(active.id),
        }));
      }
    });
  }, []);

  useEffect(() => {
    if (!form.school_id) {
      setClasses([]);
      return;
    }
    fetch('/api/master/classes')
      .then((r) => r.json())
      .then((cls) => {
        const list = Array.isArray(cls) ? cls : [];
        setClasses(list.filter((c: { school_id: number }) => String(c.school_id) === form.school_id));
      })
      .catch(() => setClasses([]));
  }, [form.school_id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        school_id: parseInt(form.school_id, 10),
        full_name: form.full_name,
        nis: form.nis,
        nisn: form.nisn || null,
        gender: form.gender,
        student_type: form.student_type || null,
        program: form.program || null,
        username: form.username || null,
        entry_academic_year_id: form.entry_academic_year_id
          ? parseInt(form.entry_academic_year_id, 10)
          : null,
        active_academic_year_id: form.active_academic_year_id
          ? parseInt(form.active_academic_year_id, 10)
          : null,
        class_id: form.class_id ? parseInt(form.class_id, 10) : undefined,
      }),
    });
    const row = await res.json();
    setSaving(false);
    if (row?.id) router.push(`/students/${row.id}`);
    else router.push('/students');
  };

  return (
    <div className="p-6 max-w-[720px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/students">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Tambah Peserta Didik</h2>
          <p className="text-slate-400 text-[13px]">Data minimal — lengkapi profil di halaman berikut</p>
        </div>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden"
      >
        <div className="p-6 space-y-5">
            <Field label="Sekolah" required>
            <Select
              value={form.school_id}
              onChange={(e) => setForm((f) => ({ ...f, school_id: e.target.value, class_id: '' }))}
            >
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nama Lengkap" required>
            <Input
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            />
          </Field>
          <Field label="Username (opsional)">
            <Input
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="NIS" required>
              <Input value={form.nis} onChange={(e) => setForm((f) => ({ ...f, nis: e.target.value }))} />
            </Field>
            <Field label="NISN">
              <Input value={form.nisn} onChange={(e) => setForm((f) => ({ ...f, nisn: e.target.value }))} />
            </Field>
          </div>
          <Field label="Jenis Kelamin">
            <Select
              value={form.gender}
              onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
            >
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Jenis">
              <Input
                value={form.student_type}
                onChange={(e) => setForm((f) => ({ ...f, student_type: e.target.value }))}
              />
            </Field>
            <Field label="Program">
              <Input
                value={form.program}
                onChange={(e) => setForm((f) => ({ ...f, program: e.target.value }))}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tahun Masuk">
              <Select
                value={form.entry_academic_year_id}
                onChange={(e) => setForm((f) => ({ ...f, entry_academic_year_id: e.target.value }))}
              >
                <option value="">—</option>
                {years.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tahun Aktif">
              <Select
                value={form.active_academic_year_id}
                onChange={(e) => setForm((f) => ({ ...f, active_academic_year_id: e.target.value }))}
              >
                <option value="">—</option>
                {years.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Rombel (opsional)" hint="Langsung masuk ke riwayat kelas tahun aktif">
            <Select
              value={form.class_id}
              onChange={(e) => setForm((f) => ({ ...f, class_id: e.target.value }))}
            >
              <option value="">—</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.level_name} {c.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="bg-slate-50 border-t border-[#E2E8F1] p-5 flex justify-end gap-3">
          <Link href="/students">
            <Button variant="ghost" type="button">
              Batal
            </Button>
          </Link>
          <Button loading={saving} type="submit" disabled={!form.full_name || !form.nis}>
            Simpan & lanjut edit profil
          </Button>
        </div>
      </form>
    </div>
  );
}
