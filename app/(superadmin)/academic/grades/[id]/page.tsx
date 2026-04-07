'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Input, Button, Select } from '@/components/ui/FormFields';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditGradePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [students, setStudents] = useState<{ id: number; full_name: string; nis: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: number; name_id: string }[]>([]);
  const [semesters, setSemesters] = useState<{ id: number; academic_year: string; semester_label: string }[]>([]);
  const [form, setForm] = useState({
    student_id: '',
    semester_id: '',
    subject_id: '',
    score: '',
    letter_grade: '',
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/students?limit=100').then((r) => r.json()),
      fetch('/api/academic/subjects').then((r) => r.json()),
      fetch('/api/academic/semesters').then((r) => r.json()),
      fetch(`/api/academic/grades/${id}`).then((r) => r.json()),
    ]).then(([stu, sub, sem, row]) => {
      setStudents((stu?.data as typeof students) || []);
      setSubjects(Array.isArray(sub) ? sub : []);
      setSemesters(Array.isArray(sem) ? sem : []);
      if (row && !row.error) {
        setForm({
          student_id: String(row.student_id ?? ''),
          semester_id: String(row.semester_id ?? ''),
          subject_id: String(row.subject_id ?? ''),
          score: String(row.score ?? ''),
          letter_grade: row.letter_grade ?? '',
        });
      }
      setLoading(false);
    });
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/academic/grades/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: Number(form.student_id),
        semester_id: Number(form.semester_id),
        subject_id: Number(form.subject_id),
        score: form.score,
        letter_grade: form.letter_grade || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert((j as { error?: string }).error || 'Gagal menyimpan');
      return;
    }
    router.push('/academic/grades');
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Memuat…</div>;

  return (
    <div className="p-6 max-w-[800px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/academic/grades">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Edit Nilai</h2>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden">
        <div className="p-6 space-y-5">
          <Field label="Siswa" required>
            <Select
              value={form.student_id}
              onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))}
              required
            >
              <option value="">Pilih siswa</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.nis})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Semester" required>
            <Select
              value={form.semester_id}
              onChange={(e) => setForm((f) => ({ ...f, semester_id: e.target.value }))}
              required
            >
              <option value="">Pilih semester</option>
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.semester_label} — {s.academic_year}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Mapel" required>
            <Select
              value={form.subject_id}
              onChange={(e) => setForm((f) => ({ ...f, subject_id: e.target.value }))}
              required
            >
              <option value="">Pilih mapel</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name_id}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nilai" required>
            <Input value={form.score} onChange={(e) => setForm((f) => ({ ...f, score: e.target.value }))} />
          </Field>
          <Field label="Nilai huruf">
            <Input
              value={form.letter_grade}
              onChange={(e) => setForm((f) => ({ ...f, letter_grade: e.target.value }))}
            />
          </Field>
        </div>
        <div className="bg-slate-50 border-t border-[#E2E8F1] p-5 flex justify-end gap-3">
          <Link href="/academic/grades">
            <Button variant="ghost" type="button">
              Batal
            </Button>
          </Link>
          <Button
            loading={saving}
            type="submit"
            disabled={!form.student_id || !form.semester_id || !form.subject_id || !form.score}
          >
            Update
          </Button>
        </div>
      </form>
    </div>
  );
}
