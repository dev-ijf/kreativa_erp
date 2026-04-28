'use client';

import { useEffect, useRef, useState } from 'react';
import { Field, Button, Input } from '@/components/ui/FormFields';
import { ImageIcon, X } from 'lucide-react';

type Props = {
  /** URL logo yang sudah tersimpan (blob, absolut, atau path `/…`). */
  existingUrl: string | null;
  /** File yang dipilih user; upload ke Blob dilakukan di parent saat submit. */
  pendingFile: File | null;
  onPendingFileChange: (file: File | null) => void;
  disabled?: boolean;
};

export function SchoolLogoFormField({
  existingUrl,
  pendingFile,
  onPendingFileChange,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingFile) {
      setObjectUrl(null);
      return;
    }
    const u = URL.createObjectURL(pendingFile);
    setObjectUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [pendingFile]);

  const previewSrc = objectUrl || (pendingFile ? null : existingUrl || null);
  const showPreview = Boolean(previewSrc);

  return (
    <Field
      label="Logo sekolah"
      hint="Pilih gambar untuk pratinjau. File diunggah ke Vercel Blob saat Anda menekan Simpan / Update, bukan saat memilih file."
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={disabled}
            aria-label="Pilih logo sekolah"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              onPendingFileChange(f);
              e.target.value = '';
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            <ImageIcon size={14} className="mr-1.5" />
            {pendingFile ? 'Ganti gambar' : 'Pilih gambar'}
          </Button>
          {pendingFile && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-slate-600"
              disabled={disabled}
              onClick={() => onPendingFileChange(null)}
            >
              <X size={14} className="mr-1" />
              Batal pilihan
            </Button>
          )}
        </div>

        <Input
          readOnly
          value={pendingFile ? pendingFile.name : 'Belum ada file baru — logo tersimpan dipakai jika ada'}
          className="bg-slate-50 text-slate-600 text-[13px]"
          tabIndex={-1}
          aria-label="Nama file yang dipilih"
        />

        {showPreview && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 inline-block max-w-full">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
              {pendingFile ? 'Pratinjau (belum diunggah)' : 'Logo saat ini'}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewSrc!}
              alt={pendingFile ? `Pratinjau ${pendingFile.name}` : 'Logo sekolah'}
              className="max-h-40 max-w-full rounded-lg object-contain border border-white shadow-sm"
            />
          </div>
        )}
      </div>
    </Field>
  );
}
