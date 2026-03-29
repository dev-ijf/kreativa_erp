import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const uid = Number(id);
  const [userRow] = await sql`
    SELECT id, role, school_id FROM core_users WHERE id = ${uid}
  `;
  const user = userRow as { id: number; role: string; school_id: number | null } | undefined;
  if (!user) {
    return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
  }
  if (user.role !== 'teacher') {
    return NextResponse.json({ academic_year_id: null, class_ids: [] as number[] });
  }
  const [ayRow] = await sql`
    SELECT id, name FROM core_academic_years WHERE is_active = true LIMIT 1
  `;
  const ay = ayRow as { id: number; name: string } | undefined;
  if (!ay) {
    return NextResponse.json({ academic_year_id: null, academic_year_name: null, class_ids: [] });
  }
  const rows = await sql`
    SELECT class_id FROM core_teacher_class_assignments
    WHERE user_id = ${uid} AND academic_year_id = ${ay.id}
  `;
  return NextResponse.json({
    academic_year_id: ay.id,
    academic_year_name: ay.name,
    class_ids: (rows as { class_id: number }[]).map((r) => r.class_id),
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const uid = Number(id);
  const body = await req.json();
  const classIds: number[] = Array.isArray(body.class_ids)
    ? body.class_ids.map((x: unknown) => Number(x)).filter((n: number) => Number.isFinite(n))
    : [];

  const [userRowPut] = await sql`
    SELECT id, role, school_id FROM core_users WHERE id = ${uid}
  `;
  const user = userRowPut as { id: number; role: string; school_id: number | null } | undefined;
  if (!user) {
    return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
  }
  if (user.role !== 'teacher') {
    return NextResponse.json({ error: 'Hanya peran Guru yang memiliki penugasan kelas' }, { status: 400 });
  }
  if (user.school_id == null) {
    return NextResponse.json({ error: 'Guru harus terikat sekolah untuk penugasan kelas' }, { status: 400 });
  }
  const schoolId = user.school_id;

  const [ayRow] = await sql`
    SELECT id FROM core_academic_years WHERE is_active = true LIMIT 1
  `;
  const ay = ayRow as { id: number } | undefined;
  if (!ay) {
    return NextResponse.json({ error: 'Belum ada tahun ajaran aktif' }, { status: 400 });
  }
  const ayId = ay.id;

  for (const cid of classIds) {
    const [cRow] = await sql`
      SELECT school_id FROM core_classes WHERE id = ${cid}
    `;
    const c = cRow as { school_id: number } | undefined;
    if (!c || c.school_id !== schoolId) {
      return NextResponse.json({ error: `Kelas ${cid} tidak valid untuk sekolah guru` }, { status: 400 });
    }
  }

  await sql`DELETE FROM core_teacher_class_assignments WHERE user_id = ${uid} AND academic_year_id = ${ayId}`;
  for (const cid of classIds) {
    await sql`
      INSERT INTO core_teacher_class_assignments (user_id, class_id, academic_year_id, assignment_role)
      VALUES (${uid}, ${cid}, ${ayId}, 'homeroom')
    `;
  }

  return NextResponse.json({ success: true, academic_year_id: ayId, class_ids: classIds });
}
