'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Field, Select, Button, Input, Textarea } from '@/components/ui/FormFields';
import { ArrowLeft, Save, Printer, ChevronLeft, ChevronRight, MapPin, FileText, Eye, ExternalLink, Receipt } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';
import { format, subMonths } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { toast } from 'sonner';
import { StudentPhotoUpload } from '@/components/student/StudentPhotoUpload';
import { StudentDocumentsSection } from '@/components/student/StudentDocumentsSection';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import { OsmEmbedMap } from '@/components/map/OsmEmbedMap';

type TabId =
  | 'personal'
  | 'parents'
  | 'documents'
  | 'education'
  | 'class_history'
  | 'billing'
  | 'payments'
  | 'log';

interface ParentForm {
  relation_type: string;
  full_name: string;
  nik: string;
  birth_year: string;
  education: string;
  occupation: string;
  income_bracket: string;
  special_needs_note: string;
  phone: string;
}

interface EduForm {
  school_name: string;
  level_label: string;
  year_from: string;
  year_to: string;
  notes: string;
}

const emptyParent = (relation: string): ParentForm => ({
  relation_type: relation,
  full_name: '',
  nik: '',
  birth_year: '',
  education: '',
  occupation: '',
  income_bracket: '',
  special_needs_note: '',
  phone: '',
});

/** Koordinat tersimpan; string kosong jangan di-`Number()` (menjadi 0 → titik di laut, bukan Bandung). */
function parseStoredLatLon(
  rawLat: unknown,
  rawLon: unknown
): { lat: number; lon: number } | null {
  const sLat = String(rawLat ?? '').trim();
  const sLon = String(rawLon ?? '').trim();
  if (!sLat || !sLon) return null;
  const lat = Number(sLat);
  const lon = Number(sLon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  /* 0,0 = bug umum dari field kosong / data rusak; untuk sekolah di ID tidak dipakai sebagai lokasi nyata */
  if (lat === 0 && lon === 0) return null;
  return { lat, lon };
}

function StudentDetailPageInner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewOnly = searchParams.get('view') === '1';

  const [tab, setTab] = useState<TabId>('personal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schools, setSchools] = useState<{ id: number; name: string }[]>([]);
  const [years, setYears] = useState<{ id: number; name: string }[]>([]);
  const [provinces, setProvinces] = useState<{ id: number; name: string }[]>([]);
  const [cities, setCities] = useState<{ id: number; name: string }[]>([]);
  const [districts, setDistricts] = useState<{ id: number; name: string }[]>([]);
  const [cohorts, setCohorts] = useState<{ id: number; name: string }[]>([]);
  const [subdistricts, setSubdistricts] = useState<
    { id: number; name: string; postal_code?: string | null }[]
  >([]);
  const [wilayahSummary, setWilayahSummary] = useState<string | null>(null);

  const [form, setForm] = useState<Record<string, string | boolean | number | null | undefined>>({});
  const [father, setFather] = useState<ParentForm>(emptyParent('father'));
  const [mother, setMother] = useState<ParentForm>(emptyParent('mother'));
  const [guardian, setGuardian] = useState<ParentForm>(emptyParent('guardian'));
  const [educationRows, setEducationRows] = useState<EduForm[]>([
    { school_name: '', level_label: '', year_from: '', year_to: '', notes: '' },
  ]);
  const [documents, setDocuments] = useState<
    { id: number; document_type: string; file_name: string; file_path: string }[]
  >([]);
  const [classHistories, setClassHistories] = useState<
    {
      id: number;
      class_name: string;
      level_name: string;
      academic_year_name: string;
      status: string | null;
      level_is_terminal?: boolean | string;
    }[]
  >([]);
  const [parentPortalLinks, setParentPortalLinks] = useState<
    { relation_type: string; portal_email: string; portal_full_name: string; portal_user_id: number }[]
  >([]);
  const [allClasses, setAllClasses] = useState<
    { id: number; school_id: number; name: string; level_name: string }[]
  >([]);
  const [parentAccessEmail, setParentAccessEmail] = useState('');
  const [parentAccessRelation, setParentAccessRelation] = useState('father');
  const [parentAccessPassword, setParentAccessPassword] = useState('');
  const [parentAccessBusy, setParentAccessBusy] = useState(false);
  const [geocodeBusy, setGeocodeBusy] = useState(false);
  const [geocodeCandidates, setGeocodeCandidates] = useState<
    { lat: number; lon: number; display_name?: string }[]
  >([]);
  const [graduateBusy, setGraduateBusy] = useState(false);
  const [listNavIds, setListNavIds] = useState<number[]>([]);

  const defaultPayTo = format(new Date(), 'yyyy-MM-dd');
  const defaultPayFrom = format(subMonths(new Date(), 12), 'yyyy-MM-dd');
  const [payFrom, setPayFrom] = useState(defaultPayFrom);
  const [payTo, setPayTo] = useState(defaultPayTo);
  const [payLoading, setPayLoading] = useState(false);
  const [headerLightboxOpen, setHeaderLightboxOpen] = useState(false);
  const [payRows, setPayRows] = useState<any[]>([]);

  const [billRows, setBillRows] = useState<any[]>([]);
  const [billTotal, setBillTotal] = useState(0);
  const [billLoading, setBillLoading] = useState(false);
  const [billPage, setBillPage] = useState(1);
  const [billLimit, setBillLimit] = useState(10);

  const [payTotal, setPayTotal] = useState(0);
  const [payPage, setPayPage] = useState(1);
  const [payLimit, setPayLimit] = useState(10);

  const [classTotal, setClassTotal] = useState(0);
  const [classPage, setClassPage] = useState(1);
  const [classLimit, setClassLimit] = useState(10);
  const [classLoading, setClassLoading] = useState(false);

  const PaginationControl = ({
    total,
    page,
    limit,
    setPage,
    setLimit,
    label,
  }: {
    total: number;
    page: number;
    limit: number;
    setPage: (p: number | ((p: number) => number)) => void;
    setLimit: (l: number) => void;
    label: string;
  }) => {
    const totalPages = Math.ceil(total / limit) || 1;
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/30 gap-4">
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500 whitespace-nowrap">
            Total {total.toLocaleString('id-ID')} {label} — Hal {page} / {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Baris:</span>
            <select
              className="h-7 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 px-1"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
            >
              {[10, 25, 50, 100].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="h-8 px-3 text-xs font-semibold"
          >
            <ChevronLeft size={14} className="mr-1" /> Sebelum
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="h-8 px-3 text-xs font-semibold"
          >
            Lanjut <ChevronRight size={14} className="ml-1" />
          </Button>
        </div>
      </div>
    );
  };

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/students/${id}`).then((r) => r.json()),
      fetch('/api/master/schools').then((r) => r.json()),
      fetch('/api/master/academic-years').then((r) => r.json()),
      fetch('/api/master/provinces').then((r) => r.json()),
      fetch('/api/master/classes').then((r) => r.json()),
    ]).then(([data, sch, ay, prov, cls]) => {
      if (data.error) {
        setLoading(false);
        return;
      }
      setSchools(sch);
      setYears(ay);
      setProvinces(Array.isArray(prov) ? prov : []);
      setAllClasses(Array.isArray(cls) ? cls : []);
      const parts = [data.province_name, data.city_name, data.district_name, data.subdistrict_name].filter(
        Boolean
      ) as string[];
      setWilayahSummary(parts.length ? parts.join(' › ') : null);
      setClassHistories(
        (data.class_histories || []) as {
          id: number;
          class_name: string;
          level_name: string;
          academic_year_name: string;
          status: string | null;
          level_is_terminal?: boolean | string;
        }[]
      );
      setParentPortalLinks(
        (data.parent_portal_links || []) as {
          relation_type: string;
          portal_email: string;
          portal_full_name: string;
          portal_user_id: number;
        }[]
      );
      const f = { ...data } as Record<string, unknown>;
      delete f.parent_profiles;
      delete f.documents;
      delete f.education_histories;
      delete f.class_histories;
      delete f.parent_portal_links;
      delete f.province_name;
      delete f.city_name;
      delete f.district_name;
      delete f.subdistrict_name;
      if (data.current_class_id != null) {
        f.current_class_id = data.current_class_id;
      }
      setForm(
        Object.fromEntries(
          Object.entries(f).map(([k, v]) => [
            k,
            v === null || v === undefined ? '' : typeof v === 'boolean' ? v : String(v),
          ])
        ) as Record<string, string | boolean | number | null | undefined>
      );
      const profiles = (data.parent_profiles || []) as {
        relation_type: string;
        full_name?: string;
        nik?: string;
        birth_year?: number;
        education?: string;
        occupation?: string;
        income_bracket?: string;
        special_needs_note?: string;
        phone?: string;
      }[];
      const setP = (rel: string, setter: (p: ParentForm) => void) => {
        const p = profiles.find((x) => x.relation_type === rel);
        if (p) {
          setter({
            relation_type: rel,
            full_name: p.full_name || '',
            nik: p.nik || '',
            birth_year: p.birth_year != null ? String(p.birth_year) : '',
            education: p.education || '',
            occupation: p.occupation || '',
            income_bracket: p.income_bracket || '',
            special_needs_note: p.special_needs_note || '',
            phone: p.phone || '',
          });
        }
      };
      setP('father', setFather);
      setP('mother', setMother);
      setP('guardian', setGuardian);

      const edu = (data.education_histories || []) as {
        school_name: string;
        level_label?: string;
        year_from?: number;
        year_to?: number;
        notes?: string;
      }[];
      if (edu.length > 0) {
        setEducationRows(
          edu.map((e) => ({
            school_name: e.school_name,
            level_label: e.level_label || '',
            year_from: e.year_from != null ? String(e.year_from) : '',
            year_to: e.year_to != null ? String(e.year_to) : '',
            notes: e.notes || '',
          }))
        );
      }
      setDocuments(data.documents || []);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get('nav') !== '1') {
      setListNavIds([]);
      return;
    }
    try {
      const raw = sessionStorage.getItem('students_list_nav');
      if (raw) {
        const j = JSON.parse(raw) as { ids?: number[] };
        setListNavIds(Array.isArray(j.ids) ? j.ids : []);
      }
    } catch {
      setListNavIds([]);
    }
  }, [searchParams]);

  const loadBills = useCallback(() => {
    setBillLoading(true);
    const q = new URLSearchParams({
      student_id: String(id),
      page: String(billPage),
      limit: String(billLimit),
    });
    fetch(`/api/billing/bills?${q}`)
      .then((r) => r.json())
      .then((data) => {
        setBillRows(data.data || []);
        setBillTotal(data.total || 0);
      })
      .catch(() => setBillRows([]))
      .finally(() => setBillLoading(false));
  }, [id, billPage, billLimit]);


  useEffect(() => {
    if (tab === 'billing') loadBills();
  }, [tab, loadBills]);

  const loadPayments = useCallback(() => {
    setPayLoading(true);
    const q = new URLSearchParams({
      student_id: String(id),
      from: '2010-01-01', // Rentang luas agar semua data muncul
      to: format(new Date(), 'yyyy-MM-dd'),
      limit: String(payLimit),
      page: String(payPage),
    });
    fetch(`/api/billing/transactions?${q}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.items) {
          setPayRows(data.items);
          setPayTotal(data.total || 0);
        } else {
          setPayRows([]);
          setPayTotal(0);
        }
      })
      .catch(() => setPayRows([]))
      .finally(() => setPayLoading(false));
  }, [id, payPage, payLimit]);



  const fmtMoney = (s: string | number) =>
    'Rp ' + parseFloat(String(s || '0')).toLocaleString('id-ID', { minimumFractionDigits: 0 });

  useEffect(() => {
    if (tab === 'payments') loadPayments();
  }, [tab, loadPayments]);


  useEffect(() => {
    const pid = form.province_id;
    if (pid === '' || pid === undefined || pid === null) {
      setCities([]);
      return;
    }
    fetch(`/api/master/cities?province_id=${pid}`)
      .then((r) => r.json())
      .then((rows) => setCities(Array.isArray(rows) ? rows : []))
      .catch(() => setCities([]));
  }, [form.province_id]);

  useEffect(() => {
    const cid = form.city_id;
    if (cid === '' || cid === undefined || cid === null) {
      setDistricts([]);
      return;
    }
    fetch(`/api/master/districts?city_id=${cid}`)
      .then((r) => r.json())
      .then((rows) => setDistricts(Array.isArray(rows) ? rows : []))
      .catch(() => setDistricts([]));
  }, [form.city_id]);

  useEffect(() => {
    const did = form.district_id;
    if (did === '' || did === undefined || did === null) {
      setSubdistricts([]);
      return;
    }
    fetch(`/api/master/subdistricts?district_id=${did}`)
      .then((r) => r.json())
      .then((rows) => setSubdistricts(Array.isArray(rows) ? rows : []))
      .catch(() => setSubdistricts([]));
  }, [form.district_id]);

  useEffect(() => {
    const sid = form.school_id;
    if (sid === '' || sid === undefined || sid === null) {
      setCohorts([]);
      return;
    }
    fetch(`/api/master/cohorts?school_id=${sid}`)
      .then((r) => r.json())
      .then((rows) => setCohorts(Array.isArray(rows) ? rows : []))
      .catch(() => setCohorts([]));
  }, [form.school_id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (viewOnly) return;
    setSaving(true);
    const payload = {
      school_id: Number(form.school_id),
      cohort_id: Number(form.cohort_id),
      full_name: form.full_name,
      nickname: emptyToNull(form.nickname as string),
      username: emptyToNull(form.username as string),
      nis: form.nis,
      nisn: emptyToNull(form.nisn as string),
      nik: emptyToNull(form.nik as string),
      nationality: emptyToNull(form.nationality as string),
      photo_url: emptyToNull(form.photo_url as string),
      student_type: emptyToNull(form.student_type as string),
      program: emptyToNull(form.program as string),
      curriculum: emptyToNull(form.curriculum as string),
      previous_school: emptyToNull(form.previous_school as string),
      gender: emptyToNull(form.gender as string),
      place_of_birth: emptyToNull(form.place_of_birth as string),
      date_of_birth: emptyToNull(form.date_of_birth as string),
      religion: emptyToNull(form.religion as string),
      child_order: numOrNull(form.child_order as string),
      siblings_count: numOrNull(form.siblings_count as string),
      child_status: emptyToNull(form.child_status as string),
      address: emptyToNull(form.address as string),
      rt: emptyToNull(form.rt as string),
      rw: emptyToNull(form.rw as string),
      hamlet: emptyToNull(form.hamlet as string),
      village_label: emptyToNull(form.village_label as string),
      district_label: emptyToNull(form.district_label as string),
      city_label: emptyToNull(form.city_label as string),
      province_id: numOrNull(form.province_id as string),
      city_id: numOrNull(form.city_id as string),
      district_id: numOrNull(form.district_id as string),
      subdistrict_id: numOrNull(form.subdistrict_id as string),
      postal_code: emptyToNull(form.postal_code as string),
      phone: emptyToNull(form.phone as string),
      email: emptyToNull(form.email as string),
      living_with: emptyToNull(form.living_with as string),
      daily_language: emptyToNull(form.daily_language as string),
      hobbies: emptyToNull(form.hobbies as string),
      aspiration: emptyToNull(form.aspiration as string),
      transport_mode: emptyToNull(form.transport_mode as string),
      distance_to_school: emptyToNull(form.distance_to_school as string),
      travel_time: emptyToNull(form.travel_time as string),
      registration_type: emptyToNull(form.registration_type as string),
      enrollment_date: emptyToNull(form.enrollment_date as string),
      diploma_serial: emptyToNull(form.diploma_serial as string),
      skhun_serial: emptyToNull(form.skhun_serial as string),
      is_alumni: form.is_alumni === true || form.is_alumni === 'true',
      boarding_status: emptyToNull(form.boarding_status as string),
      entry_academic_year_id: numOrNull(form.entry_academic_year_id as string),
      active_academic_year_id: numOrNull(form.active_academic_year_id as string),
      blood_type: emptyToNull(form.blood_type as string),
      weight_kg: emptyToNull(form.weight_kg as string),
      height_cm: numOrNull(form.height_cm as string),
      head_circumference_cm: numOrNull(form.head_circumference_cm as string),
      allergies: emptyToNull(form.allergies as string),
      vision_condition: emptyToNull(form.vision_condition as string),
      hearing_condition: emptyToNull(form.hearing_condition as string),
      special_needs: emptyToNull(form.special_needs as string),
      chronic_diseases: emptyToNull(form.chronic_diseases as string),
      physical_abnormalities: emptyToNull(form.physical_abnormalities as string),
      recurring_diseases: emptyToNull(form.recurring_diseases as string),
      graduated_at: emptyToNull(form.graduated_at as string),
      enrollment_status: (form.enrollment_status as string) || 'active',
      left_school_at: emptyToNull(form.left_school_at as string),
      exit_notes: emptyToNull(form.exit_notes as string),
      address_latitude: emptyToNull(form.address_latitude as string),
      address_longitude: emptyToNull(form.address_longitude as string),
      current_class_id: numOrNull(form.current_class_id as string),
      parent_profiles: [father, mother, guardian].filter((p) => p.full_name.trim()),
      education_histories: educationRows.filter((r) => r.school_name.trim()),
    };
    await fetch(`/api/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    load();
    router.refresh();
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Memuat...</div>;

  const tabBar: { id: TabId; label: string }[] = [
    { id: 'personal', label: 'Data Diri' },
    { id: 'parents', label: 'Orang Tua & Wali' },
    { id: 'documents', label: 'Dokumen' },
    { id: 'education', label: 'Riwayat Pendidikan' },
    { id: 'class_history', label: 'Histori kelas' },
    { id: 'billing', label: 'Tagihan' },
    { id: 'payments', label: 'Pembayaran' },
    { id: 'log', label: 'Log' },
  ];

  const schoolClasses = allClasses.filter((c) => String(c.school_id) === String(form.school_id || ''));
  const isTerminalLevel = (v: boolean | string | undefined) =>
    v === true || String(v).toLowerCase() === 'true' || String(v).toLowerCase() === 't';

  const canGraduate =
    !viewOnly &&
    classHistories.some((h) => h.status === 'active' && isTerminalLevel(h.level_is_terminal)) &&
    !(form.is_alumni === true || form.is_alumni === 'true') &&
    form.enrollment_status !== 'graduated';

  const navIdx = listNavIds.indexOf(Number(id));
  const prevStudentId = navIdx > 0 ? listNavIds[navIdx - 1] : null;
  const nextStudentId = navIdx >= 0 && navIdx < listNavIds.length - 1 ? listNavIds[navIdx + 1] : null;

  const photoUrl = String(form.photo_url || '').trim();
  const headerPhoto =
    photoUrl &&
    (photoUrl.startsWith('http') || photoUrl.startsWith('blob:') || photoUrl.startsWith('/'));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <ImageLightbox
        open={headerLightboxOpen}
        onClose={() => setHeaderLightboxOpen(false)}
        src={photoUrl}
        alt={String(form.full_name || 'Foto siswa')}
      />
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <Link href="/students">
            <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center mt-1 shrink-0">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          {headerPhoto ? (
            <button
              type="button"
              onClick={() => setHeaderLightboxOpen(true)}
              className="w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100 shadow-sm ring-1 ring-slate-900/5 cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
              aria-label="Perbesar foto siswa"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl}
                alt=""
                className="w-full h-full object-cover object-top pointer-events-none"
              />
            </button>
          ) : null}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-800">{String(form.full_name || 'Siswa')}</h2>
              {viewOnly && (
                <span className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  Mode lihat
                </span>
              )}
            </div>
            <p className="text-slate-700 text-sm font-medium mt-0.5">
              {schools.find((s) => String(s.id) === String(form.school_id || ''))?.name ||
                String(form.school_name || '') ||
                '—'}
            </p>
            <p className="text-slate-400 text-sm mt-0.5">
              NISN {String(form.nisn || '—')} · {String(form.student_type || '—')} · Kurikulum{' '}
              {String(form.curriculum || '—')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {viewOnly && searchParams.get('nav') === '1' && (prevStudentId != null || nextStudentId != null) && (
            <>
              <Link href={prevStudentId != null ? `/students/${prevStudentId}?view=1&nav=1` : '#'}>
                <Button variant="outline" size="sm" type="button" disabled={prevStudentId == null}>
                  <ChevronLeft size={14} /> Sebelumnya
                </Button>
              </Link>
              <Link href={nextStudentId != null ? `/students/${nextStudentId}?view=1&nav=1` : '#'}>
                <Button variant="outline" size="sm" type="button" disabled={nextStudentId == null}>
                  Berikutnya <ChevronRight size={14} />
                </Button>
              </Link>
            </>
          )}
          <Button variant="outline" size="sm" type="button" onClick={() => window.print()}>
            <Printer size={14} /> Cetak profil
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {tabBar.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {tab === 'personal' && (
          <section className="bg-white rounded-2xl border border-[#E2E8F1] p-6 space-y-6">
            <h3 className="text-base font-bold text-blue-700 uppercase tracking-wide border-b border-slate-100 pb-2">
              Data Pribadi
            </h3>
            <StudentPhotoUpload
              studentId={String(id)}
              photoUrl={form.photo_url as string | undefined}
              viewOnly={viewOnly}
              onPhotoSaved={(url) => setForm((f) => ({ ...f, photo_url: url }))}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nama Lengkap" required>
                <Input
                  value={String(form.full_name || '')}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  disabled={viewOnly}
                />
              </Field>
              <Field label="Nama Panggilan">
                <Input
                  value={String(form.nickname || '')}
                  onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
                  disabled={viewOnly}
                />
              </Field>
              <Field label="Jenis Kelamin">
                <Select
                  value={String(form.gender || 'L')}
                  onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                  disabled={viewOnly}
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </Select>
              </Field>
              <Field label="NIS" required>
                <Input
                  value={String(form.nis || '')}
                  onChange={(e) => setForm((f) => ({ ...f, nis: e.target.value }))}
                  disabled={viewOnly}
                />
              </Field>
              <Field label="NISN">
                <Input
                  value={String(form.nisn || '')}
                  onChange={(e) => setForm((f) => ({ ...f, nisn: e.target.value }))}
                  disabled={viewOnly}
                />
              </Field>
              <Field label="NIK">
                <Input
                  value={String(form.nik || '')}
                  onChange={(e) => setForm((f) => ({ ...f, nik: e.target.value }))}
                  disabled={viewOnly}
                />
              </Field>
              <Field label="Username">
                <Input
                  value={String(form.username || '')}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  disabled={viewOnly}
                />
              </Field>
              <Field label="Program">
                <Input
                  value={String(form.program || '')}
                  onChange={(e) => setForm((f) => ({ ...f, program: e.target.value }))}
                  disabled={viewOnly}
                />
              </Field>
              <Field label="Kurikulum">
                <Input
                  value={String(form.curriculum || '')}
                  onChange={(e) => setForm((f) => ({ ...f, curriculum: e.target.value }))}
                  disabled={viewOnly}
                />
              </Field>
              <Field label="Sekolah">
                <Select
                  value={String(form.school_id || '')}
                  onChange={(e) => {
                    const sid = e.target.value;
                    const name = schools.find((s) => String(s.id) === sid)?.name ?? '';
                    setForm((f) => ({ ...f, school_id: sid, school_name: name }));
                  }}
                  disabled={viewOnly}
                >
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Sekolah Asal (Sebelumnya)">
                <Input
                  value={String(form.previous_school || '')}
                  onChange={(e) => setForm((f) => ({ ...f, previous_school: e.target.value }))}
                  disabled={viewOnly}
                  placeholder="Nama sekolah asal"
                />
              </Field>
              <Field label="Angkatan Masuk" required>
                <Select
                  value={String(form.cohort_id || '')}
                  onChange={(e) => setForm((f) => ({ ...f, cohort_id: e.target.value }))}
                  disabled={viewOnly}
                  required
                >
                  <option value="">— Pilih Angkatan —</option>
                  {cohorts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Tahun Masuk">
                <Select
                  value={String(form.entry_academic_year_id || '')}
                  onChange={(e) => setForm((f) => ({ ...f, entry_academic_year_id: e.target.value }))}
                  disabled={viewOnly}
                >
                  <option value="">—</option>
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Tahun Aktif">
                <Select
                  value={String(form.active_academic_year_id || '')}
                  onChange={(e) => setForm((f) => ({ ...f, active_academic_year_id: e.target.value }))}
                  disabled={viewOnly}
                >
                  <option value="">—</option>
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Rombel (sesuai tahun aktif)" hint="Menyimpan riwayat kelas untuk tahun ajaran aktif">
                <Select
                  value={String(form.current_class_id || '')}
                  onChange={(e) => setForm((f) => ({ ...f, current_class_id: e.target.value }))}
                  disabled={viewOnly}
                >
                  <option value="">—</option>
                  {schoolClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.level_name} {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Tanggal lulus (opsional)">
                <Input
                  type="date"
                  value={String(form.graduated_at || '')}
                  onChange={(e) => setForm((f) => ({ ...f, graduated_at: e.target.value }))}
                  disabled={viewOnly}
                />
              </Field>
            </div>
            {canGraduate && (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm text-amber-900 flex-1">
                  Siswa di tingkat akhir: catat kelulusan (tutup rombel aktif, tandai alumni).
                </p>
            <Button
                  type="button"
                  size="sm"
                  loading={graduateBusy}
                  onClick={async () => {
                    toast.warning('Tandai siswa sebagai lulus? Rombel aktif akan ditutup dan status menjadi alumni.', {
                      action: {
                        label: 'Catat lulus',
                        onClick: async () => {
                          setGraduateBusy(true);
                          const res = await fetch(`/api/students/${id}/graduate`, { method: 'POST' });
                          const j = (await res.json().catch(() => ({}))) as { error?: string };
                          setGraduateBusy(false);
                          if (!res.ok) {
                            toast.error(j.error || 'Gagal mencatat kelulusan');
                            return;
                          }
                          toast.success('Kelulusan dicatat');
                          load();
                        },
                      },
                    });
                  }}
                >
                  Catat lulus
                </Button>
              </div>
            )}
            <h3 className="text-base font-bold text-blue-700 uppercase tracking-wide border-b border-slate-100 pb-2 pt-4">
              Alamat & lainnya
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
              <Field label="Alamat">
                {viewOnly ? (
                  <Textarea
                    value={String(form.address || '')}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    disabled
                    rows={2}
                  />
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-start">
                    <Textarea
                      value={String(form.address || '')}
                      onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                      rows={3}
                      className="min-h-[5.5rem] flex-1 min-w-0"
                      placeholder="Contoh: nama jalan, kompleks, kelurahan…"
                    />
                    <div className="flex flex-col gap-1.5 shrink-0 sm:w-[min(100%,14rem)] sm:pt-0">
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        className="w-full flex-col gap-1 whitespace-normal h-auto py-2.5 px-3 shadow-md hover:shadow-lg border-0 ring-1 ring-violet-500/30"
                        loading={geocodeBusy}
                        onClick={async () => {
                          const q = String(form.address || '').trim();
                          if (q.length < 5) {
                            toast.error('Isi alamat dulu (min. 5 karakter)');
                            return;
                          }
                          setGeocodeBusy(true);
                          const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
                          const text = await res.text();
                          setGeocodeBusy(false);
                          let j: {
                            error?: string;
                            results?: { lat: number; lon: number; display_name?: string }[];
                          } = {};
                          try {
                            if (text.trim()) j = JSON.parse(text) as typeof j;
                          } catch {
                            toast.error('Respons pencarian lokasi tidak valid');
                            return;
                          }
                          if (!res.ok) {
                            toast.error(j.error || 'Pencarian lokasi gagal');
                            setGeocodeCandidates([]);
                            return;
                          }
                          const list = j.results ?? [];
                          if (!list.length) {
                            toast.error(j.error || 'Lokasi tidak ditemukan');
                            setGeocodeCandidates([]);
                            return;
                          }
                          const r0 = list[0]!;
                          setGeocodeCandidates(list.length > 1 ? list : []);
                          setForm((f) => ({
                            ...f,
                            address_latitude: String(r0.lat),
                            address_longitude: String(r0.lon),
                          }));
                          toast.success(
                            list.length > 1
                              ? `Ditemukan ${list.length} lokasi — pilih yang paling sesuai di bawah jika perlu.`
                              : 'Koordinat diisi dari pencarian lokasi'
                          );
                        }}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white/95 leading-none">
                          Klik di sini
                        </span>
                        <span className="inline-flex items-center gap-1.5 justify-center w-full text-sm leading-snug">
                          <MapPin size={15} className="shrink-0 opacity-95" />
                          <span>Cari koordinat dari alamat</span>
                        </span>
                      </Button>
                      <p className="text-xs text-slate-500 leading-snug text-center sm:text-left">
                        Mengisi lintang &amp; bujur dari teks alamat di samping.
                      </p>
                    </div>
                  </div>
                )}
              </Field>
              </div>
              <div className="grid grid-cols-2 gap-2 md:col-span-2">
                <Field label="Lintang (latitude)">
                  <Input
                    value={String(form.address_latitude || '')}
                    onChange={(e) => setForm((f) => ({ ...f, address_latitude: e.target.value }))}
                    disabled={viewOnly}
                    placeholder="-6.xxx"
                  />
                </Field>
                <Field label="Bujur (longitude)">
                  <Input
                    value={String(form.address_longitude || '')}
                    onChange={(e) => setForm((f) => ({ ...f, address_longitude: e.target.value }))}
                    disabled={viewOnly}
                    placeholder="106.xxx"
                  />
                </Field>
                {form.address_latitude && form.address_longitude ? (
                  <div className="col-span-2 flex justify-end -mt-1">
                    <a
                      className="inline-flex items-center text-sm text-blue-600 underline"
                      target="_blank"
                      rel="noreferrer"
                      href={`https://www.openstreetmap.org/?mlat=${encodeURIComponent(String(form.address_latitude))}&mlon=${encodeURIComponent(String(form.address_longitude))}#map=16/${form.address_latitude}/${form.address_longitude}`}
                    >
                      Buka peta penuh di tab baru
                    </a>
                  </div>
                ) : null}
              </div>
              {(() => {
                /** Pusat Kota Bandung (Alun-alun / inti kota) — default bila koordinat siswa kosong */
                const BANDUNG_LAT = -6.9147;
                const BANDUNG_LON = 107.6098;
                const pin = parseStoredLatLon(form.address_latitude, form.address_longitude);
                const hasPin = pin != null;
                return (
                  <div className="md:col-span-2 space-y-1.5">
                    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                      <OsmEmbedMap
                        latitude={hasPin ? pin.lat : BANDUNG_LAT}
                        longitude={hasPin ? pin.lon : BANDUNG_LON}
                        zoom={hasPin ? 16 : 13}
                        showMarker={hasPin}
                        height={280}
                      />
                    </div>
                    {!hasPin && !viewOnly ? (
                      <p className="text-xs text-slate-500 px-0.5">
                        Pratinjau peta default: <span className="font-semibold text-slate-600">Kota Bandung</span>.
                        Isi alamat lalu tekan <span className="font-semibold">Klik di sini</span> agar penanda mengikuti lokasi.
                      </p>
                    ) : null}
                    {!hasPin && viewOnly ? (
                      <p className="text-xs text-slate-500 px-0.5">
                        Koordinat belum tercatat — peta menampilkan <span className="font-semibold text-slate-600">Kota Bandung</span> sebagai acuan.
                      </p>
                    ) : null}
                  </div>
                );
              })()}
              {!viewOnly && geocodeCandidates.length > 1 ? (
                <div className="md:col-span-2">
                  <Field label="Pilih hasil pencarian">
                    <Select
                      value={String(
                        Math.max(
                          0,
                          geocodeCandidates.findIndex(
                            (c) =>
                              String(c.lat) === String(form.address_latitude) &&
                              String(c.lon) === String(form.address_longitude)
                          )
                        )
                      )}
                      onChange={(e) => {
                        const idx = Number(e.target.value);
                        const r = geocodeCandidates[idx];
                        if (!r) return;
                        setForm((f) => ({
                          ...f,
                          address_latitude: String(r.lat),
                          address_longitude: String(r.lon),
                        }));
                      }}
                    >
                      {geocodeCandidates.map((c, i) => (
                        <option key={`${c.lat}-${c.lon}-${i}`} value={i}>
                          {(c.display_name || `${c.lat}, ${c.lon}`).slice(0, 120)}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-2">
                <Field label="RT">
                  <Input
                    value={String(form.rt || '')}
                    onChange={(e) => setForm((f) => ({ ...f, rt: e.target.value }))}
                    disabled={viewOnly}
                  />
                </Field>
                <Field label="RW">
                  <Input
                    value={String(form.rw || '')}
                    onChange={(e) => setForm((f) => ({ ...f, rw: e.target.value }))}
                    disabled={viewOnly}
                  />
                </Field>
              </div>

              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide md:col-span-2 pt-2">
                Wilayah administratif
              </h4>
              {viewOnly && wilayahSummary ? (
                <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 leading-relaxed">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-400 block mb-1.5">
                    Wilayah terdaftar
                  </span>
                  {wilayahSummary}
                  {form.postal_code ? (
                    <span className="block mt-2 text-slate-600">
                      Kode pos: <span className="font-mono font-semibold">{String(form.postal_code)}</span>
                    </span>
                  ) : null}
                </div>
              ) : (
                <>
                  <Field label="Provinsi">
                    <Select
                      value={String(form.province_id || '')}
                      onChange={(e) => {
                        const v = e.target.value;
                        setForm((f) => ({
                          ...f,
                          province_id: v,
                          city_id: '',
                          district_id: '',
                          subdistrict_id: '',
                          postal_code: '',
                        }));
                      }}
                      disabled={viewOnly}
                    >
                      <option value="">— Pilih provinsi —</option>
                      {provinces.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Kota / Kabupaten">
                    <Select
                      value={String(form.city_id || '')}
                      onChange={(e) => {
                        const v = e.target.value;
                        setForm((f) => ({
                          ...f,
                          city_id: v,
                          district_id: '',
                          subdistrict_id: '',
                          postal_code: '',
                        }));
                      }}
                      disabled={viewOnly || !form.province_id}
                    >
                      <option value="">— Pilih kota/kab —</option>
                      {cities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Kecamatan">
                    <Select
                      value={String(form.district_id || '')}
                      onChange={(e) => {
                        const v = e.target.value;
                        setForm((f) => ({
                          ...f,
                          district_id: v,
                          subdistrict_id: '',
                          postal_code: '',
                        }));
                      }}
                      disabled={viewOnly || !form.city_id}
                    >
                      <option value="">— Pilih kecamatan —</option>
                      {districts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Kelurahan / Desa">
                    <Select
                      value={String(form.subdistrict_id || '')}
                      onChange={(e) => {
                        const v = e.target.value;
                        const sub = subdistricts.find((s) => String(s.id) === v);
                        setForm((f) => ({
                          ...f,
                          subdistrict_id: v,
                          postal_code: sub?.postal_code
                            ? String(sub.postal_code)
                            : String(f.postal_code || ''),
                        }));
                      }}
                      disabled={viewOnly || !form.district_id}
                    >
                      <option value="">— Pilih kelurahan/desa —</option>
                      {subdistricts.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                          {s.postal_code ? ` (${s.postal_code})` : ''}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Kode pos">
                    <Input
                      value={String(form.postal_code || '')}
                      onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value }))}
                      disabled={viewOnly}
                      placeholder="Otomatis dari kelurahan jika tersedia"
                    />
                  </Field>
                </>
              )}

              <Field label="Data periodik — TB (cm)">
                <Input
                  type="number"
                  value={String(form.height_cm || '')}
                  onChange={(e) => setForm((f) => ({ ...f, height_cm: e.target.value }))}
                  disabled={viewOnly}
                />
              </Field>
              <Field label="BB (kg)">
                <Input
                  value={String(form.weight_kg || '')}
                  onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value }))}
                  disabled={viewOnly}
                />
              </Field>
              <Field label="Lingkar kepala (cm)">
                <Input
                  type="number"
                  value={String(form.head_circumference_cm || '')}
                  onChange={(e) => setForm((f) => ({ ...f, head_circumference_cm: e.target.value }))}
                  disabled={viewOnly}
                />
              </Field>
              <Field label="Status Pendaftaran">
                <Select
                  value={String(form.enrollment_status || 'active')}
                  onChange={(e) => setForm((f) => ({ ...f, enrollment_status: e.target.value }))}
                  disabled={viewOnly}
                >
                  <option value="active">Aktif</option>
                  <option value="graduated">Lulus</option>
                  <option value="transferred_out">Pindah</option>
                  <option value="withdrawn">Mengundurkan Diri</option>
                  <option value="expelled">Dikeluarkan</option>
                </Select>
              </Field>
              <Field label="Tanggal Keluar Sekolah">
                <Input
                  type="date"
                  value={String(form.left_school_at || '')}
                  onChange={(e) => setForm((f) => ({ ...f, left_school_at: e.target.value }))}
                  disabled={viewOnly}
                />
              </Field>
              <Field label="Catatan Keluar">
                <Input
                  value={String(form.exit_notes || '')}
                  onChange={(e) => setForm((f) => ({ ...f, exit_notes: e.target.value }))}
                  disabled={viewOnly}
                  placeholder="Alasan pindah / keluar"
                />
              </Field>
              <Field label="Alumni">
                <Select
                  value={form.is_alumni === true || form.is_alumni === 'true' ? '1' : '0'}
                  onChange={(e) => setForm((f) => ({ ...f, is_alumni: e.target.value === '1' }))}
                  disabled={viewOnly}
                >
                  <option value="0">Tidak</option>
                  <option value="1">Ya</option>
                </Select>
              </Field>
              <Field label="Boarding">
                <Input
                  value={String(form.boarding_status || '')}
                  onChange={(e) => setForm((f) => ({ ...f, boarding_status: e.target.value }))}
                  disabled={viewOnly}
                />
              </Field>
            </div>
          </section>
        )}

        {tab === 'parents' && (
          <section className="space-y-8">
            <div className="bg-white rounded-2xl border border-[#E2E8F1] p-6 space-y-4">
              <h3 className="text-base font-bold text-blue-700">Akses portal orang tua</h3>
              {parentPortalLinks.length > 0 ? (
                <ul className="text-sm text-slate-700 space-y-1">
                  {parentPortalLinks.map((l) => (
                    <li key={`${l.portal_user_id}-${l.relation_type}`}>
                      <span className="font-medium">{l.relation_type}</span>: {l.portal_full_name} —{' '}
                      <span className="font-mono text-xs">{l.portal_email}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">Belum ada akun portal terhubung ke siswa ini.</p>
              )}
              {!viewOnly && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <Field label="Email akun portal">
                    <Input
                      type="email"
                      value={parentAccessEmail}
                      onChange={(e) => setParentAccessEmail(e.target.value)}
                      placeholder="ortu@email.com"
                    />
                  </Field>
                  <Field label="Peran relasi">
                    <Select
                      value={parentAccessRelation}
                      onChange={(e) => setParentAccessRelation(e.target.value)}
                    >
                      <option value="father">Ayah</option>
                      <option value="mother">Ibu</option>
                      <option value="guardian">Wali</option>
                    </Select>
                  </Field>
                  <Field label="Password (jika akun baru, min. 6 karakter)" hint="Kosongkan untuk password acak">
                    <Input
                      type="password"
                      value={parentAccessPassword}
                      onChange={(e) => setParentAccessPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </Field>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      loading={parentAccessBusy}
                      onClick={async () => {
                        setParentAccessBusy(true);
                        const res = await fetch(`/api/students/${id}/parent-access`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            email: parentAccessEmail.trim(),
                            relation_type: parentAccessRelation,
                            password: parentAccessPassword || undefined,
                            full_name:
                              parentAccessRelation === 'mother'
                                ? mother.full_name
                                : parentAccessRelation === 'guardian'
                                  ? guardian.full_name
                                  : father.full_name,
                            phone:
                              parentAccessRelation === 'mother'
                                ? mother.phone
                                : parentAccessRelation === 'guardian'
                                  ? guardian.phone
                                  : father.phone,
                          }),
                        });
                        const j = await res.json().catch(() => ({}));
                        setParentAccessBusy(false);
                        if (!res.ok) {
                          toast.error((j as { error?: string }).error || 'Gagal');
                          return;
                        }
                        if ((j as { generated_password?: string }).generated_password) {
                          toast.success(
                            `Akun dibuat. Simpan password sementara: ${(j as { generated_password: string }).generated_password}`
                          );
                        } else {
                          toast.success('Akun terhubung');
                        }
                        setParentAccessEmail('');
                        setParentAccessPassword('');
                        load();
                      }}
                    >
                      Buat atau hubungkan akun
                    </Button>
                  </div>
                </div>
              )}
            </div>
            {[
              { label: 'Ayah', state: father, set: setFather },
              { label: 'Ibu', state: mother, set: setMother },
              { label: 'Wali', state: guardian, set: setGuardian },
            ].map(({ label, state, set }) => (
              <div
                key={label}
                className="bg-white rounded-2xl border border-[#E2E8F1] p-6 space-y-4"
              >
                <h3 className="text-base font-bold text-blue-700">{label} kandung / wali</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Nama">
                    <Input
                      value={state.full_name}
                      onChange={(e) => set({ ...state, full_name: e.target.value })}
                      disabled={viewOnly}
                    />
                  </Field>
                  <Field label="NIK">
                    <Input
                      value={state.nik}
                      onChange={(e) => set({ ...state, nik: e.target.value })}
                      disabled={viewOnly}
                    />
                  </Field>
                  <Field label="Tahun lahir">
                    <Input
                      value={state.birth_year}
                      onChange={(e) => set({ ...state, birth_year: e.target.value })}
                      disabled={viewOnly}
                    />
                  </Field>
                  <Field label="Pendidikan">
                    <Input
                      value={state.education}
                      onChange={(e) => set({ ...state, education: e.target.value })}
                      disabled={viewOnly}
                    />
                  </Field>
                  <Field label="Pekerjaan">
                    <Input
                      value={state.occupation}
                      onChange={(e) => set({ ...state, occupation: e.target.value })}
                      disabled={viewOnly}
                    />
                  </Field>
                  <Field label="Penghasilan">
                    <Input
                      value={state.income_bracket}
                      onChange={(e) => set({ ...state, income_bracket: e.target.value })}
                      disabled={viewOnly}
                    />
                  </Field>
                  <Field label="No. HP">
                    <Input
                      value={state.phone}
                      onChange={(e) => set({ ...state, phone: e.target.value })}
                      disabled={viewOnly}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </section>
        )}

        {tab === 'documents' && (
          <StudentDocumentsSection
            studentId={String(id)}
            documents={documents}
            viewOnly={viewOnly}
            onDocumentsChanged={load}
          />
        )}

        {tab === 'education' && (
          <section className="bg-white rounded-2xl border border-[#E2E8F1] p-6 space-y-4">
            <h3 className="text-base font-bold text-blue-700">Riwayat pendidikan</h3>
            {educationRows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 border-b border-slate-50 pb-4">
                <Field label="Nama sekolah">
                  <Input
                    value={row.school_name}
                    onChange={(e) => {
                      const next = [...educationRows];
                      next[idx] = { ...row, school_name: e.target.value };
                      setEducationRows(next);
                    }}
                    disabled={viewOnly}
                  />
                </Field>
                <Field label="Jenjang">
                  <Input
                    value={row.level_label}
                    onChange={(e) => {
                      const next = [...educationRows];
                      next[idx] = { ...row, level_label: e.target.value };
                      setEducationRows(next);
                    }}
                    disabled={viewOnly}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Dari tahun">
                    <Input
                      value={row.year_from}
                      onChange={(e) => {
                        const next = [...educationRows];
                        next[idx] = { ...row, year_from: e.target.value };
                        setEducationRows(next);
                      }}
                      disabled={viewOnly}
                    />
                  </Field>
                  <Field label="Sampai">
                    <Input
                      value={row.year_to}
                      onChange={(e) => {
                        const next = [...educationRows];
                        next[idx] = { ...row, year_to: e.target.value };
                        setEducationRows(next);
                      }}
                      disabled={viewOnly}
                    />
                  </Field>
                </div>
              </div>
            ))}
            {!viewOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setEducationRows([
                    ...educationRows,
                    { school_name: '', level_label: '', year_from: '', year_to: '', notes: '' },
                  ])
                }
              >
                + Baris riwayat
              </Button>
            )}
          </section>
        )}

        {tab === 'class_history' && (
          <section className="bg-white rounded-2xl border border-[#E2E8F1] p-6 overflow-x-auto">
            <h3 className="text-base font-bold text-blue-700 mb-4">Histori rombel</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-500">
                  <th className="py-2 pr-3">Tahun ajaran</th>
                  <th className="py-2 pr-3">Tingkat</th>
                  <th className="py-2 pr-3">Kelas</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {classHistories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      Belum ada riwayat
                    </td>
                  </tr>
                ) : (
                  classHistories
                    .slice((classPage - 1) * classLimit, classPage * classLimit)
                    .map((h) => (
                      <tr key={h.id} className="border-b border-slate-50">
                        <td className="py-2 pr-3">{h.academic_year_name}</td>
                        <td className="py-2 pr-3">{h.level_name}</td>
                        <td className="py-2 pr-3">{h.class_name}</td>
                        <td className="py-2">{h.status ?? '—'}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
            <PaginationControl
              total={classHistories.length}
              page={classPage}
              limit={classLimit}
              setPage={setClassPage}
              setLimit={setClassLimit}
              label="Histori"
            />
          </section>
        )}

        {(tab === 'billing' || tab === 'payments' || tab === 'log') && (
          <section
            className={`bg-white rounded-2xl border border-slate-200 p-0 overflow-hidden shadow-sm ${
              tab === 'log' ? 'bg-slate-50 border-dashed p-8 text-center text-slate-500' : ''
            }`}
          >
            {tab === 'billing' && (
              <div className="space-y-0 text-sm">
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <FileText size={16} className="text-emerald-600" /> Daftar Tagihan
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Daftar tagihan yang diterbitkan untuk siswa ini
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Total: {billTotal} Tagihan
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-left">
                      <tr>
                        <th className="px-4 py-3 font-semibold w-12 text-center text-sm">ID</th>
                        <th className="px-4 py-3 font-semibold">Judul Tagihan</th>
                        <th className="px-4 py-3 font-semibold">Produk</th>
                        <th className="px-4 py-3 font-semibold text-right">Total</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold w-24 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billLoading ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                            Memuat data tagihan…
                          </td>
                        </tr>
                      ) : billRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                            Belum ada data tagihan.
                          </td>
                        </tr>
                      ) : (
                        billRows.map((r) => (
                          <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3 text-center font-mono text-xs text-slate-400">{r.id}</td>
                            <td className="px-4 py-3 font-medium text-slate-800">{r.title}</td>
                            <td className="px-4 py-3 text-slate-600">{r.product_name}</td>
                            <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
                              {fmtMoney(r.total_amount)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded border text-xs font-semibold uppercase tracking-tight ${
                                  r.status === 'paid'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold'
                                    : r.status === 'partial'
                                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                                      : 'bg-slate-50 text-slate-600 border-slate-200'
                                }`}
                              >
                                {r.status || 'unpaid'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Link
                                href={`/billing/bills/${r.id}/detail`}
                                className="inline-flex items-center justify-center p-1.5 rounded-lg text-blue-600 hover:bg-blue-100 border border-transparent hover:border-blue-200 transition-all shadow-sm bg-white"
                                title="Lihat detail pembayaran"
                              >
                                <Eye size={16} />
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <PaginationControl
                  total={billTotal}
                  page={billPage}
                  limit={billLimit}
                  setPage={setBillPage}
                  setLimit={setBillLimit}
                  label="Tagihan"
                />
              </div>
            )}
            {tab === 'payments' && (
              <div className="space-y-0 text-sm">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Receipt size={16} className="text-orange-600" /> Riwayat Pembayaran
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Daftar transaksi pembayaran yang dilakukan oleh siswa ini
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-left">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Referensi</th>
                        <th className="px-4 py-3 font-semibold">Waktu</th>
                        <th className="px-4 py-3 font-semibold">Metode</th>
                        <th className="px-4 py-3 font-semibold text-right">Total</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold w-24 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payLoading ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                            Memuat riwayat pembayaran…
                          </td>
                        </tr>
                      ) : payRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                            Tidak ada data dalam periode ini.
                          </td>
                        </tr>
                      ) : (
                        payRows.map((r) => (
                          <tr key={`${r.id}-${r.created_at}`} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-slate-700 font-medium">{r.reference_no}</td>
                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-sm">
                              {format(new Date(r.created_at), 'd MMM yyyy HH:mm', { locale: idLocale })}
                            </td>
                            <td className="px-4 py-3 text-slate-600 text-sm font-medium">{r.payment_method_name || '—'}</td>
                            <td className="px-4 py-3 text-right font-bold tabular-nums text-slate-900">
                              {fmtMoney(r.total_amount)}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                                {r.status || 'success'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Link
                                href={`/billing/transactions/${r.id}?created_at=${encodeURIComponent(r.created_at)}`}
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold text-xs hover:underline"
                              >
                                Detail <ExternalLink size={12} />
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <PaginationControl
                  total={payTotal}
                  page={payPage}
                  limit={payLimit}
                  setPage={setPayPage}
                  setLimit={setPayLimit}
                  label="Pembayaran"
                />
              </div>
            )}
            {tab === 'log' && (
              <div className="p-12 text-center text-slate-400">
                <p>Log aktivitas dapat dihubungkan ke audit trail di fase berikutnya.</p>
              </div>
            )}
          </section>
        )}


        {!viewOnly && (
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Link href="/students">
              <Button variant="ghost" type="button">
                Batal
              </Button>
            </Link>
            <Button type="submit" loading={saving}>
              <Save size={16} /> Simpan
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-400">Memuat…</div>}>
      <StudentDetailPageInner params={params} />
    </Suspense>
  );
}

function emptyToNull(s: string): string | null {
  const t = s?.trim();
  return t ? t : null;
}

function numOrNull(s: string): number | null {
  const t = s?.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}
