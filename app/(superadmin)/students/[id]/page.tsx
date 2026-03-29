'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Field, Select, Button, Input, Textarea } from '@/components/ui/FormFields';
import { ArrowLeft, Save, Printer } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';
import { format, subMonths } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Toaster } from 'sonner';
import { StudentPhotoUpload } from '@/components/student/StudentPhotoUpload';
import { StudentDocumentsSection } from '@/components/student/StudentDocumentsSection';
import { ImageLightbox } from '@/components/ui/ImageLightbox';

type TabId = 'personal' | 'parents' | 'documents' | 'education' | 'billing' | 'payments' | 'log';

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

  const defaultPayTo = format(new Date(), 'yyyy-MM-dd');
  const defaultPayFrom = format(subMonths(new Date(), 12), 'yyyy-MM-dd');
  const [payFrom, setPayFrom] = useState(defaultPayFrom);
  const [payTo, setPayTo] = useState(defaultPayTo);
  const [payLoading, setPayLoading] = useState(false);
  const [headerLightboxOpen, setHeaderLightboxOpen] = useState(false);
  const [payRows, setPayRows] = useState<
    {
      id: number;
      created_at: string;
      reference_no: string;
      total_amount: string;
      status: string | null;
      payer_name: string | null;
    }[]
  >([]);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/students/${id}`).then((r) => r.json()),
      fetch('/api/master/schools').then((r) => r.json()),
      fetch('/api/master/academic-years').then((r) => r.json()),
      fetch('/api/master/provinces').then((r) => r.json()),
    ]).then(([data, sch, ay, prov]) => {
      if (data.error) {
        setLoading(false);
        return;
      }
      setSchools(sch);
      setYears(ay);
      setProvinces(Array.isArray(prov) ? prov : []);
      const parts = [data.province_name, data.city_name, data.district_name, data.subdistrict_name].filter(
        Boolean
      ) as string[];
      setWilayahSummary(parts.length ? parts.join(' › ') : null);
      const f = { ...data } as Record<string, unknown>;
      delete f.parent_profiles;
      delete f.documents;
      delete f.education_histories;
      delete f.province_name;
      delete f.city_name;
      delete f.district_name;
      delete f.subdistrict_name;
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

  const loadPayments = useCallback(() => {
    setPayLoading(true);
    const q = new URLSearchParams({
      student_id: String(id),
      from: payFrom,
      to: payTo,
      limit: '50',
      page: '1',
    });
    fetch(`/api/billing/transactions?${q}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.items) setPayRows(data.items);
        else setPayRows([]);
      })
      .catch(() => setPayRows([]))
      .finally(() => setPayLoading(false));
  }, [id, payFrom, payTo]);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (viewOnly) return;
    setSaving(true);
    const payload = {
      school_id: Number(form.school_id),
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
    { id: 'billing', label: 'Tagihan' },
    { id: 'payments', label: 'Pembayaran' },
    { id: 'log', label: 'Log' },
  ];

  const photoUrl = String(form.photo_url || '').trim();
  const headerPhoto =
    photoUrl &&
    (photoUrl.startsWith('http') || photoUrl.startsWith('blob:') || photoUrl.startsWith('/'));

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-6">
      <Toaster position="top-right" richColors />
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
              <h2 className="text-xl font-bold text-slate-800">{String(form.full_name || 'Siswa')}</h2>
              {viewOnly && (
                <span className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  Mode lihat
                </span>
              )}
            </div>
            <p className="text-slate-700 text-[13px] font-medium mt-0.5">
              {schools.find((s) => String(s.id) === String(form.school_id || ''))?.name ||
                String(form.school_name || '') ||
                '—'}
            </p>
            <p className="text-slate-400 text-[13px] mt-0.5">
              NISN {String(form.nisn || '—')} · {String(form.student_type || '—')} · Kurikulum{' '}
              {String(form.curriculum || '—')}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" type="button" onClick={() => window.print()}>
          <Printer size={14} /> Cetak profil
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {tabBar.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-t-lg text-[13px] font-medium transition-colors ${
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
            <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wide border-b border-slate-100 pb-2">
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
            </div>
            <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wide border-b border-slate-100 pb-2 pt-4">
              Alamat & lainnya
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Alamat">
                <Textarea
                  value={String(form.address || '')}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  disabled={viewOnly}
                  rows={2}
                />
              </Field>
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
                <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-800 leading-relaxed">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400 block mb-1.5">
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
            {[
              { label: 'Ayah', state: father, set: setFather },
              { label: 'Ibu', state: mother, set: setMother },
              { label: 'Wali', state: guardian, set: setGuardian },
            ].map(({ label, state, set }) => (
              <div
                key={label}
                className="bg-white rounded-2xl border border-[#E2E8F1] p-6 space-y-4"
              >
                <h3 className="text-sm font-bold text-blue-700">{label} kandung / wali</h3>
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
            <h3 className="text-sm font-bold text-blue-700">Riwayat pendidikan</h3>
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

        {(tab === 'billing' || tab === 'payments' || tab === 'log') && (
          <section
            className={`bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 text-[13px] ${
              tab === 'payments' ? 'text-slate-600' : 'text-center text-slate-500'
            }`}
          >
            {tab === 'billing' && (
              <p>
                Tagihan terhubung ke modul Keuangan. Gunakan menu{' '}
                <Link href="/billing/generate" className="text-blue-600 underline">
                  Generate Tagihan
                </Link>{' '}
                / Kasir.
              </p>
            )}
            {tab === 'payments' && (
              <div className="text-left max-w-3xl mx-auto space-y-4">
                <p className="text-slate-600">
                  Riwayat transaksi yang melibatkan siswa ini (filter tanggal memakai{' '}
                  <code className="text-[12px]">created_at</code> header transaksi untuk partisi).
                </p>
                <div className="flex flex-wrap gap-3 items-end">
                  <Field label="Dari">
                    <Input type="date" value={payFrom} onChange={(e) => setPayFrom(e.target.value)} />
                  </Field>
                  <Field label="Sampai">
                    <Input type="date" value={payTo} onChange={(e) => setPayTo(e.target.value)} />
                  </Field>
                  <Button type="button" size="sm" onClick={loadPayments} loading={payLoading}>
                    Muat ulang
                  </Button>
                </div>
                <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600">
                        <th className="text-left px-3 py-2 font-semibold">Referensi</th>
                        <th className="text-left px-3 py-2 font-semibold">Waktu</th>
                        <th className="text-left px-3 py-2 font-semibold">Pembayar</th>
                        <th className="text-right px-3 py-2 font-semibold">Total</th>
                        <th className="text-right px-3 py-2 font-semibold" />
                      </tr>
                    </thead>
                    <tbody>
                      {payLoading ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                            Memuat…
                          </td>
                        </tr>
                      ) : payRows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                            Tidak ada transaksi pada periode ini.
                          </td>
                        </tr>
                      ) : (
                        payRows.map((r) => (
                          <tr key={`${r.id}-${r.created_at}`} className="border-t border-slate-100">
                            <td className="px-3 py-2 font-mono text-[11px]">{r.reference_no}</td>
                            <td className="px-3 py-2 text-slate-600">
                              {format(new Date(r.created_at), 'd MMM yyyy HH:mm', { locale: idLocale })}
                            </td>
                            <td className="px-3 py-2">{r.payer_name || '—'}</td>
                            <td className="px-3 py-2 text-right font-semibold">
                              Rp{' '}
                              {parseFloat(r.total_amount).toLocaleString('id-ID', {
                                minimumFractionDigits: 0,
                              })}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <Link
                                href={`/billing/transactions/${r.id}?created_at=${encodeURIComponent(r.created_at)}`}
                                className="text-blue-600 hover:underline"
                              >
                                Detail
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {tab === 'log' && <p>Log aktivitas dapat dihubungkan ke audit trail di fase berikutnya.</p>}
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
