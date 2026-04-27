'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Field, Input, Select } from '@/components/ui/FormFields';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { toast } from 'sonner';
import { confirmToast } from '@/components/ui/confirmToast';

type TabId = 'themes' | 'modules' | 'access';

const LIMIT = 15;

const MAX_THEME_IMAGE_BYTES = 10 * 1024 * 1024;
const COLOR_PICKER_FALLBACK = '#2563eb';

type PendingImage = { file: File; previewUrl: string } | null;

function revokePending(p: PendingImage) {
  if (p?.previewUrl) URL.revokeObjectURL(p.previewUrl);
}

function isAllowedThemeImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  const name = file.name.toLowerCase();
  return name.endsWith('.ico') || name.endsWith('.svg');
}

async function postBlobUpload(file: File, prefix: string): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('prefix', prefix);
  const res = await fetch('/api/upload/blob', { method: 'POST', body: fd });
  const j = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok) throw new Error(j.error || 'Gagal mengunggah file');
  return j.url as string;
}

interface ListResp<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function PortalModulesAdmin() {
  const [tab, setTab] = useState<TabId>('themes');

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Portal &amp; modul aplikasi</h2>
        <p className="text-slate-400 text-[13px]">
          <code className="text-[12px] bg-slate-100 px-1 rounded">core_portal_themes</code>,{' '}
          <code className="text-[12px] bg-slate-100 px-1 rounded">core_app_modules</code>,{' '}
          <code className="text-[12px] bg-slate-100 px-1 rounded">core_module_access</code>
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {(
          [
            ['themes', 'Tema portal'],
            ['modules', 'Modul aplikasi'],
            ['access', 'Akses modul'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${
              tab === id
                ? 'bg-violet-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'themes' && <ThemesSection />}
      {tab === 'modules' && <ModulesSection />}
      {tab === 'access' && <AccessSection />}
    </div>
  );
}

type ThemeRow = {
  id: number;
  host_domain: string;
  portal_title: string;
  logo_url: string | null;
  primary_color: string | null;
  login_bg_url: string | null;
  favicon_url: string | null;
  welcome_text: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function ThemesSection() {
  const [rows, setRows] = useState<ThemeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterQ, setFilterQ] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingLogo, setPendingLogo] = useState<PendingImage>(null);
  const [pendingLoginBg, setPendingLoginBg] = useState<PendingImage>(null);
  const [pendingFavicon, setPendingFavicon] = useState<PendingImage>(null);
  const [modal, setModal] = useState<{ open: boolean; record: Partial<ThemeRow> | null }>({
    open: false,
    record: null,
  });
  const logoFileRef = useRef<HTMLInputElement>(null);
  const loginBgFileRef = useRef<HTMLInputElement>(null);
  const faviconFileRef = useRef<HTMLInputElement>(null);

  const resetPending = useCallback(() => {
    setPendingLogo((prev) => {
      revokePending(prev);
      return null;
    });
    setPendingLoginBg((prev) => {
      revokePending(prev);
      return null;
    });
    setPendingFavicon((prev) => {
      revokePending(prev);
      return null;
    });
  }, []);

  const closeModal = useCallback(() => {
    resetPending();
    setModal({ open: false, record: null });
  }, [resetPending]);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(LIMIT));
    if (filterQ.trim()) params.set('q', filterQ.trim());
    fetch(`/api/master/portal-themes?${params}`)
      .then((r) => r.json())
      .then((d: ListResp<ThemeRow>) => {
        setRows(d.data || []);
        setTotalPages(d.totalPages || 1);
        setTotal(d.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, filterQ]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    resetPending();
    setModal({ open: true, record: {} });
  };

  const openEdit = (r: ThemeRow) => {
    resetPending();
    setModal({ open: true, record: { ...r } });
  };

  const handlePickImage = (file: File | undefined, setPending: React.Dispatch<React.SetStateAction<PendingImage>>) => {
    if (!file) return;
    if (!isAllowedThemeImageFile(file)) {
      toast.error('Pilih gambar (JPG, PNG, WebP, ICO, dll.)');
      return;
    }
    if (file.size > MAX_THEME_IMAGE_BYTES) {
      toast.error('File terlalu besar (maks 10 MB)');
      return;
    }
    setPending((prev) => {
      revokePending(prev);
      const previewUrl = URL.createObjectURL(file);
      return { file, previewUrl };
    });
  };

  const save = async () => {
    const r = modal.record;
    if (!r?.host_domain?.trim() || !r?.portal_title?.trim()) {
      toast.warning('Host domain dan judul portal wajib diisi');
      return;
    }
    setSaving(true);
    try {
      let logo_url: string | null =
        r.logo_url != null && String(r.logo_url).trim() !== '' ? String(r.logo_url).trim() : null;
      let login_bg_url: string | null =
        r.login_bg_url != null && String(r.login_bg_url).trim() !== '' ? String(r.login_bg_url).trim() : null;
      let favicon_url: string | null =
        r.favicon_url != null && String(r.favicon_url).trim() !== '' ? String(r.favicon_url).trim() : null;

      if (pendingLogo) logo_url = await postBlobUpload(pendingLogo.file, 'portal-themes/logo');
      if (pendingLoginBg) login_bg_url = await postBlobUpload(pendingLoginBg.file, 'portal-themes/login-bg');
      if (pendingFavicon) favicon_url = await postBlobUpload(pendingFavicon.file, 'portal-themes/favicon');

      const primary_color =
        r.primary_color != null && String(r.primary_color).trim() !== ''
          ? String(r.primary_color).trim().slice(0, 20)
          : null;

      const body = {
        host_domain: r.host_domain.trim(),
        portal_title: r.portal_title.trim(),
        logo_url,
        primary_color,
        login_bg_url,
        favicon_url,
        welcome_text: r.welcome_text != null && String(r.welcome_text).trim() !== '' ? String(r.welcome_text).trim() : null,
      };
      const url = r.id ? `/api/master/portal-themes/${r.id}` : '/api/master/portal-themes';
      const method = r.id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(j.error || 'Gagal menyimpan tema portal');
        return;
      }
      resetPending();
      setModal({ open: false, record: null });
      toast.success('Tema portal berhasil disimpan');
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menyimpan tema portal');
    } finally {
      setSaving(false);
    }
  };

  const del = (id: number) => {
    confirmToast('Hapus tema portal ini?', {
      confirmLabel: 'Hapus',
      onConfirm: async () => {
        setDeleting(id);
        const res = await fetch(`/api/master/portal-themes/${id}`, { method: 'DELETE' });
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setDeleting(null);
        if (!res.ok) {
          toast.error(j.error || 'Gagal menghapus tema portal');
          return;
        }
        toast.success('Tema portal dihapus');
        load();
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end justify-between">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl flex-1">
          <Field label="Cari host / judul">
            <Input value={filterQ} onChange={(e) => setFilterQ(e.target.value)} placeholder="Filter..." />
          </Field>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setPage(1); load(); }}>
            Terapkan filter
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus size={14} /> Tambah
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] uppercase text-slate-500">
              <th className="px-3 py-3">Host</th>
              <th className="px-3 py-3">Judul</th>
              <th className="px-3 py-3">Favicon</th>
              <th className="px-3 py-3">Warna</th>
              <th className="px-3 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  Memuat...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  Tidak ada data
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-3 py-2 font-mono text-xs">{r.host_domain}</td>
                  <td className="px-3 py-2 font-medium text-slate-800">{r.portal_title}</td>
                  <td className="px-3 py-2">
                    {r.favicon_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.favicon_url}
                        alt=""
                        className="w-5 h-5 rounded object-contain border border-slate-200 bg-white"
                        title={r.favicon_url}
                      />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {r.primary_color ? (
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="w-5 h-5 rounded border border-slate-200"
                          style={{ background: r.primary_color }}
                        />
                        {r.primary_color}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
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
            {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} / {total}
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
                {modal.record?.id ? 'Edit tema portal' : 'Tambah tema portal'}
              </h3>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600"
                onClick={closeModal}
                aria-label="Tutup dialog"
              >
                <X size={20} />
              </button>
            </div>
            <Field label="Host domain" required>
              <Input
                value={modal.record?.host_domain ?? ''}
                onChange={(e) => setModal((m) => ({ ...m, record: { ...m.record, host_domain: e.target.value } }))}
                placeholder="parents.sekolah.id"
              />
            </Field>
            <Field label="Judul portal" required>
              <Input
                value={modal.record?.portal_title ?? ''}
                onChange={(e) => setModal((m) => ({ ...m, record: { ...m.record, portal_title: e.target.value } }))}
              />
            </Field>
            <Field
              label="Logo"
              hint="Pilih gambar lalu simpan; unggah ke penyimpanan saat Anda menekan Simpan."
            >
              <input
                ref={logoFileRef}
                type="file"
                accept="image/*,.ico"
                className="hidden"
                aria-label="Unggah logo portal"
                onChange={(e) => {
                  handlePickImage(e.target.files?.[0], setPendingLogo);
                  e.target.value = '';
                }}
              />
              <div className="flex flex-wrap items-start gap-3">
                <div className="w-20 h-20 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                  {pendingLogo?.previewUrl || modal.record?.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pendingLogo?.previewUrl ?? modal.record?.logo_url ?? ''}
                      alt="Pratinjau logo"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <span className="text-[11px] text-slate-400 px-1 text-center">Belum ada</span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="outline" type="button" onClick={() => logoFileRef.current?.click()}>
                    {pendingLogo || modal.record?.logo_url ? 'Ganti gambar' : 'Pilih gambar'}
                  </Button>
                  {pendingLogo && (
                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      className="text-slate-500"
                      onClick={() =>
                        setPendingLogo((prev) => {
                          revokePending(prev);
                          return null;
                        })
                      }
                    >
                      Batalkan pilihan
                    </Button>
                  )}
                </div>
              </div>
            </Field>
            <Field
              label="Background login"
              hint="Gambar latar halaman login portal; unggah saat Simpan."
            >
              <input
                ref={loginBgFileRef}
                type="file"
                accept="image/*,.ico"
                className="hidden"
                aria-label="Unggah background login"
                onChange={(e) => {
                  handlePickImage(e.target.files?.[0], setPendingLoginBg);
                  e.target.value = '';
                }}
              />
              <div className="flex flex-wrap items-start gap-3">
                <div className="w-28 h-16 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                  {pendingLoginBg?.previewUrl || modal.record?.login_bg_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pendingLoginBg?.previewUrl ?? modal.record?.login_bg_url ?? ''}
                      alt="Pratinjau background"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[11px] text-slate-400 px-1 text-center">Belum ada</span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="outline" type="button" onClick={() => loginBgFileRef.current?.click()}>
                    {pendingLoginBg || modal.record?.login_bg_url ? 'Ganti gambar' : 'Pilih gambar'}
                  </Button>
                  {pendingLoginBg && (
                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      className="text-slate-500"
                      onClick={() =>
                        setPendingLoginBg((prev) => {
                          revokePending(prev);
                          return null;
                        })
                      }
                    >
                      Batalkan pilihan
                    </Button>
                  )}
                </div>
              </div>
            </Field>
            <Field
              label="Favicon"
              hint="Ikon tab browser (PNG, ICO, SVG); unggah saat Simpan."
            >
              <input
                ref={faviconFileRef}
                type="file"
                accept="image/*,.ico,.svg,image/svg+xml"
                className="hidden"
                aria-label="Unggah favicon"
                onChange={(e) => {
                  handlePickImage(e.target.files?.[0], setPendingFavicon);
                  e.target.value = '';
                }}
              />
              <div className="flex flex-wrap items-start gap-3">
                <div className="w-12 h-12 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                  {pendingFavicon?.previewUrl || modal.record?.favicon_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pendingFavicon?.previewUrl ?? modal.record?.favicon_url ?? ''}
                      alt="Pratinjau favicon"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-400 px-0.5 text-center leading-tight">—</span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="outline" type="button" onClick={() => faviconFileRef.current?.click()}>
                    {pendingFavicon || modal.record?.favicon_url ? 'Ganti file' : 'Pilih file'}
                  </Button>
                  {pendingFavicon && (
                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      className="text-slate-500"
                      onClick={() =>
                        setPendingFavicon((prev) => {
                          revokePending(prev);
                          return null;
                        })
                      }
                    >
                      Batalkan pilihan
                    </Button>
                  )}
                </div>
              </div>
            </Field>
            <Field label="Warna primary" hint="Pilih warna tema; kosongkan jika tidak dipakai.">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="color"
                  className="h-10 w-14 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
                  value={
                    modal.record?.primary_color && /^#[0-9A-Fa-f]{6}$/.test(modal.record.primary_color)
                      ? modal.record.primary_color
                      : COLOR_PICKER_FALLBACK
                  }
                  onChange={(e) =>
                    setModal((m) => ({
                      ...m,
                      record: { ...m.record, primary_color: e.target.value },
                    }))
                  }
                  aria-label="Pilih warna primary"
                />
                <span className="text-[12px] text-slate-500 font-mono tabular-nums">
                  {modal.record?.primary_color && /^#[0-9A-Fa-f]{6}$/.test(modal.record.primary_color)
                    ? modal.record.primary_color
                    : '—'}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() =>
                    setModal((m) => ({
                      ...m,
                      record: { ...m.record, primary_color: null },
                    }))
                  }
                >
                  Kosongkan warna
                </Button>
              </div>
            </Field>
            <Field label="Teks sambutan">
              <textarea
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-[13.5px] outline-none min-h-[80px]"
                value={modal.record?.welcome_text ?? ''}
                onChange={(e) => setModal((m) => ({ ...m, record: { ...m.record, welcome_text: e.target.value } }))}
              />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" type="button" onClick={closeModal}>
                Batal
              </Button>
              <Button type="button" loading={saving} onClick={save}>
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type ModRow = { id: number; module_code: string; module_name: string };

function ModulesSection() {
  const [rows, setRows] = useState<ModRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterQ, setFilterQ] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);
  const [modal, setModal] = useState<{ open: boolean; record: Partial<ModRow> | null }>({ open: false, record: null });

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(LIMIT));
    if (filterQ.trim()) params.set('q', filterQ.trim());
    fetch(`/api/master/app-modules?${params}`)
      .then((r) => r.json())
      .then((d: ListResp<ModRow>) => {
        setRows(d.data || []);
        setTotalPages(d.totalPages || 1);
        setTotal(d.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, filterQ]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    const r = modal.record;
    if (!r?.module_code?.trim() || !r?.module_name?.trim()) {
      toast.warning('Kode dan nama modul wajib diisi');
      return;
    }
    const body = { module_code: r.module_code.trim(), module_name: r.module_name.trim() };
    const url = r.id ? `/api/master/app-modules/${r.id}` : '/api/master/app-modules';
    const method = r.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      toast.error(j.error || 'Gagal menyimpan modul');
      return;
    }
    setModal({ open: false, record: null });
    toast.success('Modul aplikasi berhasil disimpan');
    load();
  };

  const del = (id: number) => {
    confirmToast('Hapus modul aplikasi ini?', {
      confirmLabel: 'Hapus',
      onConfirm: async () => {
        setDeleting(id);
        const res = await fetch(`/api/master/app-modules/${id}`, { method: 'DELETE' });
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setDeleting(null);
        if (!res.ok) {
          toast.error(j.error || 'Gagal menghapus modul');
          return;
        }
        toast.success('Modul aplikasi dihapus');
        load();
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end justify-between">
        <div className="max-w-xs flex-1">
          <Field label="Cari kode / nama">
            <Input value={filterQ} onChange={(e) => setFilterQ(e.target.value)} placeholder="Filter..." />
          </Field>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setPage(1); load(); }}>
            Terapkan filter
          </Button>
          <Button size="sm" onClick={() => setModal({ open: true, record: {} })}>
            <Plus size={14} /> Tambah
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] uppercase text-slate-500">
              <th className="px-3 py-3">Kode</th>
              <th className="px-3 py-3">Nama modul</th>
              <th className="px-3 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-slate-400">
                  Memuat...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-slate-400">
                  Tidak ada data
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-3 py-2 font-mono text-xs">{r.module_code}</td>
                  <td className="px-3 py-2 font-medium text-slate-800">{r.module_name}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setModal({ open: true, record: { ...r } })}>
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
            {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} / {total}
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
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-bold text-slate-800">
                {modal.record?.id ? 'Edit modul' : 'Tambah modul'}
              </h3>
              <button type="button" className="text-slate-400" onClick={() => setModal({ open: false, record: null })}>
                <X size={20} />
              </button>
            </div>
            <Field label="Module code" required>
              <Input
                value={modal.record?.module_code ?? ''}
                onChange={(e) => setModal((m) => ({ ...m, record: { ...m.record, module_code: e.target.value } }))}
                placeholder="financial"
              />
            </Field>
            <Field label="Nama modul" required>
              <Input
                value={modal.record?.module_name ?? ''}
                onChange={(e) => setModal((m) => ({ ...m, record: { ...m.record, module_name: e.target.value } }))}
              />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" type="button" onClick={() => setModal({ open: false, record: null })}>
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

type AccessRow = {
  id: number;
  module_id: number;
  school_id: number | null;
  level_grade_id: number | null;
  is_visible: boolean;
  module_code?: string;
  module_name?: string;
  school_name?: string | null;
  level_grade_name?: string | null;
};

function AccessSection() {
  const [rows, setRows] = useState<AccessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterQ, setFilterQ] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [filterSchool, setFilterSchool] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterVis, setFilterVis] = useState('');
  const [modules, setModules] = useState<{ id: number; module_code: string; module_name: string }[]>([]);
  const [schools, setSchools] = useState<{ id: number; name: string }[]>([]);
  const [levels, setLevels] = useState<{ id: number; name: string; school_id: number }[]>([]);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [modal, setModal] = useState<{ open: boolean; record: Partial<AccessRow> | null }>({ open: false, record: null });

  useEffect(() => {
    Promise.all([
      fetch('/api/master/app-modules').then((r) => r.json()),
      fetch('/api/master/schools').then((r) => r.json()),
      fetch('/api/master/level-grades').then((r) => r.json()),
    ]).then(([m, s, l]) => {
      setModules(Array.isArray(m) ? m : []);
      setSchools(Array.isArray(s) ? s : []);
      setLevels(Array.isArray(l) ? l : []);
    });
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(LIMIT));
    if (filterQ.trim()) params.set('q', filterQ.trim());
    if (filterModule) params.set('module_id', filterModule);
    if (filterSchool) params.set('school_id', filterSchool);
    if (filterLevel) params.set('level_grade_id', filterLevel);
    if (filterVis === 'true' || filterVis === 'false') params.set('is_visible', filterVis);
    fetch(`/api/master/module-access?${params}`)
      .then((r) => r.json())
      .then((d: ListResp<AccessRow>) => {
        setRows(d.data || []);
        setTotalPages(d.totalPages || 1);
        setTotal(d.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, filterQ, filterModule, filterSchool, filterLevel, filterVis]);

  useEffect(() => {
    load();
  }, [load]);

  const modalSchoolId =
    modal.record?.school_id != null ? String(modal.record.school_id) : '';
  const filteredLevels = modalSchoolId
    ? levels.filter((lg) => String(lg.school_id) === modalSchoolId)
    : levels;

  const save = async () => {
    const r = modal.record;
    if (!r?.module_id) {
      toast.warning('Pilih modul');
      return;
    }
    const body = {
      module_id: Number(r.module_id),
      school_id: r.school_id == null ? null : Number(r.school_id),
      level_grade_id: r.level_grade_id == null ? null : Number(r.level_grade_id),
      is_visible: r.is_visible !== false,
    };
    const url = r.id ? `/api/master/module-access/${r.id}` : '/api/master/module-access';
    const method = r.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      toast.error(j.error || 'Gagal menyimpan aturan akses modul');
      return;
    }
    setModal({ open: false, record: null });
    toast.success('Aturan akses modul disimpan');
    load();
  };

  const del = (id: number) => {
    confirmToast('Hapus aturan akses modul ini?', {
      confirmLabel: 'Hapus',
      onConfirm: async () => {
        setDeleting(id);
        const res = await fetch(`/api/master/module-access/${id}`, { method: 'DELETE' });
        setDeleting(null);
        if (!res.ok) {
          toast.error('Gagal menghapus aturan akses modul');
          return;
        }
        toast.success('Aturan akses modul dihapus');
        load();
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <Field label="Modul">
            <Select value={filterModule} onChange={(e) => setFilterModule(e.target.value)}>
              <option value="">Semua</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.module_code}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Sekolah">
            <Select value={filterSchool} onChange={(e) => setFilterSchool(e.target.value)}>
              <option value="">Semua</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tingkat">
            <Select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
              <option value="">Semua</option>
              {levels.map((lg) => (
                <option key={lg.id} value={lg.id}>
                  {lg.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tampil">
            <Select value={filterVis} onChange={(e) => setFilterVis(e.target.value)}>
              <option value="">Semua</option>
              <option value="true">Ya</option>
              <option value="false">Tidak</option>
            </Select>
          </Field>
          <div className="lg:col-span-2">
            <Field label="Cari teks">
              <Input value={filterQ} onChange={(e) => setFilterQ(e.target.value)} placeholder="Kode, nama, sekolah..." />
            </Field>
          </div>
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
                record: { module_id: modules[0]?.id, is_visible: true, school_id: null, level_grade_id: null },
              })
            }
          >
            <Plus size={14} /> Tambah
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] uppercase text-slate-500">
              <th className="px-3 py-3">Modul</th>
              <th className="px-3 py-3">Sekolah</th>
              <th className="px-3 py-3">Tingkat</th>
              <th className="px-3 py-3">Tampil</th>
              <th className="px-3 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  Memuat...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  Tidak ada data
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-3 py-2">
                    <div className="font-semibold text-slate-800">{r.module_name}</div>
                    <div className="text-[11px] font-mono text-slate-500">{r.module_code}</div>
                  </td>
                  <td className="px-3 py-2">{r.school_name ?? <span className="text-slate-400">Global</span>}</td>
                  <td className="px-3 py-2">{r.level_grade_name ?? <span className="text-slate-400">—</span>}</td>
                  <td className="px-3 py-2">{r.is_visible ? 'Ya' : 'Tidak'}</td>
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
                              module_id: r.module_id,
                              school_id: r.school_id,
                              level_grade_id: r.level_grade_id,
                              is_visible: r.is_visible,
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
            {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} / {total}
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
                {modal.record?.id ? 'Edit akses modul' : 'Tambah akses modul'}
              </h3>
              <button type="button" className="text-slate-400" onClick={() => setModal({ open: false, record: null })}>
                <X size={20} />
              </button>
            </div>
            <Field label="Modul" required>
              <Select
                value={modal.record?.module_id != null ? String(modal.record.module_id) : ''}
                onChange={(e) => setModal((m) => ({ ...m, record: { ...m.record, module_id: Number(e.target.value) } }))}
              >
                <option value="">— Pilih —</option>
                {modules.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.module_code} — {x.module_name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Sekolah" hint="Kosong = aturan global">
              <Select
                value={modal.record?.school_id != null ? String(modal.record.school_id) : ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setModal((m) => ({
                    ...m,
                    record: {
                      ...m.record,
                      school_id: v ? Number(v) : null,
                      level_grade_id: null,
                    },
                  }));
                }}
              >
                <option value="">(Global / semua sekolah)</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tingkat kelas" hint="Opsional; filter sesuai sekolah jika dipilih">
              <Select
                value={modal.record?.level_grade_id != null ? String(modal.record.level_grade_id) : ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setModal((m) => ({
                    ...m,
                    record: { ...m.record, level_grade_id: v ? Number(v) : null },
                  }));
                }}
              >
                <option value="">(Semua tingkat / tidak spesifik)</option>
                {filteredLevels.map((lg) => (
                  <option key={lg.id} value={lg.id}>
                    {lg.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tampil">
              <Select
                value={modal.record?.is_visible === false ? 'false' : 'true'}
                onChange={(e) =>
                  setModal((m) => ({
                    ...m,
                    record: { ...m.record, is_visible: e.target.value === 'true' },
                  }))
                }
              >
                <option value="true">Ya</option>
                <option value="false">Tidak</option>
              </Select>
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" type="button" onClick={() => setModal({ open: false, record: null })}>
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
