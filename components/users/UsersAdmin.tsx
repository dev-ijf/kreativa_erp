'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Field, Input, Select } from '@/components/ui/FormFields';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format } from 'date-fns';

const LIMIT = 15;

const ROLES = [
  { value: 'superadmin', label: 'Superadmin' },
  { value: 'school_finance', label: 'Keuangan sekolah' },
  { value: 'parent', label: 'Orang tua' },
  { value: 'teacher', label: 'Guru' },
  { value: 'student', label: 'Siswa' },
];

interface Row {
  id: number;
  school_id: number | null;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  created_at?: string | null;
  school_name?: string | null;
}

/** Form state: select HTML memakai '' untuk “tidak pilih sekolah”. */
type UserFormRecord = Partial<Omit<Row, 'school_id'>> & {
  school_id?: number | null | '';
  password?: string;
};

interface ListResp {
  data: Row[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function UsersAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterQ, setFilterQ] = useState('');
  const [filterSchool, setFilterSchool] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [schools, setSchools] = useState<{ id: number; name: string }[]>([]);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [modal, setModal] = useState<{ open: boolean; record: UserFormRecord }>({ open: false, record: {} });

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
    if (filterRole) params.set('role', filterRole);
    fetch(`/api/users?${params}`)
      .then((r) => r.json())
      .then((d: ListResp) => {
        setRows(d.data || []);
        setTotalPages(d.totalPages || 1);
        setTotal(d.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, filterQ, filterSchool, filterRole]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    const r = modal.record;
    if (!r.full_name?.trim() || !r.email?.trim() || !r.role) {
      alert('Nama, email, dan peran wajib');
      return;
    }
    if (!r.id && (!r.password || r.password.length < 6)) {
      alert('Password minimal 6 karakter (wajib untuk pengguna baru)');
      return;
    }
    if (r.id && r.password && r.password.length > 0 && r.password.length < 6) {
      alert('Password minimal 6 karakter');
      return;
    }
    const school_id =
      r.school_id === '' || r.school_id == null ? null : Number(r.school_id);
    let res: Response;
    if (!r.id) {
      res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: r.full_name.trim(),
          email: r.email.trim().toLowerCase(),
          password: r.password,
          phone: r.phone?.trim() || null,
          role: r.role,
          school_id,
        }),
      });
    } else {
      const payload: Record<string, unknown> = {
        full_name: r.full_name.trim(),
        email: r.email.trim().toLowerCase(),
        phone: r.phone?.trim() || null,
        role: r.role,
        school_id,
      };
      if (r.password && r.password.length > 0) {
        payload.password = r.password;
      }
      res = await fetch(`/api/users/${r.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert((j as { error?: string }).error || 'Gagal menyimpan');
      return;
    }
    setModal({ open: false, record: {} });
    load();
  };

  const del = async (id: number) => {
    if (!confirm('Hapus pengguna ini?')) return;
    setDeleting(id);
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    const j = await res.json().catch(() => ({}));
    setDeleting(null);
    if (!res.ok) {
      alert((j as { error?: string }).error || 'Gagal menghapus');
      return;
    }
    load();
  };

  const roleLabel = (code: string) => ROLES.find((x) => x.value === code)?.label ?? code;

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Data Pengguna</h2>
        <p className="text-slate-400 text-[13px]">Kelola akun login (core_users)</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label="Cari">
            <Input
              value={filterQ}
              onChange={(e) => setFilterQ(e.target.value)}
              placeholder="Nama, email, telepon..."
            />
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
          <Field label="Peran">
            <Select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
              <option value="">Semua</option>
              {ROLES.map((x) => (
                <option key={x.value} value={x.value}>
                  {x.label}
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
            onClick={() => setModal({ open: true, record: { role: 'parent', school_id: '' } })}
          >
            <Plus size={14} /> Tambah pengguna
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] uppercase text-slate-500">
              <th className="px-3 py-3">Nama</th>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3">Telepon</th>
              <th className="px-3 py-3">Peran</th>
              <th className="px-3 py-3">Sekolah</th>
              <th className="px-3 py-3">Dibuat</th>
              <th className="px-3 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  Memuat...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  Tidak ada data
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-3 py-2 font-medium text-slate-800">{r.full_name}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.email}</td>
                  <td className="px-3 py-2">{r.phone ?? '—'}</td>
                  <td className="px-3 py-2">{roleLabel(r.role)}</td>
                  <td className="px-3 py-2">{r.school_name ?? <span className="text-slate-400">Yayasan</span>}</td>
                  <td className="px-3 py-2 text-slate-500 whitespace-nowrap text-[12px]">
                    {r.created_at ? format(new Date(r.created_at), 'dd/MM/yyyy HH:mm') : '—'}
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
                              full_name: r.full_name,
                              email: r.email,
                              phone: r.phone ?? '',
                              role: r.role,
                              school_id: r.school_id != null ? r.school_id : '',
                              password: '',
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
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-bold text-slate-800">
                {modal.record?.id ? 'Edit pengguna' : 'Tambah pengguna'}
              </h3>
              <button type="button" className="text-slate-400" onClick={() => setModal({ open: false, record: {} })}>
                <X size={20} />
              </button>
            </div>
            <Field label="Nama lengkap" required>
              <Input
                value={modal.record?.full_name ?? ''}
                onChange={(e) => setModal((m) => ({ ...m, record: { ...m.record, full_name: e.target.value } }))}
              />
            </Field>
            <Field label="Email" required>
              <Input
                type="email"
                value={modal.record?.email ?? ''}
                onChange={(e) => setModal((m) => ({ ...m, record: { ...m.record, email: e.target.value } }))}
              />
            </Field>
            <Field label={modal.record?.id ? 'Password baru (kosongkan jika tidak diubah)' : 'Password'} required={!modal.record?.id}>
              <Input
                type="password"
                autoComplete="new-password"
                value={modal.record?.password ?? ''}
                onChange={(e) => setModal((m) => ({ ...m, record: { ...m.record, password: e.target.value } }))}
                placeholder={modal.record?.id ? '••••••••' : 'Min. 6 karakter'}
              />
            </Field>
            <Field label="Telepon">
              <Input
                value={modal.record?.phone != null ? String(modal.record.phone) : ''}
                onChange={(e) => setModal((m) => ({ ...m, record: { ...m.record, phone: e.target.value } }))}
              />
            </Field>
            <Field label="Peran" required>
              <Select
                value={modal.record?.role ?? ''}
                onChange={(e) => setModal((m) => ({ ...m, record: { ...m.record, role: e.target.value } }))}
              >
                <option value="">— Pilih —</option>
                {ROLES.map((x) => (
                  <option key={x.value} value={x.value}>
                    {x.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Sekolah" hint="Kosongkan untuk akun tingkat yayasan">
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
                <option value="">(Tidak terikat sekolah)</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
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
