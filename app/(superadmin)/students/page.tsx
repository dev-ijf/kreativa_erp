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
  FileDown,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { confirmToast } from '@/components/ui/confirmToast';

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

  const [academicYears, setAcademicYears] = useState<
    { id: number; name: string; is_active?: boolean }[]
  >([]);
  const [classes, setClasses] = useState<
    { id: number; school_id: number; name: string; level_name: string }[]
  >([]);
  const [schools, setSchools] = useState<{ id: number; name: string }[]>([]);
  const [cohorts, setCohorts] = useState<{ id: number; name: string; school_id: number }[]>([]);

  const [filterSchool, setFilterSchool] = useState('');
  const [filterAy, setFilterAy] = useState('');
  const [filterEntry, setFilterEntry] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateSchoolId, setTemplateSchoolId] = useState('');
  const [templateCohortId, setTemplateCohortId] = useState('');
  const [templateClassId, setTemplateClassId] = useState('');

  const loadRefs = useCallback(() => {
    Promise.all([
      fetch('/api/master/academic-years').then((r) => r.json()),
      fetch('/api/master/classes').then((r) => r.json()),
      fetch('/api/master/schools').then((r) => r.json()),
      fetch('/api/master/cohorts').then((r) => r.json()),
    ]).then(([ay, cls, sch, coh]) => {
      setAcademicYears(ay);
      setClasses(cls);
      setSchools(sch);
      setCohorts(Array.isArray(coh) ? coh : []);
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

  useEffect(() => {
    if (!templateModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTemplateModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [templateModalOpen]);

  const handleDelete = (id: number) => {
    confirmToast('Hapus siswa ini?', {
      confirmLabel: 'Hapus',
      onConfirm: async () => {
        setDeleting(id);
        const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setDeleting(null);
        if (!res.ok) {
          toast.error(j.error || 'Gagal menghapus siswa');
          return;
        }
        toast.success('Siswa berhasil dihapus');
        load();
      },
    });
  };

  const filteredClasses = filterSchool
    ? classes.filter((c) => String(c.school_id) === filterSchool)
    : classes;

  const templateClasses = templateSchoolId
    ? classes.filter((c) => String(c.school_id) === templateSchoolId)
    : [];

  const templateCohorts = templateSchoolId
    ? cohorts.filter((c) => String(c.school_id) === templateSchoolId)
    : [];

  const downloadImportTemplate = () => {
    if (!templateSchoolId) {
      toast.error('Pilih sekolah terlebih dahulu agar kolom school_id di file sesuai.');
      return;
    }
    if (!templateCohortId.trim()) {
      toast.error('Pilih angkatan terlebih dahulu agar kolom cohort_id di file sesuai.');
      return;
    }
    const sid = Number(templateSchoolId);
    const cohortNum = Number(templateCohortId.trim());
    if (!Number.isFinite(cohortNum)) {
      toast.error('Angkatan tidak valid.');
      return;
    }
    const school = schools.find((s) => s.id === sid);
    const activeAyRow = academicYears.find((y) => y.is_active);
    const ayId =
      activeAyRow?.id ?? (filterAy && filterAy !== '' ? Number(filterAy) : NaN);
    const ayNum = Number.isFinite(ayId) ? ayId : '';
    const classNum = templateClassId.trim() ? Number(templateClassId.trim()) : '';
    const sampleNis = `${sid}-NIS-001`;
    const cohortRow = cohorts.find((c) => c.id === cohortNum);
    const ayRowForSample =
      Number.isFinite(Number(ayNum)) && ayNum !== ''
        ? academicYears.find((y) => y.id === Number(ayNum))
        : undefined;
    const ayNameSample = ayRowForSample?.name ?? '';
    const clsRow =
      classNum !== '' && Number.isFinite(Number(classNum))
        ? classes.find((c) => c.id === Number(classNum))
        : undefined;
    const classNameSample = clsRow ? `${clsRow.level_name} ${clsRow.name}` : '';

    const header = [
      'school_id',
      'school_name',
      'cohort_id',
      'cohort_name',
      'full_name',
      'nis',
      'nisn',
      'gender',
      'student_type',
      'program',
      'username',
      'academic_year_id',
      'academic_year_name',
      'class_id',
      'class_name',
      'nickname',
      'nik',
      'nationality',
      'place_of_birth',
      'date_of_birth',
      'religion',
      'child_order',
      'siblings_count',
      'child_status',
      'address',
      'rt',
      'rw',
      'village_label',
      'district_label',
      'city_label',
      'province_id',
      'city_id',
      'district_id',
      'subdistrict_id',
      'postal_code',
      'phone',
      'email',
      'living_with',
      'daily_language',
      'hobbies',
      'aspiration',
      'transport_mode',
      'distance_to_school',
      'travel_time',
      'registration_type',
      'enrollment_date',
      'diploma_serial',
      'skhun_serial',
      'is_alumni',
      'boarding_status',
      'blood_type',
      'weight_kg',
      'height_cm',
      'head_circumference_cm',
      'allergies',
      'vision_condition',
      'hearing_condition',
      'special_needs',
      'chronic_diseases',
      'physical_abnormalities',
      'recurring_diseases',
      'address_latitude',
      'address_longitude',
      'previous_school',
    ];
    const sampleRow: (string | number)[] = [
      sid,
      school?.name ?? '',
      cohortNum,
      cohortRow?.name ?? '',
      'Contoh Nama Lengkap',
      sampleNis,
      '',
      'L',
      'Reguler',
      'Reguler',
      'opsional_username',
      ayNum === '' ? '' : ayNum,
      ayNameSample,
      classNum === '' ? '' : classNum,
      classNameSample,
      'Contoh Nama Panggilan',
      '3204xxxxxxxxxxxx',
      'WNI',
      'Bandung',
      '2015-01-01',
      'Islam',
      1,
      2,
      'Anak kandung',
      'Jl. Contoh Alamat No. 1',
      '001',
      '002',
      'Contoh Dukuh',
      'Contoh Kecamatan',
      'Kota Bandung',
      '',
      '',
      '',
      '',
      '40111',
      '081234567890',
      'email@contoh.com',
      'Orang tua',
      'Indonesia',
      'Membaca, olahraga',
      'Dokter',
      'Motor',
      '< 1 km',
      '< 15 menit',
      'Siswa baru',
      '2024-07-10',
      'DN-01/2024/001',
      'SK-01/2024/001',
      0,
      'Reguler',
      'O',
      '25',
      120,
      50,
      'Debu',
      'Normal',
      'Normal',
      '',
      '',
      '',
      '',
      '',
      'TK Contoh Sejahtera',
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([header, sampleRow]);
    XLSX.utils.book_append_sheet(wb, ws, 'Siswa');
    const safe = (school?.name || String(sid))
      .replace(/[/\\?%*:|"<>]/g, '_')
      .replace(/\s+/g, '_');
    XLSX.writeFile(wb, `template_import_siswa_${safe}.xlsx`);
    setTemplateModalOpen(false);
  };

  return (
    <div className="p-6 space-y-5 max-w-[1600px] mx-auto">
      {templateModalOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="template-import-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
            aria-label="Tutup"
            onClick={() => setTemplateModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 id="template-import-title" className="text-lg font-bold text-slate-800">
                  Unduh template import Excel (.xlsx)
                </h3>
                <p className="text-[13px] text-slate-500 mt-1">
                  Pilih sekolah dan angkatan supaya kolom <span className="font-mono text-[12px]">school_id</span>,{' '}
                  <span className="font-mono text-[12px]">cohort_id</span>, dan contoh baris sudah benar. Impor hanya
                  menerima file <strong>.xlsx</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTemplateModalOpen(false)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Tutup"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <Field label="Sekolah (wajib)">
                <Select
                  value={templateSchoolId}
                  onChange={(e) => {
                    const sid = e.target.value;
                    setTemplateSchoolId(sid);
                    setTemplateCohortId('');
                    const first = classes.find((c) => String(c.school_id) === sid);
                    setTemplateClassId(first ? String(first.id) : '');
                  }}
                >
                  <option value="">— Pilih sekolah —</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Angkatan (wajib)">
                <Select
                  value={templateCohortId}
                  onChange={(e) => setTemplateCohortId(e.target.value)}
                  disabled={!templateSchoolId}
                >
                  <option value="">— Pilih angkatan —</option>
                  {templateCohorts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
                {templateSchoolId && templateCohorts.length === 0 ? (
                  <p className="text-[12px] text-amber-700 mt-1.5">
                    Belum ada angkatan untuk sekolah ini. Tambahkan di{' '}
                    <Link href="/master/cohorts" className="underline font-medium">
                      Master Angkatan
                    </Link>
                    .
                  </p>
                ) : null}
              </Field>
              <Field label="Contoh rombel (opsional)">
                <Select
                  value={templateClassId}
                  onChange={(e) => setTemplateClassId(e.target.value)}
                  disabled={!templateSchoolId}
                >
                  <option value="">Kosong — tanpa rombel di baris contoh</option>
                  {templateClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.level_name} {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <p className="text-[12px] text-slate-500 leading-relaxed">
                Kolom <span className="font-mono">school_id</span>, <span className="font-mono">cohort_id</span>,{' '}
                <span className="font-mono">full_name</span>, <span className="font-mono">nis</span>, dan{' '}
                <span className="font-mono">gender</span> bersifat wajib. Kolom berakhiran{' '}
                <span className="font-mono">_name</span> (<span className="font-mono">school_name</span>,{' '}
                <span className="font-mono">cohort_name</span>, dst.) hanya untuk baca manusia; saat unggah yang dipakai
                tetap kolom <span className="font-mono">*_id</span>. Kolom lain opsional.
              </p>
              <div className="flex flex-wrap gap-2 justify-end pt-2">
                <Button variant="outline" type="button" onClick={() => setTemplateModalOpen(false)}>
                  Batal
                </Button>
                <Button type="button" onClick={downloadImportTemplate}>
                  <FileDown size={14} /> Unduh .xlsx
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
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
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              const name = file.name.toLowerCase();
              if (!name.endsWith('.xlsx')) {
                toast.error('Impor siswa hanya mendukung file Microsoft Excel (.xlsx).');
                return;
              }
              const fd = new FormData();
              fd.set('file', file);
              const res = await fetch('/api/students/import', { method: 'POST', body: fd });
              const j = (await res.json().catch(() => ({}))) as {
                error?: string;
                inserted?: number;
                skipped?: number;
              };
              if (!res.ok) {
                toast.error(j.error || 'Import siswa gagal');
                return;
              }
              toast.success(
                `Import selesai: ${j.inserted ?? 0} masuk, ${j.skipped ?? 0} dilewati`
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
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => {
              setTemplateSchoolId(filterSchool || '');
              if (filterSchool) {
                const first = classes.find((c) => String(c.school_id) === filterSchool);
                setTemplateClassId(first ? String(first.id) : '');
              } else {
                setTemplateClassId('');
              }
              setTemplateModalOpen(true);
            }}
          >
            <FileDown size={14} /> Template Excel
          </Button>
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
                        onClick={() =>
                          toast.info(
                            'Status / flag dapat dihubungkan ke field kustom pada fase berikutnya.'
                          )
                        }
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
