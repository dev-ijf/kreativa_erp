'use client';

import { useRef, useState } from 'react';
import { Field, Button, Input } from '@/components/ui/FormFields';
import { FileUp, Loader2, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export type DocRow = {
  id: number;
  document_type: string;
  file_name: string;
  file_path: string;
};

type Props = {
  studentId: string;
  documents: DocRow[];
  viewOnly: boolean;
  onDocumentsChanged: () => void;
};

function isImageUrl(url: string) {
  if (/\.pdf(\?|$)/i.test(url)) return false;
  return /\.(jpe?g|png|gif|webp)(\?|$)/i.test(url);
}

export function StudentDocumentsSection({
  studentId,
  documents,
  viewOnly,
  onDocumentsChanged,
}: Props) {
  const [docType, setDocType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    if (!docType.trim()) {
      toast.error('Isi jenis dokumen dulu');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('prefix', `students/${studentId}/documents`);
      const up = await fetch('/api/upload/blob', { method: 'POST', body: fd });
      const upJson = await up.json();
      if (!up.ok) throw new Error(upJson.error || 'Upload gagal');

      const fileName = file.name;
      const res = await fetch(`/api/students/${studentId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_type: docType.trim(),
          file_name: fileName,
          file_path: upJson.url,
        }),
      });
      if (!res.ok) throw new Error('Gagal menyimpan metadata dokumen');
      setDocType('');
      if (fileRef.current) fileRef.current.value = '';
      toast.success('Dokumen diunggah');
      onDocumentsChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal');
    } finally {
      setUploading(false);
    }
  };

  const remove = async (docId: number) => {
    if (!confirm('Hapus dokumen ini dari daftar?')) return;
    setDeletingId(docId);
    try {
      const res = await fetch(
        `/api/students/${studentId}/documents?document_id=${docId}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error('Gagal menghapus');
      toast.success('Dokumen dihapus');
      onDocumentsChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-[#E2E8F1] p-6 space-y-5">
      <h3 className="text-sm font-bold text-blue-700">Dokumen pendukung</h3>

      {!viewOnly && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Jenis dokumen">
              <Input
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                placeholder="Kartu Keluarga, Akta lahir, …"
              />
            </Field>
            <Field label="Berkas">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  aria-label="Pilih berkas dokumen"
                  accept=".pdf,image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void upload(f);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="animate-spin" size={14} /> Mengunggah…
                    </>
                  ) : (
                    <>
                      <FileUp size={14} /> Pilih file
                    </>
                  )}
                </Button>
                <span className="text-[12px] text-slate-500">PDF atau gambar, maks 10 MB</span>
              </div>
            </Field>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {documents.length === 0 ? (
          <p className="text-[13px] text-slate-400 col-span-full">Belum ada dokumen.</p>
        ) : (
          documents.map((d) => (
            <div
              key={d.id}
              className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50/50 flex flex-col"
            >
              <div className="p-3 border-b border-slate-100 flex justify-between gap-2 items-start">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 text-[13px]">{d.document_type}</p>
                  <p className="text-[11px] text-slate-500 truncate" title={d.file_name}>
                    {d.file_name}
                  </p>
                </div>
                {!viewOnly && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 text-rose-600 border-rose-200 hover:bg-rose-50"
                    loading={deletingId === d.id}
                    onClick={() => remove(d.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
              <div className="relative bg-white aspect-4/3 max-h-[220px]">
                {isImageUrl(d.file_path) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.file_path}
                    alt={d.document_type}
                    className="w-full h-full object-contain object-center bg-slate-100"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-[13px] gap-2 p-4">
                    <span>Berkas PDF / non-gambar</span>
                    <a
                      href={d.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 font-medium hover:underline"
                    >
                      Buka / unduh <ExternalLink size={14} />
                    </a>
                  </div>
                )}
              </div>
              <div className="p-2 border-t border-slate-100 bg-white">
                <a
                  href={d.file_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] text-blue-600 hover:underline flex items-center justify-center gap-1 py-1"
                >
                  Buka di tab baru <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
