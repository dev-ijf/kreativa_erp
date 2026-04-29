'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/FormFields';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { confirmToast } from '@/components/ui/confirmToast';

function stripHtmlPreview(html: string, maxLen = 90): string {
  const t = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t) return '—';
  return t.length > maxLen ? `${t.slice(0, maxLen)}…` : t;
}

interface Row {
  id: number;
  subject_id: number;
  grade_band: string;
  difficulty: string;
  question_text: string;
  lang: string | null;
  subject_name_id?: string | null;
  subject_name_en?: string | null;
  level_grade_name?: string | null;
}

export default function AdaptiveQuestionsBankPage() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/academic/adaptive-questions-bank')
      .then((r) => r.json())
      .then((d) => {
        setData(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const r = await fetch('/api/academic/adaptive-questions-bank');
      const d = await r.json().catch(() => []);
      if (!cancelled) {
        setData(Array.isArray(d) ? d : []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (id: number) => {
    confirmToast('Hapus soal ini dari bank?', {
      confirmLabel: 'Hapus',
      onConfirm: async () => {
        setDeleting(id);
        const res = await fetch(`/api/academic/adaptive-questions-bank/${id}`, { method: 'DELETE' });
        setDeleting(null);
        if (!res.ok) {
          toast.error('Gagal menghapus');
          return;
        }
        toast.success('Soal dihapus');
        load();
      },
    });
  };

  const columns = [
    { key: 'id', label: 'ID', sortable: true, className: 'w-16 text-slate-400 font-mono text-xs' },
    {
      key: 'subject_name_id',
      label: 'Mapel',
      sortable: true,
      render: (r: Row) => (
        <span className="text-slate-700">{r.subject_name_id || r.subject_name_en || `#${r.subject_id}`}</span>
      ),
    },
    { key: 'grade_band', label: 'Grade band', sortable: true, className: 'whitespace-nowrap' },
    {
      key: 'level_grade_name',
      label: 'Tingkat',
      render: (r: Row) => <span className="text-slate-500">{r.level_grade_name || '—'}</span>,
    },
    { key: 'difficulty', label: 'Kesulitan', sortable: true, className: 'tabular-nums' },
    {
      key: 'question_text',
      label: 'Pratinjau soal',
      render: (r: Row) => (
        <span className="text-slate-600 line-clamp-2 max-w-md">{stripHtmlPreview(r.question_text)}</span>
      ),
    },
    {
      key: 'lang',
      label: 'Lang',
      sortable: true,
      className: 'w-14',
      render: (r: Row) => <span className="font-mono text-xs">{r.lang || '—'}</span>,
    },
    {
      key: 'actions',
      label: 'Aksi',
      className: 'text-right',
      render: (r: Row) => (
        <div className="flex justify-end gap-2">
          <Link href={`/academic/adaptive-questions-bank/${r.id}`}>
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
          <h2 className="text-xl font-bold text-slate-800">Bank Soal</h2>
          <p className="text-slate-400 text-[13px]">Repositori soal adaptif per mapel dan rentang kelas</p>
        </div>
        <Link href="/academic/adaptive-questions-bank/add">
          <Button>
            <Plus size={15} /> Tambah soal
          </Button>
        </Link>
      </div>
      <DataTable data={data} columns={columns} loading={loading} rowKey={(r) => r.id} emptyText="Belum ada soal di bank" />
    </div>
  );
}
