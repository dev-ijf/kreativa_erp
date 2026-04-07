/**
 * Hanya utilitas query string — aman untuk komponen `'use client'`.
 * Jangan impor `@/lib/db` dari file yang dipakai klien.
 */
export function buildStudentSummaryParams(o: {
  schoolId?: string;
  classId?: string;
  studentId?: string;
  q?: string;
  academicYearId?: number | null;
}): string {
  const p = new URLSearchParams();
  if (o.schoolId) p.set('school_id', o.schoolId);
  if (o.classId) p.set('class_id', o.classId);
  if (o.studentId) p.set('student_id', o.studentId);
  if (o.q?.trim()) p.set('q', o.q.trim());
  if (o.academicYearId != null) p.set('academic_year_id', String(o.academicYearId));
  return p.toString();
}
