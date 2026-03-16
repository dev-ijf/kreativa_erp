'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/FormFields';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface School { id: number; name: string; address: string; created_at: string; [key: string]: any; }

export default function SchoolsPage() {
  const [data, setData] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/master/schools').then(r => r.json()).then(d => { setData(d); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus sekolah ini?')) return;
    setDeleting(id);
    await fetch(`/api/master/schools/${id}`, { method: 'DELETE' });
    setDeleting(null);
    load();
  };

  const columns = [
    { key: 'id', label: 'ID', sortable: true, className: 'w-16 text-slate-400 font-mono text-xs' },
    { key: 'name', label: 'Nama Sekolah', sortable: true },
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
