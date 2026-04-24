'use client';

import { useCallback, useEffect, useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/FormFields';
import { Eye, ClipboardList, Users, Percent, BookOpen, Trophy } from 'lucide-react';
import Link from 'next/link';
import AcademicResourceTabs, { type AcademicTabId } from '@/components/academic/AcademicResourceTabs';
import StudentSummaryFilters from '@/components/academic/StudentSummaryFilters';
import StatsCard from '@/components/ui/StatsCard';
import { useActiveAcademicYear } from '@/hooks/useActiveAcademicYear';
import { buildStudentSummaryParams } from '@/lib/academic-student-summary-params';
import {
  HABIT_DATE_PARTITION_END,
  HABIT_DATE_PARTITION_START,
} from '@/lib/academic-habits-partition-bounds';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from 'recharts';

interface Row {
  id: number;
  student_name: string;
  habit_date: string;
}

interface SummaryRow {
  student_id: number;
  full_name: string;
  nis: string;
  class_name: string | null;
  row_count: number;
}

interface ScorecardRow {
  student_id: number;
  full_name: string;
  nis: string;
  class_name: string | null;
  total_days: number;
  total_yes: number;
  total_possible: number;
  score_pct: number;
  ibadah_pct: number;
  disiplin_pct: number;
  karakter_pct: number;
}

interface StatsTotals {
  total_records: number;
  total_students: number;
  avg_score_pct: number;
  full_sholat_pct: number;
}

interface StatsDistItem {
  key: string;
  label: string;
  yes_count: number;
  total: number;
}

interface StatsDailyItem {
  date: string;
  avg_score: number;
}

interface StatsData {
  totals: StatsTotals;
  distribution: StatsDistItem[];
  daily: StatsDailyItem[];
}

/* ── Progress bar component ── */
function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full bg-slate-100 rounded-full h-2">
      <div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

/* ── Scorecard Tab ── */
function ScorecardTabContent({
  data,
  loading,
}: {
  data: ScorecardRow[];
  loading: boolean;
}) {
  if (loading) return <div className="text-center py-16 text-slate-400 text-sm">Memuat scorecard...</div>;
  if (data.length === 0)
    return <div className="text-center py-16 text-slate-400 text-sm">Tidak ada data — sesuaikan filter lalu Terapkan</div>;

  const top5 = data.slice(0, 5);
  const avgAll = data.length > 0 ? Math.round(data.reduce((s, r) => s + (r.score_pct || 0), 0) / data.length) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Jumlah Siswa"
          value={data.length}
          icon={<Users size={18} />}
          color="bg-slate-100 text-slate-600"
          subtitle="Memiliki data pembiasaan"
        />
        <StatsCard
          title="Rata-rata Skor"
          value={`${avgAll}%`}
          icon={<Percent size={18} />}
          color="bg-violet-100 text-violet-600"
          subtitle="Seluruh siswa"
        />
        <StatsCard
          title="Skor Tertinggi"
          value={`${Math.round(data[0]?.score_pct || 0)}%`}
          icon={<Trophy size={18} />}
          color="bg-emerald-100 text-emerald-600"
          subtitle={data[0]?.full_name || '–'}
        />
        <StatsCard
          title="Skor Terendah"
          value={`${Math.round(data[data.length - 1]?.score_pct || 0)}%`}
          icon={<BookOpen size={18} />}
          color="bg-amber-100 text-amber-600"
          subtitle={data[data.length - 1]?.full_name || '–'}
        />
      </div>

      {top5.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E2E8F1] p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-1">Top 5 Siswa Terbaik</h3>
          <p className="text-[12px] text-slate-400 mb-4">Berdasarkan skor pembiasaan keseluruhan</p>
          <div className="space-y-3">
            {top5.map((r, idx) => (
              <Link
                key={r.student_id}
                href={`/academic/habits/student/${r.student_id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
              >
                <span
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-[13px] font-bold ${
                    idx === 0
                      ? 'bg-amber-100 text-amber-700'
                      : idx === 1
                        ? 'bg-slate-200 text-slate-600'
                        : idx === 2
                          ? 'bg-orange-100 text-orange-600'
                          : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-700 truncate group-hover:text-sky-700">
                    {r.full_name}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {r.class_name || '–'} · {r.total_days} hari
                  </p>
                </div>
                <span className="text-lg font-bold text-slate-800">{Math.round(r.score_pct)}%</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Scorecard Lengkap</h3>
          <p className="text-[12px] text-slate-400">Skor per siswa dengan breakdown kategori</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100">
                <th className="text-left px-4 py-2.5 font-semibold text-slate-500">No</th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-500">Nama</th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-500">Kelas</th>
                <th className="text-center px-3 py-2.5 font-semibold text-slate-500">Hari</th>
                <th className="text-center px-3 py-2.5 font-semibold text-violet-600 min-w-[70px]">Skor</th>
                <th className="px-3 py-2.5 font-semibold text-slate-500 min-w-[140px]">Ibadah</th>
                <th className="px-3 py-2.5 font-semibold text-slate-500 min-w-[140px]">Disiplin</th>
                <th className="px-3 py-2.5 font-semibold text-slate-500 min-w-[140px]">Karakter</th>
                <th className="w-20" />
              </tr>
            </thead>
            <tbody>
              {data.map((r, idx) => (
                <tr key={r.student_id} className="border-b border-slate-50 hover:bg-slate-50/40">
                  <td className="px-4 py-2.5 text-slate-400">{idx + 1}</td>
                  <td className="px-4 py-2.5 text-slate-700 font-medium">{r.full_name}</td>
                  <td className="px-4 py-2.5 text-slate-500">{r.class_name || '–'}</td>
                  <td className="text-center px-3 py-2.5 text-slate-600">{r.total_days}</td>
                  <td className="text-center px-3 py-2.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        r.score_pct >= 75
                          ? 'bg-emerald-100 text-emerald-700'
                          : r.score_pct >= 50
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {Math.round(r.score_pct)}%
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={r.ibadah_pct || 0} color="bg-emerald-500" />
                      <span className="text-[11px] text-slate-500 w-9 text-right">{Math.round(r.ibadah_pct || 0)}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={r.disiplin_pct || 0} color="bg-sky-500" />
                      <span className="text-[11px] text-slate-500 w-9 text-right">{Math.round(r.disiplin_pct || 0)}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={r.karakter_pct || 0} color="bg-violet-500" />
                      <span className="text-[11px] text-slate-500 w-9 text-right">{Math.round(r.karakter_pct || 0)}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Link href={`/academic/habits/student/${r.student_id}`}>
                      <Button size="sm" variant="outline">
                        <Eye size={13} />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Stats Tab ── */
function StatsTabContent({ stats, loading }: { stats: StatsData | null; loading: boolean }) {
  if (loading) return <div className="text-center py-16 text-slate-400 text-sm">Memuat statistik...</div>;
  if (!stats) return <div className="text-center py-16 text-slate-400 text-sm">Tidak ada data — sesuaikan filter lalu Terapkan</div>;

  const { totals, distribution, daily } = stats;

  const barData = distribution.map((d) => ({
    name: d.label,
    value: d.yes_count,
    pct: d.total > 0 ? Math.round((d.yes_count / d.total) * 100) : 0,
  }));

  const trendData = daily.map((d) => ({
    date: String(d.date).slice(5, 10),
    skor: d.avg_score,
  }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Record"
          value={totals.total_records}
          icon={<ClipboardList size={18} />}
          color="bg-slate-100 text-slate-600"
          subtitle="Seluruh data pembiasaan"
        />
        <StatsCard
          title="Siswa Terlaporkan"
          value={totals.total_students}
          icon={<Users size={18} />}
          color="bg-sky-100 text-sky-600"
          subtitle="Memiliki minimal 1 data"
        />
        <StatsCard
          title="Rata-rata Skor"
          value={`${Math.round(totals.avg_score_pct || 0)}%`}
          icon={<Percent size={18} />}
          color="bg-violet-100 text-violet-600"
          subtitle="Keseluruhan item"
        />
        <StatsCard
          title="Sholat 5 Waktu Lengkap"
          value={`${Math.round(totals.full_sholat_pct || 0)}%`}
          icon={<BookOpen size={18} />}
          color="bg-emerald-100 text-emerald-600"
          subtitle="% hari sholat 5 waktu penuh"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-[#E2E8F1] p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-1">Distribusi Kebiasaan</h3>
          <p className="text-[12px] text-slate-400 mb-4">Jumlah &ldquo;Ya&rdquo; per item pembiasaan</p>
          <div className="h-[350px] w-full">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barSize={28} margin={{ bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F1" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    dx={-10}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F1' }}
                    formatter={(value, _name, props) => [
                      `${value} (${(props as unknown as { payload: { pct: number } }).payload.pct}%)`,
                      'Ya',
                    ]}
                  />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-300 text-sm">Belum ada data</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F1] p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-1">Tren Harian</h3>
          <p className="text-[12px] text-slate-400 mb-4">Rata-rata skor pembiasaan per hari</p>
          <div className="h-[350px] w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="gradSkor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F1" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    dx={-10}
                    domain={[0, 100]}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F1' }}
                    formatter={(value) => [`${Math.round(Number(value))}%`, 'Skor']}
                  />
                  <Area
                    type="monotone"
                    dataKey="skor"
                    name="Skor"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#gradSkor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-300 text-sm">Belum ada data</div>
            )}
          </div>
          {trendData.length > 0 && (
            <div className="flex items-center justify-center gap-5 mt-3">
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500">
                <div className="w-2.5 h-2.5 rounded-full bg-violet-500" /> Rata-rata Skor Harian
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function AcademicHabitsPage() {
  const activeYearId = useActiveAcademicYear();
  const [tab, setTab] = useState<AcademicTabId>('all');
  const [data, setData] = useState<Row[]>([]);
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [scorecard, setScorecard] = useState<ScorecardRow[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingScorecard, setLoadingScorecard] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

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
        startDate: HABIT_DATE_PARTITION_START,
        endDate: HABIT_DATE_PARTITION_END,
      }),
    [schoolId, classId, studentId, q, activeYearId]
  );

  const fetchJson = useCallback(async (url: string) => {
    const r = await fetch(url);
    return r.json();
  }, []);

  const loadList = useCallback(() => {
    setLoading(true);
    const qs = listQueryParams();
    const url = qs ? `/api/academic/habits?${qs}` : '/api/academic/habits';
    return fetchJson(url).then((d) => {
      setData(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  }, [listQueryParams, fetchJson]);

  const loadSummary = useCallback(() => {
    setLoadingSummary(true);
    const qs = listQueryParams();
    const url = qs ? `/api/academic/habits/student-summary?${qs}` : '/api/academic/habits/student-summary';
    fetchJson(url).then((d) => {
      setSummary(Array.isArray(d) ? d : []);
      setLoadingSummary(false);
    });
  }, [listQueryParams, fetchJson]);

  const loadScorecard = useCallback(() => {
    setLoadingScorecard(true);
    const qs = listQueryParams();
    const url = qs ? `/api/academic/habits/scorecard?${qs}` : '/api/academic/habits/scorecard';
    fetchJson(url).then((d) => {
      setScorecard(Array.isArray(d) ? d : []);
      setLoadingScorecard(false);
    });
  }, [listQueryParams, fetchJson]);

  const loadStats = useCallback(() => {
    setLoadingStats(true);
    const qs = listQueryParams();
    const url = qs ? `/api/academic/habits/stats?${qs}` : '/api/academic/habits/stats';
    fetchJson(url).then((d) => {
      setStats(d && d.totals ? d : null);
      setLoadingStats(false);
    });
  }, [listQueryParams, fetchJson]);

  const applyFilters = useCallback(() => {
    void loadList();
    loadSummary();
    loadScorecard();
    loadStats();
  }, [loadList, loadSummary, loadScorecard, loadStats]);

  useEffect(() => {
    void loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === 'summary') loadSummary();
    if (tab === 'scorecard') loadScorecard();
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

  const columns = [
    { key: 'id', label: 'ID', sortable: true, className: 'w-14 text-slate-400 font-mono text-xs' },
    { key: 'student_name', label: 'Siswa', sortable: true },
    { key: 'habit_date', label: 'Tanggal', render: (r: Row) => String(r.habit_date).slice(0, 10) },
    {
      key: 'actions',
      label: 'Aksi',
      className: 'text-right',
      render: (r: Row) => (
        <div className="flex justify-end">
          <Link
            href={`/academic/habits/${r.id}?habit_date=${encodeURIComponent(String(r.habit_date).slice(0, 10))}`}
          >
            <Button size="sm" variant="outline">
              <Eye size={13} /> Detail
            </Button>
          </Link>
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
        <Link href={`/academic/habits/student/${r.student_id}`}>
          <Button size="sm" variant="outline">
            <Eye size={13} /> Detail
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Pembiasaan</h2>
        <p className="text-slate-400 text-[13px]">Hanya lihat — data diinput dari sumber lain</p>
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
            id: 'scorecard',
            label: 'Scorecard',
            content: <ScorecardTabContent data={scorecard} loading={loadingScorecard} />,
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
