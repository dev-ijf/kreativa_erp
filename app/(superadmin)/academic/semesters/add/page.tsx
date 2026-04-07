'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Input, Button } from '@/components/ui/FormFields';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AddSemesterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ academic_year: '', semester_label: '', is_active: false });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/academic/semesters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert((j as { error?: string }).error || 'Gagal menyimpan');
      return;
    }
    router.push('/academic/semesters');
  };

  return (
    <div className="p-6 max-w-[800px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/academic/semesters">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Tambah Semester</h2>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden">
        <div className="p-6 space-y-5">
          <Field label="Tahun ajaran" required hint="Contoh: 2024/2025">
            <Input
              value={form.academic_year}
              onChange={(e) => setForm((f) => ({ ...f, academic_year: e.target.value }))}
              autoFocus
            />
          </Field>
          <Field label="Label semester" required hint="Contoh: Ganjil / Genap">
            <Input
              value={form.semester_label}
              onChange={(e) => setForm((f) => ({ ...f, semester_label: e.target.value }))}
            />
          </Field>
          <label className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="rounded border-slate-300"
            />
            Tandai sebagai semester aktif
          </label>
        </div>
        <div className="bg-slate-50 border-t border-[#E2E8F1] p-5 flex justify-end gap-3">
          <Link href="/academic/semesters">
            <Button variant="ghost" type="button">
              Batal
            </Button>
          </Link>
          <Button loading={saving} type="submit" disabled={!form.academic_year || !form.semester_label}>
            Simpan
          </Button>
        </div>
      </form>
    </div>
  );
}
