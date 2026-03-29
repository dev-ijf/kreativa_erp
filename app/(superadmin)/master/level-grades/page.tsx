'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/FormFields';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface LevelGrade {
  id: number;
  school_id: number;
  name: string;
  level_order: number;
  is_terminal?: boolean;
  school_name?: string;
}

export default function LevelGradesPage() {
  const [data, setData] = useState<LevelGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/master/level-grades').then(r => r.json()).then(d => { setData(d); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus tingkat kelas ini?')) return;
    setDeleting(id);
    await fetch(`/api/master/level-grades/${id}`, { method: 'DELETE' });
    setDeleting(null);
    load();
  };

  const columns = [
    { key: 'id', label: 'ID', sortable: true, className: 'w-16 text-slate-400 font-mono text-xs' },
    { key: 'school_name', label: 'Sekolah', sortable: true },
    { key: 'name', label: 'Tingkat Kelas', sortable: true },
    { key: 'level_order', label: 'Urutan Level', sortable: true },
    {
      key: 'is_terminal',
      label: 'Tingkat lulus',
      sortable: true,
      render: (r: LevelGrade) => (r.is_terminal ? 'Ya' : 'Tidak'),
    },
    {
      key: 'actions', label: 'Aksi', className: 'text-right',
      render: (r: LevelGrade) => (
        <div className="flex justify-end gap-2">
          <Link href={`/master/level-grades/${r.id}`}>
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
          <h2 className="text-xl font-bold text-slate-800">Tingkat Kelas</h2>
          <p className="text-slate-400 text-[13px]">Kelola master tingkatan kelas berdasarkan sekolah</p>
        </div>
        <Link href="/master/level-grades/add">
          <Button><Plus size={15} /> Tambah Tingkat Kelas</Button>
        </Link>
      </div>

      <DataTable data={data} columns={columns} loading={loading} rowKey={r => r.id} emptyText="Belum ada data" />
    </div>
  );
}
