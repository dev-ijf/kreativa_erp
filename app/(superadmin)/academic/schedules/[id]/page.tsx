'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Input, Button, Select } from '@/components/ui/FormFields';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export default function EditSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [schools, setSchools] = useState<{ id: number; name: string }[]>([]);
  const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
  const [academicYears, setAcademicYears] = useState<{ id: number; name: string; is_active: boolean }[]>([]);
  const [subjects, setSubjects] = useState<{ id: number; name_id: string }[]>([]);
  const [teachers, setTeachers] = useState<{ id: number; user_full_name: string }[]>([]);

  const [form, setForm] = useState({
    school_id: '',
    class_id: '',
    academic_year_id: '',
    subject_id: '',
    teacher_id: '',
    day_of_week: 'Senin',
    start_time: '',
    end_time: '',
    is_break: false,
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialSchoolId, setInitialSchoolId] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/master/schools').then((r) => r.json()),
      fetch('/api/master/academic-years').then((r) => r.json()),
      fetch('/api/academic/subjects').then((r) => r.json()),
      fetch('/api/master/teachers').then((r) => r.json()),
      fetch(`/api/academic/schedules/${id}`).then((r) => r.json()),
    ]).then(([sch, ay, sub, tea, row]) => {
      setSchools(Array.isArray(sch) ? sch : []);
      setAcademicYears(Array.isArray(ay) ? ay : []);
      setSubjects(Array.isArray(sub) ? sub : []);
      setTeachers(Array.isArray(tea) ? tea : []);
      if (row && !row.error) {
        const sid = String(row.school_id ?? '');
        setInitialSchoolId(sid);
        setForm({
          school_id: sid,
          class_id: String(row.class_id ?? ''),
          academic_year_id: String(row.academic_year_id ?? ''),
          subject_id: row.subject_id != null ? String(row.subject_id) : '',
          teacher_id: row.teacher_id != null ? String(row.teacher_id) : '',
          day_of_week: row.day_of_week || 'Senin',
          start_time: String(row.start_time || '').slice(0, 5),
          end_time: String(row.end_time || '').slice(0, 5),
          is_break: !!row.is_break,
        });
      }
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!form.school_id) { setClasses([]); return; }
    fetch(`/api/master/classes?school_id=${form.school_id}&for_active_year=1&include_empty=1`)
      .then((r) => r.json())
      .then((d) => setClasses(Array.isArray(d) ? d : []));
    if (form.school_id !== initialSchoolId) {
      setForm((f) => ({ ...f, class_id: '' }));
    }
  }, [form.school_id, initialSchoolId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const body: Record<string, unknown> = {
      class_id: Number(form.class_id),
      academic_year_id: Number(form.academic_year_id),
      day_of_week: form.day_of_week,
      start_time: form.start_time,
      end_time: form.end_time,
      is_break: form.is_break,
    };
    if (form.subject_id) body.subject_id = Number(form.subject_id);
    if (form.teacher_id) body.teacher_id = Number(form.teacher_id);
    const res = await fetch(`/api/academic/schedules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert((j as { error?: string }).error || 'Gagal menyimpan');
      return;
    }
    router.push('/academic/schedules');
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Memuat…</div>;

  return (
    <div className="p-6 max-w-[800px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/academic/schedules">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Edit Jadwal</h2>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden">
        <div className="p-6 space-y-5">
          <Field label="Sekolah" required>
            <Select
              value={form.school_id}
              onChange={(e) => setForm((f) => ({ ...f, school_id: e.target.value }))}
              required
            >
              <option value="">Pilih sekolah</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Kelas" required>
            <Select
              value={form.class_id}
              onChange={(e) => setForm((f) => ({ ...f, class_id: e.target.value }))}
              required
              disabled={!form.school_id}
            >
              <option value="">{form.school_id ? 'Pilih kelas' : 'Pilih sekolah dulu'}</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Tahun Ajaran" required>
            <Select
              value={form.academic_year_id}
              onChange={(e) => setForm((f) => ({ ...f, academic_year_id: e.target.value }))}
              required
            >
              <option value="">Pilih tahun ajaran</option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>{y.name}{y.is_active ? ' (aktif)' : ''}</option>
              ))}
            </Select>
          </Field>
          <Field label="Hari" required>
            <Select
              value={form.day_of_week}
              onChange={(e) => setForm((f) => ({ ...f, day_of_week: e.target.value }))}
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Mulai" required>
              <Input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
              />
            </Field>
            <Field label="Selesai" required>
              <Input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
              />
            </Field>
          </div>
          <Field label="Mapel (opsional)">
            <Select
              value={form.subject_id}
              onChange={(e) => setForm((f) => ({ ...f, subject_id: e.target.value }))}
            >
              <option value="">—</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name_id}</option>
              ))}
            </Select>
          </Field>
          <Field label="Guru (opsional)">
            <Select
              value={form.teacher_id}
              onChange={(e) => setForm((f) => ({ ...f, teacher_id: e.target.value }))}
            >
              <option value="">—</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.user_full_name}</option>
              ))}
            </Select>
          </Field>
          <label className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_break}
              onChange={(e) => setForm((f) => ({ ...f, is_break: e.target.checked }))}
              className="rounded border-slate-300"
            />
            Slot istirahat
          </label>
        </div>
        <div className="bg-slate-50 border-t border-[#E2E8F1] p-5 flex justify-end gap-3">
          <Link href="/academic/schedules">
            <Button variant="ghost" type="button">Batal</Button>
          </Link>
          <Button
            loading={saving}
            type="submit"
            disabled={!form.class_id || !form.academic_year_id || !form.start_time || !form.end_time}
          >
            Update
          </Button>
        </div>
      </form>
    </div>
  );
}
