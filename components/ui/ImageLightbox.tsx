'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  src: string;
  alt: string;
};

export function ImageLightbox({ open, onClose, src, alt }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open || !src) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Pratinjau foto">
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Tutup pratinjau"
      />
      <div className="relative z-10 flex w-full max-w-4xl max-h-[min(92vh,900px)] flex-col items-stretch">
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white p-2 text-slate-700 shadow-lg ring-1 ring-slate-200 hover:bg-slate-50"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-auto rounded-2xl bg-slate-950/30 shadow-2xl ring-1 ring-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="mx-auto block max-h-[min(85vh,820px)] w-auto max-w-full object-contain object-top"
          />
        </div>
      </div>
    </div>
  );
}
