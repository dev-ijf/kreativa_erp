'use client';

import { useCallback, useEffect, useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/FormFields';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { confirmToast } from '@/components/ui/confirmToast';
import AcademicResourceTabs, { type AcademicTabId } from '@/components/academic/AcademicResourceTabs';
import StudentSummaryFilters from '@/components/academic/StudentSummaryFilters';
import { useActiveAcademicYear } from '@/hooks/useActiveAcademicYear';
import { buildStudentSummaryParams } from '@/lib/academic-student-summary-params';

interface Row {
  id: number;
  student_name: string;
  subject_name: string | null;
  teacher_name: string | null;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_break: boolean | null;
}

interface SummaryRow {
  student_id: number;
  full_name: string;
  nis: string;
  class_name: string | null;
  row_count: number;
}

export default function AcademicSchedulesPage() {
  const activeYearId = useActiveAcademicYear();
  const [tab, setTab] = useState<AcademicTabId>('all');
  const [data, setData] = useState<Row[]>([]);
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const [schoolId, setSchoolId] = useState('');
  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [q, setQ] = useState('');

  const listQueryParams = useCallback(
    () =>
      buildStudentSummaryParams({
        schoolId: schoolId || undefined,
        classId: classId || undefined,
        studentId: studentId || undefined,
        q: q.trim() || undefined,
        academicYearId: activeYearId,
      }),
    [schoolId, classId, studentId, q, activeYearId]
  );

  const loadList = useCallback(() => {
    setLoading(true);
    const qs = listQueryParams();
    const url = qs ? `/api/academic/schedules?${qs}` : '/api/academic/schedules';
    return fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setData(Array.isArray(d) ? d : []);
        setLoading(false);
      });
  }, [listQueryParams]);

  const loadSummary = useCallback(() => {
    setLoadingSummary(true);
    const qs = listQueryParams();
    const url = qs ? `/api/academic/schedules/student-summary?${qs}` : '/api/academic/schedules/student-summary';
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setSummary(Array.isArray(d) ? d : []);
        setLoadingSummary(false);
      });
  }, [listQueryParams]);

  const applyFilters = useCallback(() => {
    void loadList();
    loadSummary();
  }, [loadList, loadSummary]);

  useEffect(() => {
    void loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- muat awal saja; filter lewat Terapkan
  }, []);

  useEffect(() => {
    if (tab !== 'summary') return;
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, schoolId, classId, studentId, activeYearId]);

  useEffect(() => {
    if (schoolId === '') {
      setClassId('');
      setStudentId('');
    }
  }, [schoolId]);

  useEffect(() => {
    if (classId === '') setStudentId('');
  }, [classId]);

  const handleDelete = async (sid: number) => {
    confirmToast('Hapus jadwal ini?', {
      confirmLabel: 'Hapus',
      onConfirm: async () => {
        setDeleting(sid);
        const res = await fetch(`/api/academic/schedules/${sid}`, { method: 'DELETE' });
        setDeleting(null);
        if (!res.ok) {
          toast.error('Gagal menghapus');
          return;
        }
        toast.success('Data dihapus');
        void loadList();
        loadSummary();
      },
    });
  };

  const columns = [
    { key: 'id', label: 'ID', sortable: true, className: 'w-14 text-slate-400 font-mono text-xs' },
    { key: 'student_name', label: 'Siswa', sortable: true },
    { key: 'day_of_week', label: 'Hari', sortable: true },
    {
      key: 'time',
      label: 'Jam',
      render: (r: Row) => (
        <span className="text-slate-600 text-[12px]">
          {r.start_time} – {r.end_time}
        </span>
      ),
    },
    { key: 'subject_name', label: 'Mapel', render: (r: Row) => r.subject_name || '–' },
    { key: 'teacher_name', label: 'Guru', render: (r: Row) => r.teacher_name || '–' },
    {
      key: 'is_break',
      label: 'Istirahat',
      render: (r: Row) => (r.is_break ? 'Ya' : '–'),
    },
    {
      key: 'actions',
      label: 'Aksi',
      className: 'text-right',
      render: (r: Row) => (
        <div className="flex justify-end gap-2">
          <Link href={`/academic/schedules/${r.id}`}>
            <Button size="sm" variant="outline">
              <Edit2 size={13} />
            </Button>
          </Link>
          <Button size="sm" variant="danger" loading={deleting === r.id} onClick={() => handleDelete(r.id)}>
            <Trash2 size={13} />
          </Button>
        </div>
      ),
    },
  ];

  const summaryColumns = [
    { key: 'full_name', label: 'Nama siswa', sortable: true },
    { key: 'nis', label: 'NIS', sortable: true },
    { key: 'class_name', label: 'Kelas', render: (r: SummaryRow) => r.class_name || '–' },
    { key: 'row_count', label: 'Jumlah', sortable: true, className: 'w-24' },
    {
      key: 'actions',
      label: 'Aksi',
      className: 'text-right w-28',
      render: (r: SummaryRow) => (
        <Link href={`/academic/schedules/student/${r.student_id}`}>
          <Button size="sm" variant="outline">
            <Eye size={13} /> Detail
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-5 max-w-[1280px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Jadwal</h2>
          <p className="text-slate-400 text-[13px]">Per siswa, mapel & guru</p>
        </div>
        <Link href="/academic/schedules/add">
          <Button>
            <Plus size={15} /> Tambah Jadwal
          </Button>
        </Link>
      </div>

      <StudentSummaryFilters
        schoolId={schoolId}
        onSchoolIdChange={setSchoolId}
        classId={classId}
        onClassIdChange={setClassId}
        studentId={studentId}
        onStudentIdChange={setStudentId}
        q={q}
        onQChange={setQ}
        academicYearId={activeYearId}
        onApply={applyFilters}
      />

      <AcademicResourceTabs
        active={tab}
        onChange={setTab}
        allContent={
          <DataTable
            data={data}
            columns={columns}
            loading={loading}
            rowKey={(r) => r.id}
            emptyText="Belum ada data"
            searchable={false}
            showRowNumber
          />
        }
        summaryContent={
          <DataTable
            data={summary}
            columns={summaryColumns}
            loading={loadingSummary}
            rowKey={(r) => r.student_id}
            emptyText="Tidak ada data — sesuaikan filter lalu Terapkan"
            searchable={false}
            showRowNumber
          />
        }
      />
    </div>
  );
}
