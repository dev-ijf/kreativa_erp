'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/FormFields';
import { Plus, Edit2, Trash2, Eye, ChevronDown, Users, ClipboardList, UserCheck, UserX, Percent } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { confirmToast } from '@/components/ui/confirmToast';
import AcademicResourceTabs, { type AcademicTabId } from '@/components/academic/AcademicResourceTabs';
import StudentSummaryFilters from '@/components/academic/StudentSummaryFilters';
import StatsCard from '@/components/ui/StatsCard';
import { useActiveAcademicYear } from '@/hooks/useActiveAcademicYear';
import { buildStudentSummaryParams } from '@/lib/academic-student-summary-params';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, AreaChart, Area } from 'recharts';

interface Row {
  id: number;
  student_name: string;
  attendance_date: string;
  status: string;
}

interface SummaryRow {
  student_id: number;
  full_name: string;
  nis: string;
  class_name: string | null;
  row_count: number;
}

interface DailySummaryRow {
  attendance_date: string;
  class_id: number | null;
  class_name: string | null;
  total: number;
  hadir: number;
  izin: number;
  sakit: number;
  alpha: number;
  terlambat: number;
}

interface StatsTotals {
  total: number;
  hadir: number;
  izin: number;
  sakit: number;
  alpha: number;
  terlambat: number;
}

interface StatsDaily {
  date: string;
  hadir: number;
  tidak_hadir: number;
}

interface StatsData {
  totals: StatsTotals;
  daily: StatsDaily[];
}

const STATUS_BAR_DATA_KEYS: { key: keyof StatsTotals; label: string; color: string }[] = [
  { key: 'hadir', label: 'Hadir', color: '#10b981' },
  { key: 'izin', label: 'Izin', color: '#3b82f6' },
  { key: 'sakit', label: 'Sakit', color: '#f59e0b' },
  { key: 'alpha', label: 'Alpha', color: '#ef4444' },
  { key: 'terlambat', label: 'Terlambat', color: '#f97316' },
];

function StatsTabContent({ stats, loading }: { stats: StatsData | null; loading: boolean }) {
  if (loading) {
    return <div className="text-center py-16 text-slate-400 text-sm">Memuat statistik...</div>;
  }
  if (!stats) {
    return <div className="text-center py-16 text-slate-400 text-sm">Tidak ada data — sesuaikan filter lalu Terapkan</div>;
  }

  const { totals, daily } = stats;
  const tidakHadir = totals.total - totals.hadir;
  const pctHadir = totals.total > 0 ? ((totals.hadir / totals.total) * 100).toFixed(1) : '0';

  const barData = STATUS_BAR_DATA_KEYS.map((s) => ({
    name: s.label,
    value: totals[s.key],
    color: s.color,
  }));

  const trendData = daily.map((d) => ({
    date: String(d.date).slice(5, 10),
    hadir: d.hadir,
    tidak_hadir: d.tidak_hadir,
  }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Record"
          value={totals.total}
          icon={<ClipboardList size={18} />}
          color="bg-slate-100 text-slate-600"
          subtitle="Seluruh data kehadiran"
        />
        <StatsCard
          title="Hadir"
          value={totals.hadir}
          icon={<UserCheck size={18} />}
          color="bg-emerald-100 text-emerald-600"
          subtitle={`${pctHadir}% dari total`}
        />
        <StatsCard
          title="Tidak Hadir"
          value={tidakHadir}
          icon={<UserX size={18} />}
          color="bg-red-100 text-red-600"
          subtitle={`Izin ${totals.izin} · Sakit ${totals.sakit} · Alpha ${totals.alpha}`}
        />
        <StatsCard
          title="% Kehadiran"
          value={`${pctHadir}%`}
          icon={<Percent size={18} />}
          color="bg-violet-100 text-violet-600"
          subtitle={totals.total > 0 ? `${totals.hadir} dari ${totals.total}` : '–'}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-[#E2E8F1] p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-1">Distribusi Status</h3>
          <p className="text-[12px] text-slate-400 mb-4">Jumlah per status kehadiran</p>
          <div className="h-[250px] w-full">
            {totals.total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F1" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F1' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-300 text-sm">Belum ada data</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F1] p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-1">Tren Harian</h3>
          <p className="text-[12px] text-slate-400 mb-4">Hadir vs Tidak Hadir per hari</p>
          <div className="h-[250px] w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="gradHadir" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradTidakHadir" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F1" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F1' }} />
                  <Area type="monotone" dataKey="hadir" name="Hadir" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#gradHadir)" />
                  <Area type="monotone" dataKey="tidak_hadir" name="Tidak Hadir" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#gradTidakHadir)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-300 text-sm">Belum ada data</div>
            )}
          </div>
          {trendData.length > 0 && (
            <div className="flex items-center justify-center gap-5 mt-3">
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Hadir
              </div>
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" /> Tidak Hadir
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <Button onClick={() => setOpen((v) => !v)}>
        <Plus size={15} /> Tambah <ChevronDown size={14} className={`ml-1 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
          <Link
            href="/academic/attendances/add"
            className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors"
            onClick={() => setOpen(false)}
          >
            <Plus size={14} className="text-slate-400" />
            Tambah satuan
          </Link>
          <Link
            href="/academic/attendances/add/bulk"
            className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors"
            onClick={() => setOpen(false)}
          >
            <Users size={14} className="text-slate-400" />
            Entry per kelas
          </Link>
        </div>
      )}
    </div>
  );
}

export default function AcademicAttendancesPage() {
  const activeYearId = useActiveAcademicYear();
  const [tab, setTab] = useState<AcademicTabId>('all');
  const [data, setData] = useState<Row[]>([]);
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummaryRow[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
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
    const url = qs ? `/api/academic/attendances?${qs}` : '/api/academic/attendances';
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
    const url = qs ? `/api/academic/attendances/student-summary?${qs}` : '/api/academic/attendances/student-summary';
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setSummary(Array.isArray(d) ? d : []);
        setLoadingSummary(false);
      });
  }, [listQueryParams]);

  const loadDaily = useCallback(() => {
    setLoadingDaily(true);
    const qs = listQueryParams();
    const url = qs ? `/api/academic/attendances/daily-summary?${qs}` : '/api/academic/attendances/daily-summary';
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setDailySummary(Array.isArray(d) ? d : []);
        setLoadingDaily(false);
      });
  }, [listQueryParams]);

  const loadStats = useCallback(() => {
    setLoadingStats(true);
    const qs = listQueryParams();
    const url = qs ? `/api/academic/attendances/stats?${qs}` : '/api/academic/attendances/stats';
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setStats(d && d.totals ? d : null);
        setLoadingStats(false);
      });
  }, [listQueryParams]);

  const applyFilters = useCallback(() => {
    void loadList();
    loadSummary();
    loadDaily();
    loadStats();
  }, [loadList, loadSummary, loadDaily, loadStats]);

  useEffect(() => {
    void loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === 'summary') loadSummary();
    if (tab === 'daily') loadDaily();
    if (tab === 'stats') loadStats();
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
    confirmToast('Hapus kehadiran ini?', {
      confirmLabel: 'Hapus',
      onConfirm: async () => {
        setDeleting(sid);
        const res = await fetch(`/api/academic/attendances/${sid}`, { method: 'DELETE' });
        setDeleting(null);
        if (!res.ok) {
          toast.error('Gagal menghapus');
          return;
        }
        toast.success('Data dihapus');
        void loadList();
        loadSummary();
        loadDaily();
        loadStats();
      },
    });
  };

  const columns = [
    { key: 'id', label: 'ID', sortable: true, className: 'w-14 text-slate-400 font-mono text-xs' },
    { key: 'student_name', label: 'Siswa', sortable: true },
    {
      key: 'attendance_date',
      label: 'Tanggal',
      render: (r: Row) => String(r.attendance_date).slice(0, 10),
    },
    { key: 'status', label: 'Status', sortable: true },
    {
      key: 'actions',
      label: 'Aksi',
      className: 'text-right',
      render: (r: Row) => (
        <div className="flex justify-end gap-2">
          <Link href={`/academic/attendances/${r.id}`}>
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
        <Link href={`/academic/attendances/student/${r.student_id}`}>
          <Button size="sm" variant="outline">
            <Eye size={13} /> Detail
          </Button>
        </Link>
      ),
    },
  ];

  const statusBadge = (label: string, value: number, color: string) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${color}`}>
      {label}: {value}
    </span>
  );

  const dailyColumns = [
    {
      key: 'attendance_date',
      label: 'Tanggal',
      sortable: true,
      render: (r: DailySummaryRow) => String(r.attendance_date).slice(0, 10),
    },
    { key: 'class_name', label: 'Kelas', sortable: true, render: (r: DailySummaryRow) => r.class_name || '–' },
    { key: 'total', label: 'Total', sortable: true, className: 'w-20 text-center' },
    {
      key: 'hadir',
      label: 'Hadir',
      sortable: true,
      className: 'w-20 text-center',
      render: (r: DailySummaryRow) => statusBadge('', r.hadir, 'bg-emerald-100 text-emerald-700'),
    },
    {
      key: 'izin',
      label: 'Izin',
      sortable: true,
      className: 'w-20 text-center',
      render: (r: DailySummaryRow) => statusBadge('', r.izin, 'bg-blue-100 text-blue-700'),
    },
    {
      key: 'sakit',
      label: 'Sakit',
      sortable: true,
      className: 'w-20 text-center',
      render: (r: DailySummaryRow) => statusBadge('', r.sakit, 'bg-amber-100 text-amber-700'),
    },
    {
      key: 'alpha',
      label: 'Alpha',
      sortable: true,
      className: 'w-20 text-center',
      render: (r: DailySummaryRow) => statusBadge('', r.alpha, 'bg-red-100 text-red-700'),
    },
    {
      key: 'terlambat',
      label: 'Terlambat',
      sortable: true,
      className: 'w-24 text-center',
      render: (r: DailySummaryRow) => statusBadge('', r.terlambat, 'bg-orange-100 text-orange-700'),
    },
  ];

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Kehadiran</h2>
          <p className="text-slate-400 text-[13px]">Absensi harian</p>
        </div>
        <AddDropdown />
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
        tabs={[
          {
            id: 'all',
            label: 'Semua data',
            content: (
              <DataTable
                data={data}
                columns={columns}
                loading={loading}
                rowKey={(r) => r.id}
                emptyText="Belum ada data"
                searchable={false}
                showRowNumber
              />
            ),
          },
          {
            id: 'summary',
            label: 'Rekap per siswa',
            content: (
              <DataTable
                data={summary}
                columns={summaryColumns}
                loading={loadingSummary}
                rowKey={(r) => r.student_id}
                emptyText="Tidak ada data — sesuaikan filter lalu Terapkan"
                searchable={false}
                showRowNumber
              />
            ),
          },
          {
            id: 'daily',
            label: 'Rekap harian',
            content: (
              <DataTable
                data={dailySummary}
                columns={dailyColumns}
                loading={loadingDaily}
                rowKey={(r) => `${r.attendance_date}-${r.class_id}`}
                emptyText="Tidak ada data — sesuaikan filter lalu Terapkan"
                searchable={false}
                showRowNumber
              />
            ),
          },
          {
            id: 'stats',
            label: 'Statistik',
            content: <StatsTabContent stats={stats} loading={loadingStats} />,
          },
        ]}
      />
    </div>
  );
}
