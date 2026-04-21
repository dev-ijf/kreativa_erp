'use client';

import { useEffect, useState, use, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/FormFields';
import {
  ArrowLeft, Check, X, ChevronDown, ChevronUp, TrendingUp, BarChart3, PieChart,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Calendar,
} from 'lucide-react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

interface HabitRow {
  id: number;
  habit_date: string;
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
  dhuha: boolean;
  tahajud: boolean;
  read_quran: boolean;
  sunnah_fasting: boolean;
  wake_up_early: boolean;
  help_parents: boolean;
  pray_with_parents: boolean;
  give_greetings: boolean;
  smile_greet_polite: boolean;
  on_time_arrival: string | null;
  parent_hug_pray: boolean;
  child_tell_parents: boolean;
  quran_juz_info: string | null;
  [key: string]: unknown;
}

interface PaginatedResponse {
  data: HabitRow[];
  total: number;
  page: number;
  limit: number;
}

const BOOL_COLS: { k: keyof HabitRow; short: string; full: string; cat: 'ibadah' | 'disiplin' | 'karakter' }[] = [
  { k: 'wake_up_early', short: 'Bangun', full: 'Bangun sebelum Subuh', cat: 'disiplin' },
  { k: 'fajr', short: 'Subuh', full: 'Sholat Subuh', cat: 'ibadah' },
  { k: 'dhuhr', short: 'Dzuhur', full: 'Sholat Dzuhur', cat: 'ibadah' },
  { k: 'asr', short: 'Ashar', full: 'Sholat Ashar', cat: 'ibadah' },
  { k: 'maghrib', short: 'Maghrib', full: 'Sholat Maghrib', cat: 'ibadah' },
  { k: 'isha', short: 'Isya', full: 'Sholat Isya', cat: 'ibadah' },
  { k: 'dhuha', short: 'Dhuha', full: 'Sholat Dhuha', cat: 'ibadah' },
  { k: 'tahajud', short: 'Tahajud', full: 'Sholat Tahajud', cat: 'ibadah' },
  { k: 'read_quran', short: 'Quran', full: 'Baca Quran', cat: 'ibadah' },
  { k: 'sunnah_fasting', short: 'Puasa', full: 'Puasa Sunnah', cat: 'ibadah' },
  { k: 'pray_with_parents', short: 'Ngaji', full: 'Mengaji bersama Orang Tua', cat: 'ibadah' },
  { k: 'give_greetings', short: 'Salam', full: 'Beri Salam ke Orang Tua', cat: 'karakter' },
  { k: 'smile_greet_polite', short: '5S', full: 'Senyum Salam Sopan Santun', cat: 'disiplin' },
  { k: 'help_parents', short: 'Bantu', full: 'Bantu Orang Tua', cat: 'karakter' },
  { k: 'parent_hug_pray', short: 'Peluk', full: 'Orang Tua Memeluk & Mendoakan', cat: 'karakter' },
  { k: 'child_tell_parents', short: 'Cerita', full: 'Anak Bercerita ke Orang Tua', cat: 'karakter' },
];

const PAGE_SIZE = 15;

function countScore(row: HabitRow): { yes: number; total: number } {
  let yes = 0;
  for (const { k } of BOOL_COLS) {
    if (row[k]) yes++;
  }
  return { yes, total: BOOL_COLS.length };
}

function BoolIcon({ val }: { val: boolean }) {
  return val ? (
    <Check size={14} className="text-emerald-600 mx-auto" />
  ) : (
    <X size={14} className="text-slate-300 mx-auto" />
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full bg-slate-100 rounded-full h-2.5">
      <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

function useChartData(data: HabitRow[]) {
  return useMemo(() => {
    if (data.length === 0) return { trend: [], distribution: [], categories: [], categoryBreakdown: { ibadah: 0, disiplin: 0, karakter: 0 } };

    const sorted = [...data].sort((a, b) => a.habit_date.localeCompare(b.habit_date));

    const trend = sorted.map((row) => {
      const { yes, total } = countScore(row);
      return { date: String(row.habit_date).slice(5, 10), skor: Math.round((yes / total) * 100) };
    });

    const distMap: Record<string, number> = {};
    for (const col of BOOL_COLS) distMap[col.k as string] = 0;
    for (const row of data) {
      for (const col of BOOL_COLS) {
        if (row[col.k]) distMap[col.k as string]++;
      }
    }
    const distribution = BOOL_COLS.map((col) => ({
      name: col.short,
      fullName: col.full,
      pct: Math.round((distMap[col.k as string] / data.length) * 100),
      count: distMap[col.k as string],
      total: data.length,
    }));

    const catCols = { ibadah: 0, disiplin: 0, karakter: 0 };
    const catTotal = { ibadah: 0, disiplin: 0, karakter: 0 };
    for (const col of BOOL_COLS) {
      catTotal[col.cat] += data.length;
      for (const row of data) {
        if (row[col.k]) catCols[col.cat]++;
      }
    }

    const categoryBreakdown = {
      ibadah: catTotal.ibadah > 0 ? Math.round((catCols.ibadah / catTotal.ibadah) * 100) : 0,
      disiplin: catTotal.disiplin > 0 ? Math.round((catCols.disiplin / catTotal.disiplin) * 100) : 0,
      karakter: catTotal.karakter > 0 ? Math.round((catCols.karakter / catTotal.karakter) * 100) : 0,
    };

    const categories = [
      { category: 'Ibadah', value: categoryBreakdown.ibadah, fullMark: 100 },
      { category: 'Disiplin', value: categoryBreakdown.disiplin, fullMark: 100 },
      { category: 'Karakter', value: categoryBreakdown.karakter, fullMark: 100 },
    ];

    return { trend, distribution, categories, categoryBreakdown };
  }, [data]);
}

export default function HabitsStudentDetailPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params);
  const [studentLabel, setStudentLabel] = useState('');

  const [allData, setAllData] = useState<HabitRow[]>([]);
  const [tableData, setTableData] = useState<HabitRow[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingTable, setLoadingTable] = useState(false);

  const [defaultStart] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [defaultEnd] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [appliedStart, setAppliedStart] = useState(defaultStart);
  const [appliedEnd, setAppliedEnd] = useState(defaultEnd);

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showCharts, setShowCharts] = useState(true);

  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));

  const buildDateParams = useCallback((sd: string, ed: string) => {
    const parts: string[] = [];
    if (sd) parts.push(`start_date=${sd}`);
    if (ed) parts.push(`end_date=${ed}`);
    return parts.length > 0 ? `&${parts.join('&')}` : '';
  }, []);

  useEffect(() => {
    void fetch(`/api/students/${studentId}`)
      .then((r) => r.json())
      .then((s) => {
        if (s?.full_name) setStudentLabel(`${s.full_name} (NIS ${s.nis || '–'})`);
        else setStudentLabel(`Siswa #${studentId}`);
      });
  }, [studentId]);

  const loadAllData = useCallback((sd: string, ed: string) => {
    setLoading(true);
    const dp = buildDateParams(sd, ed);
    fetch(`/api/academic/habits?student_id=${studentId}${dp}`)
      .then((r) => r.json())
      .then((d) => {
        setAllData(Array.isArray(d) ? d : []);
        setLoading(false);
      });
  }, [studentId, buildDateParams]);

  const loadTablePage = useCallback((pg: number, sd: string, ed: string) => {
    setLoadingTable(true);
    const dp = buildDateParams(sd, ed);
    fetch(`/api/academic/habits?student_id=${studentId}&page=${pg}&limit=${PAGE_SIZE}${dp}`)
      .then((r) => r.json())
      .then((d: PaginatedResponse) => {
        setTableData(Array.isArray(d.data) ? d.data : []);
        setTotalRows(d.total ?? 0);
        setLoadingTable(false);
      });
  }, [studentId, buildDateParams]);

  useEffect(() => {
    loadAllData(defaultStart, defaultEnd);
    loadTablePage(1, defaultStart, defaultEnd);
  }, [loadAllData, loadTablePage, defaultStart, defaultEnd]);

  const applyDateFilter = () => {
    setAppliedStart(startDate);
    setAppliedEnd(endDate);
    setPage(1);
    loadAllData(startDate, endDate);
    loadTablePage(1, startDate, endDate);
  };

  const resetDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setAppliedStart('');
    setAppliedEnd('');
    setPage(1);
    loadAllData('', '');
    loadTablePage(1, '', '');
  };

  const goToPage = (pg: number) => {
    const clamped = Math.max(1, Math.min(pg, totalPages));
    setPage(clamped);
    loadTablePage(clamped, appliedStart, appliedEnd);
  };

  const avgScore =
    allData.length > 0
      ? Math.round(allData.reduce((sum, r) => sum + (countScore(r).yes / countScore(r).total) * 100, 0) / allData.length)
      : 0;

  const { trend, distribution, categories, categoryBreakdown } = useChartData(allData);

  const bestDay = useMemo(() => {
    if (allData.length === 0) return null;
    let best = allData[0];
    let bestPct = 0;
    for (const row of allData) {
      const { yes, total } = countScore(row);
      const pct = (yes / total) * 100;
      if (pct > bestPct) { bestPct = pct; best = row; }
    }
    return { date: String(best.habit_date).slice(0, 10), pct: Math.round(bestPct) };
  }, [allData]);

  const hasDateFilter = appliedStart || appliedEnd;

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/academic/habits">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-800">Pembiasaan siswa</h2>
          <p className="text-slate-500 text-[13px]">{studentLabel}</p>
        </div>
        {!loading && allData.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setShowCharts((v) => !v)} className="text-[12px]">
            {showCharts ? 'Sembunyikan' : 'Tampilkan'} Grafik
          </Button>
        )}
      </div>

      {/* ── Date Filter ── */}
      <div className="bg-white rounded-2xl border border-[#E2E8F1] p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dari Tanggal</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-8 pr-3 py-2 text-[13px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 w-[160px]"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sampai Tanggal</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-8 pr-3 py-2 text-[13px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 w-[160px]"
              />
            </div>
          </div>
          <Button size="sm" onClick={applyDateFilter}>
            Terapkan
          </Button>
          {hasDateFilter && (
            <Button size="sm" variant="outline" onClick={resetDateFilter}>
              Reset
            </Button>
          )}
          {hasDateFilter && (
            <span className="text-[12px] text-slate-400 self-center">
              Menampilkan {appliedStart || '...'} s/d {appliedEnd || '...'}
            </span>
          )}
        </div>
      </div>

      {/* ── Summary Cards ── */}
      {!loading && allData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white rounded-2xl border border-[#E2E8F1] px-4 py-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Hari</p>
            <p className="text-2xl font-semibold text-slate-800">{allData.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#E2E8F1] px-4 py-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rata-rata Skor</p>
            <p className={`text-2xl font-semibold ${avgScore >= 75 ? 'text-emerald-600' : avgScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
              {avgScore}%
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-[#E2E8F1] px-4 py-3">
            <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">Ibadah</p>
            <p className="text-2xl font-semibold text-slate-800">{categoryBreakdown.ibadah}%</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#E2E8F1] px-4 py-3">
            <p className="text-[11px] font-bold text-sky-500 uppercase tracking-wider">Disiplin</p>
            <p className="text-2xl font-semibold text-slate-800">{categoryBreakdown.disiplin}%</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#E2E8F1] px-4 py-3">
            <p className="text-[11px] font-bold text-violet-500 uppercase tracking-wider">Karakter</p>
            <p className="text-2xl font-semibold text-slate-800">{categoryBreakdown.karakter}%</p>
          </div>
        </div>
      )}

      {/* ── Charts ── */}
      {!loading && allData.length > 0 && showCharts && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2 bg-white rounded-2xl border border-[#E2E8F1] p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={16} className="text-violet-500" />
                <h3 className="font-semibold text-slate-800">Tren Skor Harian</h3>
              </div>
              <p className="text-[12px] text-slate-400 mb-4">
                Persentase pembiasaan per hari
                {bestDay && (
                  <span className="ml-2 text-emerald-600 font-medium">
                    Terbaik: {bestDay.date} ({bestDay.pct}%)
                  </span>
                )}
              </p>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend}>
                    <defs>
                      <linearGradient id="gradSkorStudent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F1" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                    <YAxis
                      axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }}
                      dx={-10} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F1', fontSize: '12px' }}
                      formatter={(value) => [`${Number(value)}%`, 'Skor']}
                    />
                    <Area type="monotone" dataKey="skor" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#gradSkorStudent)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E2E8F1] p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <PieChart size={16} className="text-emerald-500" />
                <h3 className="font-semibold text-slate-800">Profil Pembiasaan</h3>
              </div>
              <p className="text-[12px] text-slate-400 mb-4">Skor per kategori</p>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={categories} outerRadius="70%">
                    <PolarGrid stroke="#E2E8F1" />
                    <PolarAngleAxis dataKey="category" tick={{ fontSize: 12, fill: '#475569' }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Radar dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} strokeWidth={2} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F1', fontSize: '12px' }}
                      formatter={(value) => [`${Number(value)}%`, 'Skor']}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-1.5">
                {categories.map((c) => (
                  <div key={c.category} className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 w-14">{c.category}</span>
                    <ProgressBar
                      value={c.value}
                      color={c.category === 'Ibadah' ? 'bg-emerald-500' : c.category === 'Disiplin' ? 'bg-sky-500' : 'bg-violet-500'}
                    />
                    <span className="text-[11px] font-semibold text-slate-600 w-9 text-right">{c.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F1] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={16} className="text-sky-500" />
              <h3 className="font-semibold text-slate-800">Konsistensi Per Item</h3>
            </div>
            <p className="text-[12px] text-slate-400 mb-4">
              Persentase &ldquo;Ya&rdquo; dari {allData.length} hari untuk setiap item pembiasaan
            </p>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution} barSize={28} margin={{ bottom: 60 }}>
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
                    domain={[0, 100]}
                    tickFormatter={(v: number) => `${v}%`}
                    dx={-10}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F1', fontSize: '12px' }}
                    formatter={(value, _name, props) => [
                      `${value}% (${(props as unknown as { payload: { count: number; total: number } }).payload.count}/${(props as unknown as { payload: { count: number; total: number } }).payload.total} hari)`,
                      (props as unknown as { payload: { fullName: string } }).payload.fullName,
                    ]}
                  />
                  <Bar dataKey="pct" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Data Table ── */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">Memuat...</div>
      ) : allData.length === 0 && !loadingTable ? (
        <div className="text-center py-16 text-slate-400 text-sm">Belum ada data pembiasaan untuk siswa ini</div>
      ) : (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-x-auto">
            {loadingTable && (
              <div className="absolute inset-0 bg-white/60 z-20 flex items-center justify-center">
                <span className="text-slate-400 text-sm">Memuat...</span>
              </div>
            )}
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left px-3 py-2.5 font-semibold text-slate-500 sticky left-0 bg-slate-50/60 z-10 min-w-[100px]">
                    Tanggal
                  </th>
                  {BOOL_COLS.map((c) => (
                    <th key={c.k as string} className="text-center px-1.5 py-2.5 font-semibold text-slate-500 min-w-[52px]" title={c.full}>
                      {c.short}
                    </th>
                  ))}
                  <th className="text-center px-2 py-2.5 font-semibold text-slate-500 min-w-[56px]" title="Datang Tepat Waktu">Waktu</th>
                  <th className="text-center px-2 py-2.5 font-semibold text-violet-600 min-w-[56px]">Skor</th>
                  <th className="w-10" />
                </tr>
              </thead>
              {tableData.map((row) => {
                const { yes, total } = countScore(row);
                const pct = Math.round((yes / total) * 100);
                const hasExtra = ((row.quran_juz_info as string) || '').trim();
                const isExpanded = expandedId === row.id;
                const colSpanAll = BOOL_COLS.length + 4;

                return (
                  <tbody key={row.id}>
                    <tr className="border-b border-slate-50 hover:bg-slate-50/40 group">
                      <td className="px-3 py-2 text-slate-700 font-medium sticky left-0 bg-white group-hover:bg-slate-50/40 z-10">
                        {String(row.habit_date).slice(0, 10)}
                      </td>
                      {BOOL_COLS.map((c) => (
                        <td key={c.k as string} className="text-center px-1.5 py-2">
                          <BoolIcon val={!!row[c.k]} />
                        </td>
                      ))}
                      <td className="text-center px-2 py-2">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            row.on_time_arrival === 'Ya'
                              ? 'bg-emerald-100 text-emerald-700'
                              : row.on_time_arrival === 'Tidak'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {row.on_time_arrival || '–'}
                        </span>
                      </td>
                      <td className="text-center px-2 py-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            pct >= 75 ? 'bg-emerald-100 text-emerald-700' : pct >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {yes}/{total}
                        </span>
                      </td>
                      <td className="px-1 py-2">
                        {hasExtra && (
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : row.id)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400"
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && hasExtra && (
                      <tr className="bg-slate-50/60">
                        <td colSpan={colSpanAll} className="px-4 py-2 text-[12px] text-slate-600">
                          <span className="font-semibold text-slate-500">Jilid/Juz Al-Quran:</span> {row.quran_juz_info}
                        </td>
                      </tr>
                    )}
                  </tbody>
                );
              })}
            </table>
          </div>

          {/* ── Pagination ── */}
          <div className="flex items-center justify-between text-[12px] text-slate-500">
            <span>
              {totalRows} data · Halaman {page} dari {totalPages}
              {hasDateFilter && ' (difilter)'}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => goToPage(1)}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Halaman pertama"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Sebelumnya"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => goToPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-[12px] font-semibold transition-colors ${
                      pageNum === page
                        ? 'bg-sky-600 text-white'
                        : 'hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Berikutnya"
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => goToPage(totalPages)}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Halaman terakhir"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
