'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/FormFields';
import { Field, Select, Input } from '@/components/ui/FormFields';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Row {
  id: number;
  district_id: number;
  name: string;
  postal_code?: string | null;
  district_name?: string;
  city_name?: string;
  province_name?: string;
}

interface ListResponse {
  data: Row[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function SubdistrictsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const [deleting, setDeleting] = useState<number | null>(null);
  const [provinces, setProvinces] = useState<{ id: number; name: string }[]>([]);
  const [cities, setCities] = useState<{ id: number; name: string }[]>([]);
  const [districts, setDistricts] = useState<{ id: number; name: string }[]>([]);
  const [filterProvince, setFilterProvince] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterQ, setFilterQ] = useState('');

  useEffect(() => {
    fetch('/api/master/provinces')
      .then((r) => r.json())
      .then((d) => setProvinces(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    if (!filterProvince) {
      setCities([]);
      setFilterCity('');
      return;
    }
    fetch(`/api/master/cities?province_id=${filterProvince}`)
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : [];
        setCities(list);
        setFilterCity((prev) => (list.some((c: { id: number }) => String(c.id) === prev) ? prev : ''));
      });
  }, [filterProvince]);

  useEffect(() => {
    if (!filterCity) {
      setDistricts([]);
      setFilterDistrict('');
      return;
    }
    fetch(`/api/master/districts?city_id=${filterCity}`)
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : [];
        setDistricts(list);
        setFilterDistrict((prev) => (list.some((x: { id: number }) => String(x.id) === prev) ? prev : ''));
      });
  }, [filterCity]);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (filterProvince) params.set('province_id', filterProvince);
    if (filterCity) params.set('city_id', filterCity);
    if (filterDistrict) params.set('district_id', filterDistrict);
    if (filterQ.trim()) params.set('q', filterQ.trim());

    fetch(`/api/master/subdistricts?${params}`)
      .then((r) => r.json())
      .then((d: ListResponse) => {
        setRows(d.data || []);
        setTotalPages(d.totalPages || 1);
        setTotal(d.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, filterProvince, filterCity, filterDistrict, filterQ]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus kelurahan/desa ini?')) return;
    setDeleting(id);
    const r = await fetch(`/api/master/subdistricts/${id}`, { method: 'DELETE' });
    const j = await r.json().catch(() => ({}));
    setDeleting(null);
    if (!r.ok) {
      alert((j as { error?: string }).error || 'Gagal menghapus');
      return;
    }
    load();
  };

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Kelurahan / Desa</h2>
          <p className="text-slate-400 text-[13px]">Filter cascade: provinsi → kab/kota → kecamatan</p>
        </div>
        <Link href="/master/subdistricts/add">
          <Button>
            <Plus size={15} /> Tambah Kelurahan
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          <Field label="Provinsi">
            <Select
              value={filterProvince}
              onChange={(e) => {
                setFilterProvince(e.target.value);
                setFilterCity('');
                setFilterDistrict('');
                setPage(1);
              }}
            >
              <option value="">Semua</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Kab/Kota">
            <Select
              value={filterCity}
              onChange={(e) => {
                setFilterCity(e.target.value);
                setFilterDistrict('');
                setPage(1);
              }}
              disabled={!filterProvince}
            >
              <option value="">Semua</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Kecamatan">
            <Select
              value={filterDistrict}
              onChange={(e) => {
                setFilterDistrict(e.target.value);
                setPage(1);
              }}
              disabled={!filterCity}
            >
              <option value="">Semua</option>
              {districts.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="lg:col-span-2 xl:col-span-2">
            <Field label="Cari (nama / kode pos)">
              <Input
                value={filterQ}
                onChange={(e) => setFilterQ(e.target.value)}
                placeholder="Kelurahan, kecamatan, kota..."
              />
            </Field>
          </div>
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
              <th className="px-3 py-3 w-12">ID</th>
              <th className="px-3 py-3 min-w-[100px]">Provinsi</th>
              <th className="px-3 py-3 min-w-[100px]">Kab/Kota</th>
              <th className="px-3 py-3 min-w-[100px]">Kecamatan</th>
              <th className="px-3 py-3 min-w-[120px]">Kelurahan</th>
              <th className="px-3 py-3 w-24">Kode pos</th>
              <th className="px-3 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                  Memuat...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                  Tidak ada data
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-3 py-2 text-slate-400">{(page - 1) * limit + i + 1}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-500">{r.id}</td>
                  <td className="px-3 py-2">{r.province_name ?? '—'}</td>
                  <td className="px-3 py-2">{r.city_name ?? '—'}</td>
                  <td className="px-3 py-2">{r.district_name ?? '—'}</td>
                  <td className="px-3 py-2 font-medium text-slate-800">{r.name}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.postal_code ?? '—'}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/master/subdistricts/${r.id}`}>
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
