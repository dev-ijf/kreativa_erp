'use client';

import { useEffect, useState, use } from 'react';
import { Button } from '@/components/ui/FormFields';
import { ArrowLeft, Edit2 } from 'lucide-react';
import Link from 'next/link';
import { useActiveAcademicYear } from '@/hooks/useActiveAcademicYear';

const STATUS_COLORS: Record<string, string> = {
  hadir: 'bg-emerald-100 text-emerald-700',
  izin: 'bg-blue-100 text-blue-700',
  sakit: 'bg-amber-100 text-amber-700',
  alpha: 'bg-red-100 text-red-700',
  terlambat: 'bg-orange-100 text-orange-700',
};

interface StudentRow {
  student_id: number;
  full_name: string;
  nis: string;
  attendance_id: number | null;
  status: string | null;
  note_en: string | null;
  note_id: string | null;
}

export default function DailyAttendanceViewPage({
  params,
}: {
  params: Promise<{ date: string; classId: string }>;
}) {
  const { date, classId } = use(params);
  const activeYearId = useActiveAcademicYear();
  const [className, setClassName] = useState('');
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);

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
        setStudents(Array.isArray(d.students) ? d.students : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [date, classId, activeYearId]);

  const total = students.length;
  const hadir = students.filter((s) => s.status === 'hadir').length;
  const izin = students.filter((s) => s.status === 'izin').length;
  const sakit = students.filter((s) => s.status === 'sakit').length;
  const alpha = students.filter((s) => s.status === 'alpha').length;
  const terlambat = students.filter((s) => s.status === 'terlambat').length;
  const belum = students.filter((s) => !s.status).length;

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/academic/attendances">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-800">
            Rekap Kehadiran — {className || 'Kelas'}
          </h2>
          <p className="text-slate-400 text-[13px]">{date}</p>
        </div>
        <Link href={`/academic/attendances/daily/${date}/${classId}/edit`}>
          <Button>
            <Edit2 size={15} /> Edit Kehadiran
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 text-[12px]">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold bg-slate-100 text-slate-600">
          Total: {total}
        </span>
        {hadir > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold bg-emerald-100 text-emerald-700">
            Hadir: {hadir}
          </span>
        )}
        {izin > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold bg-blue-100 text-blue-700">
            Izin: {izin}
          </span>
        )}
        {sakit > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold bg-amber-100 text-amber-700">
            Sakit: {sakit}
          </span>
        )}
        {alpha > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold bg-red-100 text-red-700">
            Alpha: {alpha}
          </span>
        )}
        {terlambat > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold bg-orange-100 text-orange-700">
            Terlambat: {terlambat}
          </span>
        )}
        {belum > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold bg-gray-100 text-gray-500">
            Belum diisi: {belum}
          </span>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm">Memuat data...</div>
        ) : students.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">Tidak ada siswa di kelas ini</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 w-12">No</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500">Nama Siswa</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 w-24">NIS</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 w-32">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500">Catatan</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, idx) => (
                  <tr
                    key={s.student_id}
                    className={`border-b border-slate-100 ${
                      s.status && s.status !== 'hadir' ? 'bg-rose-50/40' : ''
                    }`}
                  >
                    <td className="px-4 py-2.5 text-slate-400 font-mono text-xs">{idx + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-700">{s.full_name}</td>
                    <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">{s.nis}</td>
                    <td className="px-4 py-2.5">
                      {s.status ? (
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            STATUS_COLORS[s.status] || 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {s.status}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 text-[12px]">
                      {s.note_id || s.note_en || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
