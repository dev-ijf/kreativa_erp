'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import { Button, Badge } from '@/components/ui/FormFields';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { confirmToast } from '@/components/ui/confirmToast';

interface AcademicYear {
  id: number;
  name: string;
  is_active: boolean;
}

export default function AcademicYearsPage() {
  const [data, setData] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/master/academic-years')
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
    confirmToast('Hapus tahun ajaran ini?', {
      confirmLabel: 'Hapus',
      onConfirm: async () => {
        setDeleting(id);
        const res = await fetch(`/api/master/academic-years/${id}`, { method: 'DELETE' });
        setDeleting(null);
        if (!res.ok) {
          toast.error('Gagal menghapus tahun ajaran');
          return;
        }
        toast.success('Tahun ajaran dihapus');
        load();
      },
    });
  };

  const columns = [
    { key: 'id', label: 'ID', sortable: true, className: 'w-16 text-slate-400 font-mono text-xs' },
    { key: 'name', label: 'Tahun Ajaran', sortable: true },
    { key: 'is_active', label: 'Status', render: (r: AcademicYear) => r.is_active ? <Badge variant="success">Aktif</Badge> : <Badge variant="neutral">Tidak Aktif</Badge> },
    {
      key: 'actions', label: 'Aksi', className: 'text-right',
      render: (r: AcademicYear) => (
        <div className="flex justify-end gap-2">
          <Link href={`/master/academic-years/${r.id}`}>
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
          <h2 className="text-xl font-bold text-slate-800">Tahun Ajaran</h2>
          <p className="text-slate-400 text-[13px]">Kelola periode akademik aktif</p>
        </div>
        <Link href="/master/academic-years/add">
          <Button><Plus size={15} /> Tambah Tahun Ajaran</Button>
        </Link>
      </div>

      <DataTable data={data} columns={columns} loading={loading} rowKey={r => r.id} emptyText="Belum ada data" />
    </div>
  );
}
