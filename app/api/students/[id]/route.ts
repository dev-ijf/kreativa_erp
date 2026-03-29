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

  const [parents, documents, education] = await Promise.all([
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
  ]);

  return NextResponse.json({
    ...student,
    parent_profiles: parents,
    documents,
    education_histories: education,
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

  const [row] = await sql`
    UPDATE core_students SET
      school_id = ${data.school_id},
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
      updated_at = NOW()
    WHERE id = ${sid}
    RETURNING *
  `;

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
          ${p.birth_year ?? null},
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
          ${e.year_from ?? null},
          ${e.year_to ?? null},
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
