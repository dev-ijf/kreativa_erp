'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button, Field, Input, Select } from '@/components/ui/FormFields';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { toast } from 'sonner';

type PaymentMethod = { id: number; name: string };

export default function AddPaymentInstructionPage() {
  const router = useRouter();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    payment_channel_id: '',
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
    router.push('/finance/payment-instructions');
  };

  return (
    <div className="p-6 max-w-[900px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/payment-instructions">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center"><ArrowLeft size={16} /></Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Tambah Payment Instruction</h2>
          <p className="text-slate-400 text-[13px]">Buat instruksi pembayaran untuk channel tertentu</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden">
        <div className="p-6 space-y-5">
          <Field label="Payment Channel" required>
            <Select value={form.payment_channel_id} onChange={(e) => setForm((f) => ({ ...f, payment_channel_id: e.target.value }))}>
              <option value="" disabled>Pilih channel</option>
              {methods.map((m) => (
                <option key={m.id} value={String(m.id)}>{m.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Judul Instruksi" required>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} autoFocus />
          </Field>
          <Field label="Urutan Langkah (opsional)" hint="Kosongkan jika tidak ingin diurutkan">
            <Input inputMode="numeric" value={form.step_order} onChange={(e) => setForm((f) => ({ ...f, step_order: e.target.value.replace(/[^\d]/g, '') }))} />
          </Field>
          <Field label="Deskripsi Detail" required>
            <RichTextEditor value={form.description} onChange={(html) => setForm((f) => ({ ...f, description: html }))} />
          </Field>
        </div>
        <div className="bg-slate-50 border-t border-[#E2E8F1] p-5 flex justify-end gap-3">
          <Link href="/finance/payment-instructions"><Button variant="ghost" type="button">Batal</Button></Link>
          <Button loading={saving} type="submit" disabled={!form.title || !form.payment_channel_id || !form.description}>
            Simpan
          </Button>
        </div>
      </form>
    </div>
  );
}

