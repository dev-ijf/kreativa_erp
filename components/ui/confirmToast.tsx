'use client';

import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '@/components/ui/FormFields';

type ConfirmToastOptions = {
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
};

type ConfirmModalProps = {
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

function ConfirmModal({
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label="Tutup dialog konfirmasi"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm mx-4 rounded-2xl bg-white shadow-2xl border border-slate-200 p-5">
        <div className="text-[14px] text-slate-800 leading-relaxed">
          {message}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={async () => {
              await onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function confirmToast(message: string, options: ConfirmToastOptions) {
  const { confirmLabel = 'Lanjut', cancelLabel = 'Batal', onConfirm } = options;

  if (typeof document === 'undefined') return;

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  const handleClose = () => {
    root.unmount();
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  };

  root.render(
    <ConfirmModal
      message={message}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      onConfirm={onConfirm}
      onClose={handleClose}
    />
  );
}

