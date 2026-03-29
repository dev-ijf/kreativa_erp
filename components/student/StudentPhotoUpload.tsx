'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/FormFields';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import { Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Props = {
  studentId: string;
  photoUrl: string | null | undefined;
  viewOnly: boolean;
  onPhotoSaved: (url: string) => void;
};

export function StudentPhotoUpload({ studentId, photoUrl, viewOnly, onPhotoSaved }: Props) {
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayUrl = localPreview || photoUrl || '';

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Pilih file gambar (JPG, PNG, WebP)');
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('prefix', `students/${studentId}/photos`);
      const res = await fetch('/api/upload/blob', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload gagal');
      const patch = await fetch(`/api/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_url: data.url }),
      });
      if (!patch.ok) throw new Error('Gagal menyimpan foto');
      URL.revokeObjectURL(objectUrl);
      setLocalPreview(null);
      onPhotoSaved(data.url as string);
      toast.success('Foto tersimpan');
    } catch (err) {
      URL.revokeObjectURL(objectUrl);
      setLocalPreview(null);
      toast.error(err instanceof Error ? err.message : 'Upload gagal');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 md:items-start">
      <ImageLightbox
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        src={displayUrl}
        alt="Foto siswa"
      />
      <div className="shrink-0 flex justify-center md:justify-start w-full md:w-auto">
        <button
          type="button"
          className={`relative w-full max-w-[min(100%,280px)] aspect-3/4 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm ring-1 ring-slate-900/5 text-left ${
            displayUrl && !uploading
              ? 'cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2'
              : 'cursor-default'
          }`}
          onClick={() => displayUrl && !uploading && setLightboxOpen(true)}
          disabled={!displayUrl || uploading}
          aria-label={displayUrl ? 'Perbesar foto siswa' : undefined}
        >
          {displayUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL Blob publik & pratinjau lokal
            <img
              src={displayUrl}
              alt="Foto siswa"
              className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-[13px] px-4 text-center">
              Belum ada foto
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-white/75 flex items-center justify-center z-10">
              <Loader2 className="animate-spin text-slate-600" size={32} aria-hidden />
            </div>
          )}
        </button>
      </div>
      <div className="flex-1 space-y-3 min-w-0 pt-0 md:pt-1">
        {!viewOnly && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              aria-label="Pilih file foto siswa"
              onChange={handleFile}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              <Camera size={14} /> {uploading ? 'Mengunggah…' : 'Unggah / ganti foto'}
            </Button>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              JPG, PNG, WebP, atau GIF. Maks 10 MB. Penyimpanan: Vercel Blob.
            </p>
          </>
        )}
        {viewOnly && photoUrl && (
          <a
            href={photoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-[13px] text-blue-600 hover:underline font-medium"
          >
            Buka gambar di tab baru
          </a>
        )}
      </div>
    </div>
  );
}
