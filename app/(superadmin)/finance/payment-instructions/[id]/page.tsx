'use client';

import { use, useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button, Field, Input, Select } from '@/components/ui/FormFields';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { toast } from 'sonner';

type PaymentMethod = { id: number; name: string };

function paymentMethodsFromResponse(payload: unknown): PaymentMethod[] {
  if (Array.isArray(payload)) return payload as PaymentMethod[];
  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: PaymentMethod[] }).data;
  }
  return [];
}

type Instruction = {
  id: number;
  title: string;
  description: string;
  step_order: number | null;
  payment_channel_id: number;
  lang: 'ID' | 'EN';
};

function EditInstructionForm({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParams = searchParams.get('redirect');
  
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    payment_channel_id: '',
    step_order: '',
    description: '',
    lang: 'ID' as 'ID' | 'EN',
  });

  const redirect = redirectParams || (form.payment_channel_id ? `/finance/payment-methods/${form.payment_channel_id}#instructions` : '/finance/payment-methods');

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const [m, rowRes] = await Promise.all([
        fetch('/api/finance/payment-methods?limit=500').then((r) => r.json()),
        fetch(`/api/finance/payment-instructions/${id}`),
      ]);
      setMethods(paymentMethodsFromResponse(m));
      if (!rowRes.ok) {
        toast.error('Instruksi tidak ditemukan');
        router.push(redirect);
        return;
      }
      const row = (await rowRes.json()) as Instruction;
      setForm({
        title: row.title ?? '',
        payment_channel_id: String(row.payment_channel_id ?? ''),
        step_order: row.step_order === null || row.step_order === undefined ? '' : String(row.step_order),
        description: row.description ?? '',
        lang: row.lang === 'EN' ? 'EN' : 'ID',
      });
      setLoading(false);
    })();
  }, [id, router, redirect]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/finance/payment-instructions/${id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        step_order: form.step_order === '' ? null : Number(form.step_order),
        payment_channel_id: Number(form.payment_channel_id),
        lang: form.lang,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error('Gagal update instruksi');
      return;
    }
    toast.success('Instruksi diperbarui');
    router.push(redirect);
  };

  return (
    <div className="p-6 max-w-[900px] mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Link href={redirect}>
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center"><ArrowLeft size={16} /></Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Edit Instruksi Pembayaran</h2>
          <p className="text-slate-400 text-[13px]">Update detail instruksi pembayaran</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 space-y-5">
          <Field label="Payment Channel" required>
            <Select disabled={loading} value={form.payment_channel_id} onChange={(e) => setForm((f) => ({ ...f, payment_channel_id: e.target.value }))}>
              <option value="" disabled>Pilih channel</option>
              {methods.map((m) => (
                <option key={m.id} value={String(m.id)}>{m.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Bahasa" required hint="Tampilan instruksi untuk locale portal">
            <div className="flex flex-wrap gap-6">
              <label className="inline-flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="instruction_lang"
                  className="accent-violet-600"
                  disabled={loading}
                  checked={form.lang === 'ID'}
                  onChange={() => setForm((f) => ({ ...f, lang: 'ID' }))}
                />
                Indonesia (ID)
              </label>
              <label className="inline-flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="instruction_lang"
                  className="accent-violet-600"
                  disabled={loading}
                  checked={form.lang === 'EN'}
                  onChange={() => setForm((f) => ({ ...f, lang: 'EN' }))}
                />
                English (EN)
              </label>
            </div>
          </Field>
          <Field label="Judul Instruksi" required hint="Contoh: Pembayaran melalui ATM Mandiri">
            <Input disabled={loading} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} autoFocus />
          </Field>
          <Field label="Urutan Langkah (opsional)" hint="Kosongkan jika tidak ingin diurutkan">
            <Input disabled={loading} inputMode="numeric" value={form.step_order} onChange={(e) => setForm((f) => ({ ...f, step_order: e.target.value.replace(/[^\d]/g, '') }))} />
          </Field>
          <Field label="Deskripsi Detail" required>
            <RichTextEditor value={form.description} onChange={(html) => setForm((f) => ({ ...f, description: html }))} />
          </Field>
        </div>
        <div className="bg-slate-50/80 border-t border-slate-100 p-5 flex justify-end gap-3 mt-4">
          <Link href={redirect}><Button variant="ghost" type="button">Batal</Button></Link>
          <Button loading={saving} type="submit" disabled={loading || !form.title || !form.payment_channel_id || !form.description}>
            Update Instruksi
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function EditPaymentInstructionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-400">Loading form...</div>}>
      <EditInstructionForm id={id} />
    </Suspense>
  );
}

