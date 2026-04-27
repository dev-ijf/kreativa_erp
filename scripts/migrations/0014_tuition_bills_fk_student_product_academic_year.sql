-- =============================================================================
-- 0014: tuition_bills — FK ke core_students, tuition_products, core_academic_years
-- =============================================================================
-- Pra-syarat produksi:
--   1) Backup / snapshot database (mis. Neon branch atau pg_dump).
--   2) Opsional: `npm run db:check-tuition-orphans` — setelah migrasi ini baris
--      orphan sudah dihapus otomatis di bawah (beserta detail transaksi terkait).
-- =============================================================================

-- Hapus detail pembayaran yang menunjuk ke tagihan tidak valid, lalu tagihan itu sendiri.
DELETE FROM public.tuition_transaction_details d
WHERE EXISTS (
    SELECT 1
    FROM public.tuition_bills b
    WHERE
        b.id = d.bill_id
        AND (
            NOT EXISTS (SELECT 1 FROM public.core_students s WHERE s.id = b.student_id)
            OR NOT EXISTS (SELECT 1 FROM public.tuition_products p WHERE p.id = b.product_id)
            OR NOT EXISTS (SELECT 1 FROM public.core_academic_years y WHERE y.id = b.academic_year_id)
        )
    );

DELETE FROM public.tuition_bills b
WHERE
    NOT EXISTS (SELECT 1 FROM public.core_students s WHERE s.id = b.student_id)
    OR NOT EXISTS (SELECT 1 FROM public.tuition_products p WHERE p.id = b.product_id)
    OR NOT EXISTS (SELECT 1 FROM public.core_academic_years y WHERE y.id = b.academic_year_id);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tuition_bills_student_id_core_students_id_fk') THEN
        ALTER TABLE public.tuition_bills
            ADD CONSTRAINT tuition_bills_student_id_core_students_id_fk
            FOREIGN KEY (student_id) REFERENCES public.core_students (id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tuition_bills_product_id_tuition_products_id_fk') THEN
        ALTER TABLE public.tuition_bills
            ADD CONSTRAINT tuition_bills_product_id_tuition_products_id_fk
            FOREIGN KEY (product_id) REFERENCES public.tuition_products (id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tuition_bills_academic_year_id_core_academic_years_id_fk') THEN
        ALTER TABLE public.tuition_bills
            ADD CONSTRAINT tuition_bills_academic_year_id_core_academic_years_id_fk
            FOREIGN KEY (academic_year_id) REFERENCES public.core_academic_years (id);
    END IF;
END $$;
