-- =============================================================================
-- 0019: academic_adaptive_tests.student_id → core_students(id)
--
-- Skema produksi sebelumnya tidak punya FK pada kolom ini sehingga baris
-- adaptive_tests bisa menunjuk student yang sudah dihapus. Migration ini
-- membersihkan baris yatim lalu menambah FK (idempotent).
-- =============================================================================

-- 1. Hapus pertanyaan dari tes yang student_id-nya tidak valid (cascade siap
--    via FK questions->tests, tapi kita lakukan eksplisit agar urutannya jelas).
DELETE FROM public.academic_adaptive_questions
WHERE adaptive_test_id IN (
    SELECT t.id
    FROM public.academic_adaptive_tests t
    WHERE NOT EXISTS (
        SELECT 1 FROM public.core_students s WHERE s.id = t.student_id
    )
);

-- 2. Hapus tes yang student_id-nya tidak valid.
DELETE FROM public.academic_adaptive_tests t
WHERE NOT EXISTS (
    SELECT 1 FROM public.core_students s WHERE s.id = t.student_id
);

-- 3. Tambah FK constraint (idempotent).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'academic_adaptive_tests_student_id_core_students_id_fk'
    ) THEN
        ALTER TABLE public.academic_adaptive_tests
            ADD CONSTRAINT academic_adaptive_tests_student_id_core_students_id_fk
            FOREIGN KEY (student_id) REFERENCES public.core_students (id);
    END IF;
END $$;
