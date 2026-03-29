'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button, Field, Select } from '@/components/ui/FormFields';
import { toast, Toaster } from 'sonner';

export default function ClassPromotionPage() {
  const [schools, setSchools] = useState<{ id: number; name: string }[]>([]);
  const [years, setYears] = useState<{ id: number; name: string }[]>([]);
  const [classes, setClasses] = useState<
    { id: number; school_id: number; name: string; level_name: string }[]
  >([]);
  const [schoolId, setSchoolId] = useState('');
  const [srcAy, setSrcAy] = useState('');
  const [tgtAy, setTgtAy] = useState('');
  const [srcClassIds, setSrcClassIds] = useState<number[]>([]);
  const [tgtClassIds, setTgtClassIds] = useState<number[]>([]);
  const [shuffle, setShuffle] = useState(true);
  const [seed, setSeed] = useState('');
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/master/schools').then((r) => r.json()),
      fetch('/api/master/academic-years').then((r) => r.json()),
      fetch('/api/master/classes').then((r) => r.json()),
    ]).then(([sch, ay, cls]) => {
      setSchools(sch);
      setYears(ay);
      setClasses(cls);
      const active = ay.find((y: { is_active: boolean }) => y.is_active);
      if (active) setSrcAy(String(active.id));
    });
  }, []);

  const filteredClasses = schoolId
    ? classes.filter((c) => String(c.school_id) === schoolId)
    : [];

  const toggle = (id: number, list: number[], setList: (v: number[]) => void) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const runPreview = useCallback(async () => {
    if (!schoolId || !srcAy || !tgtAy) {
      toast.error('Pilih sekolah dan tahun ajaran sumber/tujuan');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/master/class-promotion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        school_id: Number(schoolId),
        source_academic_year_id: Number(srcAy),
        target_academic_year_id: Number(tgtAy),
        source_class_ids: srcClassIds,
        target_class_ids: tgtClassIds,
        shuffle,
        seed: seed ? Number(seed) : undefined,
        preview: true,
      }),
    });
    const j = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(j.error || 'Pratinjau gagal');
      setPreviewCount(null);
      return;
    }
    setPreviewCount(j.count ?? 0);
    toast.success(`Pratinjau: ${j.count} siswa akan dipindahkan`);
  }, [schoolId, srcAy, tgtAy, srcClassIds, tgtClassIds, shuffle, seed]);

  const runCommit = async () => {
    if (!confirm('Jalankan pembagian / naik kelas? Operasi ini mengubah database.')) return;
    setLoading(true);
    const res = await fetch('/api/master/class-promotion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        school_id: Number(schoolId),
        source_academic_year_id: Number(srcAy),
        target_academic_year_id: Number(tgtAy),
        source_class_ids: srcClassIds,
        target_class_ids: tgtClassIds,
        shuffle,
        seed: seed ? Number(seed) : undefined,
        preview: false,
      }),
    });
    const j = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(j.error || 'Gagal');
      return;
    }
    toast.success(`Berhasil memindahkan ${j.moved} siswa`);
    setPreviewCount(null);
  };

  return (
    <div className="p-6 max-w-[900px] mx-auto space-y-6">
      <Toaster position="top-right" richColors />
      <div className="flex items-center gap-4">
        <Link href="/master/classes">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Naik kelas / pembagian rombel</h2>
          <p className="text-slate-400 text-[13px]">
            Pindahkan siswa aktif dari beberapa kelas sumber ke kelas tujuan (acak per gender, merata).
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm p-6 space-y-5">
        <Field label="Sekolah">
          <Select value={schoolId} onChange={(e) => { setSchoolId(e.target.value); setSrcClassIds([]); setTgtClassIds([]); }}>
            <option value="">— Pilih —</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Tahun ajaran sumber">
            <Select value={srcAy} onChange={(e) => setSrcAy(e.target.value)}>
              <option value="">—</option>
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tahun ajaran tujuan">
            <Select value={tgtAy} onChange={(e) => setTgtAy(e.target.value)}>
              <option value="">—</option>
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-[12px] font-bold text-slate-600 uppercase tracking-wide mb-2">Kelas sumber</p>
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1">
              {filteredClasses.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-[13px] cursor-pointer py-0.5">
                  <input
                    type="checkbox"
                    checked={srcClassIds.includes(c.id)}
                    onChange={() => toggle(c.id, srcClassIds, setSrcClassIds)}
                  />
                  {c.level_name} {c.name}
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[12px] font-bold text-slate-600 uppercase tracking-wide mb-2">Kelas tujuan</p>
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1">
              {filteredClasses.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-[13px] cursor-pointer py-0.5">
                  <input
                    type="checkbox"
                    checked={tgtClassIds.includes(c.id)}
                    onChange={() => toggle(c.id, tgtClassIds, setTgtClassIds)}
                  />
                  {c.level_name} {c.name}
                </label>
              ))}
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
          <input type="checkbox" checked={shuffle} onChange={(e) => setShuffle(e.target.checked)} />
          Acak urutan (per L / P), lalu dibagi merata ke kelas tujuan
        </label>
        <Field label="Seed acak (opsional, angka bulat)" hint="Kosongkan = acak berbeda tiap kali">
          <input
            className="w-full rounded-xl border border-[#E2E8F1] px-3 py-2 text-[13px]"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder="mis. 42"
          />
        </Field>

        {previewCount != null && (
          <p className="text-[13px] text-slate-600">
            Pratinjau terakhir: <strong>{previewCount}</strong> siswa
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" loading={loading} onClick={() => void runPreview()}>
            Pratinjau jumlah
          </Button>
          <Button type="button" loading={loading} onClick={() => void runCommit()}>
            Jalankan
          </Button>
        </div>
      </div>
    </div>
  );
}
