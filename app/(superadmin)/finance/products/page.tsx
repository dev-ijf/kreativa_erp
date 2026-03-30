'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/FormFields';
import { Plus, Edit2, Trash2, PackageSearch } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { confirmToast } from '@/components/ui/confirmToast';

interface Product {
  id: number;
  name: string;
  payment_type: string;
  coa?: string | null;
  description?: string | null;
}

export default function ProductsPage() {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/finance/products')
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: number) => {
    confirmToast('Hapus produk biaya ini?', {
      confirmLabel: 'Hapus',
      onConfirm: async () => {
        setDeleting(id);
        const res = await fetch(`/api/finance/products/${id}`, { method: 'DELETE' });
        setDeleting(null);
        if (!res.ok) {
          toast.error('Gagal menghapus produk biaya');
          return;
        }
        toast.success('Produk biaya dihapus');
        load();
      },
    });
  };

  const paymentTypeColors: Record<string, string> = {
    monthly: 'bg-blue-50 text-blue-600 border-blue-200',
    one_time: 'bg-amber-50 text-amber-600 border-amber-200',
    installment: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    annualy: 'bg-violet-50 text-violet-600 border-violet-200',
  };

  const paymentTypeLabels: Record<string, string> = {
    monthly: 'Bulanan',
    one_time: 'Sekali Bayar',
    installment: 'Cicilan',
    annualy: 'Tahunan',
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      className: 'w-16 text-slate-400 font-mono text-xs',
    },
    { key: 'name', label: 'Nama Biaya', sortable: true, className: 'font-semibold' },
    {
      key: 'payment_type',
      label: 'Jenis Pembayaran',
      render: (r: Product) => (
        <span
          className={`px-2 py-1 rounded-md text-[11px] font-medium border ${paymentTypeColors[r.payment_type] || 'bg-slate-100'}`}
        >
          {paymentTypeLabels[r.payment_type] || r.payment_type}
        </span>
      ),
    },
    { key: 'coa', label: 'COA', className: 'font-mono text-xs text-slate-500' },
    {
      key: 'actions',
      label: 'Aksi',
      className: 'text-right',
      render: (r: Product) => (
        <div className="flex justify-end gap-2">
          <Link href={`/finance/products/${r.id}`}>
            <Button size="sm" variant="outline">
              <Edit2 size={13} />
            </Button>
          </Link>
          <Button
            size="sm"
            variant="danger"
            loading={deleting === r.id}
            onClick={() => handleDelete(r.id)}
          >
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
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <PackageSearch className="text-violet-600" /> Master Komponen Biaya (Global)
          </h2>
          <p className="text-slate-400 text-[13px]">
            Produk global — harga per sekolah diatur di Matriks Tarif
          </p>
        </div>
        <Link href="/finance/products/add">
          <Button>
            <Plus size={15} /> Tambah Biaya Baru
          </Button>
        </Link>
      </div>

      <DataTable
        data={data}
        columns={columns}
        loading={loading}
        rowKey={(r) => r.id}
        emptyText="Belum ada komponen biaya"
      />
    </div>
  );
}
