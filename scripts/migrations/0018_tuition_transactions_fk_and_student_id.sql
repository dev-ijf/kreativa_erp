-- =============================================================================
-- 0018: tuition_transactions & tuition_transaction_details
--   - tambah kolom student_id (NOT NULL setelah backfill)
--   - tambah FK ke core_users / core_students / core_academic_years /
--     tuition_payment_methods / tuition_bills / tuition_products
--   - tambah index pendukung
--
-- Pra-syarat produksi:
--   1) Backup / snapshot database (mis. Neon branch atau pg_dump).
--   2) Kedua tabel ini RANGE-partitioned (yYYYYmMM). ALTER pada parent
--      otomatis merambat ke seluruh partisi (PostgreSQL >= 12).
-- =============================================================================

-- 1. Tambah kolom student_id (nullable dulu agar backfill bisa berjalan).
ALTER TABLE public.tuition_transactions
  ADD COLUMN IF NOT EXISTS student_id integer;

ALTER TABLE public.tuition_transaction_details
  ADD COLUMN IF NOT EXISTS student_id integer;

-- 2. Backfill student_id pada detail dari tuition_bills (sumber kebenaran).
UPDATE public.tuition_transaction_details d
SET student_id = b.student_id
FROM public.tuition_bills b
WHERE b.id = d.bill_id
  AND d.student_id IS NULL;

-- 3. Backfill student_id pada transaksi dari salah satu detail-nya
--    (1 transaksi = 1 student). MIN dipakai sebagai pemilih deterministik.
UPDATE public.tuition_transactions t
SET student_id = sub.student_id
FROM (
    SELECT transaction_id,
           transaction_created_at,
           MIN(student_id) AS student_id
    FROM public.tuition_transaction_details
    WHERE student_id IS NOT NULL
    GROUP BY transaction_id, transaction_created_at
) sub
WHERE t.id = sub.transaction_id
  AND t.created_at = sub.transaction_created_at
  AND t.student_id IS NULL;

-- 4. Safeguard: hapus baris yang masih NULL setelah backfill (orphan tanpa
--    detail/bill valid). Detail yatim akan terhapus lewat CASCADE FK ke
--    transaksi (sudah ada di skema partisi).
DELETE FROM public.tuition_transaction_details
WHERE student_id IS NULL;

DELETE FROM public.tuition_transactions
WHERE student_id IS NULL;

-- 5. Kunci NOT NULL.
ALTER TABLE public.tuition_transactions
  ALTER COLUMN student_id SET NOT NULL;

ALTER TABLE public.tuition_transaction_details
  ALTER COLUMN student_id SET NOT NULL;

-- 6. Tambah Foreign Keys (idempotent).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'tuition_transactions_user_id_core_users_id_fk'
    ) THEN
        ALTER TABLE public.tuition_transactions
            ADD CONSTRAINT tuition_transactions_user_id_core_users_id_fk
            FOREIGN KEY (user_id) REFERENCES public.core_users (id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'tuition_transactions_student_id_core_students_id_fk'
    ) THEN
        ALTER TABLE public.tuition_transactions
            ADD CONSTRAINT tuition_transactions_student_id_core_students_id_fk
            FOREIGN KEY (student_id) REFERENCES public.core_students (id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'tuition_transactions_academic_year_id_core_academic_years_id_fk'
    ) THEN
        ALTER TABLE public.tuition_transactions
            ADD CONSTRAINT tuition_transactions_academic_year_id_core_academic_years_id_fk
            FOREIGN KEY (academic_year_id) REFERENCES public.core_academic_years (id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'tuition_transactions_payment_method_id_tuition_payment_methods_id_fk'
    ) THEN
        ALTER TABLE public.tuition_transactions
            ADD CONSTRAINT tuition_transactions_payment_method_id_tuition_payment_methods_id_fk
            FOREIGN KEY (payment_method_id) REFERENCES public.tuition_payment_methods (id)
            ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'tuition_transaction_details_bill_id_tuition_bills_id_fk'
    ) THEN
        ALTER TABLE public.tuition_transaction_details
            ADD CONSTRAINT tuition_transaction_details_bill_id_tuition_bills_id_fk
            FOREIGN KEY (bill_id) REFERENCES public.tuition_bills (id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'tuition_transaction_details_product_id_tuition_products_id_fk'
    ) THEN
        ALTER TABLE public.tuition_transaction_details
            ADD CONSTRAINT tuition_transaction_details_product_id_tuition_products_id_fk
            FOREIGN KEY (product_id) REFERENCES public.tuition_products (id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'tuition_transaction_details_student_id_core_students_id_fk'
    ) THEN
        ALTER TABLE public.tuition_transaction_details
            ADD CONSTRAINT tuition_transaction_details_student_id_core_students_id_fk
            FOREIGN KEY (student_id) REFERENCES public.core_students (id);
    END IF;
END $$;

-- 7. Index pendukung untuk filter & join lintas partisi.
CREATE INDEX IF NOT EXISTS idx_tuition_tx_student
    ON public.tuition_transactions (student_id);

CREATE INDEX IF NOT EXISTS idx_tuition_tx_user
    ON public.tuition_transactions (user_id);

CREATE INDEX IF NOT EXISTS idx_tuition_tx_det_student
    ON public.tuition_transaction_details (student_id);

CREATE INDEX IF NOT EXISTS idx_tuition_tx_det_bill
    ON public.tuition_transaction_details (bill_id);
