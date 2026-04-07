'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/FormFields';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { confirmToast } from '@/components/ui/confirmToast';

interface TeacherRow {
  id: number;
  user_id: number;
  nip: string | null;
  join_date: string | null;
  latest_education: string | null;
  user_full_name: string;
  user_email: string;
  [key: string]: unknown;
}

export default function TeachersPage() {
  const [data, setData] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/master/teachers')
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
    confirmToast(
      'Hapus profil guru? Akun pengguna (core_users) ikut terhapus karena CASCADE. Lanjutkan?',
      {
        confirmLabel: 'Hapus',
        onConfirm: async () => {
          setDeleting(id);
          const res = await fetch(`/api/master/teachers/${id}`, { method: 'DELETE' });
          setDeleting(null);
          if (!res.ok) {
            toast.error('Gagal menghapus');
            return;
          }
          toast.success('Guru dihapus');
          load();
        },
      }
    );
  };

  const columns = [
    { key: 'id', label: 'ID', sortable: true, className: 'w-14 text-slate-400 font-mono text-xs' },
    { key: 'user_full_name', label: 'Nama', sortable: true },
    { key: 'user_email', label: 'Email', render: (r: TeacherRow) => <span className="text-slate-600 text-[13px]">{r.user_email}</span> },
    { key: 'nip', label: 'NIP', render: (r: TeacherRow) => r.nip || '–' },
    { key: 'join_date', label: 'Bergabung', render: (r: TeacherRow) => r.join_date || '–' },
    { key: 'latest_education', label: 'Pendidikan', render: (r: TeacherRow) => <span className="text-slate-500 max-w-[180px] truncate block">{r.latest_education || '–'}</span> },
    {
      key: 'actions',
      label: 'Aksi',
      className: 'text-right',
      render: (r: TeacherRow) => (
        <div className="flex justify-end gap-2">
          <Link href={`/master/teachers/${r.id}`}>
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
          <h2 className="text-xl font-bold text-slate-800">Data Guru</h2>
          <p className="text-slate-400 text-[13px]">Profil mengajar terhubung ke akun core_users</p>
        </div>
        <Link href="/master/teachers/add">
          <Button>
            <Plus size={15} /> Tambah Guru
          </Button>
        </Link>
      </div>
      <DataTable columns={columns} data={data} loading={loading} />
    </div>
  );
}
