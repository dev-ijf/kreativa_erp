-- Optional school scope for payment methods (e.g. per-school cash / COA).
ALTER TABLE tuition_payment_methods
  ADD COLUMN IF NOT EXISTS school_id integer NULL REFERENCES core_schools (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tuition_payment_methods_school_id
  ON tuition_payment_methods (school_id);

ALTER TABLE tuition_payment_methods
  DROP CONSTRAINT IF EXISTS tuition_payment_methods_code_unique;

-- Global rows (school_id IS NULL): code unique among globals (case-insensitive).
CREATE UNIQUE INDEX IF NOT EXISTS tuition_payment_methods_code_global_lower_uq
  ON tuition_payment_methods (lower(trim(both from code::text)))
  WHERE school_id IS NULL;

-- Per-school rows: (school_id, code) unique (case-insensitive code).
CREATE UNIQUE INDEX IF NOT EXISTS tuition_payment_methods_school_code_lower_uq
  ON tuition_payment_methods (school_id, lower(trim(both from code::text)))
  WHERE school_id IS NOT NULL;
