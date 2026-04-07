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
  subject_name: string;
  academic_year: string;
  semester_label: string;
  score: string;
  letter_grade: string | null;
}

export default function AcademicGradesPage() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/academic/grades')
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
    confirmToast('Hapus nilai ini?', {
      confirmLabel: 'Hapus',
      onConfirm: async () => {
        setDeleting(sid);
        const res = await fetch(`/api/academic/grades/${sid}`, { method: 'DELETE' });
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
    { key: 'subject_name', label: 'Mapel', sortable: true },
    {
      key: 'sem',
      label: 'Semester',
      render: (r: Row) => `${r.semester_label} (${r.academic_year})`,
    },
    { key: 'score', label: 'Nilai', sortable: true },
    { key: 'letter_grade', label: 'Huruf', render: (r: Row) => r.letter_grade || '–' },
    {
      key: 'actions',
      label: 'Aksi',
      className: 'text-right',
      render: (r: Row) => (
        <div className="flex justify-end gap-2">
          <Link href={`/academic/grades/${r.id}`}>
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
          <h2 className="text-xl font-bold text-slate-800">Nilai / Rapor</h2>
          <p className="text-slate-400 text-[13px]">Per siswa, semester, mapel</p>
        </div>
        <Link href="/academic/grades/add">
          <Button>
            <Plus size={15} /> Tambah Nilai
          </Button>
        </Link>
      </div>
      <DataTable data={data} columns={columns} loading={loading} rowKey={(r) => r.id} emptyText="Belum ada data" />
    </div>
  );
}
