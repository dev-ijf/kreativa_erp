-- Kode channel bank & kode sekolah (integrasi pembayaran / eksternal).
ALTER TABLE public.core_schools
  ADD COLUMN IF NOT EXISTS bank_channel_code varchar(100);

ALTER TABLE public.core_schools
  ADD COLUMN IF NOT EXISTS school_code varchar(100);
