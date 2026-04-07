'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/FormFields';
import { Eye } from 'lucide-react';
import Link from 'next/link';

interface Row {
  id: number;
  student_name: string;
  habit_date: string;
}

export default function AcademicHabitsPage() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/academic/habits')
      .then((r) => r.json())
      .then((d) => {
        setData(Array.isArray(d) ? d : []);
        setLoading(false);
      });
  }, []);

  const columns = [
    { key: 'id', label: 'ID', sortable: true, className: 'w-14 text-slate-400 font-mono text-xs' },
    { key: 'student_name', label: 'Siswa', sortable: true },
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
      <div>
        <h2 className="text-xl font-bold text-slate-800">Pembiasaan</h2>
        <p className="text-slate-400 text-[13px]">Hanya lihat — data diinput dari sumber lain</p>
      </div>
      <DataTable data={data} columns={columns} loading={loading} rowKey={(r) => r.id} emptyText="Belum ada data" />
    </div>
  );
}
