'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Input, Button, Select, Textarea } from '@/components/ui/FormFields';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditClinicVisitPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [students, setStudents] = useState<{ id: number; full_name: string; nis: string }[]>([]);
  const [form, setForm] = useState({
    student_id: '',
    visit_date: '',
    complaint_en: '',
    complaint_id: '',
    action_en: '',
    action_id: '',
    handled_by: '',
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/students?limit=100').then((r) => r.json()),
      fetch(`/api/academic/clinic-visits/${id}`).then((r) => r.json()),
    ]).then(([stu, row]) => {
      setStudents((stu?.data as typeof students) || []);
      if (row && !row.error) {
        setForm({
          student_id: String(row.student_id ?? ''),
          visit_date: String(row.visit_date || '').slice(0, 10),
          complaint_en: row.complaint_en ?? '',
          complaint_id: row.complaint_id ?? '',
          action_en: row.action_en ?? '',
          action_id: row.action_id ?? '',
          handled_by: row.handled_by ?? '',
        });
      }
      setLoading(false);
    });
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/academic/clinic-visits/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: Number(form.student_id),
        visit_date: form.visit_date,
        complaint_en: form.complaint_en || null,
        complaint_id: form.complaint_id || null,
        action_en: form.action_en || null,
        action_id: form.action_id || null,
        handled_by: form.handled_by || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert((j as { error?: string }).error || 'Gagal menyimpan');
      return;
    }
    router.push('/academic/clinic-visits');
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Memuat…</div>;

  return (
    <div className="p-6 max-w-[800px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/academic/clinic-visits">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Edit Kunjungan UKS</h2>
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
          <Field label="Tanggal kunjungan" required>
            <Input
              type="date"
              value={form.visit_date}
              onChange={(e) => setForm((f) => ({ ...f, visit_date: e.target.value }))}
            />
          </Field>
          <Field label="Keluhan (ID)">
            <Input value={form.complaint_id} onChange={(e) => setForm((f) => ({ ...f, complaint_id: e.target.value }))} />
          </Field>
          <Field label="Keluhan (EN)">
            <Input value={form.complaint_en} onChange={(e) => setForm((f) => ({ ...f, complaint_en: e.target.value }))} />
          </Field>
          <Field label="Tindakan (ID)">
            <Textarea value={form.action_id} onChange={(e) => setForm((f) => ({ ...f, action_id: e.target.value }))} />
          </Field>
          <Field label="Tindakan (EN)">
            <Textarea value={form.action_en} onChange={(e) => setForm((f) => ({ ...f, action_en: e.target.value }))} />
          </Field>
          <Field label="Petugas">
            <Input value={form.handled_by} onChange={(e) => setForm((f) => ({ ...f, handled_by: e.target.value }))} />
          </Field>
        </div>
        <div className="bg-slate-50 border-t border-[#E2E8F1] p-5 flex justify-end gap-3">
          <Link href="/academic/clinic-visits">
            <Button variant="ghost" type="button">
              Batal
            </Button>
          </Link>
          <Button loading={saving} type="submit" disabled={!form.student_id || !form.visit_date}>
            Update
          </Button>
        </div>
      </form>
    </div>
  );
}
