'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/FormFields';
import { Field, Select, Input } from '@/components/ui/FormFields';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Row {
  id: number;
  province_id: number;
  name: string;
  province_name?: string;
}

interface ListResponse {
  data: Row[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function CitiesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const [deleting, setDeleting] = useState<number | null>(null);
  const [provinces, setProvinces] = useState<{ id: number; name: string }[]>([]);
  const [filterProvince, setFilterProvince] = useState('');
  const [filterQ, setFilterQ] = useState('');

  useEffect(() => {
    fetch('/api/master/provinces')
      .then((r) => r.json())
      .then((d) => setProvinces(Array.isArray(d) ? d : []));
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (filterProvince) params.set('province_id', filterProvince);
    if (filterQ.trim()) params.set('q', filterQ.trim());

    fetch(`/api/master/cities?${params}`)
      .then((r) => r.json())
      .then((d: ListResponse) => {
        setRows(d.data || []);
        setTotalPages(d.totalPages || 1);
        setTotal(d.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, filterProvince, filterQ]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus kabupaten/kota ini?')) return;
    setDeleting(id);
    const r = await fetch(`/api/master/cities/${id}`, { method: 'DELETE' });
    const j = await r.json().catch(() => ({}));
    setDeleting(null);
    if (!r.ok) {
      alert((j as { error?: string }).error || 'Gagal menghapus');
      return;
    }
    load();
  };

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Kabupaten / Kota</h2>
          <p className="text-slate-400 text-[13px]">Kelola data kabupaten dan kota (cascade: provinsi)</p>
        </div>
        <Link href="/master/cities/add">
          <Button>
            <Plus size={15} /> Tambah Kab/Kota
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Field label="Filter provinsi">
            <Select
              value={filterProvince}
              onChange={(e) => {
                setFilterProvince(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Semua provinsi</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Cari nama">
            <Input
              value={filterQ}
              onChange={(e) => setFilterQ(e.target.value)}
              placeholder="Nama kab/kota atau provinsi..."
            />
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
              <th className="px-3 py-3 w-14">No</th>
              <th className="px-3 py-3 w-16">ID</th>
              <th className="px-3 py-3">Provinsi</th>
              <th className="px-3 py-3">Nama Kab/Kota</th>
              <th className="px-3 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                  Memuat...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                  Tidak ada data
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-3 py-2 text-slate-400">{(page - 1) * limit + i + 1}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-500">{r.id}</td>
                  <td className="px-3 py-2 font-medium text-slate-700">{r.province_name ?? '—'}</td>
                  <td className="px-3 py-2 font-medium text-slate-800">{r.name}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/master/cities/${r.id}`}>
                        <Button size="sm" variant="outline">
                          <Edit2 size={13} />
                        </Button>
                      </Link>
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
