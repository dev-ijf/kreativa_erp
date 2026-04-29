-- 0022: flag alur pembayaran via WhatsApp (checkout / lunas)

ALTER TABLE public.tuition_transactions
  ADD COLUMN IF NOT EXISTS is_whatsapp_checkout boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_whatsapp_paid boolean NOT NULL DEFAULT false;
