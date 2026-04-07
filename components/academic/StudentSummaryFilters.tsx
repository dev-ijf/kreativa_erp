'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Button, Select } from '@/components/ui/FormFields';
import { Search } from 'lucide-react';

type School = { id: number; name: string };
type ClassRow = { id: number; name: string; school_name?: string; level_name?: string };
type StudentRow = { id: number; full_name: string; nis: string };

type Props = {
  schoolId: string;
  onSchoolIdChange: (v: string) => void;
  classId: string;
  onClassIdChange: (v: string) => void;
  studentId: string;
  onStudentIdChange: (v: string) => void;
  q: string;
  onQChange: (v: string) => void;
  academicYearId: number | null;
  /** Dipanggil saat tombol Terapkan diklik — muat ulang tab Semua data + Rekap */
  onApply: () => void;
};

function MiniLabel({ children }: { children: ReactNode }) {
  return <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5 truncate">{children}</span>;
}

export default function StudentSummaryFilters({
  schoolId,
  onSchoolIdChange,
  classId,
  onClassIdChange,
  studentId,
  onStudentIdChange,
  q,
  onQChange,
  academicYearId,
  onApply,
}: Props) {
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    void fetch('/api/master/schools')
      .then((r) => r.json())
      .then((d) => setSchools(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    if (!schoolId || !academicYearId) {
      setClasses([]);
      return;
    }
    setLoadingClasses(true);
    const sp = new URLSearchParams({
      for_active_year: '1',
      school_id: schoolId,
    });
    void fetch(`/api/master/classes?${sp}`)
      .then((r) => r.json())
      .then((d) => {
        setClasses(Array.isArray(d) ? d : []);
        setLoadingClasses(false);
      })
      .catch(() => setLoadingClasses(false));
  }, [schoolId, academicYearId]);

  useEffect(() => {
    if (!classId || !academicYearId || !schoolId) {
      setStudents([]);
      return;
    }
    setLoadingStudents(true);
    const sp = new URLSearchParams({
      limit: '500',
      page: '1',
      academic_year_id: String(academicYearId),
      class_id: classId,
      school_id: schoolId,
    });
    void fetch(`/api/students?${sp}`)
      .then((r) => r.json())
      .then((j) => {
        const list = (j?.data as StudentRow[]) || [];
        setStudents(Array.isArray(list) ? list : []);
        setLoadingStudents(false);
      })
      .catch(() => setLoadingStudents(false));
  }, [classId, academicYearId, schoolId]);

  return (
    <div className="bg-slate-50/90 border border-slate-100 rounded-xl px-3 py-2.5">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Filter</p>
      <div className="flex flex-nowrap items-end gap-2 overflow-x-auto pb-0.5">
        <div className="shrink-0 w-[min(7.5rem,22vw)]">
          <MiniLabel>Sekolah</MiniLabel>
          <Select
            value={schoolId}
            onChange={(e) => onSchoolIdChange(e.target.value)}
            variant="compact"
            title="Sekolah"
            className="min-w-0 w-full"
          >
            <option value="">Semua</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="shrink-0 w-[min(7.5rem,22vw)]" title={!schoolId ? 'Pilih sekolah dulu' : loadingClasses ? 'Memuat kelas…' : undefined}>
          <MiniLabel>Kelas</MiniLabel>
          <Select
            value={classId}
            onChange={(e) => onClassIdChange(e.target.value)}
            disabled={!schoolId || !academicYearId}
            variant="compact"
            title="Kelas"
            className="min-w-0 w-full"
          >
            <option value="">Semua</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.level_name ? `${c.level_name} — ${c.name}` : c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="shrink-0 w-[min(9rem,26vw)]" title={!classId ? 'Pilih kelas untuk memuat siswa' : loadingStudents ? 'Memuat…' : undefined}>
          <MiniLabel>Siswa</MiniLabel>
          <Select
            value={studentId}
            onChange={(e) => onStudentIdChange(e.target.value)}
            disabled={!classId || !academicYearId}
            variant="compact"
            title="Siswa"
            className="min-w-0 w-full"
          >
            <option value="">Semua</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name} ({s.nis})
              </option>
            ))}
          </Select>
        </div>
        <div className="shrink-0 w-[min(10rem,30vw)]">
          <MiniLabel>Nama / NIS</MiniLabel>
          <div className="relative">
            <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="search"
              className="w-full h-8 pl-7 pr-2 bg-white border border-slate-200 rounded-lg text-[12px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400"
              value={q}
              onChange={(e) => onQChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onApply()}
              placeholder="Cari…"
              title="Pencarian nama atau NIS — gunakan Terapkan"
            />
          </div>
        </div>
        <div className="shrink-0 pb-px">
          <Button type="button" size="sm" className="h-8 px-4 shadow-sm whitespace-nowrap" onClick={onApply}>
            Terapkan filter
          </Button>
        </div>
      </div>
    </div>
  );
}
