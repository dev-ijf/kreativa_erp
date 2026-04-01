'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import { Badge, Button } from '@/components/ui/FormFields';
import { Bell, Plus, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { confirmToast } from '@/components/ui/confirmToast';

type Row = {
  id: number;
  name: string;
  type: string;
  trigger_event: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export default function NotificationTemplatesPage() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/finance/notifications')
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  };

  useEffect(() => {
    const t = window.setTimeout(() => load(), 0);
    return () => window.clearTimeout(t);
  }, []);

  const handleDelete = async (id: number) => {
    confirmToast('Hapus template notifikasi ini?', {
      confirmLabel: 'Hapus',
      onConfirm: async () => {
        setDeleting(id);
        const res = await fetch(`/api/finance/notifications/${id}`, { method: 'DELETE' });
        setDeleting(null);
        if (!res.ok) {
          toast.error('Gagal menghapus template');
          return;
        }
        toast.success('Template dihapus');
        load();
      },
    });
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true, className: 'font-semibold' },
    { key: 'type', label: 'Type', sortable: true, className: 'uppercase tracking-wider text-[11px]' },
    { key: 'trigger_event', label: 'Subject', sortable: true, className: 'font-mono text-slate-500' },
    {
      key: 'is_active',
      label: 'Status',
      render: (r: Row) => (r.is_active ?? true) ? <Badge variant="success">Active</Badge> : <Badge variant="neutral">Inactive</Badge>,
    },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      render: (r: Row) => (
        <div className="flex justify-end gap-2">
          <Link href={`/finance/notifications/${r.id}`}>
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
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Bell className="text-violet-600" /> Notification Templates
          </h2>
          <p className="text-slate-400 text-[13px]">Manage your notification templates for events</p>
        </div>
        <Link href="/finance/notifications/add">
          <Button><Plus size={15} /> Create Template</Button>
        </Link>
      </div>

      <DataTable data={data} columns={columns} loading={loading} rowKey={(r) => r.id} emptyText="Belum ada template notifikasi" />
    </div>
  );
}

