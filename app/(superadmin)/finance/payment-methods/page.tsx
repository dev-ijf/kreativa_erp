'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import { Button, Badge } from '@/components/ui/FormFields';
import { Plus, Edit2, Trash2, CreditCard } from 'lucide-react';
import Link from 'next/link';

interface PaymentMethod { id: number; name: string; code: string; category: string; is_active: boolean; }

export default function PaymentMethodsPage() {
  const [data, setData] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/finance/payment-methods').then(r => r.json()).then(d => { setData(d); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus metode pembayaran ini?')) return;
    setDeleting(id);
    await fetch(`/api/finance/payment-methods/${id}`, { method: 'DELETE' });
    setDeleting(null);
    load();
  };

  const columns = [
    { key: 'id', label: 'ID', sortable: true, className: 'w-16 text-slate-400 font-mono text-xs' },
    { key: 'name', label: 'Nama Metode', sortable: true, className: 'font-semibold' },
    { key: 'code', label: 'Kode', sortable: true, className: 'font-mono text-slate-500' },
    { key: 'category', label: 'Jenis', sortable: true, className: 'uppercase tracking-wider text-[11px]' },
    { key: 'is_active', label: 'Status', render: (r: PaymentMethod) => r.is_active ? <Badge variant="success">Aktif</Badge> : <Badge variant="neutral">Tidak Aktif</Badge> },
    {
      key: 'actions', label: 'Aksi', className: 'text-right',
      render: (r: PaymentMethod) => (
        <div className="flex justify-end gap-2">
          <Link href={`/finance/payment-methods/${r.id}`}>
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
            <CreditCard className="text-violet-600" /> Metode Pembayaran
          </h2>
          <p className="text-slate-400 text-[13px]">Atur rekening bank, e-wallet, dan mode kasir</p>
        </div>
        <Link href="/finance/payment-methods/add">
          <Button><Plus size={15} /> Tambah Metode Baru</Button>
        </Link>
      </div>

      <DataTable data={data} columns={columns} loading={loading} rowKey={r => r.id} emptyText="Belum ada metode pembayaran" />
    </div>
  );
}
