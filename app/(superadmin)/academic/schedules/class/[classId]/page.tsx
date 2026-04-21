'use client';

import { useEffect, useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/FormFields';
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { confirmToast } from '@/components/ui/confirmToast';

interface Row {
  id: number;
  class_name: string;
  academic_year_name: string;
  subject_name: string | null;
  teacher_name: string | null;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_break: boolean | null;
}

export default function ScheduleClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);
  const searchParams = useSearchParams();
  const academicYearId = searchParams.get('academic_year_id') || '';

  const [classLabel, setClassLabel] = useState('');
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('class_id', classId);
    if (academicYearId) params.set('academic_year_id', academicYearId);
    fetch(`/api/academic/schedules?${params}`)
      .then((r) => r.json())
      .then((d) => {
        const rows = Array.isArray(d) ? d : [];
        setData(rows);
        if (rows.length > 0) {
          setClassLabel(`${rows[0].class_name} — ${rows[0].academic_year_name}`);
        }
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, [classId, academicYearId]);

  useEffect(() => {
    if (classLabel) return;
    fetch(`/api/master/classes`)
      .then((r) => r.json())
      .then((arr) => {
        if (!Array.isArray(arr)) return;
        const cls = arr.find((c: { id: number }) => String(c.id) === classId);
        if (cls) setClassLabel(cls.name);
      });
  }, [classId, classLabel]);

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
      <div className="flex items-center gap-4">
        <Link href="/academic/schedules">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Jadwal kelas</h2>
          <p className="text-slate-500 text-[13px]">{classLabel || `Kelas #${classId}`}</p>
        </div>
      </div>
      <DataTable
        data={data}
        columns={columns}
        loading={loading}
        rowKey={(r) => r.id}
        emptyText="Belum ada jadwal untuk kelas ini"
        searchable={false}
        showRowNumber
      />
    </div>
  );
}
