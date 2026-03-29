-- ==============================================================================
-- 1. CORE: PORTAL THEMES (Tema Tampilan Berdasarkan Host Domain)
-- Dibuat pertama agar bisa direferensikan oleh tabel sekolah
-- ==============================================================================
CREATE TABLE core_portal_themes (
    id BIGSERIAL PRIMARY KEY,
    host_domain VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'parents.kreativaglobal.sch.id'
    portal_title VARCHAR(100) NOT NULL,
    logo_url TEXT,
    primary_color VARCHAR(20),
    login_bg_url TEXT,
    welcome_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Di-update oleh backend/ORM
);

-- ==============================================================================
-- 2. CORE: SCHOOLS (Multi-Sekolah dalam 1 Yayasan)
-- ==============================================================================
CREATE TABLE core_schools (
    id BIGSERIAL PRIMARY KEY,
    theme_id BIGINT NULL, -- Relasi ke domain/tema mana sekolah ini bernaung
    name VARCHAR(100) NOT NULL, -- e.g., 'SD Kreativa Global', 'SMP Talenta Juara'
    address TEXT,
    school_logo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (theme_id) REFERENCES core_portal_themes(id)
);

-- ==============================================================================
-- 3. CORE: ACADEMIC YEARS (Tahun Ajaran)
-- ==============================================================================
CREATE TABLE core_academic_years (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT FALSE
);

-- ==============================================================================
-- 4. CORE: SETTINGS (Pengaturan Internal Aplikasi)
-- ==============================================================================
CREATE TABLE core_settings (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NULL,
    setting_key VARCHAR(100) NOT NULL, 
    setting_value TEXT, 
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_setting_per_school UNIQUE (school_id, setting_key),
    FOREIGN KEY (school_id) REFERENCES core_schools(id)
);

-- ==============================================================================
-- 5. CORE: USERS (Akun Login: Superadmin, Finance, Ortu, Guru, Siswa)
-- ==============================================================================
CREATE TABLE core_users (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL, -- Dahulu ENUM ('superadmin', 'school_finance', 'parent', 'teacher', 'student')
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES core_schools(id)
);

-- ==============================================================================
-- 6. CORE: REGIONAL DATA (Data Wilayah Relasional)
-- ==============================================================================
CREATE TABLE core_provinces (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE core_cities (
    id BIGSERIAL PRIMARY KEY,
    province_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    FOREIGN KEY (province_id) REFERENCES core_provinces(id)
);

CREATE TABLE core_districts (
    id BIGSERIAL PRIMARY KEY,
    city_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    FOREIGN KEY (city_id) REFERENCES core_cities(id)
);

CREATE TABLE core_subdistricts (
    id BIGSERIAL PRIMARY KEY,
    district_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10),
    FOREIGN KEY (district_id) REFERENCES core_districts(id)
);

-- ==============================================================================
-- 7. CORE: STUDENTS (Profil Kelengkapan Siswa)
-- ==============================================================================
CREATE TABLE core_students (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    user_id BIGINT NULL UNIQUE, -- Link ke akun login siswa jika role siswa diaktifkan
    full_name VARCHAR(100) NOT NULL,
    nis VARCHAR(20) UNIQUE NOT NULL,
    nisn VARCHAR(20) UNIQUE,
    previous_school VARCHAR(100),
    gender VARCHAR(10), -- Dahulu ENUM ('L', 'P')
    place_of_birth VARCHAR(50),
    date_of_birth DATE,
    religion VARCHAR(30),
    child_order INT,
    siblings_count INT,
    child_status VARCHAR(50), -- Dahulu ENUM ('Kandung', 'Tiri', 'Angkat')
    address TEXT,
    province_id BIGINT,
    city_id BIGINT,
    district_id BIGINT, 
    subdistrict_id BIGINT, 
    postal_code VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(100),
    living_with VARCHAR(50),
    
    -- Riwayat Kesehatan
    blood_type VARCHAR(10), -- Dahulu ENUM ('A', 'B', 'AB', 'O')
    weight_kg DECIMAL(5,2),
    height_cm INT,
    allergies TEXT,
    vision_condition VARCHAR(100),
    hearing_condition VARCHAR(100),
    special_needs VARCHAR(100),
    chronic_diseases TEXT,
    physical_abnormalities TEXT,
    recurring_diseases TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES core_schools(id),
    FOREIGN KEY (user_id) REFERENCES core_users(id),
    FOREIGN KEY (province_id) REFERENCES core_provinces(id),
    FOREIGN KEY (city_id) REFERENCES core_cities(id),
    FOREIGN KEY (district_id) REFERENCES core_districts(id),
    FOREIGN KEY (subdistrict_id) REFERENCES core_subdistricts(id)
);

-- ==============================================================================
-- 8. CORE: STUDENT DOCUMENTS (Dokumen Kelengkapan Siswa)
-- ==============================================================================
CREATE TABLE core_student_documents (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES core_students(id)
);

-- ==============================================================================
-- 9. CORE: PARENT_STUDENT_RELATIONS (Many-to-Many Ayah/Ibu <-> Anak)
-- ==============================================================================
CREATE TABLE core_parent_student_relations (
    user_id BIGINT NOT NULL, 
    student_id BIGINT NOT NULL,
    relation_type VARCHAR(50) NOT NULL, -- Dahulu ENUM ('father', 'mother', 'guardian')
    PRIMARY KEY (user_id, student_id),
    FOREIGN KEY (user_id) REFERENCES core_users(id),
    FOREIGN KEY (student_id) REFERENCES core_students(id)
);

-- ==============================================================================
-- 10. CORE: LEVEL GRADES (Tingkat Kelas)
-- ==============================================================================
CREATE TABLE core_level_grades (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL,
    level_order INT NOT NULL,
    FOREIGN KEY (school_id) REFERENCES core_schools(id)
);

-- ==============================================================================
-- 11. CORE: CLASSES (Data Master Kelas per Sekolah)
-- ==============================================================================
CREATE TABLE core_classes (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    level_grade_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL,
    FOREIGN KEY (school_id) REFERENCES core_schools(id),
    FOREIGN KEY (level_grade_id) REFERENCES core_level_grades(id)
);

-- ==============================================================================
-- 12. CORE: STUDENT_CLASS_HISTORIES (Mutasi Siswa)
-- ==============================================================================
CREATE TABLE core_student_class_histories (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL,
    class_id BIGINT NOT NULL,
    level_grade_id BIGINT NOT NULL,
    academic_year_id BIGINT NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- Dahulu ENUM ('active', 'completed', 'dropped')
    FOREIGN KEY (student_id) REFERENCES core_students(id),
    FOREIGN KEY (class_id) REFERENCES core_classes(id),
    FOREIGN KEY (level_grade_id) REFERENCES core_level_grades(id),
    FOREIGN KEY (academic_year_id) REFERENCES core_academic_years(id)
);

-- ==============================================================================
-- 13. CORE: APP MODULES (Daftar Menu / Modul Aplikasi)
-- ==============================================================================
CREATE TABLE core_app_modules (
    id BIGSERIAL PRIMARY KEY,
    module_code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'financial', 'academic', 'habits'
    module_name VARCHAR(100) NOT NULL
);

-- ==============================================================================
-- 14. CORE: MODULE ACCESS (Matriks Tampil/Sembunyi Menu)
-- ==============================================================================
CREATE TABLE core_module_access (
    id BIGSERIAL PRIMARY KEY,
    module_id BIGINT NOT NULL,
    school_id BIGINT NULL, -- NULL = berlaku global
    level_grade_id BIGINT NULL, -- NULL = berlaku di semua jenjang
    is_visible BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (module_id) REFERENCES core_app_modules(id),
    FOREIGN KEY (school_id) REFERENCES core_schools(id),
    FOREIGN KEY (level_grade_id) REFERENCES core_level_grades(id),
    CONSTRAINT unique_access_rule UNIQUE (module_id, school_id, level_grade_id)
);

-- ==============================================================================
-- 15. TUITION: PRODUCTS (Produk / Kategori Biaya - Master Data Global)
-- ==============================================================================
CREATE TABLE tuition_products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    payment_type VARCHAR(50) NOT NULL, -- Dahulu ENUM ('monthly', 'annualy', 'one_time')
    coa VARCHAR(50),
    coa_another VARCHAR(50),
    description TEXT
);

-- ==============================================================================
-- 15B. TUITION: PRODUCT TARIFFS (Matriks Harga Berdasarkan Tahun & Tingkat Kelas)
-- Menyimpan riwayat dan perbedaan harga antar jenjang secara dinamis
-- ==============================================================================
CREATE TABLE tuition_product_tariffs (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    academic_year_id BIGINT NOT NULL,
    level_grade_id BIGINT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES core_schools(id),
    FOREIGN KEY (product_id) REFERENCES tuition_products(id),
    FOREIGN KEY (academic_year_id) REFERENCES core_academic_years(id),
    FOREIGN KEY (level_grade_id) REFERENCES core_level_grades(id),
    CONSTRAINT unique_tariff_matrix UNIQUE (school_id, product_id, academic_year_id, level_grade_id)
);

-- ==============================================================================
-- 16. TUITION: PAYMENT METHODS (Metode Pembayaran)
-- ==============================================================================
CREATE TABLE tuition_payment_methods (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    coa VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 17. TUITION: PAYMENT INSTRUCTIONS (Instruksi Pembayaran Berjenjang)
-- ==============================================================================
CREATE TABLE tuition_payment_instruction_groups (
    id BIGSERIAL PRIMARY KEY,
    payment_method_id BIGINT NOT NULL,
    title VARCHAR(100) NOT NULL,
    FOREIGN KEY (payment_method_id) REFERENCES tuition_payment_methods(id)
);

CREATE TABLE tuition_payment_instruction_steps (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL,
    step_number INT NOT NULL,
    instruction_text TEXT NOT NULL,
    FOREIGN KEY (group_id) REFERENCES tuition_payment_instruction_groups(id)
);

-- ==============================================================================
-- 18. TUITION: BILLS (Tagihan Siswa - Hasil Cetak Tarif)
-- * Ditambahkan bill_month & bill_year untuk mempercepat filtering *
-- ==============================================================================
CREATE TABLE tuition_bills (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    academic_year_id BIGINT NOT NULL,
    title VARCHAR(100) NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL, 
    paid_amount DECIMAL(15, 2) DEFAULT 0,
    min_payment DECIMAL(15, 2) DEFAULT 0,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'unpaid', -- Dahulu ENUM ('paid', 'unpaid', 'partial')
    bill_month INT NULL, -- e.g., 7 untuk Juli
    bill_year INT NULL,  -- e.g., 2025
    related_month DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES core_students(id),
    FOREIGN KEY (product_id) REFERENCES tuition_products(id),
    FOREIGN KEY (academic_year_id) REFERENCES core_academic_years(id)
);
-- Index untuk performa filtering berdasarkan periode tagihan
CREATE INDEX idx_tuition_bills_period ON tuition_bills(bill_year, bill_month);

-- ==============================================================================
-- 19. TUITION: TRANSACTIONS (Header Checkout / Keranjang)
-- * Menggunakan PostgreSQL Table Partitioning RANGE (created_at) *
-- ==============================================================================
CREATE TABLE tuition_transactions (
    id BIGSERIAL,
    user_id BIGINT NOT NULL,
    academic_year_id BIGINT NOT NULL,
    reference_no VARCHAR(50) NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    payment_method_id BIGINT,
    va_no VARCHAR(100),
    qr_code TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    payment_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- PK harus menyertakan partion key di Postgres
    PRIMARY KEY (id, created_at),
    CONSTRAINT unique_ref_no_per_partition UNIQUE (reference_no, created_at)
) PARTITION BY RANGE (created_at);

-- ==============================================================================
-- 20. TUITION: TRANSACTION_DETAILS (Item Tagihan di dalam Keranjang)
-- * Menambahkan product_id & Menyesuaikan untuk Partitioning *
-- ==============================================================================
CREATE TABLE tuition_transaction_details (
    id BIGSERIAL,
    transaction_id BIGINT NOT NULL,
    transaction_created_at TIMESTAMP NOT NULL, -- Diperlukan untuk FK ke tabel partisi
    bill_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL, -- Ditambahkan: Menghindari JOIN berat untuk ambil COA ZAINS
    amount_paid DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, created_at),
    FOREIGN KEY (transaction_id, transaction_created_at) REFERENCES tuition_transactions(id, created_at),
    FOREIGN KEY (product_id) REFERENCES tuition_products(id)
) PARTITION BY RANGE (created_at);

-- ==============================================================================
-- 21. TUITION: PAYMENT LOGS (Mencatat Request/Response Payment Gateway)
-- ==============================================================================
CREATE TABLE tuition_payment_logs (
    id BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT NOT NULL,
    transaction_created_at TIMESTAMP NOT NULL, -- FK penyesuaian partisi
    request_payload TEXT,
    response_payload TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id, transaction_created_at) REFERENCES tuition_transactions(id, created_at)
);

-- ==============================================================================
-- 21B. TUITION: ZAINS LOG (Mencatat Request/Response Accounting ZAINS)
-- ==============================================================================
CREATE TABLE tuition_zains_log (
    id BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT NOT NULL,
    transaction_created_at TIMESTAMP NOT NULL,
    request_payload TEXT,
    response_payload TEXT,
    url TEXT,
    process VARCHAR(100),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id, transaction_created_at) REFERENCES tuition_transactions(id, created_at)
);

-- ==============================================================================
-- 22. NOTIF: TEMPLATES (Template Pesan WhatsApp & Email)
-- ==============================================================================
CREATE TABLE notif_templates (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- Dahulu ENUM ('whatsapp', 'email')
    trigger_event VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES core_schools(id)
);

-- ==============================================================================
-- 23. NOTIF: LOGS (Mencatat Request/Response Notifikasi)
-- ==============================================================================
CREATE TABLE notif_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NULL,
    template_id BIGINT NULL,
    type VARCHAR(50) NOT NULL, -- Dahulu ENUM ('whatsapp', 'email')
    recipient VARCHAR(100) NOT NULL,
    request_payload TEXT,
    response_payload TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- Dahulu ENUM ('success', 'failed', 'pending')
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES core_users(id),
    FOREIGN KEY (template_id) REFERENCES notif_templates(id)
);

-- ==============================================================================
-- ========================= AUTO-CREATE PARTITIONS =============================
-- Membuat contoh partisi untuk bulan di mana Seed Data dimasukkan (Oktober 2024)
-- Backend application / Cron job harus memanggil ini tiap bulan!
-- ==============================================================================
CREATE TABLE tuition_transactions_y2024m10 PARTITION OF tuition_transactions 
    FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');

CREATE TABLE tuition_transaction_details_y2024m10 PARTITION OF tuition_transaction_details 
    FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');

-- ==============================================================================
-- =============================== SEED DATA ====================================
-- ==============================================================================

-- 1. Insert Portal Themes
INSERT INTO core_portal_themes (id, host_domain, portal_title, logo_url, primary_color, login_bg_url, welcome_text) VALUES
(1, 'parents.kreativaglobal.sch.id', 'Kreativa Parent Portal', '/assets/brand/kreativa-main.png', '#2563eb', '/assets/bg/kreativa-bg.jpg', 'Selamat Datang di Portal Kreativa Global School.'),
(2, 'parents.talentajuara.sch.id', 'Talenta Juara Portal', '/assets/brand/talenta-main.png', '#ea580c', '/assets/bg/talenta-bg.jpg', 'Mari bersama membangun generasi juara di Talenta Juara.');

-- 2. Insert Schools
INSERT INTO core_schools (id, theme_id, name, address, school_logo_url) VALUES
(1, 1, 'SD Kreativa Global', 'Jl. Merpati 1', '/assets/logos/sd-kreativa.png'),
(2, 1, 'SMP Kreativa Global', 'Jl. Merpati 2', '/assets/logos/smp-kreativa.png'),
(3, 2, 'SD Talenta Juara Bandung', 'Jl. Terusan Jkt', '/assets/logos/sd-talenta.png'),
(4, 2, 'SMP Talenta Juara Bandung', 'Jl. Terusan Jkt', '/assets/logos/smp-talenta.png');

-- 3. Insert Academic Years 
INSERT INTO core_academic_years (id, name, is_active) VALUES
(1, '2024/2025', FALSE),
(2, '2025/2026', TRUE);

-- 4. Insert Users
INSERT INTO core_users (id, school_id, full_name, email, password_hash, role) VALUES
(1, NULL, 'Budi Santoso', 'budi.ayah@email.com', 'hash', 'parent'),
(2, 4, 'Zevanya', 'zevanya@student.com', 'hash', 'student'); 

-- 5. Insert Students 
INSERT INTO core_students (id, school_id, user_id, full_name, nis, nisn, gender) VALUES
(1, 1, NULL, 'Revy Ahmad', 'SD-001', '00112233', 'L'), 
(2, 4, 2, 'Zevanya', 'SMP-001', '00112244', 'P'); 

-- 6. Link Parent to Students
INSERT INTO core_parent_student_relations (user_id, student_id, relation_type) VALUES
(1, 1, 'father'), 
(1, 2, 'father'); 

-- 7. Level Grades
INSERT INTO core_level_grades (id, school_id, name, level_order) VALUES
(1, 1, 'Primary 1', 1),
(2, 1, 'Primary 2', 2), 
(3, 4, 'Secondary 1', 7);

-- 8. Setup App Modules
INSERT INTO core_app_modules (id, module_code, module_name) VALUES
(1, 'financial', 'Keuangan (SPP)'),
(2, 'academic', 'Nilai Harian & Rapor'),
(3, 'habits', 'Pembiasaan (Ibadah Harian)');

-- 9. Module Access
INSERT INTO core_module_access (module_id, school_id, level_grade_id, is_visible) VALUES
(1, NULL, NULL, TRUE), 
(2, NULL, NULL, TRUE), 
(3, NULL, NULL, FALSE), 
(3, NULL, 1, TRUE); 

-- 10. Tuition Products
INSERT INTO tuition_products (id, name, payment_type) VALUES
(1, 'SPP Bulanan', 'monthly'),
(2, 'Uang Gedung', 'installment');

-- 10B. INSERT TUITION TARIFFS 
INSERT INTO tuition_product_tariffs (school_id, product_id, academic_year_id, level_grade_id, amount) VALUES
(1, 1, 1, 1, 750000),
(1, 1, 1, 2, 750000), 
(4, 1, 1, 3, 1100000),
(1, 1, 2, 1, 800000),
(1, 1, 2, 2, 850000),
(4, 1, 2, 3, 1200000);

-- 11. Bills (Mengisi kolom bulan & tahun untuk performa Indexing)
INSERT INTO tuition_bills (id, student_id, product_id, academic_year_id, title, total_amount, bill_month, bill_year, related_month) VALUES
(1, 1, 1, 2, 'SPP Juli 2025', 800000, 7, 2025, '2025-07-01'), 
(2, 2, 1, 2, 'SPP Juli 2025', 1200000, 7, 2025, '2025-07-01'); 

-- 12. Seed Transaksi untuk Partisi Oktober 2024
INSERT INTO tuition_transactions (id, user_id, academic_year_id, reference_no, total_amount, status, created_at) VALUES 
(1, 1, 2, 'TRX-OKT-001', 800000, 'success', '2024-10-15 10:00:00');

INSERT INTO tuition_transaction_details (id, transaction_id, transaction_created_at, bill_id, product_id, amount_paid, created_at) VALUES 
(1, 1, '2024-10-15 10:00:00', 1, 1, 800000, '2024-10-15 10:00:00');

-- Reset Sequences for PostgreSQL to account for manually inserted Seed IDs
SELECT setval('core_portal_themes_id_seq', (SELECT MAX(id) FROM core_portal_themes));
SELECT setval('core_schools_id_seq', (SELECT MAX(id) FROM core_schools));
SELECT setval('core_academic_years_id_seq', (SELECT MAX(id) FROM core_academic_years));
SELECT setval('core_users_id_seq', (SELECT MAX(id) FROM core_users));
SELECT setval('core_students_id_seq', (SELECT MAX(id) FROM core_students));
SELECT setval('core_level_grades_id_seq', (SELECT MAX(id) FROM core_level_grades));
SELECT setval('core_app_modules_id_seq', (SELECT MAX(id) FROM core_app_modules));
SELECT setval('tuition_products_id_seq', (SELECT MAX(id) FROM tuition_products));
SELECT setval('tuition_product_tariffs_id_seq', (SELECT MAX(id) FROM tuition_product_tariffs));
SELECT setval('tuition_bills_id_seq', (SELECT MAX(id) FROM tuition_bills));