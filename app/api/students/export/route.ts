import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const schoolId = sp.get('school_id');
  const academicYearId = sp.get('academic_year_id');
  const classId = sp.get('class_id');
  const entryYearId = sp.get('entry_year_id');
  const studentType = sp.get('student_type');
  const program = sp.get('program');
  const search = sp.get('q')?.trim();

  const schoolIdNum = schoolId ? Number(schoolId) : null;
  const entryIdNum = entryYearId ? Number(entryYearId) : null;
  const stType = studentType || null;
  const prog = program || null;
  const searchPattern = search ? `%${search}%` : null;
  const hasAy = academicYearId != null && academicYearId !== '';
  const hasClass = classId != null && classId !== '';

  let rows: Record<string, unknown>[];

  if (hasAy && hasClass) {
    rows = await sql`
      SELECT DISTINCT ON (s.id)
        s.id, s.school_id, s.full_name, s.nis, s.nisn, s.gender, s.student_type, s.program,
        s.phone, s.email, s.is_alumni, s.username,
        sch.name AS school_name,
        c.name AS class_name,
        ay_h.name AS rombel_academic_year_name
      FROM core_students s
      JOIN core_schools sch ON s.school_id = sch.id
      JOIN core_student_class_histories ch ON ch.student_id = s.id
        AND ch.status = 'active'
        AND ch.academic_year_id = ${Number(academicYearId)}
        AND ch.class_id = ${Number(classId)}
      JOIN core_classes c ON ch.class_id = c.id
      JOIN core_academic_years ay_h ON ch.academic_year_id = ay_h.id
      WHERE (${schoolIdNum}::int IS NULL OR s.school_id = ${schoolIdNum})
        AND (${entryIdNum}::int IS NULL OR s.entry_academic_year_id = ${entryIdNum})
        AND (${stType}::text IS NULL OR s.student_type = ${stType})
        AND (${prog}::text IS NULL OR s.program = ${prog})
        AND (${searchPattern}::text IS NULL OR s.full_name ILIKE ${searchPattern}
          OR COALESCE(s.username, '') ILIKE ${searchPattern}
          OR s.nis ILIKE ${searchPattern}
          OR COALESCE(s.nisn, '') ILIKE ${searchPattern})
      ORDER BY s.id DESC
      LIMIT 10000
    `;
  } else if (hasAy) {
    rows = await sql`
      SELECT DISTINCT ON (s.id)
        s.id, s.school_id, s.full_name, s.nis, s.nisn, s.gender, s.student_type, s.program,
        s.phone, s.email, s.is_alumni, s.username,
        sch.name AS school_name,
        c.name AS class_name,
        ay_h.name AS rombel_academic_year_name
      FROM core_students s
      JOIN core_schools sch ON s.school_id = sch.id
      JOIN core_student_class_histories ch ON ch.student_id = s.id
        AND ch.status = 'active'
        AND ch.academic_year_id = ${Number(academicYearId)}
      JOIN core_classes c ON ch.class_id = c.id
      JOIN core_academic_years ay_h ON ch.academic_year_id = ay_h.id
      WHERE (${schoolIdNum}::int IS NULL OR s.school_id = ${schoolIdNum})
        AND (${entryIdNum}::int IS NULL OR s.entry_academic_year_id = ${entryIdNum})
        AND (${stType}::text IS NULL OR s.student_type = ${stType})
        AND (${prog}::text IS NULL OR s.program = ${prog})
        AND (${searchPattern}::text IS NULL OR s.full_name ILIKE ${searchPattern}
          OR COALESCE(s.username, '') ILIKE ${searchPattern}
          OR s.nis ILIKE ${searchPattern}
          OR COALESCE(s.nisn, '') ILIKE ${searchPattern})
      ORDER BY s.id DESC
      LIMIT 10000
    `;
  } else {
    rows = await sql`
      SELECT
        s.id, s.school_id, s.full_name, s.nis, s.nisn, s.gender, s.student_type, s.program,
        s.phone, s.email, s.is_alumni, s.username,
        sch.name AS school_name,
        (SELECT c.name FROM core_student_class_histories ch2
          JOIN core_classes c ON ch2.class_id = c.id
          WHERE ch2.student_id = s.id AND ch2.status = 'active'
          ORDER BY ch2.academic_year_id DESC LIMIT 1) AS class_name,
        (SELECT ay.name FROM core_student_class_histories ch2
          JOIN core_academic_years ay ON ch2.academic_year_id = ay.id
          WHERE ch2.student_id = s.id AND ch2.status = 'active'
          ORDER BY ch2.academic_year_id DESC LIMIT 1) AS rombel_academic_year_name
      FROM core_students s
      JOIN core_schools sch ON s.school_id = sch.id
      WHERE (${schoolIdNum}::int IS NULL OR s.school_id = ${schoolIdNum})
        AND (${entryIdNum}::int IS NULL OR s.entry_academic_year_id = ${entryIdNum})
        AND (${stType}::text IS NULL OR s.student_type = ${stType})
        AND (${prog}::text IS NULL OR s.program = ${prog})
        AND (${searchPattern}::text IS NULL OR s.full_name ILIKE ${searchPattern}
          OR COALESCE(s.username, '') ILIKE ${searchPattern}
          OR s.nis ILIKE ${searchPattern}
          OR COALESCE(s.nisn, '') ILIKE ${searchPattern})
      ORDER BY s.id DESC
      LIMIT 10000
    `;
  }

  const exportRows = rows.map((r) => ({
    id: r.id,
    school_id: r.school_id,
    school_name: r.school_name,
    full_name: r.full_name,
    nis: r.nis,
    nisn: r.nisn,
    gender: r.gender,
    student_type: r.student_type,
    program: r.program,
    username: r.username,
    phone: r.phone,
    email: r.email,
    is_alumni: r.is_alumni,
    class_name: r.class_name,
    rombel_year: r.rombel_academic_year_name,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportRows);
  XLSX.utils.book_append_sheet(wb, ws, 'Siswa');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  const filename = `siswa_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
