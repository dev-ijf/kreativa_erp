'use client';

import { useEffect, useState } from 'react';
import { Field, Select, Button, Input } from '@/components/ui/FormFields';
import { ScanLine, Search, Filter } from 'lucide-react';

export default function MatrixPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [schools, setSchools] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [classes, setClasses] = useState<any[]>([]);

  const [form, setForm] = useState({ schoolId: '', academicYearId: '', classId: '', search: '' });
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [matrixData, setMatrixData] = useState<any[]>([]);

  const MONTHS = ['July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June'];
  const MONTHS_LABEL = ['Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'];

  useEffect(() => {
    Promise.all([
      fetch('/api/master/schools').then(r => r.json()),
      fetch('/api/master/academic-years').then(r => r.json()),
      fetch('/api/master/classes').then(r => r.json())
    ]).then(([sch, ay, cls]) => {
      setSchools(sch); setAcademicYears(ay); setClasses(cls);
      if (sch.length > 0) setForm(f => ({ ...f, schoolId: String(sch[0].id) }));
      const activeAY = ay.find((y: any) => y.is_active);
      if (activeAY) setForm(f => ({ ...f, academicYearId: String(activeAY.id) }));
    });
  }, []);

  const availableClasses = classes.filter(c => String(c.school_id) === form.schoolId);

  const handleSearch = async () => {
    if (!form.classId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/billing/matrix?class_id=${form.classId}&academic_year_id=${form.academicYearId}`);
      const data = await res.json();
      setMatrixData(data);
    } catch {
      // error
    }
    setLoading(false);
  };

  const statusColor = (status: string) => {
    if (status === 'paid') return 'bg-emerald-500 text-white border-emerald-600';
    if (status === 'partial') return 'bg-amber-400 text-amber-900 border-amber-500';
    return 'bg-white text-slate-400 border-slate-200';
  };

  const statusText = (status: string) => {
    if (status === 'paid') return 'L';
    if (status === 'partial') return 'S';
    return '-';
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ScanLine className="text-violet-600" /> Matriks SPP (Buku Bantu)
          </h2>
          <p className="text-slate-400 text-[13px] mt-1">Pemantauan visual status pembayaran per bulan per siswa</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-end">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 flex-1 w-full">
          <Field label="Sekolah"><Select value={form.schoolId} onChange={e => setForm(f => ({ ...f, schoolId: e.target.value, classId: '' }))}>{schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
          <Field label="Tahun Ajaran"><Select value={form.academicYearId} onChange={e => setForm(f => ({ ...f, academicYearId: e.target.value }))}>{academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}</Select></Field>
          <Field label="Kelas"><Select value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value }))} disabled={!form.schoolId}><option value="">Pilih</option>{availableClasses.map(c => <option key={c.id} value={c.id}>{c.level_name} - {c.name}</option>)}</Select></Field>
          <Field label="Pencarian Nama"><Input placeholder="Cari..." value={form.search} onChange={e => setForm(f => ({ ...f, search: e.target.value }))} /></Field>
        </div>
        <Button onClick={handleSearch} disabled={!form.classId} className="h-10 px-6 whitespace-nowrap"><Filter size={16} /> Tampilkan Matriks</Button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 flex justify-center items-center h-64">
           <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
        </div>
      ) : matrixData.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <p className="text-[13px] font-semibold text-slate-700">Total: {matrixData.length} Siswa</p>
            <div className="flex gap-4 text-[12px] font-medium">
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-500 rounded-sm" /> Lunas</span>
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-amber-400 rounded-sm" /> Sebagian</span>
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-white border border-slate-300 rounded-sm" /> Belum</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 font-semibold text-slate-600 sticky left-0 bg-slate-50 border-r border-slate-200 z-10 shadow-[1px_0_2px_-1px_rgba(0,0,0,0.1)]">Nama Siswa</th>
                  {MONTHS_LABEL.map(m => (
                    <th key={m} className="px-2 py-3 font-semibold text-slate-500 text-center uppercase tracking-wider text-[11px] min-w-[3rem] border-r border-slate-100 last:border-0">{m}</th>
                  ))}
                  <th className="px-4 py-3 font-bold text-slate-700 text-right bg-slate-50">Tunggakan</th>
                </tr>
              </thead>
              <tbody>
                {matrixData.filter(d => !form.search || d.student_name.toLowerCase().includes(form.search.toLowerCase())).map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-5 py-3 sticky left-0 bg-white border-r border-slate-200 z-10 shadow-[1px_0_2px_-1px_rgba(0,0,0,0.1)]">
                      <div className="font-semibold text-slate-700">{row.student_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{row.nis}</div>
                    </td>
                    {MONTHS.map(m => {
                      const status = row.months[m] || 'none';
                      return (
                        <td key={m} className={`border-r border-slate-100 last:border-0 p-1.5 bg-white text-center group relative cursor-help`}>
                          <div className={`w-full h-8 flex items-center justify-center rounded-md border text-[11px] font-bold ${statusColor(status)} shadow-sm transition-all hover:brightness-95`}>
                            {statusText(status)}
                          </div>
                          {/* Tooltip */}
                          {status !== 'none' && (
                            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[11px] py-1 px-2 rounded-md bottom-full left-1/2 -translate-x-1/2 mb-1 pointer-events-none z-20 whitespace-nowrap">
                              {status === 'paid' ? 'Lunas' : status === 'partial' ? 'Dicicil' : 'Belum Bayar'}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-right bg-white font-semibold text-rose-600">
                      Rp {(row.arrears || 0).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-400 flex flex-col items-center">
          <Search size={48} className="text-slate-200 mb-4" />
          <p className="text-[14px]">Pilih kelas dan tap "Tampilkan Matriks" untuk melihat buku bantu SPP</p>
        </div>
      )}
    </div>
  );
}
