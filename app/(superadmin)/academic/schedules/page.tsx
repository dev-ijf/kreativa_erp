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
  student_name: string;
  subject_name: string | null;
  teacher_name: string | null;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_break: boolean | null;
}

export default function AcademicSchedulesPage() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/academic/schedules')
      .then((r) => r.json())
      .then((d) => {
        setData(Array.isArray(d) ? d : []);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (sid: number) => {
    confirmToast('Hapus jadwal ini?', {
      confirmLabel: 'Hapus',
      onConfirm: async () => {
        setDeleting(sid);
        const res = await fetch(`/api/academic/schedules/${sid}`, { method: 'DELETE' });
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
    { key: 'student_name', label: 'Siswa', sortable: true },
    { key: 'day_of_week', label: 'Hari', sortable: true },
    {
      key: 'time',
      label: 'Jam',
      render: (r: Row) => (
        <span className="text-slate-600 text-[12px]">
          {r.start_time} – {r.end_time}
        </span>
      ),
    },
    { key: 'subject_name', label: 'Mapel', render: (r: Row) => r.subject_name || '–' },
    { key: 'teacher_name', label: 'Guru', render: (r: Row) => r.teacher_name || '–' },
    {
      key: 'is_break',
      label: 'Istirahat',
      render: (r: Row) => (r.is_break ? 'Ya' : '–'),
    },
    {
      key: 'actions',
      label: 'Aksi',
      className: 'text-right',
      render: (r: Row) => (
        <div className="flex justify-end gap-2">
          <Link href={`/academic/schedules/${r.id}`}>
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
    <div className="p-6 space-y-5 max-w-[1280px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Jadwal</h2>
          <p className="text-slate-400 text-[13px]">Per siswa, mapel & guru</p>
        </div>
        <Link href="/academic/schedules/add">
          <Button>
            <Plus size={15} /> Tambah Jadwal
          </Button>
        </Link>
      </div>
      <DataTable data={data} columns={columns} loading={loading} rowKey={(r) => r.id} emptyText="Belum ada data" />
    </div>
  );
}
