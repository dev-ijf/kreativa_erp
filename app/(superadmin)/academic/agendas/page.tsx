'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import DataTable from '@/components/ui/DataTable';
import { Button, Select } from '@/components/ui/FormFields';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight, Calendar, List, Clock } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { confirmToast } from '@/components/ui/confirmToast';

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function monthStartISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function distinctLevelNames(rows: { level_name?: string | null }[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of rows) {
    const n = (r.level_name ?? '').trim();
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

interface Row {
  id: number;
  school_name: string;
  school_id: number;
  event_date: string;
  title_id: string;
  title_en: string;
  event_type: string;
  target_grade: string | null;
  time_range: string | null;
}

type ViewMode = 'list' | 'calendar';

export default function AcademicAgendasPage() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [view, setView] = useState<ViewMode>('list');

  const [schools, setSchools] = useState<{ id: number; name: string }[]>([]);
  const [levelNames, setLevelNames] = useState<string[]>([]);

  const [schoolId, setSchoolId] = useState('');
  const [startDate, setStartDate] = useState(monthStartISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [targetGrade, setTargetGrade] = useState('');

  const [appliedSchoolId, setAppliedSchoolId] = useState('');
  const [appliedStart, setAppliedStart] = useState(monthStartISO());
  const [appliedEnd, setAppliedEnd] = useState(todayISO());
  const [appliedGrade, setAppliedGrade] = useState('');

  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  useEffect(() => {
    fetch('/api/master/schools')
      .then((r) => r.json())
      .then((d) => setSchools(Array.isArray(d) ? d : []));
  }, []);

  const loadClasses = useCallback((sid: string) => {
    if (!sid) { setLevelNames([]); return; }
    fetch(`/api/master/classes?school_id=${sid}&for_active_year=1&include_empty=1`)
      .then((r) => r.json())
      .then((d) => setLevelNames(distinctLevelNames(Array.isArray(d) ? d : [])));
  }, []);

  useEffect(() => {
    loadClasses(schoolId);
    setTargetGrade('');
  }, [schoolId, loadClasses]);

  const buildQs = useCallback((overrides?: { start?: string; end?: string }) => {
    const params = new URLSearchParams();
    if (appliedSchoolId) params.set('school_id', appliedSchoolId);
    if (overrides?.start ?? appliedStart) params.set('start_date', overrides?.start ?? appliedStart);
    if (overrides?.end ?? appliedEnd) params.set('end_date', overrides?.end ?? appliedEnd);
    if (appliedGrade) params.set('target_grade', appliedGrade);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }, [appliedSchoolId, appliedStart, appliedEnd, appliedGrade]);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/academic/agendas${buildQs()}`)
      .then((r) => r.json())
      .then((d) => {
        setData(Array.isArray(d) ? d : []);
        setLoading(false);
      });
  }, [buildQs]);

  useEffect(() => { load(); }, [load]);

  const applyFilters = () => {
    setAppliedSchoolId(schoolId);
    setAppliedStart(startDate);
    setAppliedEnd(endDate);
    setAppliedGrade(targetGrade);
  };

  const resetFilters = () => {
    setSchoolId('');
    setStartDate(monthStartISO());
    setEndDate(todayISO());
    setTargetGrade('');
    setAppliedSchoolId('');
    setAppliedStart(monthStartISO());
    setAppliedEnd(todayISO());
    setAppliedGrade('');
  };

  // --- Calendar data ---
  const calStart = useMemo(() => {
    const d = new Date(calMonth.year, calMonth.month, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  }, [calMonth]);

  const calEnd = useMemo(() => {
    const d = new Date(calMonth.year, calMonth.month + 1, 0);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, [calMonth]);

  const [calData, setCalData] = useState<Row[]>([]);
  const [calLoading, setCalLoading] = useState(false);

  const loadCalendar = useCallback(() => {
    setCalLoading(true);
    const qs = buildQs({ start: calStart, end: calEnd });
    fetch(`/api/academic/agendas${qs}`)
      .then((r) => r.json())
      .then((d) => {
        setCalData(Array.isArray(d) ? d : []);
        setCalLoading(false);
      });
  }, [buildQs, calStart, calEnd]);

  useEffect(() => {
    if (view === 'calendar') loadCalendar();
  }, [view, loadCalendar]);

  const prevMonth = () =>
    setCalMonth((p) => {
      const d = new Date(p.year, p.month - 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const nextMonth = () =>
    setCalMonth((p) => {
      const d = new Date(p.year, p.month + 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const calMonthLabel = useMemo(() => {
    const d = new Date(calMonth.year, calMonth.month, 1);
    return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }, [calMonth]);

  const eventDatesSet = useMemo(() => {
    const s = new Set<string>();
    for (const r of calData) s.add(r.event_date.slice(0, 10));
    return s;
  }, [calData]);

  const calendarGrid = useMemo(() => {
    const firstDay = new Date(calMonth.year, calMonth.month, 1);
    const lastDay = new Date(calMonth.year, calMonth.month + 1, 0);
    const startDay = firstDay.getDay(); // 0=Sun
    const totalDays = lastDay.getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calMonth]);

  const todayStr = todayISO();

  const sortedCalData = useMemo(
    () => [...calData].sort((a, b) => a.event_date.localeCompare(b.event_date)),
    [calData]
  );

  const CAL_PAGE_SIZE = 5;
  const [calPage, setCalPage] = useState(1);
  useEffect(() => setCalPage(1), [calData]);
  const calTotalPages = Math.max(1, Math.ceil(sortedCalData.length / CAL_PAGE_SIZE));
  const calPageData = sortedCalData.slice((calPage - 1) * CAL_PAGE_SIZE, calPage * CAL_PAGE_SIZE);

  const handleDelete = async (sid: number) => {
    confirmToast('Hapus agenda ini?', {
      confirmLabel: 'Hapus',
      onConfirm: async () => {
        setDeleting(sid);
        const res = await fetch(`/api/academic/agendas/${sid}`, { method: 'DELETE' });
        setDeleting(null);
        if (!res.ok) {
          toast.error('Gagal menghapus');
          return;
        }
        toast.success('Data dihapus');
        load();
        if (view === 'calendar') loadCalendar();
      },
    });
  };

  const columns = [
    { key: 'id', label: 'ID', sortable: true, className: 'w-14 text-slate-400 font-mono text-xs' },
    { key: 'school_name', label: 'Sekolah', sortable: true },
    { key: 'event_date', label: 'Tanggal', render: (r: Row) => String(r.event_date).slice(0, 10) },
    { key: 'title_id', label: 'Judul', sortable: true },
    {
      key: 'target_grade',
      label: 'Target',
      render: (r: Row) => r.target_grade || '—',
    },
    { key: 'event_type', label: 'Jenis', sortable: true },
    {
      key: 'actions',
      label: 'Aksi',
      className: 'text-right',
      render: (r: Row) => (
        <div className="flex justify-end gap-2">
          <Link href={`/academic/agendas/${r.id}`}>
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

  const eventTypeColor = (t: string) => {
    const lower = t.toLowerCase();
    if (lower.includes('ujian') || lower.includes('exam')) return 'bg-red-50 text-red-700 border-red-200';
    if (lower.includes('libur') || lower.includes('holiday')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (lower.includes('upacara') || lower.includes('ceremony')) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-sky-50 text-sky-700 border-sky-200';
  };

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Agenda</h2>
          <p className="text-slate-400 text-[13px]">Kegiatan sekolah</p>
        </div>
        <Link href="/academic/agendas/add">
          <Button>
            <Plus size={15} /> Tambah Agenda
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
          <div className="min-w-[120px]">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tingkat</label>
            <Select value={targetGrade} onChange={(e) => setTargetGrade(e.target.value)} disabled={!schoolId}>
              <option value="">{schoolId ? 'Semua' : '—'}</option>
              {levelNames.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </Select>
          </div>
          <div className="w-[130px]">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Dari</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="Dari tanggal"
              className="w-full px-2 py-2 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400"
            />
          </div>
          <div className="w-[130px]">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sampai</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title="Sampai tanggal"
              className="w-full px-2 py-2 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400"
            />
          </div>
          <Button onClick={applyFilters} className="h-[38px]">Terapkan</Button>
          <Button variant="ghost" onClick={resetFilters} className="h-[38px]">Reset</Button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-1 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setView('list')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold rounded-t-lg border-b-2 -mb-px transition-colors ${
            view === 'list'
              ? 'border-sky-600 text-sky-800 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/80'
          }`}
        >
          <List size={14} /> Daftar
        </button>
        <button
          type="button"
          onClick={() => setView('calendar')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold rounded-t-lg border-b-2 -mb-px transition-colors ${
            view === 'calendar'
              ? 'border-sky-600 text-sky-800 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/80'
          }`}
        >
          <Calendar size={14} /> Kalender
        </button>
      </div>

      {/* Tab Content */}
      {view === 'list' && (
        <DataTable
          data={data}
          columns={columns}
          loading={loading}
          rowKey={(r) => r.id}
          emptyText="Belum ada data"
          searchable={false}
          showRowNumber
        />
      )}

      {view === 'calendar' && (
        <div className="space-y-5">
          {/* Calendar grid */}
          <div className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm p-5 max-w-[480px] mx-auto">
            {/* Month navigator */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={prevMonth}
                aria-label="Bulan sebelumnya"
                title="Bulan sebelumnya"
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <h3 className="text-[15px] font-bold text-slate-800 capitalize">{calMonthLabel}</h3>
              <button
                onClick={nextMonth}
                aria-label="Bulan berikutnya"
                title="Bulan berikutnya"
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {['Mi', 'Se', 'Sl', 'Ra', 'Ka', 'Ju', 'Sa'].map((d) => (
                <div key={d} className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            {calLoading ? (
              <div className="grid grid-cols-7">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-center h-9">
                    <div className="h-7 w-7 bg-slate-100 rounded-lg animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {calendarGrid.map((day, i) => {
                  if (day === null) return <div key={`empty-${i}`} className="h-9" />;
                  const dateStr = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const hasEvent = eventDatesSet.has(dateStr);
                  const isToday = dateStr === todayStr;
                  return (
                    <div key={dateStr} className="flex items-center justify-center h-9">
                      <span
                        className={`flex items-center justify-center w-8 h-8 rounded-lg text-[13px] font-semibold transition-colors ${
                          hasEvent && isToday
                            ? 'bg-violet-600 text-white shadow-sm'
                            : hasEvent
                              ? 'bg-violet-100 text-violet-800'
                              : isToday
                                ? 'bg-slate-100 text-violet-700 ring-2 ring-violet-300'
                                : 'text-slate-600'
                        }`}
                      >
                        {day}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Agenda Bulan Ini */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[16px] font-bold text-slate-800">Agenda Bulan Ini</h3>
              {sortedCalData.length > 0 && (
                <span className="text-[12px] text-slate-400">{sortedCalData.length} agenda</span>
              )}
            </div>
            {calLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-[#E2E8F1] p-5 animate-pulse">
                    <div className="h-4 bg-slate-100 rounded w-40 mb-3" />
                    <div className="h-3 bg-slate-100 rounded w-28" />
                  </div>
                ))}
              </div>
            ) : sortedCalData.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-[13px] bg-white rounded-2xl border border-[#E2E8F1]">
                Tidak ada agenda pada bulan ini
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {calPageData.map((item) => (
                    <Link
                      key={item.id}
                      href={`/academic/agendas/${item.id}`}
                      className="flex items-start gap-4 bg-white rounded-2xl border border-[#E2E8F1] shadow-sm p-5 hover:border-violet-300 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-violet-50 text-violet-500 shrink-0">
                        <Calendar size={20} />
                      </div>
                      <div className="space-y-1.5 min-w-0">
                        <h4 className="text-[14px] font-bold text-slate-800 group-hover:text-violet-700 transition-colors">
                          {item.title_id}
                        </h4>
                        {item.time_range && (
                          <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                            <Clock size={12} className="text-slate-400" />
                            <span>{item.time_range}</span>
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] bg-violet-50 text-violet-700 border border-violet-200 rounded-md px-2 py-0.5 font-medium">
                            {item.event_date.slice(0, 10)}
                          </span>
                          <span className={`text-[11px] rounded-md px-2 py-0.5 border font-medium ${eventTypeColor(item.event_type)}`}>
                            {item.event_type}
                          </span>
                          {item.target_grade && (
                            <span className="text-[11px] bg-sky-50 text-sky-700 border border-sky-200 rounded-md px-2 py-0.5 font-medium">
                              {item.target_grade}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400">{item.school_name}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {calTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-1 mt-4">
                    <button
                      onClick={() => setCalPage((p) => Math.max(1, p - 1))}
                      disabled={calPage === 1}
                      aria-label="Halaman sebelumnya"
                      title="Halaman sebelumnya"
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-all"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: calTotalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setCalPage(p)}
                        className={`min-w-[32px] h-8 rounded-lg text-[12px] font-medium transition-all ${
                          calPage === p
                            ? 'bg-violet-600 text-white shadow-sm'
                            : 'text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setCalPage((p) => Math.min(calTotalPages, p + 1))}
                      disabled={calPage === calTotalPages}
                      aria-label="Halaman berikutnya"
                      title="Halaman berikutnya"
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-all"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
