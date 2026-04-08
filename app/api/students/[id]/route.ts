import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sid = Number(id);
  const [student] = await sql`
    SELECT s.*, sch.name AS school_name,
      ay_e.name AS entry_year_name,
      ay_a.name AS active_year_name,
      p.name AS province_name,
      c.name AS city_name,
      d.name AS district_name,
      sd.name AS subdistrict_name
    FROM core_students s
    JOIN core_schools sch ON s.school_id = sch.id
    LEFT JOIN core_academic_years ay_e ON s.entry_academic_year_id = ay_e.id
    LEFT JOIN core_academic_years ay_a ON s.active_academic_year_id = ay_a.id
    LEFT JOIN core_provinces p ON s.province_id = p.id
    LEFT JOIN core_cities c ON s.city_id = c.id
    LEFT JOIN core_districts d ON s.district_id = d.id
    LEFT JOIN core_subdistricts sd ON s.subdistrict_id = sd.id
    WHERE s.id = ${sid}
  `;
  if (!student) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const [parents, documents, education, classHistories, portalLinks, currentEnroll] = await Promise.all([
    sql`
    SELECT * FROM core_student_parent_profiles WHERE student_id = ${sid} ORDER BY
      CASE relation_type WHEN 'father' THEN 1 WHEN 'mother' THEN 2 ELSE 3 END
  `,
    sql`
    SELECT * FROM core_student_documents WHERE student_id = ${sid} ORDER BY uploaded_at DESC
  `,
    sql`
    SELECT * FROM core_student_education_histories WHERE student_id = ${sid} ORDER BY year_from DESC NULLS LAST
  `,
    sql`
    SELECT ch.id, ch.student_id, ch.class_id, ch.level_grade_id, ch.academic_year_id, ch.status,
      c.name AS class_name, lg.name AS level_name, ay.name AS academic_year_name,
      COALESCE(lg.is_terminal, false) AS level_is_terminal
    FROM core_student_class_histories ch
    JOIN core_classes c ON c.id = ch.class_id
    JOIN core_level_grades lg ON lg.id = ch.level_grade_id
    JOIN core_academic_years ay ON ay.id = ch.academic_year_id
    WHERE ch.student_id = ${sid}
    ORDER BY ch.academic_year_id DESC, ch.id DESC
  `,
    sql`
    SELECT psr.relation_type, u.id AS portal_user_id, u.email AS portal_email, u.full_name AS portal_full_name
    FROM core_parent_student_relations psr
    JOIN core_users u ON u.id = psr.user_id
    WHERE psr.student_id = ${sid}
  `,
    sql`
    SELECT ch.class_id AS current_class_id, ch.academic_year_id AS current_enrollment_year_id
    FROM core_student_class_histories ch
    WHERE ch.student_id = ${sid} AND ch.status = 'active'
    ORDER BY ch.academic_year_id DESC
    LIMIT 1
  `,
  ]);

  const cur = currentEnroll[0] as { current_class_id?: number; current_enrollment_year_id?: number } | undefined;

  return NextResponse.json({
    ...student,
    parent_profiles: parents,
    documents,
    education_histories: education,
    class_histories: classHistories,
    parent_portal_links: portalLinks,
    current_class_id: cur?.current_class_id ?? null,
    current_enrollment_year_id: cur?.current_enrollment_year_id ?? null,
  });
}

/** Partial update (mis. photo_url setelah upload Blob) */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sid = Number(id);
  const data = (await req.json()) as { photo_url?: string | null };

  if (data.photo_url !== undefined) {
    const [row] = await sql`
      UPDATE core_students
      SET photo_url = ${data.photo_url}, updated_at = NOW()
      WHERE id = ${sid}
      RETURNING id, photo_url, updated_at
    `;
    if (!row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(row);
  }

  return NextResponse.json({ error: 'Tidak ada field yang didukung' }, { status: 400 });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sid = Number(id);
  const data = await req.json();

  const [prev] = await sql`
    SELECT graduated_at, address_latitude, address_longitude FROM core_students WHERE id = ${sid}
  `;
  if (!prev) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const mergedGraduatedAt =
    Object.prototype.hasOwnProperty.call(data, 'graduated_at') ? data.graduated_at ?? null : prev.graduated_at;
  const mergedLat =
    Object.prototype.hasOwnProperty.call(data, 'address_latitude') ? data.address_latitude ?? null : prev.address_latitude;
  const mergedLng =
    Object.prototype.hasOwnProperty.call(data, 'address_longitude')
      ? data.address_longitude ?? null
      : prev.address_longitude;

  const numOrSqlNull = (v: unknown) => {
    if (v === '' || v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const [row] = await sql`
    UPDATE core_students SET
      school_id = ${data.school_id},
      cohort_id = ${data.cohort_id},
      full_name = ${data.full_name},
      nickname = ${data.nickname ?? null},
      username = ${data.username ?? null},
      nis = ${data.nis},
      nisn = ${data.nisn ?? null},
      nik = ${data.nik ?? null},
      nationality = ${data.nationality ?? null},
      photo_url = ${data.photo_url ?? null},
      student_type = ${data.student_type ?? null},
      program = ${data.program ?? null},
      curriculum = ${data.curriculum ?? null},
      previous_school = ${data.previous_school ?? null},
      gender = ${data.gender ?? null},
      place_of_birth = ${data.place_of_birth ?? null},
      date_of_birth = ${data.date_of_birth ?? null},
      religion = ${data.religion ?? null},
      child_order = ${data.child_order ?? null},
      siblings_count = ${data.siblings_count ?? null},
      child_status = ${data.child_status ?? null},
      address = ${data.address ?? null},
      rt = ${data.rt ?? null},
      rw = ${data.rw ?? null},
      hamlet = ${data.hamlet ?? null},
      village_label = ${data.village_label ?? null},
      district_label = ${data.district_label ?? null},
      city_label = ${data.city_label ?? null},
      province_id = ${data.province_id ?? null},
      city_id = ${data.city_id ?? null},
      district_id = ${data.district_id ?? null},
      subdistrict_id = ${data.subdistrict_id ?? null},
      postal_code = ${data.postal_code ?? null},
      phone = ${data.phone ?? null},
      email = ${data.email ?? null},
      living_with = ${data.living_with ?? null},
      daily_language = ${data.daily_language ?? null},
      hobbies = ${data.hobbies ?? null},
      aspiration = ${data.aspiration ?? null},
      transport_mode = ${data.transport_mode ?? null},
      distance_to_school = ${data.distance_to_school ?? null},
      travel_time = ${data.travel_time ?? null},
      registration_type = ${data.registration_type ?? null},
      enrollment_date = ${data.enrollment_date ?? null},
      diploma_serial = ${data.diploma_serial ?? null},
      skhun_serial = ${data.skhun_serial ?? null},
      is_alumni = ${data.is_alumni ?? false},
      boarding_status = ${data.boarding_status ?? null},
      entry_academic_year_id = ${data.entry_academic_year_id ?? null},
      active_academic_year_id = ${data.active_academic_year_id ?? null},
      blood_type = ${data.blood_type ?? null},
      weight_kg = ${data.weight_kg ?? null},
      height_cm = ${data.height_cm ?? null},
      head_circumference_cm = ${data.head_circumference_cm ?? null},
      allergies = ${data.allergies ?? null},
      vision_condition = ${data.vision_condition ?? null},
      hearing_condition = ${data.hearing_condition ?? null},
      special_needs = ${data.special_needs ?? null},
      chronic_diseases = ${data.chronic_diseases ?? null},
      physical_abnormalities = ${data.physical_abnormalities ?? null},
      recurring_diseases = ${data.recurring_diseases ?? null},
      graduated_at = ${mergedGraduatedAt},
      address_latitude = ${numOrSqlNull(mergedLat)},
      address_longitude = ${numOrSqlNull(mergedLng)},
      updated_at = NOW()
    WHERE id = ${sid}
    RETURNING *
  `;

  const ayForClass =
    data.active_academic_year_id != null && data.active_academic_year_id !== ''
      ? Number(data.active_academic_year_id)
      : null;
  const rawClass = data.current_class_id;
  const classId =
    rawClass !== undefined && rawClass !== null && rawClass !== ''
      ? Number(rawClass)
      : null;
  if (classId != null && Number.isFinite(classId) && ayForClass != null) {
    const [clsRow] = await sql`
      SELECT level_grade_id, school_id FROM core_classes WHERE id = ${classId}
    `;
    const cls = clsRow as { level_grade_id: number; school_id: number } | undefined;
    const [stuRow] = await sql`
      SELECT school_id FROM core_students WHERE id = ${sid}
    `;
    const stuSchool = stuRow as { school_id: number } | undefined;
    if (cls && stuSchool && cls.school_id === stuSchool.school_id) {
      await sql`
        UPDATE core_student_class_histories
        SET status = 'completed'
        WHERE student_id = ${sid} AND academic_year_id = ${ayForClass} AND status = 'active'
      `;
      await sql`
        INSERT INTO core_student_class_histories (student_id, class_id, level_grade_id, academic_year_id, status)
        VALUES (${sid}, ${classId}, ${cls.level_grade_id}, ${ayForClass}, 'active')
      `;
    }
  }

  if (data.parent_profiles && Array.isArray(data.parent_profiles)) {
    for (const p of data.parent_profiles) {
      if (!p.relation_type || !p.full_name) continue;
      await sql`
        INSERT INTO core_student_parent_profiles (
          student_id, relation_type, full_name, nik, birth_year, education,
          occupation, income_bracket, special_needs_note, phone
        ) VALUES (
          ${sid},
          ${p.relation_type},
          ${p.full_name},
          ${p.nik ?? null},
          ${numOrSqlNull(p.birth_year)},
          ${p.education ?? null},
          ${p.occupation ?? null},
          ${p.income_bracket ?? null},
          ${p.special_needs_note ?? null},
          ${p.phone ?? null}
        )
        ON CONFLICT (student_id, relation_type) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          nik = EXCLUDED.nik,
          birth_year = EXCLUDED.birth_year,
          education = EXCLUDED.education,
          occupation = EXCLUDED.occupation,
          income_bracket = EXCLUDED.income_bracket,
          special_needs_note = EXCLUDED.special_needs_note,
          phone = EXCLUDED.phone,
          updated_at = NOW()
      `;
    }
  }

  if (data.education_histories && Array.isArray(data.education_histories)) {
    await sql`DELETE FROM core_student_education_histories WHERE student_id = ${sid}`;
    for (const e of data.education_histories) {
      if (!e.school_name) continue;
      await sql`
        INSERT INTO core_student_education_histories (
          student_id, school_name, level_label, year_from, year_to, notes
        ) VALUES (
          ${sid},
          ${e.school_name},
          ${e.level_label ?? null},
          ${numOrSqlNull(e.year_from)},
          ${numOrSqlNull(e.year_to)},
          ${e.notes ?? null}
        )
      `;
    }
  }

  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await sql`DELETE FROM core_students WHERE id=${Number(id)}`;
  return NextResponse.json({ success: true });
}
