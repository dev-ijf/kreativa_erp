import sql from './lib/db';

async function debug() {
  const schoolId = 1;
  const cohortId = 3;
  const classId = 1;
  const ayId = 2;

  const rows = await sql`
    SELECT s.id, s.nis, s.full_name, COUNT(ch.id) as history_count
    FROM core_students s
    JOIN core_student_class_histories ch ON ch.student_id = s.id
    WHERE s.school_id = ${schoolId}
      AND s.cohort_id = ${cohortId}
      AND ch.class_id = ${classId}
      AND ch.academic_year_id = ${ayId}
      AND ch.status = 'active'
    GROUP BY s.id, s.nis, s.full_name
    HAVING COUNT(ch.id) > 1
  `;
  console.log('Duplicates:', rows);
}

debug().catch(console.error);
