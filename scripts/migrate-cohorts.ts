import pg from 'pg';
import { config } from 'dotenv';
import path from 'node:path';
import { pgConnectionString } from './pg-url';

config({ path: path.join(process.cwd(), '.env.local') });

async function main() {
  const rawUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!rawUrl) {
    console.error('Set DATABASE_URL_UNPOOLED atau DATABASE_URL di .env.local');
    process.exit(1);
  }
  const url = pgConnectionString(rawUrl);

  console.log('Menjalankan migrasi manual Angkatan (Cohorts)...');
  const client = new pg.Client({ connectionString: url });
  await client.connect();

  try {
    await client.query("BEGIN;");

    // 1. Buat tabel master core_cohorts
    await client.query(`
      CREATE TABLE IF NOT EXISTS core_cohorts (
        id SERIAL PRIMARY KEY,
        school_id INTEGER NOT NULL REFERENCES core_schools(id),
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✔️ Created core_cohorts table');

    // 2. Buat data "Angkatan Migrasi" default untuk setiap sekolah
    await client.query(`
      INSERT INTO core_cohorts (school_id, name)
      SELECT id, 'Angkatan Migrasi' FROM core_schools
      ON CONFLICT DO NOTHING;
    `);
    console.log('✔️ Inserted default cohorts');

    // 3. Tambahkan kolom cohort_id ke core_students (boleh null sementara)
    await client.query(`ALTER TABLE core_students ADD COLUMN IF NOT EXISTS cohort_id INTEGER;`);
    console.log('✔️ Added cohort_id to core_students');

    // 4. Update cohort_id siswa yang sudah ada ke ID "Angkatan Migrasi" sekolahnya masing-masing
    await client.query(`
      UPDATE core_students s
      SET cohort_id = c.id
      FROM core_cohorts c
      WHERE s.school_id = c.school_id AND c.name = 'Angkatan Migrasi' AND s.cohort_id IS NULL;
    `);
    console.log('✔️ Backfilled cohort_id for existing students');

    // 5. Set Not Null constraint dan Foreign Key ke core_students
    // If it's already there, this will just succeed or fail, we should alter safely
    await client.query(`ALTER TABLE core_students ALTER COLUMN cohort_id SET NOT NULL;`);
    try {
      await client.query(`
        ALTER TABLE core_students ADD CONSTRAINT core_students_cohort_id_fkey FOREIGN KEY (cohort_id) REFERENCES core_cohorts(id);
      `);
    } catch(e) {
      // Ignored if constraint already exists
    }
    console.log('✔️ Enforced NOT NULL and FK on core_students');

    // 6. Modifikasi tabel tuition_product_tariffs
    try {
       await client.query(`ALTER TABLE tuition_product_tariffs RENAME COLUMN level_grade_id TO cohort_id;`);
    } catch(e) {
      console.log('   (Skipping RENAME TO cohort_id because it may already exist or error: format is likely fine)');
    }

    // 7. Perbaiki Unique Constraint pada tabel tuition_product_tariffs
    await client.query(`ALTER TABLE tuition_product_tariffs DROP CONSTRAINT IF EXISTS unique_tariff_matrix;`);
    await client.query(`
      ALTER TABLE tuition_product_tariffs ADD CONSTRAINT unique_tariff_matrix UNIQUE (school_id, product_id, academic_year_id, cohort_id);
    `);
    console.log('✔️ Updated tuition_product_tariffs columns and constraints');

    await client.query("COMMIT;");
    console.log('\\n✅ Migrasi Cohort selesai');

  } catch(e) {
    await client.query("ROLLBACK;");
    console.error('Migrasi gagal, rollback.', e);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
