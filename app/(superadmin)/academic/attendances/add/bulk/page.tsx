'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Input, Button, Select } from '@/components/ui/FormFields';
import { ArrowLeft, Save, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { confirmToast } from '@/components/ui/confirmToast';
import { useActiveAcademicYear } from '@/hooks/useActiveAcademicYear';

const STATUSES = ['hadir', 'izin', 'sakit', 'alpha', 'terlambat'] as const;

const STATUS_COLORS: Record<string, string> = {
  hadir: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  izin: 'bg-blue-50 text-blue-700 border-blue-200',
  sakit: 'bg-amber-50 text-amber-700 border-amber-200',
  alpha: 'bg-red-50 text-red-700 border-red-200',
  terlambat: 'bg-orange-50 text-orange-700 border-orange-200',
};

type School = { id: number; name: string };
type ClassRow = { id: number; name: string; level_name?: string };
type StudentRow = { id: number; full_name: string; nis: string };

interface BulkEntry {
  student_id: number;
  full_name: string;
  nis: string;
  status: string;
  note_id: string;
}

export default function BulkAttendancePage() {
  const router = useRouter();
  const activeYearId = useActiveAcademicYear();

  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [schoolId, setSchoolId] = useState('');
  const [classId, setClassId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [entries, setEntries] = useState<BulkEntry[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetch('/api/master/schools')
      .then((r) => r.json())
      .then((d) => setSchools(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    if (!schoolId || !activeYearId) {
      setClasses([]);
      setClassId('');
      return;
    }
    const sp = new URLSearchParams({ for_active_year: '1', school_id: schoolId });
    void fetch(`/api/master/classes?${sp}`)
      .then((r) => r.json())
      .then((d) => setClasses(Array.isArray(d) ? d : []));
  }, [schoolId, activeYearId]);

  const loadStudents = useCallback(() => {
    if (!classId || !activeYearId || !schoolId) {
      setEntries([]);
      return;
    }
    setLoadingStudents(true);
    const sp = new URLSearchParams({
      limit: '500',
      page: '1',
      academic_year_id: String(activeYearId),
      class_id: classId,
      school_id: schoolId,
    });
    void fetch(`/api/students?${sp}`)
      .then((r) => r.json())
      .then((j) => {
        const list = ((j?.data as StudentRow[]) || []).sort((a, b) =>
          a.full_name.localeCompare(b.full_name)
        );
        setEntries(
          list.map((s) => ({
            student_id: s.id,
            full_name: s.full_name,
            nis: s.nis,
            status: 'hadir',
            note_id: '',
          }))
        );
        setLoadingStudents(false);
      })
      .catch(() => setLoadingStudents(false));
  }, [classId, activeYearId, schoolId]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const updateEntry = (idx: number, field: keyof BulkEntry, value: string) => {
    setEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e)));
  };

  const setAllStatus = (status: string) => {
    setEntries((prev) => prev.map((e) => ({ ...e, status })));
  };

  const doSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/academic/attendances/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendance_date: attendanceDate,
          items: entries.map((e) => ({
            student_id: e.student_id,
            status: e.status,
            note_id: e.note_id || null,
          })),
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error((j as { error?: string }).error || 'Gagal menyimpan');
        setSaving(false);
        return;
      }

      const result = await res.json();
      toast.success(`Berhasil menyimpan ${result.inserted} data kehadiran`);
      router.push('/academic/attendances');
    } catch {
      toast.error('Terjadi kesalahan');
      setSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (entries.length === 0) {
      toast.error('Tidak ada siswa untuk disimpan');
      return;
    }
    if (!attendanceDate) {
      toast.error('Tanggal wajib diisi');
      return;
    }

    const tidakHadir = entries.filter((en) => en.status !== 'hadir').length;
    const summary = tidakHadir > 0
      ? `${entries.length} siswa (${tidakHadir} tidak hadir) untuk tanggal ${attendanceDate}. Data kehadiran yang sudah ada di tanggal ini akan ditimpa.`
      : `${entries.length} siswa semua hadir untuk tanggal ${attendanceDate}. Data kehadiran yang sudah ada di tanggal ini akan ditimpa.`;

    confirmToast(`Simpan kehadiran ${summary}`, {
      confirmLabel: 'Ya, Simpan',
      onConfirm: doSave,
    });
  };

  const countByStatus = (status: string) => entries.filter((e) => e.status === status).length;

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/academic/attendances">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Entry Kehadiran per Kelas</h2>
          <p className="text-slate-400 text-[13px]">Isi kehadiran semua siswa sekaligus</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden">
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Sekolah" required>
              <Select value={schoolId} onChange={(e) => setSchoolId(e.target.value)} required>
                <option value="">Pilih sekolah</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Kelas" required>
              <Select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                disabled={!schoolId || !activeYearId}
                required
              >
                <option value="">Pilih kelas</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.level_name ? `${c.level_name} — ${c.name}` : c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tanggal" required>
              <Input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                required
              />
            </Field>
          </div>
        </div>
      </div>

      {loadingStudents && (
        <div className="text-center py-10 text-slate-400 text-sm">Memuat daftar siswa...</div>
      )}

      {!loadingStudents && entries.length > 0 && (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide">
              Set semua:
            </span>
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setAllStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-colors ${STATUS_COLORS[s]} hover:opacity-80`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 text-[12px]">
            {STATUSES.map((s) => {
              const count = countByStatus(s);
              return count > 0 ? (
                <span key={s} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold ${STATUS_COLORS[s]}`}>
                  {s}: {count}
                </span>
              ) : null;
            })}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold bg-slate-100 text-slate-600">
              Total: {entries.length}
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 w-12">No</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500">Nama Siswa</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 w-24">NIS</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 w-40">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 w-60">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, idx) => (
                    <tr
                      key={entry.student_id}
                      className={`border-b border-slate-100 transition-colors ${
                        entry.status !== 'hadir' ? 'bg-rose-50/40' : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <td className="px-4 py-2.5 text-slate-400 font-mono text-xs">{idx + 1}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-700">{entry.full_name}</td>
                      <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">{entry.nis}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-1">
                          {STATUSES.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => updateEntry(idx, 'status', s)}
                              className={`px-2 py-1 rounded text-[11px] font-semibold border transition-all ${
                                entry.status === s
                                  ? STATUS_COLORS[s]
                                  : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                              }`}
                              title={s}
                            >
                              {s.charAt(0).toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="text"
                          value={entry.note_id}
                          onChange={(e) => updateEntry(idx, 'note_id', e.target.value)}
                          className="w-full bg-transparent border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 placeholder:text-slate-300"
                          placeholder="Catatan..."
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between items-center bg-white rounded-2xl border border-[#E2E8F1] shadow-sm p-5">
            <div className="flex items-center gap-2 text-[13px] text-slate-500">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>{entries.length} siswa siap disimpan</span>
            </div>
            <div className="flex gap-3">
              <Link href="/academic/attendances">
                <Button variant="ghost" type="button">Batal</Button>
              </Link>
              <Button loading={saving} type="submit" disabled={entries.length === 0 || !attendanceDate}>
                <Save size={15} /> Simpan Kehadiran
              </Button>
            </div>
          </div>
        </form>
      )}

      {!loadingStudents && entries.length === 0 && classId && (
        <div className="text-center py-10 text-slate-400 text-sm">
          Tidak ada siswa di kelas ini untuk tahun ajaran aktif
        </div>
      )}
    </div>
  );
}
