import sql from '@/lib/db';

export type TariffResolve =
  | { ok: true; amount: string; minPayment: string; schoolId: number; cohortId: number }
  | { ok: false; error: string };

/**
 * Ambil nominal dari matriks tarif untuk siswa + produk + tahun ajaran.
 */
export async function resolveTariffAmount(
  studentId: number,
  productId: number,
  academicYearId: number
): Promise<TariffResolve> {
  const [row] = await sql`
    SELECT t.amount, t.min_payment, s.school_id, s.cohort_id
    FROM core_students s
    JOIN tuition_product_tariffs t ON t.school_id = s.school_id
      AND t.cohort_id = s.cohort_id
      AND t.product_id = ${productId}
      AND t.academic_year_id = ${academicYearId}
    WHERE s.id = ${studentId}
  `;
  if (!row) {
    return {
      ok: false,
      error:
        'Tarif tidak ditemukan di Matriks Tarif untuk angkatan siswa ini. Atur di Matriks Tarif terlebih dahulu.',
    };
  }
  return {
    ok: true,
    amount: String(row.amount),
    minPayment: String(row.min_payment ?? 0),
    schoolId: row.school_id as number,
    cohortId: row.cohort_id as number,
  };
}
