'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Input, Button, Select } from '@/components/ui/FormFields';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Nama tingkat unik dari core_level_grades (urutan mengikuti respons API). */
function distinctLevelNames(rows: { level_name?: string | null }[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of rows) {
    const n = (r.level_name ?? '').trim();
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(n.length > 50 ? `${n.slice(0, 47)}...` : n);
  }
  return out;
}

export default function AddAgendaPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<{ id: number; name: string }[]>([]);
  const [levelNames, setLevelNames] = useState<string[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [form, setForm] = useState({
    school_id: '',
    target_grade: '',
    event_date: todayISO(),
    title_en: '',
    title_id: '',
    time_range: '',
    event_type: '',
  });
  const [saving, setSaving] = useState(false);

  const loadClasses = useCallback((schoolId: string) => {
    if (!schoolId) {
      setLevelNames([]);
      return;
    }
    setLoadingClasses(true);
    fetch(`/api/master/classes?school_id=${schoolId}&for_active_year=1&include_empty=1`)
      .then((r) => r.json())
      .then((d) => setLevelNames(distinctLevelNames(Array.isArray(d) ? d : [])))
      .finally(() => setLoadingClasses(false));
  }, []);

  useEffect(() => {
    fetch('/api/master/schools')
      .then((r) => r.json())
      .then((d) => setSchools(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    loadClasses(form.school_id);
  }, [form.school_id, loadClasses]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/academic/agendas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        school_id: Number(form.school_id),
        target_grade: form.target_grade || null,
        event_date: form.event_date,
        title_en: form.title_en,
        title_id: form.title_id,
        time_range: form.time_range || null,
        event_type: form.event_type,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert((j as { error?: string }).error || 'Gagal menyimpan');
      return;
    }
    router.push('/academic/agendas');
  };

  return (
    <div className="p-6 max-w-[800px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/academic/agendas">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Tambah Agenda</h2>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden">
        <div className="p-6 space-y-5">
          <Field label="Sekolah" required>
            <Select
              value={form.school_id}
              onChange={(e) => {
                const v = e.target.value;
                setForm((f) => ({ ...f, school_id: v, target_grade: '' }));
              }}
              required
            >
              <option value="">Pilih sekolah</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Target kelas / tingkat">
            <Select
              value={form.target_grade}
              onChange={(e) => setForm((f) => ({ ...f, target_grade: e.target.value }))}
              disabled={!form.school_id || loadingClasses}
            >
              <option value="">
                {!form.school_id ? 'Pilih sekolah terlebih dahulu' : loadingClasses ? 'Memuat tingkat…' : 'Opsional (semua tingkat)'}
              </option>
              {levelNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tanggal acara" required>
            <Input
              type="date"
              value={form.event_date}
              onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))}
            />
          </Field>
          <Field label="Judul (ID)" required>
            <Input value={form.title_id} onChange={(e) => setForm((f) => ({ ...f, title_id: e.target.value }))} />
          </Field>
          <Field label="Judul (EN)" required>
            <Input value={form.title_en} onChange={(e) => setForm((f) => ({ ...f, title_en: e.target.value }))} />
          </Field>
          <Field label="Rentang waktu">
            <Input
              value={form.time_range}
              onChange={(e) => setForm((f) => ({ ...f, time_range: e.target.value }))}
              placeholder="08:00 - 10:00"
            />
          </Field>
          <Field label="Jenis acara" required>
            <Input
              value={form.event_type}
              onChange={(e) => setForm((f) => ({ ...f, event_type: e.target.value }))}
              placeholder="upacara, ujian"
            />
          </Field>
        </div>
        <div className="bg-slate-50 border-t border-[#E2E8F1] p-5 flex justify-end gap-3">
          <Link href="/academic/agendas">
            <Button variant="ghost" type="button">
              Batal
            </Button>
          </Link>
          <Button
            loading={saving}
            type="submit"
            disabled={!form.school_id || !form.event_date || !form.title_en || !form.title_id || !form.event_type}
          >
            Simpan
          </Button>
        </div>
      </form>
    </div>
  );
}
