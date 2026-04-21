'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Input, Button, Select } from '@/components/ui/FormFields';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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

export default function EditAgendaPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [schools, setSchools] = useState<{ id: number; name: string }[]>([]);
  const [levelNames, setLevelNames] = useState<string[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [form, setForm] = useState({
    school_id: '',
    target_grade: '',
    event_date: '',
    title_en: '',
    title_id: '',
    time_range: '',
    event_type: '',
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

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
    Promise.all([
      fetch('/api/master/schools').then((r) => r.json()),
      fetch(`/api/academic/agendas/${id}`).then((r) => r.json()),
    ]).then(([sch, row]) => {
      setSchools(Array.isArray(sch) ? sch : []);
      if (row && !row.error) {
        const sid = String(row.school_id ?? '');
        setForm({
          school_id: sid,
          target_grade: row.target_grade ?? '',
          event_date: String(row.event_date || '').slice(0, 10),
          title_en: row.title_en ?? '',
          title_id: row.title_id ?? '',
          time_range: row.time_range ?? '',
          event_type: row.event_type ?? '',
        });
      }
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (loading) return;
    loadClasses(form.school_id);
  }, [loading, form.school_id, loadClasses]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/academic/agendas/${id}`, {
      method: 'PUT',
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

  if (loading) return <div className="p-10 text-center text-slate-400">Memuat…</div>;

  return (
    <div className="p-6 max-w-[800px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/academic/agendas">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Edit Agenda</h2>
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
              {(() => {
                const saved = (form.target_grade || '').trim();
                const showSaved = saved && !levelNames.includes(saved);
                return (
                  <>
                    {showSaved && (
                      <option value={saved}>
                        {saved.length > 60 ? `${saved.slice(0, 57)}…` : saved} (nilai tersimpan)
                      </option>
                    )}
                    {levelNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </>
                );
              })()}
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
            <Input value={form.time_range} onChange={(e) => setForm((f) => ({ ...f, time_range: e.target.value }))} />
          </Field>
          <Field label="Jenis acara" required>
            <Input value={form.event_type} onChange={(e) => setForm((f) => ({ ...f, event_type: e.target.value }))} />
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
            Update
          </Button>
        </div>
      </form>
    </div>
  );
}
