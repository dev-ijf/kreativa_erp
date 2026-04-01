'use client';

import { useEffect, useMemo, useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import { Badge, Button, Select } from '@/components/ui/FormFields';
import { ListTree, Plus, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { confirmToast } from '@/components/ui/confirmToast';

type PaymentMethod = { id: number; name: string; code: string };
type PaymentInstructionRow = {
  id: number;
  title: string;
  description: string;
  step_order: number | null;
  payment_channel_id: number;
  created_at: string | null;
  updated_at: string | null;
  payment_channel_name?: string;
  payment_channel_code?: string;
};

export default function PaymentInstructionsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [data, setData] = useState<PaymentInstructionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [filterChannel, setFilterChannel] = useState<string>('all');

  const load = async () => {
    setLoading(true);
    const [mRes, rowsRes] = await Promise.all([
      fetch('/api/finance/payment-methods'),
      fetch('/api/finance/payment-instructions'),
    ]);
    const m = await mRes.json().catch(() => []);
    const rows = await rowsRes.json().catch(() => []);

    setMethods(Array.isArray(m) ? m : []);
    if (!Array.isArray(rows)) {
      const errMsg = (rows as { error?: string } | null)?.error;
      if (errMsg) toast.error(errMsg);
      setData([]);
    } else {
      setData(rows);
    }
    setLoading(false);
  };

  useEffect(() => {
    const t = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    if (filterChannel === 'all') return data;
    const id = Number(filterChannel);
    return data.filter((r) => r.payment_channel_id === id);
  }, [data, filterChannel]);

  const handleDelete = async (id: number) => {
    confirmToast('Hapus instruksi pembayaran ini?', {
      confirmLabel: 'Hapus',
      onConfirm: async () => {
        setDeleting(id);
        const res = await fetch(`/api/finance/payment-instructions/${id}`, { method: 'DELETE' });
        setDeleting(null);
        if (!res.ok) {
          toast.error('Gagal menghapus instruksi');
          return;
        }
        toast.success('Instruksi dihapus');
        void load();
      },
    });
  };

  const columns = [
    { key: 'id', label: 'ID', sortable: true, className: 'w-16 text-slate-400 font-mono text-xs' },
    { key: 'payment_channel_name', label: 'Payment Channel', sortable: true, className: 'font-semibold' },
    { key: 'title', label: 'Judul', sortable: true },
    { key: 'step_order', label: 'Urutan', sortable: true, className: 'w-24 text-slate-500 font-mono text-xs' },
    {
      key: 'updated_at',
      label: 'Status',
      render: (_r: PaymentInstructionRow) => (
        <Badge variant="success">Active</Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      className: 'text-right',
      render: (r: PaymentInstructionRow) => (
        <div className="flex justify-end gap-2">
          <Link href={`/finance/payment-instructions/${r.id}`}>
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
            <ListTree className="text-violet-600" /> Payment Instructions
          </h2>
          <p className="text-slate-400 text-[13px]">Kelola instruksi pembayaran per payment channel</p>
        </div>
        <Link href="/finance/payment-instructions/add">
          <Button><Plus size={15} /> Tambah Instruksi</Button>
        </Link>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        loading={loading}
        rowKey={(r) => r.id}
        emptyText="Belum ada instruksi pembayaran"
        actions={
          <div className="flex items-center gap-2">
            <Select value={filterChannel} onChange={(e) => setFilterChannel(e.target.value)}>
              <option value="all">Semua channel</option>
              {methods.map((m) => (
                <option key={m.id} value={String(m.id)}>{m.name}</option>
              ))}
            </Select>
          </div>
        }
      />
    </div>
  );
}

