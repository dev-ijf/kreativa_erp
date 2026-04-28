-- =============================================================================
-- 0020: tuition_transactions.id & tuition_transaction_details.id → bigserial
--
-- Sebelumnya: bigint GENERATED ALWAYS AS IDENTITY (sequence *nama* …_id_seq).
-- Sesudah:    bigint + DEFAULT nextval(seq) + OWNED BY (setara bigserial).
--
-- Di PostgreSQL 17 (manual resmi) grammar-nya hanya:
--   ALTER COLUMN … DROP IDENTITY [ IF EXISTS ]
-- tanpa KEEP/DROP — kata `KEEP` memicu syntax error di 17.8.
-- Setelah DROP IDENTITY, sequence identitas ikut hilang →
-- `CREATE SEQUENCE IF NOT EXISTS` membuat ulang nama yang sama, lalu setval selaras MAX(id).
--
-- Idempotent: aman jika sudah bigserial / migrasi diulang.
-- =============================================================================

-- ----- tuition_transactions -----
ALTER TABLE public.tuition_transactions
  ALTER COLUMN id DROP IDENTITY IF EXISTS;

CREATE SEQUENCE IF NOT EXISTS public.tuition_transactions_id_seq
  AS bigint
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 9223372036854775807
  START WITH 1
  CACHE 1;

ALTER TABLE public.tuition_transactions
  ALTER COLUMN id SET DEFAULT nextval('public.tuition_transactions_id_seq'::regclass);

ALTER SEQUENCE public.tuition_transactions_id_seq OWNED BY public.tuition_transactions.id;

SELECT setval(
  'public.tuition_transactions_id_seq',
  COALESCE((SELECT MAX(id) FROM public.tuition_transactions), 1)::bigint,
  EXISTS (SELECT 1 FROM public.tuition_transactions)
);

-- ----- tuition_transaction_details -----
ALTER TABLE public.tuition_transaction_details
  ALTER COLUMN id DROP IDENTITY IF EXISTS;

CREATE SEQUENCE IF NOT EXISTS public.tuition_transaction_details_id_seq
  AS bigint
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 9223372036854775807
  START WITH 1
  CACHE 1;

ALTER TABLE public.tuition_transaction_details
  ALTER COLUMN id SET DEFAULT nextval('public.tuition_transaction_details_id_seq'::regclass);

ALTER SEQUENCE public.tuition_transaction_details_id_seq OWNED BY public.tuition_transaction_details.id;

SELECT setval(
  'public.tuition_transaction_details_id_seq',
  COALESCE((SELECT MAX(id) FROM public.tuition_transaction_details), 1)::bigint,
  EXISTS (SELECT 1 FROM public.tuition_transaction_details)
);
