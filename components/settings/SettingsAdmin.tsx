'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Field, Input, Select } from '@/components/ui/FormFields';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format } from 'date-fns';

const LIMIT = 15;

const SETTING_KEY_OPTIONS: { key: string; label: string }[] = [
  { key: 'app_title', label: 'Judul aplikasi (app_title)' },
  { key: 'logo_main_url', label: 'Logo utama sidebar (logo_main_url)' },
  { key: 'logo_login_url', label: 'Logo halaman login (logo_login_url)' },
  { key: 'primary_color', label: 'Warna utama tema (primary_color)' },
  { key: 'login_welcome_text', label: 'Teks sambutan login (login_welcome_text)' },
  { key: 'favicon_url', label: 'Favicon / icon tab browser (favicon_url)' },
  { key: 'login_title', label: 'Judul besar kartu login (login_title)' },
  { key: 'login_subtitle', label: 'Subjudul / deskripsi singkat login (login_subtitle)' },
  { key: 'login_cta_text', label: 'Teks tombol login (login_cta_text)' },
  { key: 'login_bg_url', label: 'Gambar background panel kanan login (login_bg_url)' },
];

type SettingValueType = 'text' | 'image' | 'color';

function guessValueType(key: string, value: string | null): SettingValueType {
  const k = key.toLowerCase();
  if (k.includes('color') || k.includes('colour') || k.endsWith('_color')) return 'color';
  if (k.includes('logo') || k.includes('image') || k.includes('favicon') || k.endsWith('_url')) {
    if (value && /^https?:\/\//.test(value)) return 'image';
  }
  return 'text';
}

interface Row {
  id: number;
  school_id: number | null;
  setting_key: string;
  setting_value: string | null;
  description: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  school_name?: string | null;
}

type SettingsFormRecord = Partial<Omit<Row, 'school_id'>> & {
  school_id?: number | null | '';
  value_type?: SettingValueType;
};

interface ListResp {
  data: Row[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function SettingsAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterQ, setFilterQ] = useState('');
  const [filterSchool, setFilterSchool] = useState('');
  const [schools, setSchools] = useState<{ id: number; name: string }[]>([]);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [modal, setModal] = useState<{ open: boolean; record: SettingsFormRecord }>({ open: false, record: {} });

  useEffect(() => {
    fetch('/api/master/schools')
      .then((r) => r.json())
      .then((d) => setSchools(Array.isArray(d) ? d : []));
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(LIMIT));
    if (filterQ.trim()) params.set('q', filterQ.trim());
    if (filterSchool) params.set('school_id', filterSchool);
    fetch(`/api/settings?${params}`)
      .then((r) => r.json())
      .then((d: ListResp) => {
        setRows(d.data || []);
        setTotalPages(d.totalPages || 1);
        setTotal(d.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, filterQ, filterSchool]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    const r = modal.record;
    if (!r.setting_key?.trim()) {
      alert('Kunci pengaturan wajib');
      return;
    }
    const school_id =
      r.school_id === '' || r.school_id == null ? null : Number(r.school_id);

    // Cegah duplikasi kombinasi (school_id, setting_key) di sisi UI
    if (!r.id) {
      const key = r.setting_key.trim();
      const exists = rows.some(
        (row) => row.setting_key === key && row.school_id === school_id
      );
      if (exists) {
        alert('Kombinasi sekolah + kunci pengaturan ini sudah ada. Silakan edit entri tersebut, bukan membuat baru.');
        return;
      }
    }

    const body = {
      setting_key: r.setting_key.trim(),
      setting_value: r.setting_value?.trim() ? r.setting_value : null,
      description: r.description?.trim() ? r.description.trim().slice(0, 255) : null,
      school_id,
    };
    const url = r.id ? `/api/settings/${r.id}` : '/api/settings';
    const method = r.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert((j as { error?: string }).error || 'Gagal menyimpan');
      return;
    }
    setModal({ open: false, record: {} });
    load();
  };

  const del = async (id: number) => {
    if (!confirm('Hapus pengaturan ini?')) return;
    setDeleting(id);
    const res = await fetch(`/api/settings/${id}`, { method: 'DELETE' });
    setDeleting(null);
    if (!res.ok) {
      alert('Gagal menghapus');
      return;
    }
    load();
  };

  const preview = (v: string | null, len = 48) => {
    if (v == null || v === '') return '—';
    return v.length > len ? v.slice(0, len) + '…' : v;
  };

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Pengaturan</h2>
        <p className="text-slate-400 text-[13px]">CRUD pengaturan internal (core_settings)</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Field label="Cari kunci / nilai / deskripsi">
            <Input value={filterQ} onChange={(e) => setFilterQ(e.target.value)} placeholder="Filter..." />
          </Field>
          <Field label="Sekolah">
            <Select value={filterSchool} onChange={(e) => setFilterSchool(e.target.value)}>
              <option value="">Semua</option>
              <option value="__global__">Hanya global (tanpa sekolah)</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="flex justify-between flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => { setPage(1); load(); }}>
            Terapkan filter
          </Button>
          <Button
            size="sm"
            onClick={() =>
              setModal({
                open: true,
                record: { value_type: 'text' },
              })
            }
          >
            <Plus size={14} /> Tambah pengaturan
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] uppercase text-slate-500">
              <th className="px-3 py-3">Kunci</th>
              <th className="px-3 py-3">Nilai</th>
              <th className="px-3 py-3">Deskripsi</th>
              <th className="px-3 py-3">Sekolah</th>
              <th className="px-3 py-3">Diperbarui</th>
              <th className="px-3 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  Memuat...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  Tidak ada data
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-3 py-2 font-mono text-xs font-semibold text-slate-800">{r.setting_key}</td>
                  <td className="px-3 py-2 text-slate-600 max-w-[240px]" title={r.setting_value ?? ''}>
                    {preview(r.setting_value, 60)}
                  </td>
                  <td className="px-3 py-2 text-slate-500 max-w-[180px]">{preview(r.description, 40)}</td>
                  <td className="px-3 py-2">
                    {r.school_name ?? <span className="text-slate-400">Global</span>}
                  </td>
                  <td className="px-3 py-2 text-slate-500 whitespace-nowrap text-[12px]">
                    {r.updated_at ? format(new Date(r.updated_at), 'dd/MM/yyyy HH:mm') : '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setModal({
                            open: true,
                            record: {
                              id: r.id,
                              setting_key: r.setting_key,
                              setting_value: r.setting_value ?? '',
                              description: r.description ?? '',
                              school_id: r.school_id != null ? r.school_id : '',
                              value_type: guessValueType(r.setting_key, r.setting_value),
                            },
                          })
                        }
                      >
                        <Edit2 size={13} />
                      </Button>
                      <Button size="sm" variant="danger" loading={deleting === r.id} onClick={() => del(r.id)}>
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-slate-100 flex justify-between text-[13px] text-slate-500">
          <span>
            {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} dari {total}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft size={14} />
            </Button>
            <span className="tabular-nums">
              {page} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      </div>

      {modal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-bold text-slate-800">
                {modal.record?.id ? 'Edit pengaturan' : 'Tambah pengaturan'}
              </h3>
              <button type="button" className="text-slate-400" onClick={() => setModal({ open: false, record: {} })}>
                <X size={20} />
              </button>
            </div>
            <Field label="Sekolah" hint="Kosong = berlaku global (yayasan)">
              <Select
                value={
                  modal.record?.school_id !== undefined && modal.record?.school_id !== null && modal.record.school_id !== ''
                    ? String(modal.record.school_id)
                    : ''
                }
                onChange={(e) =>
                  setModal((m) => ({
                    ...m,
                    record: { ...m.record, school_id: e.target.value ? Number(e.target.value) : '' },
                  }))
                }
              >
                <option value="">(Global)</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Kunci (setting_key)" required>
              {modal.record?.id ? (
                <Input
                  value={modal.record.setting_key ?? ''}
                  disabled
                />
              ) : (
                <Select
                  value={modal.record?.setting_key ?? ''}
                  onChange={(e) =>
                    setModal((m) => ({
                      ...m,
                      record: { ...m.record, setting_key: e.target.value },
                    }))
                  }
                >
                  <option value="">— Pilih kunci —</option>
                  {SETTING_KEY_OPTIONS.map((opt) => {
                    const schoolIdForCheck =
                      modal.record?.school_id === '' || modal.record?.school_id == null
                        ? null
                        : Number(modal.record.school_id);
                    const alreadyUsed = rows.some(
                      (row) => row.setting_key === opt.key && row.school_id === schoolIdForCheck
                    );
                    return (
                      <option key={opt.key} value={opt.key} disabled={alreadyUsed}>
                        {opt.label}
                      </option>
                    );
                  })}
                </Select>
              )}
            </Field>
            {modal.record?.id && (
              <p className="text-[11px] text-slate-400">Kunci tidak bisa diubah setelah dibuat.</p>
            )}
            <Field label="Jenis nilai">
              <Select
                value={modal.record?.value_type ?? 'text'}
                onChange={(e) =>
                  setModal((m) => ({
                    ...m,
                    record: { ...m.record, value_type: (e.target.value || 'text') as SettingValueType },
                  }))
                }
              >
                <option value="text">Teks / konfigurasi umum</option>
                <option value="image">Logo / URL gambar</option>
                <option value="color">Warna (hex)</option>
              </Select>
            </Field>
            {(() => {
              const vt: SettingValueType = modal.record?.value_type ?? 'text';
              if (vt === 'image') {
                const url = modal.record?.setting_value ?? '';
                return (
                  <div className="space-y-2">
                    <Field label="Logo / URL gambar">
                      <div className="space-y-2">
                        {url ? (
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-16 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} alt="Preview logo" className="max-w-full max-h-full object-contain" />
                            </div>
                            <span className="text-[11px] text-slate-500 break-all">{url}</span>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400">
                            Belum ada logo tersimpan. Unggah file atau isi URL gambar publik.
                          </p>
                        )}
                        <Input
                          value={url}
                          onChange={(e) =>
                            setModal((m) => ({
                              ...m,
                              record: { ...m.record, setting_value: e.target.value },
                            }))
                          }
                          placeholder="https://contoh.com/logo.png"
                        />
                        <div className="flex items-center gap-3">
                          <label className="inline-flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const form = new FormData();
                                form.set('file', file);
                                form.set('prefix', 'settings/logo');
                                const res = await fetch('/api/upload/blob', {
                                  method: 'POST',
                                  body: form,
                                });
                                const j = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
                                if (!res.ok || !j.url) {
                                  alert(j.error || 'Gagal mengunggah logo');
                                  return;
                                }
                                setModal((m) => ({
                                  ...m,
                                  record: { ...m.record, setting_value: j.url ?? '' },
                                }));
                              }}
                            />
                            <span className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[12px]">
                              Pilih file logo…
                            </span>
                          </label>
                          <p className="text-[11px] text-slate-400">
                            Disimpan di storage dan otomatis mengisi kolom URL di atas.
                          </p>
                        </div>
                      </div>
                    </Field>
                  </div>
                );
              }
              if (vt === 'color') {
                const val = modal.record?.setting_value ?? '';
                return (
                  <Field label="Warna (hex)">
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={/^#[0-9a-fA-F]{6}$/.test(val) ? val : '#2f4f4f'}
                        onChange={(e) =>
                          setModal((m) => ({
                            ...m,
                            record: { ...m.record, setting_value: e.target.value },
                          }))
                        }
                        className="w-10 h-10 rounded-md border border-slate-200 bg-white"
                      />
                      <Input
                        value={val}
                        onChange={(e) =>
                          setModal((m) => ({
                            ...m,
                            record: { ...m.record, setting_value: e.target.value },
                          }))
                        }
                        placeholder="#2563eb"
                      />
                    </div>
                  </Field>
                );
              }
              return (
                <Field label="Nilai">
                  <textarea
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-[13.5px] outline-none min-h-[100px]"
                    value={modal.record?.setting_value ?? ''}
                    onChange={(e) =>
                      setModal((m) => ({ ...m, record: { ...m.record, setting_value: e.target.value } }))
                    }
                    placeholder="Nilai pengaturan (teks bebas, JSON, dsb.)"
                  />
                </Field>
              );
            })()}
            <Field label="Deskripsi">
              <Input
                value={modal.record?.description ?? ''}
                onChange={(e) => setModal((m) => ({ ...m, record: { ...m.record, description: e.target.value } }))}
              />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" type="button" onClick={() => setModal({ open: false, record: {} })}>
                Batal
              </Button>
              <Button type="button" onClick={save}>
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
