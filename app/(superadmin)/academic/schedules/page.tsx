'use client';

import { useCallback, useEffect, useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import { Button, Select } from '@/components/ui/FormFields';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { confirmToast } from '@/components/ui/confirmToast';
import AcademicResourceTabs, { type AcademicTabId } from '@/components/academic/AcademicResourceTabs';
import { useActiveAcademicYear } from '@/hooks/useActiveAcademicYear';

interface Row {
  id: number;
  class_name: string;
  school_name: string;
  academic_year_name: string;
  subject_name: string | null;
  teacher_name: string | null;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_break: boolean | null;
}

interface SummaryRow {
  class_id: number;
  class_name: string;
  school_name: string;
  academic_year_id: number;
  academic_year_name: string;
  slot_count: number;
}

export default function AcademicSchedulesPage() {
  const activeYearId = useActiveAcademicYear();
  const [tab, setTab] = useState<AcademicTabId>('all');
  const [data, setData] = useState<Row[]>([]);
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const [schools, setSchools] = useState<{ id: number; name: string }[]>([]);
  const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
  const [academicYears, setAcademicYears] = useState<{ id: number; name: string; is_active: boolean }[]>([]);

  const [schoolId, setSchoolId] = useState('');
  const [classId, setClassId] = useState('');
  const [yearId, setYearId] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/master/schools').then((r) => r.json()),
      fetch('/api/master/academic-years').then((r) => r.json()),
    ]).then(([sch, ay]) => {
      setSchools(Array.isArray(sch) ? sch : []);
      const years = Array.isArray(ay) ? ay : [];
      setAcademicYears(years);
      const active = years.find((y: { is_active: boolean }) => y.is_active);
      if (active) setYearId(String(active.id));
    });
  }, []);

  useEffect(() => {
    if (!schoolId) { setClasses([]); setClassId(''); return; }
    fetch(`/api/master/classes?school_id=${schoolId}&for_active_year=1&include_empty=1`)
      .then((r) => r.json())
      .then((d) => setClasses(Array.isArray(d) ? d : []));
    setClassId('');
  }, [schoolId]);

  const buildQs = useCallback(() => {
    const params = new URLSearchParams();
    if (schoolId) params.set('school_id', schoolId);
    if (classId) params.set('class_id', classId);
    if (yearId) params.set('academic_year_id', yearId);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }, [schoolId, classId, yearId]);

  const loadList = useCallback(() => {
    setLoading(true);
    fetch(`/api/academic/schedules${buildQs()}`)
      .then((r) => r.json())
      .then((d) => {
        setData(Array.isArray(d) ? d : []);
        setLoading(false);
      });
  }, [buildQs]);

  const loadSummary = useCallback(() => {
    setLoadingSummary(true);
    const params = new URLSearchParams();
    if (schoolId) params.set('school_id', schoolId);
    if (yearId) params.set('academic_year_id', yearId);
    const qs = params.toString();
    fetch(`/api/academic/schedules/class-summary${qs ? `?${qs}` : ''}`)
      .then((r) => r.json())
      .then((d) => {
        setSummary(Array.isArray(d) ? d : []);
        setLoadingSummary(false);
      });
  }, [schoolId, yearId]);

  const applyFilters = () => {
    loadList();
    loadSummary();
  };

  useEffect(() => { loadList(); }, [loadList]);

  useEffect(() => {
    if (tab === 'summary') loadSummary();
  }, [tab, loadSummary]);

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
        loadList();
        loadSummary();
      },
    });
  };

  const columns = [
    { key: 'id', label: 'ID', sortable: true, className: 'w-14 text-slate-400 font-mono text-xs' },
    { key: 'class_name', label: 'Kelas', sortable: true },
    { key: 'academic_year_name', label: 'Tahun Ajaran', sortable: true },
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
    { key: 'class_name', label: 'Kelas', sortable: true },
    { key: 'school_name', label: 'Sekolah', sortable: true },
    { key: 'academic_year_name', label: 'Tahun Ajaran', sortable: true },
    { key: 'slot_count', label: 'Jumlah Slot', sortable: true, className: 'w-28' },
    {
      key: 'actions',
      label: 'Aksi',
      className: 'text-right w-28',
      render: (r: SummaryRow) => (
        <Link href={`/academic/schedules/class/${r.class_id}?academic_year_id=${r.academic_year_id}`}>
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
          <p className="text-slate-400 text-[13px]">Per kelas, mapel & guru</p>
        </div>
        <Link href="/academic/schedules/add">
          <Button>
            <Plus size={15} /> Tambah Jadwal
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[160px]">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sekolah</label>
            <Select value={schoolId} onChange={(e) => setSchoolId(e.target.value)}>
              <option value="">Semua</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </div>
          <div className="min-w-[140px]">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Kelas</label>
            <Select value={classId} onChange={(e) => setClassId(e.target.value)} disabled={!schoolId}>
              <option value="">{schoolId ? 'Semua kelas' : '—'}</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
          <div className="min-w-[140px]">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tahun Ajaran</label>
            <Select value={yearId} onChange={(e) => setYearId(e.target.value)}>
              <option value="">Semua</option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>{y.name}{y.is_active ? ' (aktif)' : ''}</option>
              ))}
            </Select>
          </div>
          <Button onClick={applyFilters} className="h-[38px]">Terapkan</Button>
        </div>
      </div>

      <AcademicResourceTabs
        active={tab}
        onChange={setTab}
        allLabel="Semua data"
        summaryLabel="Rekap per kelas"
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
            rowKey={(r) => `${r.class_id}-${r.academic_year_id}`}
            emptyText="Tidak ada data"
            searchable={false}
            showRowNumber
          />
        }
      />
    </div>
  );
}
