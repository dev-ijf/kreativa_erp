'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/FormFields';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';

export default function StudentsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/students').then(r => r.json()).then(d => { setData(d); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus siswa ini?')) return;
    setDeleting(id);
    await fetch(`/api/students/${id}`, { method: 'DELETE' });
    setDeleting(null);
    load();
  };

  const columns = [
    { key: 'nis', label: 'NIS', sortable: true, className: 'font-mono text-slate-500' },
    { key: 'school_name', label: 'Sekolah', sortable: true },
    { key: 'full_name', label: 'Nama Siswa', sortable: true, className: 'font-semibold' },
    { key: 'gender', label: 'L/P', render: (r: any) => r.gender === 'L' ? 'Laki-laki' : 'Perempuan' },
    { key: 'phone', label: 'No. Telp' },
    {
      key: 'actions', label: 'Aksi', className: 'text-right',
      render: (r: any) => (
        <div className="flex justify-end gap-2">
          {/* We'll use the edit page for both viewing (readonly maybe) or just editing for now to simplify */}
          <Link href={`/students/${r.id}`}>
            <Button size="sm" variant="outline"><Edit2 size={13} /></Button>
          </Link>
          <Button size="sm" variant="danger" loading={deleting === r.id} onClick={() => handleDelete(r.id)}><Trash2 size={13} /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Buku Induk Siswa</h2>
          <p className="text-slate-400 text-[13px]">Pangkalan data siswa seluruh sekolah</p>
        </div>
        <Link href="/students/add">
          <Button><Plus size={15} /> Tambah Siswa</Button>
        </Link>
      </div>

      <DataTable data={data} columns={columns} loading={loading} rowKey={r => r.id} emptyText="Belum ada data siswa" />
    </div>
  );
}
