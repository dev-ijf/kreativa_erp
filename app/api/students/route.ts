import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(sp.get('limit') || '20', 10)));
  const offset = (page - 1) * limit;

  const academicYearId = sp.get('academic_year_id');
  const classId = sp.get('class_id');
  const entryYearId = sp.get('entry_year_id');
  const studentType = sp.get('student_type');
  const program = sp.get('program');
  const schoolId = sp.get('school_id');
  const search = sp.get('q')?.trim();
  const enrollmentStatus = sp.get('enrollment_status') || null;

  const hasAy = academicYearId != null && academicYearId !== '';
  const hasClass = classId != null && classId !== '';

  const entryIdNum = entryYearId ? Number(entryYearId) : null;
  const stType = studentType || null;
  const prog = program || null;
  const schoolIdNum = schoolId ? Number(schoolId) : null;

  const searchPattern = search ? `%${search}%` : null;

  let rows: Record<string, unknown>[];
  let totalRow: { count: string | number }[];

  if (hasAy && hasClass) {
    const [r, t] = await Promise.all([
      sql`
      SELECT DISTINCT ON (s.id)
        s.*,
        sch.name AS school_name,
        ay_e.name AS entry_year_name,
        ay_a.name AS active_year_name,
        c.name AS class_name,
        ay_h.name AS rombel_academic_year_name,
        (SELECT COUNT(*)::int FROM core_student_documents d WHERE d.student_id = s.id) AS document_count
      FROM core_students s
      JOIN core_schools sch ON s.school_id = sch.id
      LEFT JOIN core_academic_years ay_e ON s.entry_academic_year_id = ay_e.id
      LEFT JOIN core_academic_years ay_a ON s.active_academic_year_id = ay_a.id
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
        AND (${enrollmentStatus}::text IS NULL OR s.enrollment_status = ${enrollmentStatus})
        AND (${searchPattern}::text IS NULL OR s.full_name ILIKE ${searchPattern}
          OR COALESCE(s.username, '') ILIKE ${searchPattern}
          OR s.nis ILIKE ${searchPattern}
          OR COALESCE(s.nisn, '') ILIKE ${searchPattern})
      ORDER BY s.id DESC
      LIMIT ${limit} OFFSET ${offset}
    `,
      sql`
      SELECT COUNT(DISTINCT s.id)::int AS count
      FROM core_students s
      JOIN core_student_class_histories ch ON ch.student_id = s.id
        AND ch.status = 'active'
        AND ch.academic_year_id = ${Number(academicYearId)}
        AND ch.class_id = ${Number(classId)}
      WHERE (${schoolIdNum}::int IS NULL OR s.school_id = ${schoolIdNum})
        AND (${entryIdNum}::int IS NULL OR s.entry_academic_year_id = ${entryIdNum})
        AND (${stType}::text IS NULL OR s.student_type = ${stType})
        AND (${prog}::text IS NULL OR s.program = ${prog})
        AND (${enrollmentStatus}::text IS NULL OR s.enrollment_status = ${enrollmentStatus})
        AND (${searchPattern}::text IS NULL OR s.full_name ILIKE ${searchPattern}
          OR COALESCE(s.username, '') ILIKE ${searchPattern}
          OR s.nis ILIKE ${searchPattern}
          OR COALESCE(s.nisn, '') ILIKE ${searchPattern})
    `,
    ]);
    rows = r as Record<string, unknown>[];
    totalRow = t as { count: string | number }[];
  } else if (hasAy) {
    const [r, t] = await Promise.all([
      sql`
      SELECT DISTINCT ON (s.id)
        s.*,
        sch.name AS school_name,
        ay_e.name AS entry_year_name,
        ay_a.name AS active_year_name,
        c.name AS class_name,
        ay_h.name AS rombel_academic_year_name,
        (SELECT COUNT(*)::int FROM core_student_documents d WHERE d.student_id = s.id) AS document_count
      FROM core_students s
      JOIN core_schools sch ON s.school_id = sch.id
      LEFT JOIN core_academic_years ay_e ON s.entry_academic_year_id = ay_e.id
      LEFT JOIN core_academic_years ay_a ON s.active_academic_year_id = ay_a.id
      JOIN core_student_class_histories ch ON ch.student_id = s.id
        AND ch.status = 'active'
        AND ch.academic_year_id = ${Number(academicYearId)}
      JOIN core_classes c ON ch.class_id = c.id
      JOIN core_academic_years ay_h ON ch.academic_year_id = ay_h.id
      WHERE (${schoolIdNum}::int IS NULL OR s.school_id = ${schoolIdNum})
        AND (${entryIdNum}::int IS NULL OR s.entry_academic_year_id = ${entryIdNum})
        AND (${stType}::text IS NULL OR s.student_type = ${stType})
        AND (${prog}::text IS NULL OR s.program = ${prog})
        AND (${enrollmentStatus}::text IS NULL OR s.enrollment_status = ${enrollmentStatus})
        AND (${searchPattern}::text IS NULL OR s.full_name ILIKE ${searchPattern}
          OR COALESCE(s.username, '') ILIKE ${searchPattern}
          OR s.nis ILIKE ${searchPattern}
          OR COALESCE(s.nisn, '') ILIKE ${searchPattern})
      ORDER BY s.id DESC
      LIMIT ${limit} OFFSET ${offset}
    `,
      sql`
      SELECT COUNT(DISTINCT s.id)::int AS count
      FROM core_students s
      JOIN core_student_class_histories ch ON ch.student_id = s.id
        AND ch.status = 'active'
        AND ch.academic_year_id = ${Number(academicYearId)}
      WHERE (${schoolIdNum}::int IS NULL OR s.school_id = ${schoolIdNum})
        AND (${entryIdNum}::int IS NULL OR s.entry_academic_year_id = ${entryIdNum})
        AND (${stType}::text IS NULL OR s.student_type = ${stType})
        AND (${prog}::text IS NULL OR s.program = ${prog})
        AND (${enrollmentStatus}::text IS NULL OR s.enrollment_status = ${enrollmentStatus})
        AND (${searchPattern}::text IS NULL OR s.full_name ILIKE ${searchPattern}
          OR COALESCE(s.username, '') ILIKE ${searchPattern}
          OR s.nis ILIKE ${searchPattern}
          OR COALESCE(s.nisn, '') ILIKE ${searchPattern})
    `,
    ]);
    rows = r as Record<string, unknown>[];
    totalRow = t as { count: string | number }[];
  } else {
    const [r, t] = await Promise.all([
      sql`
      SELECT
        s.*,
        sch.name AS school_name,
        ay_e.name AS entry_year_name,
        ay_a.name AS active_year_name,
        (SELECT c.name FROM core_student_class_histories ch2
          JOIN core_classes c ON ch2.class_id = c.id
          WHERE ch2.student_id = s.id AND ch2.status = 'active'
          ORDER BY ch2.academic_year_id DESC LIMIT 1) AS class_name,
        (SELECT ay.name FROM core_student_class_histories ch2
          JOIN core_academic_years ay ON ch2.academic_year_id = ay.id
          WHERE ch2.student_id = s.id AND ch2.status = 'active'
          ORDER BY ch2.academic_year_id DESC LIMIT 1) AS rombel_academic_year_name,
        (SELECT COUNT(*)::int FROM core_student_documents d WHERE d.student_id = s.id) AS document_count
      FROM core_students s
      JOIN core_schools sch ON s.school_id = sch.id
      LEFT JOIN core_academic_years ay_e ON s.entry_academic_year_id = ay_e.id
      LEFT JOIN core_academic_years ay_a ON s.active_academic_year_id = ay_a.id
      WHERE (${schoolIdNum}::int IS NULL OR s.school_id = ${schoolIdNum})
        AND (${entryIdNum}::int IS NULL OR s.entry_academic_year_id = ${entryIdNum})
        AND (${stType}::text IS NULL OR s.student_type = ${stType})
        AND (${prog}::text IS NULL OR s.program = ${prog})
        AND (${enrollmentStatus}::text IS NULL OR s.enrollment_status = ${enrollmentStatus})
        AND (${searchPattern}::text IS NULL OR s.full_name ILIKE ${searchPattern}
          OR COALESCE(s.username, '') ILIKE ${searchPattern}
          OR s.nis ILIKE ${searchPattern}
          OR COALESCE(s.nisn, '') ILIKE ${searchPattern})
      ORDER BY s.id DESC
      LIMIT ${limit} OFFSET ${offset}
    `,
      sql`
      SELECT COUNT(*)::int AS count
      FROM core_students s
      WHERE (${schoolIdNum}::int IS NULL OR s.school_id = ${schoolIdNum})
        AND (${entryIdNum}::int IS NULL OR s.entry_academic_year_id = ${entryIdNum})
        AND (${stType}::text IS NULL OR s.student_type = ${stType})
        AND (${prog}::text IS NULL OR s.program = ${prog})
        AND (${enrollmentStatus}::text IS NULL OR s.enrollment_status = ${enrollmentStatus})
        AND (${searchPattern}::text IS NULL OR s.full_name ILIKE ${searchPattern}
          OR COALESCE(s.username, '') ILIKE ${searchPattern}
          OR s.nis ILIKE ${searchPattern}
          OR COALESCE(s.nisn, '') ILIKE ${searchPattern})
    `,
    ]);
    rows = r as Record<string, unknown>[];
    totalRow = t as { count: string | number }[];
  }

  const total = Number(totalRow[0]?.count ?? 0);

  return NextResponse.json({
    data: rows,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  });
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const [row] = await sql`
    INSERT INTO core_students (
      school_id, cohort_id, full_name, nickname, username, nis, nisn, nik, gender, date_of_birth,
      phone, address, student_type, program, curriculum, photo_url,
      entry_academic_year_id, active_academic_year_id, enrollment_status
    ) VALUES (
      ${data.school_id},
      ${data.cohort_id},
      ${data.full_name},
      ${data.nickname || null},
      ${data.username || null},
      ${data.nis},
      ${data.nisn || null},
      ${data.nik || null},
      ${data.gender || null},
      ${data.date_of_birth || null},
      ${data.phone || null},
      ${data.address || null},
      ${data.student_type || null},
      ${data.program || null},
      ${data.curriculum || null},
      ${data.photo_url || null},
      ${data.entry_academic_year_id || null},
      ${data.active_academic_year_id || null},
      'active'
    ) RETURNING *
  `;
  const sid = (row as { id: number }).id;
  const classId = data.class_id != null && data.class_id !== '' ? Number(data.class_id) : null;
  const ayId =
    data.active_academic_year_id || data.entry_academic_year_id
      ? Number(data.active_academic_year_id || data.entry_academic_year_id)
      : null;
  if (sid && classId && ayId && Number.isFinite(classId) && Number.isFinite(ayId)) {
    const [clsRow] = await sql`
      SELECT level_grade_id, school_id FROM core_classes WHERE id = ${classId}
    `;
    const cls = clsRow as { level_grade_id: number; school_id: number } | undefined;
    if (cls && cls.school_id === Number(data.school_id)) {
      await sql`
        INSERT INTO core_student_class_histories (student_id, class_id, level_grade_id, academic_year_id, status)
        VALUES (${sid}, ${classId}, ${cls.level_grade_id}, ${ayId}, 'active')
      `;
    }
  }
  return NextResponse.json(row, { status: 201 });
}
