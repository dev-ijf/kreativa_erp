-- 0026: ID pembayaran dari vendor (gateway) pada tuition_transactions

ALTER TABLE public.tuition_transactions
  ADD COLUMN IF NOT EXISTS vendor_payment_id varchar(100);
