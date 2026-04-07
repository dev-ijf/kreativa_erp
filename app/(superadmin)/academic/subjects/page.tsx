'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/FormFields';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { confirmToast } from '@/components/ui/confirmToast';

interface Row {
  id: number;
  code: string | null;
  name_en: string;
  name_id: string;
  color_theme: string | null;
}

export default function AcademicSubjectsPage() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/academic/subjects')
      .then((r) => r.json())
      .then((d) => {
        setData(Array.isArray(d) ? d : []);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: number) => {
    confirmToast('Hapus mata pelajaran ini?', {
      confirmLabel: 'Hapus',
      onConfirm: async () => {
        setDeleting(id);
        const res = await fetch(`/api/academic/subjects/${id}`, { method: 'DELETE' });
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
    { key: 'id', label: 'ID', sortable: true, className: 'w-16 text-slate-400 font-mono text-xs' },
    { key: 'name_id', label: 'Nama (ID)', sortable: true },
    { key: 'name_en', label: 'Nama (EN)', sortable: true },
    { key: 'code', label: 'Kode', render: (r: Row) => <span className="text-slate-500">{r.code || '–'}</span> },
    {
      key: 'actions',
      label: 'Aksi',
      className: 'text-right',
      render: (r: Row) => (
        <div className="flex justify-end gap-2">
          <Link href={`/academic/subjects/${r.id}`}>
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
          <h2 className="text-xl font-bold text-slate-800">Mata Pelajaran</h2>
          <p className="text-slate-400 text-[13px]">Master mapel akademik</p>
        </div>
        <Link href="/academic/subjects/add">
          <Button>
            <Plus size={15} /> Tambah Mapel
          </Button>
        </Link>
      </div>
      <DataTable data={data} columns={columns} loading={loading} rowKey={(r) => r.id} emptyText="Belum ada data" />
    </div>
  );
}
