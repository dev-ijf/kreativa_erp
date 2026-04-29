-- 0024: bank soal adaptif (repositori soal, tidak terikat satu tes)

CREATE SEQUENCE IF NOT EXISTS academic_adaptive_questions_bank_id_seq;

CREATE TABLE public.academic_adaptive_questions_bank (
    id bigint NOT NULL DEFAULT nextval('academic_adaptive_questions_bank_id_seq'::regclass),
    subject_id bigint NOT NULL,
    grade_band varchar NOT NULL,
    difficulty numeric NOT NULL,
    question_text text NOT NULL,
    options_json jsonb NOT NULL,
    correct_answer varchar NOT NULL,
    explanation text,
    lang varchar,
    generated_by varchar,
    level_grade_id integer,
    CONSTRAINT academic_adaptive_questions_bank_pkey PRIMARY KEY (id),
    CONSTRAINT academic_adaptive_questions_bank_level_grade_id_fkey
        FOREIGN KEY (level_grade_id) REFERENCES public.core_level_grades (id) ON DELETE SET NULL,
    CONSTRAINT academic_adaptive_questions_bank_subject_id_fkey
        FOREIGN KEY (subject_id) REFERENCES public.academic_subjects (id) ON DELETE CASCADE
);

ALTER SEQUENCE academic_adaptive_questions_bank_id_seq OWNED BY public.academic_adaptive_questions_bank.id;

CREATE INDEX idx_acad_adqb_subj_grade_diff
    ON public.academic_adaptive_questions_bank (subject_id, grade_band, difficulty);
