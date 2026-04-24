'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/FormFields';
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { confirmToast } from '@/components/ui/confirmToast';

interface Row {
  id: number;
  school_name: string;
  publish_date: string;
  title_id: string;
  active: boolean;
}

export default function AcademicAnnouncementsPage() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [togglingActive, setTogglingActive] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/academic/announcements')
      .then((r) => r.json())
      .then((d) => {
        setData(Array.isArray(d) ? d : []);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggleActive = (r: Row) => {
    const nextActive = !r.active;
    confirmToast(
      nextActive
        ? 'Aktifkan pengumuman ini? Pengumuman akan ditampilkan sebagai aktif.'
        : 'Nonaktifkan pengumuman ini? Pengumuman tidak akan ditampilkan sebagai aktif.',
      {
        confirmLabel: nextActive ? 'Aktifkan' : 'Nonaktifkan',
        onConfirm: async () => {
          setTogglingActive(r.id);
          const res = await fetch(`/api/academic/announcements/${r.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: nextActive }),
          });
          setTogglingActive(null);
          if (!res.ok) {
            toast.error('Gagal memperbarui status');
            return;
          }
          toast.success(nextActive ? 'Pengumuman diaktifkan' : 'Pengumuman dinonaktifkan');
          load();
        },
      }
    );
  };

  const handleDelete = async (sid: number) => {
    confirmToast('Hapus pengumuman ini?', {
      confirmLabel: 'Hapus',
      onConfirm: async () => {
        setDeleting(sid);
        const res = await fetch(`/api/academic/announcements/${sid}`, { method: 'DELETE' });
        setDeleting(null);
        if (!res.ok) {
          toast.error('Gagal menghapus');
          return;
        }
        toast.success('Data dihapus');
        load();
      },
    });
  };

  const columns = [
    { key: 'id', label: 'ID', sortable: true, className: 'w-14 text-slate-400 font-mono text-xs' },
    { key: 'school_name', label: 'Sekolah', sortable: true },
    { key: 'publish_date', label: 'Tanggal', render: (r: Row) => String(r.publish_date).slice(0, 10) },
    {
      key: 'active',
      label: 'Aktif',
      sortable: true,
      className: 'w-[100px]',
      render: (r: Row) => (
        <span
          className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold ${
            r.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {r.active ? 'Ya' : 'Tidak'}
        </span>
      ),
    },
    { key: 'title_id', label: 'Judul', sortable: true },
    {
      key: 'actions',
      label: 'Aksi',
      className: 'text-right',
      render: (r: Row) => (
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            title={r.active ? 'Nonaktifkan' : 'Aktifkan'}
            loading={togglingActive === r.id}
            onClick={() => handleToggleActive(r)}
          >
            {r.active ? <EyeOff size={13} /> : <Eye size={13} />}
          </Button>
          <Link href={`/academic/announcements/${r.id}`}>
            <Button size="sm" variant="outline">
              <Edit2 size={13} />
            </Button>
          </Link>
          <Button size="sm" variant="danger" loading={deleting === r.id} onClick={() => handleDelete(r.id)}>
            <Trash2 size={13} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Pengumuman</h2>
          <p className="text-slate-400 text-[13px]">Informasi untuk warga sekolah</p>
        </div>
        <Link href="/academic/announcements/add">
          <Button>
            <Plus size={15} /> Tambah Pengumuman
          </Button>
        </Link>
      </div>
      <DataTable data={data} columns={columns} loading={loading} rowKey={(r) => r.id} emptyText="Belum ada data" />
    </div>
  );
}
