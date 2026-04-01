'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Copy, Eye } from 'lucide-react';
import { Button, Field, Input, Select, Textarea } from '@/components/ui/FormFields';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { toast } from 'sonner';
import { TRIGGER_OPTIONS, VARIABLES_BY_TRIGGER, renderPreview, type TriggerKey } from '@/lib/notification-template-variables';

type Channel = 'whatsapp' | 'email';

type TemplateRow = {
  id: number;
  school_id: number | null;
  name: string;
  type: Channel;
  trigger_event: TriggerKey;
  subject: string | null;
  content: string;
  is_active: boolean;
};

export default function EditNotificationTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<'plain' | 'rich'>('rich');
  const [form, setForm] = useState({
    name: '',
    type: 'whatsapp' as Channel,
    trigger_event: 'REMINDER' as TriggerKey,
    subject: '',
    content: '',
    is_active: true,
  });

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const res = await fetch(`/api/finance/notifications/${id}`);
      if (!res.ok) {
        toast.error('Template tidak ditemukan');
        router.push('/finance/notifications');
        return;
      }
      const row = (await res.json()) as TemplateRow;
      setForm({
        name: row.name ?? '',
        type: row.type ?? 'whatsapp',
        trigger_event: (row.trigger_event ?? 'REMINDER') as TriggerKey,
        subject: row.subject ?? '',
        content: row.content ?? '',
        is_active: row.is_active ?? true,
      });
      setLoading(false);
    })();
  }, [id, router]);

  const variables = useMemo(() => VARIABLES_BY_TRIGGER[form.trigger_event] ?? [], [form.trigger_event]);
  const preview = useMemo(() => renderPreview(form.content || '', form.trigger_event), [form.content, form.trigger_event]);

  const copyVar = async (v: string) => {
    await navigator.clipboard.writeText(v);
    toast.success('Disalin');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/finance/notifications/${id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        type: form.type,
        trigger_event: form.trigger_event,
        subject: form.type === 'email' ? (form.subject || null) : null,
        content: form.content,
        is_active: form.is_active,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error('Gagal update template');
      return;
    }
    toast.success('Template diperbarui');
    router.push('/finance/notifications');
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/notifications">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center"><ArrowLeft size={16} /></Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Edit Notification Template</h2>
          <p className="text-slate-400 text-[13px]">Update your notification template</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
        <div className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden">
          <div className="p-6 space-y-5">
            <Field label="Template Name" required>
              <Input disabled={loading} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} autoFocus />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Channel" required>
                <Select disabled={loading} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as Channel }))}>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                </Select>
              </Field>
              <Field label="Trigger On" required>
                <Select disabled={loading} value={form.trigger_event} onChange={(e) => setForm((f) => ({ ...f, trigger_event: e.target.value as TriggerKey }))}>
                  {TRIGGER_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </Select>
              </Field>
            </div>

            {form.type === 'email' && (
              <Field label="Subject (for Email)" required>
                <Input disabled={loading} value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
              </Field>
            )}

            <div className="flex items-center gap-3">
              <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wide">Content</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`text-[12px] font-semibold px-2.5 py-1 rounded-lg border ${mode === 'plain' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-600 border-slate-200'}`}
                  onClick={() => setMode('plain')}
                >
                  Plain Text
                </button>
                <button
                  type="button"
                  className={`text-[12px] font-semibold px-2.5 py-1 rounded-lg border ${mode === 'rich' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-600 border-slate-200'}`}
                  onClick={() => setMode('rich')}
                >
                  Rich Text
                </button>
              </div>
              <div className="flex-1" />
              <label className="flex items-center gap-2 text-[12px] text-slate-500">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="h-4 w-4 accent-violet-600"
                />
                Active Template
              </label>
            </div>

            {mode === 'plain' ? (
              <Textarea disabled={loading} value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} rows={10} />
            ) : (
              <RichTextEditor value={form.content} onChange={(html) => setForm((f) => ({ ...f, content: html }))} />
            )}
          </div>

          <div className="bg-slate-50 border-t border-[#E2E8F1] p-5 flex justify-end gap-3">
            <Link href="/finance/notifications"><Button variant="ghost" type="button">Cancel</Button></Link>
            <Button loading={saving} type="submit" disabled={loading || !form.name || !form.type || !form.trigger_event || !form.content || (form.type === 'email' && !form.subject)}>
              Update Template
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#E2E8F1]">
              <p className="font-bold text-slate-800">Available Variables</p>
              <p className="text-[12px] text-slate-400">Click to copy variables to your template</p>
            </div>
            <div className="p-5 space-y-3">
              {variables.map((v) => (
                <div key={v.key} className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold bg-violet-50 text-violet-700 border border-violet-100">
                      {v.key}
                    </span>
                    <p className="text-[12px] text-slate-500 mt-1">{v.label}</p>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={() => copyVar(v.key)}>
                    <Copy size={13} />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#E2E8F1] flex items-center gap-2">
              <Eye size={16} className="text-slate-500" />
              <p className="font-bold text-slate-800">Preview</p>
            </div>
            <div className="p-5">
              {mode === 'plain' ? (
                <div className="text-[13px] text-slate-700 whitespace-pre-wrap">{preview}</div>
              ) : (
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: preview }} />
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

