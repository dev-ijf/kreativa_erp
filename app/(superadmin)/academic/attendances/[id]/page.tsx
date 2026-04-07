'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Input, Button, Select, Textarea } from '@/components/ui/FormFields';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const STATUSES = ['hadir', 'izin', 'sakit', 'alpha', 'terlambat'];

export default function EditAttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [students, setStudents] = useState<{ id: number; full_name: string; nis: string }[]>([]);
  const [form, setForm] = useState({
    student_id: '',
    attendance_date: '',
    status: 'hadir',
    note_en: '',
    note_id: '',
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/students?limit=100').then((r) => r.json()),
      fetch(`/api/academic/attendances/${id}`).then((r) => r.json()),
    ]).then(([stu, row]) => {
      setStudents((stu?.data as typeof students) || []);
      if (row && !row.error) {
        setForm({
          student_id: String(row.student_id ?? ''),
          attendance_date: String(row.attendance_date || '').slice(0, 10),
          status: row.status || 'hadir',
          note_en: row.note_en ?? '',
          note_id: row.note_id ?? '',
        });
      }
      setLoading(false);
    });
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/academic/attendances/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: Number(form.student_id),
        attendance_date: form.attendance_date,
        status: form.status,
        note_en: form.note_en || null,
        note_id: form.note_id || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert((j as { error?: string }).error || 'Gagal menyimpan');
      return;
    }
    router.push('/academic/attendances');
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Memuat…</div>;

  return (
    <div className="p-6 max-w-[800px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/academic/attendances">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Edit Kehadiran</h2>
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
          <Field label="Tanggal" required>
            <Input
              type="date"
              value={form.attendance_date}
              onChange={(e) => setForm((f) => ({ ...f, attendance_date: e.target.value }))}
            />
          </Field>
          <Field label="Status" required>
            <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Catatan (EN)">
            <Textarea value={form.note_en} onChange={(e) => setForm((f) => ({ ...f, note_en: e.target.value }))} />
          </Field>
          <Field label="Catatan (ID)">
            <Textarea value={form.note_id} onChange={(e) => setForm((f) => ({ ...f, note_id: e.target.value }))} />
          </Field>
        </div>
        <div className="bg-slate-50 border-t border-[#E2E8F1] p-5 flex justify-end gap-3">
          <Link href="/academic/attendances">
            <Button variant="ghost" type="button">
              Batal
            </Button>
          </Link>
          <Button loading={saving} type="submit" disabled={!form.student_id || !form.attendance_date}>
            Update
          </Button>
        </div>
      </form>
    </div>
  );
}
