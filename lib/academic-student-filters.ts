import type { NextRequest } from 'next/server';
import sql from '@/lib/db';

export type AcademicListFilters = {
  qPattern: string | null;
  schoolId: number | null;
  studentId: number | null;
  classId: number | null;
  academicYearId: number | null;
};

/** Parse query umum untuk list akademik & student-summary. */
export function parseAcademicListFilters(req: NextRequest): Omit<AcademicListFilters, 'academicYearId'> & {
  academicYearIdParam: number | null;
} {
  const sp = new URL(req.url).searchParams;
  const q = sp.get('q')?.trim();
  const qPattern = q ? `%${q}%` : null;
  const schoolRaw = sp.get('school_id');
  const studentRaw = sp.get('student_id');
  const classRaw = sp.get('class_id');
  const ayRaw = sp.get('academic_year_id');
  return {
    qPattern,
    schoolId: schoolRaw && schoolRaw !== '' && !Number.isNaN(Number(schoolRaw)) ? Number(schoolRaw) : null,
    studentId: studentRaw && studentRaw !== '' && !Number.isNaN(Number(studentRaw)) ? Number(studentRaw) : null,
    classId: classRaw && classRaw !== '' && !Number.isNaN(Number(classRaw)) ? Number(classRaw) : null,
    academicYearIdParam: ayRaw && ayRaw !== '' && !Number.isNaN(Number(ayRaw)) ? Number(ayRaw) : null,
  };
}

export async function resolveAcademicYearId(preferred: number | null): Promise<number | null> {
  if (preferred != null) return preferred;
  const [ay] = await sql`SELECT id FROM core_academic_years WHERE is_active = true LIMIT 1`;
  return ay && typeof (ay as { id: number }).id === 'number' ? (ay as { id: number }).id : null;
}
