'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Field, Select, Button, Input, Badge } from '@/components/ui/FormFields';
import { ArrowLeft, ListTree, Plus, Edit2, Trash2, GripVertical, Search } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';
import { toast } from 'sonner';
import { confirmToast } from '@/components/ui/confirmToast';
import { SchoolLogoFormField } from '@/components/master/SchoolLogoFormField';
import { uploadPublicBlob } from '@/lib/blob-upload';
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

type Instruction = {
  id: number;
  title: string;
  description: string;
  step_order: number | null;
  payment_channel_id: number;
};

function SortableInstructionRow({
  row,
  deleting,
  onDelete,
}: {
  row: Instruction;
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
        'border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors',
        isDragging ? 'bg-violet-50/50' : '',
      ].join(' ')}
    >
      <td className="px-5 py-3 w-10">
        <button
          type="button"
          className="inline-flex items-center justify-center text-slate-300 hover:text-slate-600 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} />
        </button>
      </td>
      <td className="px-5 py-3 w-12 text-slate-400 font-mono text-[11px]">{row.id}</td>
      <td className="px-5 py-3 py-3 text-[13px] text-slate-700 font-medium">{row.title}</td>
      <td className="px-5 py-3 text-[12px] font-mono text-slate-500 w-20">{row.step_order ?? '–'}</td>
      <td className="px-5 py-3 text-right w-28">
        <div className="flex justify-end gap-1.5">
          <Link href={`/finance/payment-instructions/${row.id}?redirect=/finance/payment-methods/${row.payment_channel_id}`}>
            <Button size="sm" variant="outline" className="h-7 w-7 p-0 justify-center"><Edit2 size={12} /></Button>
          </Link>
          <Button size="sm" variant="danger" className="h-7 w-7 p-0 justify-center" loading={deleting} onClick={() => onDelete(row.id)}><Trash2 size={12} /></Button>
        </div>
      </td>
    </tr>
  );
}

export default function EditPaymentMethodPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [schools, setSchools] = useState<{ id: number; name: string }[]>([]);
  const [form, setForm] = useState({
    name: '',
    code: '',
    school_id: '' as string | number,
    category: 'bank_transfer',
    coa: '',
    vendor: '',
    logo_url: '' as string,
    is_publish: true,
    is_redirect: false,
    is_active: true,
  });
  const [pendingLogo, setPendingLogo] = useState<File | null>(null);
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingInstructions, setLoadingInstructions] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const loadMethod = async () => {
    const res = await fetch(`/api/finance/payment-methods/${id}`);
    const item = await res.json();
    if (item) {
      setForm({
        name: item.name,
        code: item.code,
        school_id: item.school_id != null ? String(item.school_id) : '',
        category: item.category,
        coa: item.coa || '',
        vendor: item.vendor || '',
        logo_url: item.logo_url || '',
        is_publish: item.is_publish ?? true,
        is_redirect: item.is_redirect ?? false,
        is_active: item.is_active,
      });
    }
    setLoading(false);
  };

  const loadInstructions = async () => {
    setLoadingInstructions(true);
    const res = await fetch(`/api/finance/payment-instructions?payment_channel_id=${id}`);
    const d = await res.json();
    setInstructions(Array.isArray(d) ? d : []);
    setLoadingInstructions(false);
  };

  useEffect(() => {
    fetch('/api/master/schools')
      .then((r) => r.json())
      .then((d) => setSchools(Array.isArray(d) ? d : []))
      .catch(() => setSchools([]));
  }, []);

  useEffect(() => {
    void loadMethod();
    void loadInstructions();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let logo_url: string | null = form.logo_url.trim() || null;
      if (pendingLogo) {
        logo_url = await uploadPublicBlob(pendingLogo, `payment-methods/${id}/logo`);
      }
      const res = await fetch(`/api/finance/payment-methods/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          school_id: form.school_id === '' ? null : Number(form.school_id),
          logo_url,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error || 'Gagal menyimpan');
      }
      toast.success('Metode pembayaran diperbarui');
      router.push('/finance/payment-methods');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteInstruction = async (insId: number) => {
    confirmToast('Hapus instruksi ini?', {
      confirmLabel: 'Hapus',
      onConfirm: async () => {
        setDeletingId(insId);
        await fetch(`/api/finance/payment-instructions/${insId}`, { method: 'DELETE' });
        setDeletingId(null);
        toast.success('Instruksi dihapus');
        void loadInstructions();
      }
    });
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = instructions.findIndex((r) => r.id === active.id);
    const newIndex = instructions.findIndex((r) => r.id === over.id);
    const nextOrder = arrayMove(instructions, oldIndex, newIndex);
    setInstructions(nextOrder);

    setReordering(true);
    await fetch('/api/finance/payment-instructions/reorder', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ids: nextOrder.map(r => r.id) }),
    });
    setReordering(false);
    toast.success('Urutan diperbarui');
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Loading...</div>;

  return (
    <div className="p-6 max-w-[850px] mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/finance/payment-methods">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center"><ArrowLeft size={16} /></Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Edit Metode Pembayaran</h2>
          <p className="text-slate-400 text-[13px]">Modifikasi data dan instruksi pembayaran</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Main Form */}
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-2 mb-2 text-slate-800 font-semibold text-sm">
               <CreditCard size={16} className="text-violet-600" /> Informasi Dasar
            </div>
            <Field
              label="Sekolah (opsional)"
              hint="Kosong = global. Untuk tunai per sekolah (COA berbeda), pilih sekolah."
            >
              <Select value={String(form.school_id)} onChange={(e) => setForm((f) => ({ ...f, school_id: e.target.value }))}>
                <option value="">Semua sekolah (global)</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Grid cols={2} gap={5}>
              <Field label="Nama Bank / E-Wallet" required hint="Contoh: Bank BSI, BCA, GoPay, Tunai">
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
              </Field>
              <Field label="Vendor / Penyedia" hint="Contoh: Zains, Midtrans, atau Nama Bank">
                <Input value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} />
              </Field>
            </Grid>
            <Grid cols={2} gap={5}>
              <Field label="Kode COA (Accounting)" hint="Contoh: 1-1101 (Kas) atau 1-1102 (Bank)">
                <Input value={form.coa} onChange={e => setForm(f => ({ ...f, coa: e.target.value }))} />
              </Field>
              <Field label="Kode Identifikasi" required hint="Contoh: BSI, BCA, GOPAY">
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
              </Field>
            </Grid>
            <SchoolLogoFormField
              label="Logo metode (opsional)"
              hint="Tampil di daftar. Unggah ke Vercel Blob saat Simpan."
              imageEntityLabel="metode pembayaran"
              existingUrl={form.logo_url.trim() || null}
              pendingFile={pendingLogo}
              onPendingFileChange={setPendingLogo}
              disabled={saving}
            />
            <Field label="Kategori Metode" required>
              <Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                <option value="bank_transfer">Transfer Bank Manual</option>
                <option value="virtual_account">Virtual Account (Otomatis)</option>
                <option value="ewallet">E-Wallet (OVO/GoPay dll)</option>
                <option value="cash">Pembayaran Tunai (Kasir)</option>
              </Select>
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Status Publish">
                <Select value={form.is_publish ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, is_publish: e.target.value === 'true' }))}>
                  <option value="true">Published - Muncul di Portal</option>
                  <option value="false">Draft - Disembunyikan</option>
                </Select>
              </Field>
              <Field label="Redirect ke Vendor?">
                <Select value={form.is_redirect ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, is_redirect: e.target.value === 'true' }))}>
                  <option value="false">Tidak - Tetap di App</option>
                  <option value="true">Ya - Buka Halaman Vendor</option>
                </Select>
              </Field>
            </div>
            <Field label="Status Aktif">
              <Select value={form.is_active ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'true' }))}>
                <option value="true">Aktif - Bisa digunakan</option>
                <option value="false">Tidak Aktif - Nonaktifkan Permanen</option>
              </Select>
            </Field>
          </div>
          <div className="bg-slate-50/80 border-t border-slate-200 p-5 flex justify-end gap-3 mt-auto">
            <Link href="/finance/payment-methods"><Button variant="ghost" type="button">Batal</Button></Link>
            <Button loading={saving} type="submit" disabled={!form.name || !form.code}>Update Data</Button>
          </div>
        </form>

        {/* Instructions Section */}
        <div id="instructions" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col scroll-mt-6">
          <div className="p-6 pb-2 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                <ListTree size={16} className="text-violet-600" /> Instruksi Pembayaran
              </div>
              <p className="text-slate-400 text-[12px] mt-0.5">Urutan langkah yang muncul di portal tagihan</p>
            </div>
            <Link href={`/finance/payment-instructions/add?methodId=${id}`}>
              <Button size="sm" variant="outline" className="h-8 text-[11px] px-3 gap-1.5 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200">
                <Plus size={14} /> Tambah Langkah
              </Button>
            </Link>
          </div>

          <div className="p-0 mt-4 border-t border-slate-100">
            <div className="overflow-x-auto">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-10">Sort</th>
                      <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-12 text-center">ID</th>
                      <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Judul Langkah</th>
                      <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-20">Urutan</th>
                      <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right w-28 pr-6">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingInstructions ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i} className="border-b border-slate-50">
                          <td colSpan={5} className="px-5 py-4"><div className="h-4 bg-slate-50 rounded animate-pulse w-full" /></td>
                        </tr>
                      ))
                    ) : instructions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-slate-400 text-[12px] italic">
                          Belum ada instruksi untuk metode ini.
                        </td>
                      </tr>
                    ) : (
                      <SortableContext items={instructions.map((r) => r.id)} strategy={verticalListSortingStrategy}>
                        {instructions.map((row) => (
                          <SortableInstructionRow
                            key={row.id}
                            row={row}
                            deleting={deletingId === row.id}
                            onDelete={handleDeleteInstruction}
                          />
                        ))}
                      </SortableContext>
                    )}
                  </tbody>
                </table>
              </DndContext>
            </div>
          </div>
          {reordering && (
            <div className="p-2.5 bg-violet-50 border-t border-violet-100 text-center text-[11px] text-violet-600 font-medium animate-pulse">
              Menyimpan urutan baru...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper components missing in FormFields specifically for this page
function Grid({ children, cols, gap }: { children: React.ReactNode, cols: number, gap: number }) {
  return <div className={`grid grid-cols-1 md:grid-cols-${cols} gap-${gap}`}>{children}</div>;
}

function CreditCard({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}
