'use client';

import { useEffect, useState, use } from 'react';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/FormFields';
import { ArrowLeft, Eye } from 'lucide-react';
import Link from 'next/link';

interface Row {
  id: number;
  student_name: string;
  habit_date: string;
}

export default function HabitsStudentDetailPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params);
  const [studentLabel, setStudentLabel] = useState('');
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch(`/api/students/${studentId}`)
      .then((r) => r.json())
      .then((s) => {
        if (s?.full_name) setStudentLabel(`${s.full_name} (NIS ${s.nis || '–'})`);
        else setStudentLabel(`Siswa #${studentId}`);
      });
    setLoading(true);
    fetch(`/api/academic/habits?student_id=${studentId}`)
      .then((r) => r.json())
      .then((d) => {
        setData(Array.isArray(d) ? d : []);
        setLoading(false);
      });
  }, [studentId]);

  const columns = [
    { key: 'id', label: 'ID', sortable: true, className: 'w-14 text-slate-400 font-mono text-xs' },
    { key: 'habit_date', label: 'Tanggal', render: (r: Row) => String(r.habit_date).slice(0, 10) },
    {
      key: 'actions',
      label: 'Aksi',
      className: 'text-right',
      render: (r: Row) => (
        <div className="flex justify-end">
          <Link href={`/academic/habits/${r.id}`}>
            <Button size="sm" variant="outline">
              <Eye size={13} /> Detail
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/academic/habits">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Pembiasaan siswa</h2>
          <p className="text-slate-500 text-[13px]">{studentLabel}</p>
        </div>
      </div>
      <DataTable
        data={data}
        columns={columns}
        loading={loading}
        rowKey={(r) => r.id}
        emptyText="Belum ada data pembiasaan untuk siswa ini"
        searchable={false}
        showRowNumber
      />
    </div>
  );
}
