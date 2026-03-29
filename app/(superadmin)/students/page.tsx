'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/FormFields';
import { Field, Select, Input } from '@/components/ui/FormFields';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  Flag,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface StudentRow {
  id: number;
  full_name: string;
  username?: string | null;
  nis: string;
  nisn?: string | null;
  student_type?: string | null;
  program?: string | null;
  photo_url?: string | null;
  is_alumni?: boolean;
  boarding_status?: string | null;
  updated_at?: string | null;
  school_name?: string;
  entry_year_name?: string | null;
  active_year_name?: string | null;
  class_name?: string | null;
  rombel_academic_year_name?: string | null;
  document_count?: number;
}

interface ListResponse {
  data: StudentRow[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function StudentsPage() {
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const [deleting, setDeleting] = useState<number | null>(null);

  const [academicYears, setAcademicYears] = useState<{ id: number; name: string }[]>([]);
  const [classes, setClasses] = useState<
    { id: number; school_id: number; name: string; level_name: string }[]
  >([]);
  const [schools, setSchools] = useState<{ id: number; name: string }[]>([]);

  const [filterSchool, setFilterSchool] = useState('');
  const [filterAy, setFilterAy] = useState('');
  const [filterEntry, setFilterEntry] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);

  const loadRefs = useCallback(() => {
    Promise.all([
      fetch('/api/master/academic-years').then((r) => r.json()),
      fetch('/api/master/classes').then((r) => r.json()),
      fetch('/api/master/schools').then((r) => r.json()),
    ]).then(([ay, cls, sch]) => {
      setAcademicYears(ay);
      setClasses(cls);
      setSchools(sch);
      const active = ay.find((y: { is_active: boolean }) => y.is_active);
      if (active) setFilterAy(String(active.id));
    });
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (filterSchool) params.set('school_id', filterSchool);
    if (filterAy) params.set('academic_year_id', filterAy);
    if (filterEntry) params.set('entry_year_id', filterEntry);
    if (filterClass) params.set('class_id', filterClass);
    if (filterType) params.set('student_type', filterType);
    if (filterProgram) params.set('program', filterProgram);
    if (searchQ.trim()) params.set('q', searchQ.trim());

    fetch(`/api/students?${params}`)
      .then((r) => r.json())
      .then((d: ListResponse) => {
        setRows(d.data || []);
        setTotalPages(d.totalPages || 1);
        setTotal(d.total || 0);
        setLoading(false);
        try {
          sessionStorage.setItem(
            'students_list_nav',
            JSON.stringify({ ids: (d.data || []).map((row) => row.id), ts: Date.now() })
          );
        } catch {
          /* ignore */
        }
      })
      .catch(() => setLoading(false));
  }, [
    page,
    filterSchool,
    filterAy,
    filterEntry,
    filterClass,
    filterType,
    filterProgram,
    searchQ,
  ]);

  useEffect(() => {
    loadRefs();
  }, [loadRefs]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus siswa ini?')) return;
    setDeleting(id);
    await fetch(`/api/students/${id}`, { method: 'DELETE' });
    setDeleting(null);
    load();
  };

  const filteredClasses = filterSchool
    ? classes.filter((c) => String(c.school_id) === filterSchool)
    : classes;

  return (
    <div className="p-6 space-y-5 max-w-[1600px] mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Daftar Peserta Didik</h2>
          <p className="text-slate-400 text-[13px]">
            Manajemen data siswa
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              const fd = new FormData();
              fd.set('file', file);
              const res = await fetch('/api/students/import', { method: 'POST', body: fd });
              const j = await res.json().catch(() => ({}));
              if (!res.ok) {
                alert((j as { error?: string }).error || 'Import gagal');
                return;
              }
              alert(
                `Import selesai: ${(j as { inserted?: number }).inserted ?? 0} masuk, ${(j as { skipped?: number }).skipped ?? 0} dilewati`
              );
              load();
            }}
          />
          <Button variant="outline" size="sm" type="button" onClick={() => importInputRef.current?.click()}>
            <Upload size={14} /> Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => {
              const params = new URLSearchParams();
              if (filterSchool) params.set('school_id', filterSchool);
              if (filterAy) params.set('academic_year_id', filterAy);
              if (filterEntry) params.set('entry_year_id', filterEntry);
              if (filterClass) params.set('class_id', filterClass);
              if (filterType) params.set('student_type', filterType);
              if (filterProgram) params.set('program', filterProgram);
              if (searchQ.trim()) params.set('q', searchQ.trim());
              window.open(`/api/students/export?${params}`, '_blank');
            }}
          >
            <Download size={14} /> Export Excel
          </Button>
          <a
            href="/samples/students_import_template.csv"
            download
            className="inline-flex items-center text-[12px] text-blue-600 underline px-1 self-center"
          >
            Template CSV
          </a>
          <Link href="/students/add">
            <Button size="sm">
              <Plus size={15} /> Tambah Peserta Didik
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          <Field label="Sekolah">
            <Select
              value={filterSchool}
              onChange={(e) => {
                setFilterSchool(e.target.value);
                setFilterClass('');
                setPage(1);
              }}
            >
              <option value="">Semua</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tahun Ajaran">
            <Select
              value={filterAy}
              onChange={(e) => {
                setFilterAy(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Semua</option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tahun Masuk">
            <Select
              value={filterEntry}
              onChange={(e) => {
                setFilterEntry(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Semua</option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Rombel">
            <Select
              value={filterClass}
              onChange={(e) => {
                setFilterClass(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Semua</option>
              {filteredClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.level_name} {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Jenis">
            <Select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Semua</option>
              <option value="Reguler">Reguler</option>
              <option value="Prestasi">Prestasi</option>
            </Select>
          </Field>
          <Field label="Program">
            <Select
              value={filterProgram}
              onChange={(e) => {
                setFilterProgram(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Semua</option>
              <option value="PAUD">PAUD</option>
              <option value="Reguler">Reguler</option>
            </Select>
          </Field>
          <Field label="Cari">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                className="pl-9"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (setPage(1), load())}
                placeholder="Nama, NIS, username..."
              />
            </div>
          </Field>
        </div>
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setPage(1);
              load();
            }}
          >
            Terapkan filter
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <th className="px-3 py-3 w-10">No</th>
              <th className="px-3 py-3 min-w-[140px]">Sekolah</th>
              <th className="px-3 py-3">Tahun Masuk</th>
              <th className="px-3 py-3">Tahun Aktif</th>
              <th className="px-3 py-3 w-14">Foto</th>
              <th className="px-3 py-3">NIS / NISN</th>
              <th className="px-3 py-3 min-w-[200px]">Nama</th>
              <th className="px-3 py-3">Rombel</th>
              <th className="px-3 py-3">Alumni</th>
              <th className="px-3 py-3">Dokumen</th>
              <th className="px-3 py-3">Tgl Update</th>
              <th className="px-3 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={12} className="px-4 py-12 text-center text-slate-400">
                  Memuat...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-4 py-12 text-center text-slate-400">
                  Tidak ada data
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-3 py-2 text-slate-400">{(page - 1) * limit + i + 1}</td>
                  <td className="px-3 py-2 text-slate-800 font-medium max-w-[200px]">
                    {r.school_name ?? '—'}
                  </td>
                  <td className="px-3 py-2">{r.entry_year_name ?? '—'}</td>
                  <td className="px-3 py-2">{r.active_year_name ?? r.rombel_academic_year_name ?? '—'}</td>
                  <td className="px-3 py-2">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 overflow-hidden relative">
                      {r.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.photo_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 text-[10px]">
                          —
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    <div>{r.nis}</div>
                    <div className="text-slate-400">
                      {r.nisn || '—'} {r.student_type ? `/ ${r.student_type}` : ''}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-semibold text-slate-800">{r.full_name}</div>
                    {r.username && (
                      <div className="text-slate-400 text-[12px]">({r.username})</div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div>{r.class_name ? `${r.class_name}` : '—'}</div>
                    {r.rombel_academic_year_name && (
                      <div className="text-[11px] text-slate-400">
                        ({r.rombel_academic_year_name})
                      </div>
                    )}
                    <div className="text-[11px] text-slate-400">
                      Boarding: {r.boarding_status ?? '—'}
                    </div>
                  </td>
                  <td className="px-3 py-2">{r.is_alumni ? 'Ya' : 'Tidak'}</td>
                  <td className="px-3 py-2">{r.document_count ?? 0}</td>
                  <td className="px-3 py-2 text-slate-500 whitespace-nowrap">
                    {r.updated_at
                      ? format(new Date(r.updated_at), 'dd-MM-yyyy HH:mm')
                      : '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/students/${r.id}`}>
                        <Button size="sm" variant="outline" title="Edit">
                          <Edit2 size={13} />
                        </Button>
                      </Link>
                      <Link href={`/students/${r.id}?view=1&nav=1`}>
                        <Button size="sm" variant="outline" title="Detail">
                          <Eye size={13} />
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        title="Status"
                        onClick={() => alert('Status / flag — hubungkan field kustom jika perlu')}
                      >
                        <Flag size={13} />
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        loading={deleting === r.id}
                        onClick={() => handleDelete(r.id)}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-[13px] text-slate-500">
          <span>
            Menampilkan {(page - 1) * limit + 1}–{Math.min(page * limit, total)} dari {total}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={14} />
            </Button>
            <span className="tabular-nums">
              {page} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
