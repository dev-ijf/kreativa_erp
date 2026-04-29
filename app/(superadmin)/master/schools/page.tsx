'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/FormFields';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { confirmToast } from '@/components/ui/confirmToast';

interface School {
  id: number;
  name: string;
  address: string;
  theme_id?: number | null;
  bank_channel_code: string | null;
  school_code: string | null;
  created_at: string;
  [key: string]: any;
}

function curriculumLabel(themeId: number | null | undefined) {
  if (themeId === 1) return 'International';
  if (themeId === 2) return 'Nasional';
  return '–';
}

export default function SchoolsPage() {
  const [data, setData] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/master/schools')
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: number) => {
    confirmToast('Hapus sekolah ini?', {
      confirmLabel: 'Hapus',
      onConfirm: async () => {
        setDeleting(id);
        const res = await fetch(`/api/master/schools/${id}`, { method: 'DELETE' });
        setDeleting(null);
        if (!res.ok) {
          toast.error('Gagal menghapus sekolah');
          return;
        }
        toast.success('Sekolah dihapus');
        load();
      },
    });
  };

  const columns = [
    { key: 'id', label: 'ID', sortable: true, className: 'w-16 text-slate-400 font-mono text-xs' },
    { key: 'name', label: 'Nama Sekolah', sortable: true },
    {
      key: 'theme_id',
      label: 'Kurikulum',
      sortable: true,
      className: 'w-32',
      render: (r: School) => (
        <span className="text-slate-600 text-[13px]">{curriculumLabel(r.theme_id)}</span>
      ),
    },
    {
      key: 'bank_channel_code',
      label: 'Kode channel bank',
      sortable: true,
      render: (r: School) => <span className="text-slate-600 font-mono text-xs">{r.bank_channel_code || '–'}</span>,
    },
    {
      key: 'school_code',
      label: 'Kode sekolah',
      sortable: true,
      render: (r: School) => <span className="text-slate-600 font-mono text-xs">{r.school_code || '–'}</span>,
    },
    { key: 'address', label: 'Alamat', render: (r: School) => <span className="text-slate-500">{r.address || '–'}</span> },
    {
      key: 'actions', label: 'Aksi', className: 'text-right',
      render: (r: School) => (
        <div className="flex justify-end gap-2">
          <Link href={`/master/schools/${r.id}`}>
            <Button size="sm" variant="outline"><Edit2 size={13} /></Button>
          </Link>
          <Button size="sm" variant="danger" loading={deleting === r.id} onClick={() => handleDelete(r.id)}><Trash2 size={13} /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Data Sekolah</h2>
          <p className="text-slate-400 text-[13px]">Kelola semua sekolah dalam yayasan</p>
        </div>
        <Link href="/master/schools/add">
          <Button><Plus size={15} /> Tambah Sekolah</Button>
        </Link>
      </div>

      <DataTable data={data} columns={columns} loading={loading} rowKey={r => r.id} emptyText="Belum ada data sekolah" />
    </div>
  );
}
