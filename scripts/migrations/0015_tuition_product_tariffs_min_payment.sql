-- Minimum payment per matriks tarif (utama produk cicilan / is_installment)
ALTER TABLE public.tuition_product_tariffs
  ADD COLUMN IF NOT EXISTS min_payment numeric(15, 2) NOT NULL DEFAULT 0;
