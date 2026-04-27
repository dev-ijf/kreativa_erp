-- Cek baris tuition_bills yang tidak punya master data (jalankan di TablePlus / psql sebelum migrasi 0014).
-- Siswa orphan
SELECT b.id, b.student_id, b.title
FROM public.tuition_bills b
LEFT JOIN public.core_students s ON s.id = b.student_id
WHERE s.id IS NULL;

-- Produk orphan
SELECT b.id, b.product_id, b.title
FROM public.tuition_bills b
LEFT JOIN public.tuition_products p ON p.id = b.product_id
WHERE p.id IS NULL;

-- Tahun ajaran orphan
SELECT b.id, b.academic_year_id, b.title
FROM public.tuition_bills b
LEFT JOIN public.core_academic_years y ON y.id = b.academic_year_id
WHERE y.id IS NULL;
