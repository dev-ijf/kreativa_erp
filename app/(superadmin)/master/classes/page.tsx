'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/FormFields';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { confirmToast } from '@/components/ui/confirmToast';

interface ClassObj {
  id: number;
  school_id: number;
  level_grade_id: number;
  name: string;
  school_name?: string;
  level_name?: string;
}

export default function ClassesPage() {
  const [data, setData] = useState<ClassObj[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/master/classes')
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
    confirmToast('Hapus kelas ini?', {
      confirmLabel: 'Hapus',
      onConfirm: async () => {
        setDeleting(id);
        const res = await fetch(`/api/master/classes/${id}`, { method: 'DELETE' });
        setDeleting(null);
        if (!res.ok) {
          toast.error('Gagal menghapus kelas');
          return;
        }
        toast.success('Kelas dihapus');
        load();
      },
    });
  };

  const columns = [
    { key: 'id', label: 'ID', sortable: true, className: 'w-16 text-slate-400 font-mono text-xs' },
    { key: 'school_name', label: 'Sekolah', sortable: true },
    { key: 'level_name', label: 'Tingkat', sortable: true },
    { key: 'name', label: 'Nama Kelas', sortable: true },
    {
      key: 'actions', label: 'Aksi', className: 'text-right',
      render: (r: ClassObj) => (
        <div className="flex justify-end gap-2">
          <Link href={`/master/classes/${r.id}`}>
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
          <h2 className="text-xl font-bold text-slate-800">Data Kelas</h2>
          <p className="text-slate-400 text-[13px]">Kelola master kelas berdasarkan tingkat</p>
        </div>
        <Link href="/master/classes/add">
          <Button><Plus size={15} /> Tambah Kelas</Button>
        </Link>
      </div>

      <DataTable data={data} columns={columns} loading={loading} rowKey={r => r.id} emptyText="Belum ada data" />
    </div>
  );
}
