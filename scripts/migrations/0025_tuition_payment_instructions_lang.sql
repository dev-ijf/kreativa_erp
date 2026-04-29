-- 0025: Bahasa instruksi pembayaran (ID | EN) + unik per channel + urutan + bahasa

ALTER TABLE public.tuition_payment_instructions
  ADD COLUMN IF NOT EXISTS lang varchar(2) NOT NULL DEFAULT 'ID';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tuition_payment_instructions_lang_check'
  ) THEN
    ALTER TABLE public.tuition_payment_instructions
      ADD CONSTRAINT tuition_payment_instructions_lang_check
      CHECK (lang IN ('ID', 'EN'));
  END IF;
END $$;

DROP INDEX IF EXISTS public.uniq_tuition_payment_instructions_channel_step_order;

CREATE UNIQUE INDEX uniq_tuition_payment_instructions_channel_step_order
  ON public.tuition_payment_instructions (payment_channel_id, step_order, lang)
  WHERE step_order IS NOT NULL;
