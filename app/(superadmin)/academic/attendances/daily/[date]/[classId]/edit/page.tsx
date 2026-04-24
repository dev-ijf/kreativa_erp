'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/FormFields';
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

interface Entry {
  student_id: number;
  full_name: string;
  nis: string;
  status: string;
  note_id: string;
}

export default function DailyAttendanceEditPage({
  params,
}: {
  params: Promise<{ date: string; classId: string }>;
}) {
  const { date, classId } = use(params);
  const router = useRouter();
  const activeYearId = useActiveAcademicYear();
  const [className, setClassName] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!activeYearId) return;
    const sp = new URLSearchParams({
      date,
      class_id: classId,
      academic_year_id: String(activeYearId),
    });
    void fetch(`/api/academic/attendances/by-class?${sp}`)
      .then((r) => r.json())
      .then((d) => {
        setClassName(d.class_name || '');
        const students = Array.isArray(d.students) ? d.students : [];
        setEntries(
          students.map((s: { student_id: number; full_name: string; nis: string; status: string | null; note_id: string | null }) => ({
            student_id: s.student_id,
            full_name: s.full_name,
            nis: s.nis,
            status: s.status || 'hadir',
            note_id: s.note_id || '',
          }))
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [date, classId, activeYearId]);

  const updateEntry = (idx: number, field: keyof Entry, value: string) => {
    setEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e)));
  };

  const setAllStatus = (status: string) => {
    setEntries((prev) => prev.map((e) => ({ ...e, status })));
  };

  const doSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/academic/attendances/by-class', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          class_id: Number(classId),
          academic_year_id: activeYearId,
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
      toast.success(`Berhasil mengupdate ${result.updated} data kehadiran`);
      router.push(`/academic/attendances/daily/${date}/${classId}`);
    } catch {
      toast.error('Terjadi kesalahan');
      setSaving(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (entries.length === 0) {
      toast.error('Tidak ada siswa');
      return;
    }
    const tidakHadir = entries.filter((en) => en.status !== 'hadir').length;
    const summary = tidakHadir > 0
      ? `${entries.length} siswa (${tidakHadir} tidak hadir) untuk tanggal ${date}. Data yang sudah ada akan ditimpa.`
      : `${entries.length} siswa semua hadir untuk tanggal ${date}. Data yang sudah ada akan ditimpa.`;

    confirmToast(`Simpan kehadiran ${summary}`, {
      confirmLabel: 'Ya, Simpan',
      onConfirm: doSave,
    });
  };

  const countByStatus = (status: string) => entries.filter((e) => e.status === status).length;

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/academic/attendances/daily/${date}/${classId}`}>
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Edit Kehadiran — {className || 'Kelas'}
          </h2>
          <p className="text-slate-400 text-[13px]">{date}</p>
        </div>
      </div>

      {loading && (
        <div className="text-center py-10 text-slate-400 text-sm">Memuat data...</div>
      )}

      {!loading && entries.length > 0 && (
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
              <Link href={`/academic/attendances/daily/${date}/${classId}`}>
                <Button variant="ghost" type="button">Batal</Button>
              </Link>
              <Button loading={saving} type="submit" disabled={entries.length === 0}>
                <Save size={15} /> Simpan Kehadiran
              </Button>
            </div>
          </div>
        </form>
      )}

      {!loading && entries.length === 0 && (
        <div className="text-center py-10 text-slate-400 text-sm">
          Tidak ada siswa di kelas ini
        </div>
      )}
    </div>
  );
}
