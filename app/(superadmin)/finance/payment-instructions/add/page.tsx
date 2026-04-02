'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button, Field, Input, Select } from '@/components/ui/FormFields';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { toast } from 'sonner';

type PaymentMethod = { id: number; name: string };

function AddInstructionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const methodId = searchParams.get('methodId');
  const redirect = searchParams.get('redirect') || (methodId ? `/finance/payment-methods/${methodId}#instructions` : '/finance/payment-methods');
  
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    payment_channel_id: methodId || '',
    step_order: '',
    description: '',
  });

  useEffect(() => {
    fetch('/api/finance/payment-methods')
      .then((r) => r.json())
      .then((d) => setMethods(d));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/finance/payment-instructions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        step_order: form.step_order === '' ? null : Number(form.step_order),
        payment_channel_id: Number(form.payment_channel_id),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error('Gagal menyimpan instruksi');
      return;
    }
    toast.success('Instruksi dibuat');
    router.push(redirect);
  };

  return (
    <div className="p-6 max-w-[900px] mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Link href={redirect}>
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center"><ArrowLeft size={16} /></Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Tambah Instruksi Pembayaran</h2>
          <p className="text-slate-400 text-[13px]">Buat instruksi pembayaran untuk channel tertentu</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 space-y-5">
          <Field label="Payment Channel" required>
            <Select value={form.payment_channel_id} onChange={(e) => setForm((f) => ({ ...f, payment_channel_id: e.target.value }))}>
              <option value="" disabled>Pilih channel</option>
              {methods.map((m) => (
                <option key={m.id} value={String(m.id)}>{m.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Judul Instruksi" required hint="Contoh: Pembayaran melalui ATM Mandiri">
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} autoFocus />
          </Field>
          <Field label="Urutan Langkah (opsional)" hint="Kosongkan jika tidak ingin diurutkan">
            <Input inputMode="numeric" value={form.step_order} onChange={(e) => setForm((f) => ({ ...f, step_order: e.target.value.replace(/[^\d]/g, '') }))} />
          </Field>
          <Field label="Deskripsi Detail" required>
            <RichTextEditor value={form.description} onChange={(html) => setForm((f) => ({ ...f, description: html }))} />
          </Field>
        </div>
        <div className="bg-slate-50/80 border-t border-slate-100 p-5 flex justify-end gap-3 mt-4">
          <Link href={redirect}><Button variant="ghost" type="button">Batal</Button></Link>
          <Button loading={saving} type="submit" disabled={!form.title || !form.payment_channel_id || !form.description}>
            Simpan Instruksi
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function AddPaymentInstructionPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-400">Loading form...</div>}>
      <AddInstructionForm />
    </Suspense>
  );
}

