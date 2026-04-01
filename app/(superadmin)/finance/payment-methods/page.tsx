'use client';

import { useEffect, useState } from 'react';
import { Button, Badge } from '@/components/ui/FormFields';
import { Plus, Edit2, Trash2, CreditCard, GripVertical, Search } from 'lucide-react';
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
      <td className="px-5 py-3.5 text-[13px] text-slate-700 font-semibold">{row.name}</td>
      <td className="px-5 py-3.5 text-[13px] font-mono text-slate-500">{row.code}</td>
      <td className="px-5 py-3.5 uppercase tracking-wider text-[11px] text-slate-700">{row.category}</td>
      <td className="px-5 py-3.5 text-[13px] text-slate-700">
        {row.is_active ? <Badge variant="success">Aktif</Badge> : <Badge variant="neutral">Tidak Aktif</Badge>}
      </td>
      <td className="px-5 py-3.5 text-right">
        <div className="flex justify-end gap-2">
          <Link href={`/finance/payment-methods/${row.id}`}>
            <Button size="sm" variant="outline"><Edit2 size={13} /></Button>
          </Link>
          <Button size="sm" variant="danger" loading={deleting} onClick={() => onDelete(row.id)}><Trash2 size={13} /></Button>
        </div>
      </td>
    </tr>
  );
}

export default function PaymentMethodsPage() {
  const [data, setData] = useState<PaymentMethod[]>([]);
  const [view, setView] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);
  const [search, setSearch] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const load = () => {
    setLoading(true);
    fetch('/api/finance/payment-methods')
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setView(d);
        setLoading(false);
      });
  };

  useEffect(() => {
    const t = window.setTimeout(() => load(), 0);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setView(data);
      return;
    }
    const q = search.toLowerCase();
    setView(
      data.filter((r) =>
        [r.name, r.code, r.category].some((v) => String(v ?? '').toLowerCase().includes(q))
      )
    );
  }, [search, data]);

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

    const oldIndex = view.findIndex((r) => r.id === active.id);
    const newIndex = view.findIndex((r) => r.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const nextView = arrayMove(view, oldIndex, newIndex);
    setView(nextView);

    // Apply the same order to full dataset (keep those not in filtered view at end, unchanged)
    const movedIds = new Set(nextView.map((r) => r.id));
    const rest = data.filter((r) => !movedIds.has(r.id));
    const nextAll = [...nextView, ...rest];
    setData(nextAll);
    await persistOrder(nextAll);
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari metode pembayaran..."
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] w-72 focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 placeholder:text-slate-400"
            />
          </div>
          <div className="text-[12px] text-slate-400">
            {reordering ? 'Menyimpan urutan...' : `${data.length} metode`}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E2E8F1]">
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-10">Drag</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-16">ID</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nama Metode</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kode</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Jenis</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#E2E8F1]">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : view.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400 text-[13px]">
                    Belum ada metode pembayaran
                  </td>
                </tr>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                  <SortableContext items={view.map((r) => r.id)} strategy={verticalListSortingStrategy}>
                    {view.map((row) => (
                      <SortableRow
                        key={row.id}
                        row={row}
                        deleting={deleting === row.id}
                        onDelete={handleDelete}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
