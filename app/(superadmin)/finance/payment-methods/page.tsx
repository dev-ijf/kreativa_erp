'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button, Badge, Select } from '@/components/ui/FormFields';
import { Plus, Edit2, Trash2, CreditCard, GripVertical, Search, ListTree, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { confirmToast } from '@/components/ui/confirmToast';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PaymentMethod {
  id: number;
  name: string;
  code: string;
  category: string;
  coa?: string | null;
  vendor?: string | null;
  is_publish: boolean;
  is_active: boolean;
  sort_order?: number | null;
}

function SortableRow({
  row,
  deleting,
  onDelete,
}: {
  row: PaymentMethod;
  deleting: boolean;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={[
        'border-b border-[#E2E8F1] last:border-0 hover:bg-slate-50/50 transition-colors',
        isDragging ? 'bg-violet-50' : '',
      ].join(' ')}
    >
      <td className="px-5 py-3.5 w-10">
        <button
          type="button"
          className="inline-flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-grab active:cursor-grabbing"
          aria-label="Drag untuk mengurutkan"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </button>
      </td>
      <td className="px-5 py-3.5 w-16 text-slate-400 font-mono text-xs">{row.id}</td>
      <td className="px-5 py-3.5">
        <div className="text-[13px] text-slate-700 font-semibold">{row.name}</div>
        <div className="text-[11px] text-slate-400 font-medium tracking-tight uppercase">{row.vendor || '-'}</div>
      </td>
      <td className="px-5 py-3.5 text-[13px] font-mono text-slate-500">{row.code}</td>
      <td className="px-5 py-3.5 uppercase tracking-wider text-[11px] text-slate-700">{row.category}</td>
      <td className="px-5 py-3.5 text-[13px] font-mono text-slate-600">
        {row.coa ? <Badge variant="neutral">{row.coa}</Badge> : '-'}
      </td>
      <td className="px-5 py-3.5 text-[13px] text-slate-700">
        {row.is_publish ? <Badge variant="success">Published</Badge> : <Badge variant="neutral">Draft</Badge>}
      </td>
      <td className="px-5 py-3.5 text-[13px] text-slate-700">
        {row.is_active ? <Badge variant="success">Aktif</Badge> : <Badge variant="neutral">Tidak Aktif</Badge>}
      </td>
      <td className="px-5 py-3.5 text-right">
        <div className="flex justify-end gap-2">
          <Link href={`/finance/payment-methods/${row.id}#instructions`} title="Kelola Instruksi">
            <Button size="sm" variant="outline" className="border-violet-200 text-violet-600 hover:bg-violet-50 hover:border-violet-300">
              <ListTree size={13} />
            </Button>
          </Link>
          <Link href={`/finance/payment-methods/${row.id}`} title="Edit Data">
            <Button size="sm" variant="outline"><Edit2 size={13} /></Button>
          </Link>
          <Button size="sm" variant="danger" loading={deleting} onClick={() => onDelete(row.id)} title="Hapus"><Trash2 size={13} /></Button>
        </div>
      </td>
    </tr>
  );
}

export default function PaymentMethodsPage() {
  const [data, setData] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);
  const [search, setSearch] = useState('');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (search.trim()) params.set('q', search.trim());

    fetch(`/api/finance/payment-methods?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d.data || []);
        setTotal(d.total || 0);
        setTotalPages(d.totalPages || 1);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, limit, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    confirmToast('Hapus metode pembayaran ini?', {
      confirmLabel: 'Hapus',
      onConfirm: async () => {
        setDeleting(id);
        const res = await fetch(`/api/finance/payment-methods/${id}`, { method: 'DELETE' });
        setDeleting(null);
        if (!res.ok) {
          toast.error('Gagal menghapus metode pembayaran');
          return;
        }
        toast.success('Metode pembayaran dihapus');
        load();
      },
    });
  };

  const persistOrder = async (rows: PaymentMethod[]) => {
    setReordering(true);
    const res = await fetch('/api/finance/payment-methods/reorder', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ids: rows.map((r) => r.id) }),
    });
    setReordering(false);
    if (!res.ok) {
      toast.error('Gagal menyimpan urutan');
      load();
      return;
    }
    toast.success('Urutan disimpan');
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = data.findIndex((r) => r.id === active.id);
    const newIndex = data.findIndex((r) => r.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const nextData = arrayMove(data, oldIndex, newIndex);
    setData(nextData);
    await persistOrder(nextData);
  };

  const pageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

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

      <div className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E2E8F1] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari metode pembayaran..."
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] w-72 focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 placeholder:text-slate-400"
            />
          </div>
          <div className="text-[12px] text-slate-400">
            {reordering ? 'Menyimpan urutan...' : `${total} metode`}
          </div>
        </div>

        <div className="overflow-x-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-[#E2E8F1]">
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-10">Drag</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-16">ID</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nama Metode</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kode</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Jenis</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">COA</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Publish</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#E2E8F1]">
                      {Array.from({ length: 9 }).map((__, j) => (
                        <td key={j} className="px-5 py-3.5">
                          <div className="h-4 bg-slate-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16 text-slate-400 text-[13px]">
                      Belum ada metode pembayaran
                    </td>
                  </tr>
                ) : (
                  <SortableContext items={data.map((r) => r.id)} strategy={verticalListSortingStrategy}>
                    {data.map((row) => (
                      <SortableRow
                        key={row.id}
                        row={row}
                        deleting={deleting === row.id}
                        onDelete={handleDelete}
                      />
                    ))}
                  </SortableContext>
                )}
              </tbody>
            </table>
          </DndContext>
        </div>

        {/* Pagination Footer */}
        {totalPages > 0 && (
          <div className="px-5 py-3.5 border-t border-[#E2E8F1] flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-3">
              <p className="text-[12px] text-slate-400">
                {total} data · Halaman {page} dari {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-slate-400">Baris per halaman:</span>
                <div className="min-w-[4.5rem] text-slate-500">
                  <Select
                    variant="compact"
                    value={String(limit)}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                  >
                    {[10, 15, 20, 50, 100].map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-all"
              >
                <ChevronsLeft size={15} />
              </button>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={15} />
              </button>
              {pageNumbers().map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-slate-400 text-[13px]">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`min-w-[32px] h-8 rounded-lg text-[12px] font-medium transition-all ${
                      page === p
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-all"
              >
                <ChevronRight size={15} />
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-all"
              >
                <ChevronsRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
