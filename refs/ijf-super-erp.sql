-- 1. CORE: SCHOOLS (Multi-Sekolah dalam 1 Yayasan)
-- ==============================================================================
CREATE TABLE core_schools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- e.g., 'SMA Cendekia', 'SMP Cendekia'
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 2. CORE: ACADEMIC YEARS (Tahun Ajaran)
-- ==============================================================================
CREATE TABLE core_academic_years (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL, -- e.g., '2023/2024', '2025/2026'
    is_active BOOLEAN DEFAULT FALSE
);

-- ==============================================================================
-- 2B. CORE: SETTINGS (Pengaturan Aplikasi & Tampilan Dinamis)
-- ==============================================================================
CREATE TABLE core_settings (
    id SERIAL PRIMARY KEY,
    school_id INT NULL, -- NULL = Pengaturan Global (Yayasan), Isi angka = Khusus Sekolah tersebut
    setting_key VARCHAR(100) NOT NULL, -- Kunci pengaturan, misal: 'app_title', 'logo_url', 'bg_color'
    setting_value TEXT, -- Nilai pengaturan (Bisa URL, kode warna HEX, string, atau JSON)
    description VARCHAR(255), -- Penjelasan untuk admin
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_setting_per_school UNIQUE (school_id, setting_key),
    FOREIGN KEY (school_id) REFERENCES core_schools(id)
);

-- ==============================================================================
-- 3. CORE: USERS (Akun Superadmin, Finance, dan Orang Tua)
-- ==============================================================================
CREATE TABLE core_users (
    id SERIAL PRIMARY KEY,
    school_id INT NULL, -- NULL for superadmin, required for finance, optional for parents
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('superadmin', 'school_finance', 'parent', 'teacher')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES core_schools(id)
);

-- ==============================================================================
-- 3B. CORE: REGIONAL DATA (Data Wilayah Relasional)
-- ==============================================================================
CREATE TABLE core_provinces (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE core_cities (
    id SERIAL PRIMARY KEY,
    province_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    FOREIGN KEY (province_id) REFERENCES core_provinces(id)
);

CREATE TABLE core_districts (
    id SERIAL PRIMARY KEY,
    city_id INT NOT NULL,
    name VARCHAR(100) NOT NULL, -- Kecamatan
    FOREIGN KEY (city_id) REFERENCES core_cities(id)
);

CREATE TABLE core_subdistricts (
    id SERIAL PRIMARY KEY,
    district_id INT NOT NULL,
    name VARCHAR(100) NOT NULL, -- Kelurahan/Desa
    postal_code VARCHAR(10),
    FOREIGN KEY (district_id) REFERENCES core_districts(id)
);

-- ==============================================================================
-- 4. CORE: STUDENTS (Profil Kelengkapan Siswa)
-- ==============================================================================
CREATE TABLE core_students (
    id SERIAL PRIMARY KEY,
    school_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    nis VARCHAR(20) UNIQUE NOT NULL,
    nisn VARCHAR(20) UNIQUE,
    previous_school VARCHAR(100),
    gender VARCHAR(1) CHECK (gender IN ('L', 'P')), -- Laki-laki / Perempuan
    place_of_birth VARCHAR(50),
    date_of_birth DATE,
    religion VARCHAR(30),
    child_order INT, -- Anak ke-
    siblings_count INT, -- Jumlah saudara
    child_status VARCHAR(20) CHECK (child_status IN ('Kandung', 'Tiri', 'Angkat')),
    address TEXT,
    province_id INT,
    city_id INT,
    district_id INT, 
    subdistrict_id INT, 
    postal_code VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(100),
    living_with VARCHAR(50),
    
    -- Riwayat Kesehatan
    blood_type VARCHAR(2) CHECK (blood_type IN ('A', 'B', 'AB', 'O')),
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
    FOREIGN KEY (province_id) REFERENCES core_provinces(id),
    FOREIGN KEY (city_id) REFERENCES core_cities(id),
    FOREIGN KEY (district_id) REFERENCES core_districts(id),
    FOREIGN KEY (subdistrict_id) REFERENCES core_subdistricts(id)
);

-- ==============================================================================
-- 4B. CORE: STUDENT DOCUMENTS (Dokumen Kelengkapan Siswa)
-- ==============================================================================
CREATE TABLE core_student_documents (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- e.g., 'KARTU KELUARGA', 'AKTA KELAHIRAN'
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES core_students(id)
);

-- ==============================================================================
-- 5. CORE: PARENT_STUDENT_RELATIONS (Many-to-Many Ayah/Ibu <-> Anak)
-- ==============================================================================
CREATE TABLE core_parent_student_relations (
    user_id INT NOT NULL, -- The Parent (from core_users table)
    student_id INT NOT NULL, -- The Child (from core_students)
    relation_type VARCHAR(20) NOT NULL CHECK (relation_type IN ('father', 'mother', 'guardian')),
    PRIMARY KEY (user_id, student_id),
    FOREIGN KEY (user_id) REFERENCES core_users(id),
    FOREIGN KEY (student_id) REFERENCES core_students(id)
);

-- ==============================================================================
-- 6. CORE: LEVEL GRADES (Tingkat Kelas, misal: Kelas 10, Kelas 11, Primary 1)
-- ==============================================================================
CREATE TABLE core_level_grades (
    id SERIAL PRIMARY KEY,
    school_id INT NOT NULL,
    name VARCHAR(50) NOT NULL, -- e.g., 'Kelas 10', 'Primary 1'
    level_order INT NOT NULL, -- For sorting sequentially (e.g., 1, 2, 10, 11)
    FOREIGN KEY (school_id) REFERENCES core_schools(id)
);

-- ==============================================================================
-- 7. CORE: CLASSES (Data Master Kelas per Sekolah)
-- ==============================================================================
CREATE TABLE core_classes (
    id SERIAL PRIMARY KEY,
    school_id INT NOT NULL,
    level_grade_id INT NOT NULL,
    name VARCHAR(50) NOT NULL, -- e.g., '10 IPS 3', '12 IPA 1'
    FOREIGN KEY (school_id) REFERENCES core_schools(id),
    FOREIGN KEY (level_grade_id) REFERENCES core_level_grades(id)
);

-- ==============================================================================
-- 8. CORE: STUDENT_CLASS_HISTORIES (Many-to-Many Siswa <-> Kelas + Tahun Ajaran)
-- ==============================================================================
CREATE TABLE core_student_class_histories (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    class_id INT NOT NULL,sses(id),
    FOREIGN KEY (level_grade_id) REFERENCES core
    level_grade_id INT NOT NULL,
    academic_year_id INT NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
    FOREIGN KEY (student_id) REFERENCES core_students(id),
    FOREIGN KEY (class_id) REFERENCES core_cla_level_grades(id),
    FOREIGN KEY (academic_year_id) REFERENCES core_academic_years(id)
);

-- ==============================================================================
-- 9. TUITION: PRODUCTS (Produk / Kategori Biaya - sebelumnya fee_categories)
-- ==============================================================================
CREATE TABLE tuition_products (
    id SERIAL PRIMARY KEY,
    school_id INT NOT NULL,
    name VARCHAR(100) NOT NULL, -- e.g., 'SPP', 'Building Fee'
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('monthly', 'installment', 'one_time')),
    coa VARCHAR(50), -- Chart of Accounts reference
    description TEXT,
    FOREIGN KEY (school_id) REFERENCES core_schools(id)
);

-- ==============================================================================
-- 10. TUITION: PAYMENT METHODS (Metode Pembayaran)
-- ==============================================================================
CREATE TABLE tuition_payment_methods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- e.g., 'GoPay', 'BCA Virtual Account', 'Credit Card'
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'GOPAY', 'BCA_VA', 'CC'
    category VARCHAR(50) NOT NULL, -- e.g., 'e-Wallet', 'Virtual Account', 'Credit Card'
    coa VARCHAR(50), -- Chart of Accounts reference for the payment method
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 11. TUITION: PAYMENT INSTRUCTIONS (Instruksi Pembayaran Berjenjang)
-- ==============================================================================
CREATE TABLE tuition_payment_instruction_groups (
    id SERIAL PRIMARY KEY,
    payment_method_id INT NOT NULL,
    title VARCHAR(100) NOT NULL, -- e.g., 'Pembayaran melalui Blu BCA', 'Pembayaran melalui ATM'
    FOREIGN KEY (payment_method_id) REFERENCES tuition_payment_methods(id)
);

CREATE TABLE tuition_payment_instruction_steps (
    id SERIAL PRIMARY KEY,
    group_id INT NOT NULL,
    step_number INT NOT NULL,
    instruction_text TEXT NOT NULL,
    FOREIGN KEY (group_id) REFERENCES tuition_payment_instruction_groups(id)
);

-- ==============================================================================
-- 12. TUITION: BILLS (Tagihan Siswa)
-- ==============================================================================
CREATE TABLE tuition_bills (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    product_id INT NOT NULL, -- Link to tuition_products table
    academic_year_id INT NOT NULL, -- Link to core_academic_years
    title VARCHAR(100) NOT NULL, -- e.g., 'SPP October 2024'
    total_amount DECIMAL(15, 2) NOT NULL,
    paid_amount DECIMAL(15, 2) DEFAULT 0,
    min_payment DECIMAL(15, 2) DEFAULT 0, -- For installments
    due_date DATE,
    status VARCHAR(20) DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid', 'partial')),
    related_month DATE NULL, -- Specific to monthly fees (e.g., '2024-10-01')
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES core_students(id),
    FOREIGN KEY (product_id) REFERENCES tuition_products(id),
    FOREIGN KEY (academic_year_id) REFERENCES core_academic_years(id)
);

-- ==============================================================================
-- 13. TUITION: TRANSACTIONS (Header Checkout / Keranjang)
-- ==============================================================================
CREATE TABLE tuition_transactions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL, -- Whoever paid (Parent online OR Finance at counter)
    academic_year_id INT NOT NULL, -- Link to core_academic_years
    reference_no VARCHAR(50) UNIQUE NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    payment_method_id INT, -- Link to tuition_payment_methods
    va_no VARCHAR(100), -- Virtual Account Number (jika menggunakan metode VA)
    qr_code TEXT, -- Link atau String QR Code (jika menggunakan metode e-Wallet/QRIS)
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('success', 'pending', 'failed')),
    payment_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES core_users(id),
    FOREIGN KEY (academic_year_id) REFERENCES core_academic_years(id),
    FOREIGN KEY (payment_method_id) REFERENCES tuition_payment_methods(id)
);

-- ==============================================================================
-- 14. TUITION: TRANSACTION_DETAILS (Item Tagihan di dalam Keranjang/Transaksi)
-- ==============================================================================
CREATE TABLE tuition_transaction_details (
    id SERIAL PRIMARY KEY,
    transaction_id INT NOT NULL,
    bill_id INT NOT NULL,
    amount_paid DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES tuition_transactions(id),
    FOREIGN KEY (bill_id) REFERENCES tuition_bills(id)
);

-- ==============================================================================
-- 15. TUITION: PAYMENT LOGS (Mencatat Request/Response Payment Gateway)
-- ==============================================================================
CREATE TABLE tuition_payment_logs (
    id SERIAL PRIMARY KEY,
    transaction_id INT NOT NULL,
    request_payload TEXT,
    response_payload TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES tuition_transactions(id)
);

-- ==============================================================================
-- 16. NOTIF: TEMPLATES (Template Pesan WhatsApp & Email)
-- ==============================================================================
CREATE TABLE notif_templates (
    id SERIAL PRIMARY KEY,
    school_id INT NULL, -- NULL for global templates, set ID for school-specific
    name VARCHAR(100) NOT NULL, -- e.g., 'Payment Success Confirmation'
    type VARCHAR(20) NOT NULL CHECK (type IN ('whatsapp', 'email')),
    trigger_event VARCHAR(50) NOT NULL, -- e.g., 'PAYMENT_SUCCESS', 'BILL_REMINDER'
    content TEXT NOT NULL, -- Can contain placeholders like {name}, {amount}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES core_schools(id)
);

-- ==============================================================================
-- 17. NOTIF: LOGS (Mencatat Request/Response Notifikasi)
-- ==============================================================================
CREATE TABLE notif_logs (
    id SERIAL PRIMARY KEY,
    user_id INT NULL,
    template_id INT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('whatsapp', 'email')),
    recipient VARCHAR(100) NOT NULL, -- Email address or Phone number
    request_payload TEXT,
    response_payload TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('success', 'failed', 'pending')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES core_users(id),
    FOREIGN KEY (template_id) REFERENCES notif_templates(id)
);

-- ==============================================================================
-- =============================== SEED DATA ====================================
-- ==============================================================================

-- 1. Insert Schools
INSERT INTO core_schools (id, name, address) VALUES
(1, 'SMA Cendekia', 'Jl. Merpati 1, Jakarta'),
(2, 'SMP Cendekia', 'Jl. Merpati 2, Jakarta');

-- 2. Insert Academic Years
INSERT INTO core_academic_years (id, name, is_active) VALUES
(1, '2023/2024', FALSE),
(2, '2024/2025', TRUE);

-- 2B. Insert Dynamic Settings (Contoh Pengaturan Global & Spesifik)
INSERT INTO core_settings (school_id, setting_key, setting_value, description) VALUES
(NULL, 'app_title', 'Kreativa Portal', 'Judul aplikasi utama global'),
(NULL, 'global_logo_url', 'https://digieduka.web.id/assets/logo.png', 'Logo default untuk seluruh yayasan'),
(NULL, 'primary_color', '#2563eb', 'Warna tema utama (Biru) global'),
(1, 'primary_color', '#1e40af', 'Warna tema spesifik untuk SMA Cendekia (Biru Gelap)'),
(1, 'school_logo_url', 'https://digieduka.web.id/assets/logo_sma.png', 'Logo khusus SMA Cendekia'),
(2, 'primary_color', '#047857', 'Warna tema spesifik untuk SMP Cendekia (Hijau)');

-- 3. Insert Users (Multi-role Example)
INSERT INTO core_users (id, school_id, full_name, email, password_hash, role) VALUES
(1, NULL, 'System Superadmin', 'superadmin@yayasan.com', 'hash', 'superadmin'),
(2, 1, 'Finance SMA', 'finance@sma-cendekia.com', 'hash', 'school_finance'),
(3, 2, 'Finance SMP', 'finance@smp-cendekia.com', 'hash', 'school_finance'),
(4, NULL, 'Budi Santoso', 'budi.ayah@email.com', 'hash', 'parent'), -- Father
(5, NULL, 'Siti Aminah', 'siti.ibu@email.com', 'hash', 'parent'); -- Mother

-- 3B. Insert Regional Data (Data Wilayah)
INSERT INTO core_provinces (id, name) VALUES (1, 'DKI Jakarta');
INSERT INTO core_cities (id, province_id, name) VALUES (1, 1, 'Jakarta Selatan');
INSERT INTO core_districts (id, city_id, name) VALUES (1, 1, 'Kebayoran Lama');
INSERT INTO core_subdistricts (id, district_id, name, postal_code) VALUES (1, 1, 'Pondok Pinang', '12240');

-- 4. Insert Students (Dengan Profil Lengkap, Relasi Wilayah, dan Riwayat Kesehatan)
INSERT INTO core_students (id, school_id, full_name, nis, nisn, previous_school, gender, place_of_birth, date_of_birth, religion, child_order, siblings_count, child_status, address, province_id, city_id, district_id, subdistrict_id, postal_code, phone, email, living_with, blood_type, weight_kg, height_cm, allergies, vision_condition, hearing_condition, special_needs, chronic_diseases, physical_abnormalities, recurring_diseases) VALUES
(1, 1, 'Ahmad Santoso', 'SMA-001', '0012345678', 'SMP Negeri 1', 'L', 'Jakarta', '2008-05-15', 'Islam', 1, 2, 'Kandung', 'Jl. Merpati No. 45', 1, 1, 1, 1, '12240', '081299998888', 'ahmad@email.com', 'Orang Tua', 'O', 55.50, 165, 'Tidak ada', 'Normal', 'Normal', 'Tidak', 'Tidak ada', 'Tidak ada', 'Tidak ada'),
(2, 2, 'Aisyah Santoso', 'SMP-001', '0034567890', 'SD Negeri 2', 'P', 'Jakarta', '2011-08-20', 'Islam', 2, 2, 'Kandung', 'Jl. Merpati No. 45', 1, 1, 1, 1, '12240', '081277776666', 'aisyah@email.com', 'Orang Tua', 'A', 42.00, 150, 'Alergi Seafood', 'Minus 1', 'Normal', 'Tidak', 'Asma', 'Tidak ada', 'Asma');

-- 4B. Insert Student Documents
INSERT INTO core_student_documents (student_id, document_type, file_name, file_path) VALUES
(1, 'KARTU KELUARGA', 'kk_ahmad_santoso.pdf', '/storage/documents/kk_ahmad_santoso.pdf'),
(1, 'AKTA KELAHIRAN', 'akta_ahmad_santoso.pdf', '/storage/documents/akta_ahmad_santoso.pdf');

-- 5. Link Parents to Students (Both Father and Mother can see Both Kids)
INSERT INTO core_parent_student_relations (user_id, student_id, relation_type) VALUES
(4, 1, 'father'), -- Budi -> Ahmad
(4, 2, 'father'), -- Budi -> Aisyah
(5, 1, 'mother'), -- Siti -> Ahmad
(5, 2, 'mother'); -- Siti -> Aisyah

-- 6. Setup Level Grades
INSERT INTO core_level_grades (id, school_id, name, level_order) VALUES
(1, 1, 'Kelas 11', 11),
(2, 1, 'Kelas 12', 12),
(3, 2, 'Kelas 8', 8);

-- 7. Setup Classes & History
INSERT INTO core_classes (id, school_id, level_grade_id, name) VALUES
(1, 1, 1, '11 IPA 1'),
(2, 1, 2, '12 IPA 1'),
(3, 2, 3, '8A');

INSERT INTO core_student_class_histories (student_id, class_id, level_grade_id, academic_year_id, status) VALUES
(1, 1, 1, 1, 'completed'), -- Ahmad lulus dari kelas 11 tahun lalu
(1, 2, 2, 2, 'active'),    -- Ahmad sekarang kelas 12
(2, 3, 3, 2, 'active');    -- Aisyah sekarang kelas 8

-- 8. Payment Methods
INSERT INTO tuition_payment_methods (id, name, code, category, coa) VALUES
(1, 'Credit Card', 'CC', 'Credit Card', '1101.02.001'),
(2, 'GoPay', 'GOPAY', 'e-Wallet', '1101.02.002'),
(3, 'Bank Transfer BCA', 'BCA_TF', 'Virtual Account', '1101.01.001');

-- 9. Payment Instructions (Berjenjang: Group -> Steps)
INSERT INTO tuition_payment_instruction_groups (id, payment_method_id, title) VALUES
(1, 2, 'Pembayaran melalui Aplikasi Gojek'),
(2, 3, 'Pembayaran melalui m-BCA'),
(3, 3, 'Pembayaran melalui ATM BCA');

INSERT INTO tuition_payment_instruction_steps (group_id, step_number, instruction_text) VALUES
-- Steps for Gojek (Group 1)
(1, 1, 'Buka aplikasi Gojek di HP Anda.'),
(1, 2, 'Pilih menu Bayar lalu scan QRIS yang muncul di layar.'),
(1, 3, 'Konfirmasi nominal pembayaran dan masukkan PIN GoPay Anda.'),
-- Steps for m-BCA (Group 2)
(2, 1, 'Buka aplikasi m-BCA dan lakukan login.'),
(2, 2, 'Pilih menu M-Transfer > BCA Virtual Account.'),
(2, 3, 'Masukkan nomor Virtual Account yang tertera pada halaman pembayaran.'),
(2, 4, 'Periksa detail tagihan, lalu masukkan PIN m-BCA Anda untuk menyelesaikan transaksi.'),
-- Steps for ATM BCA (Group 3)
(3, 1, 'Masukkan kartu ATM dan PIN BCA Anda.'),
(3, 2, 'Pilih Transaksi Lainnya > Transfer > ke Rekening BCA Virtual Account.'),
(3, 3, 'Masukkan nomor Virtual Account.'),
(3, 4, 'Pastikan nama dan nominal sesuai, lalu tekan Benar.');

-- 10. Products (Produk Layanan / Biaya)
INSERT INTO tuition_products (id, school_id, name, payment_type, coa) VALUES
(1, 1, 'SPP SMA', 'monthly', '4101.01.000'),
(2, 1, 'Building Fee SMA', 'installment', '4102.01.000'),
(3, 2, 'SPP SMP', 'monthly', '4101.02.000');

-- 11. Create Bills (Menggunakan product_id)
INSERT INTO tuition_bills (id, student_id, product_id, academic_year_id, title, total_amount, paid_amount, min_payment, status, related_month) VALUES
(1, 1, 1, 2, 'SPP October 2024', 1500000, 1500000, 0, 'paid', '2024-10-01'),
(2, 1, 1, 2, 'SPP November 2024', 1500000, 0, 0, 'unpaid', '2024-11-01'),
(3, 1, 2, 2, 'Building Fee', 15000000, 5000000, 500000, 'partial', NULL),
(4, 2, 3, 2, 'SPP October 2024', 1000000, 0, 0, 'unpaid', '2024-10-01');

-- 12. Transactions
INSERT INTO tuition_transactions (id, user_id, academic_year_id, reference_no, total_amount, payment_method_id, status, payment_date) VALUES
(1, 4, 2, 'TRX-BUDI-001', 1500000, 1, 'success', '2024-10-05 10:00:00');

-- 13. Transaction Details
INSERT INTO tuition_transaction_details (transaction_id, bill_id, amount_paid) VALUES
(1, 1, 1500000); -- Budi paid Ahmad's October SPP

-- 14. Template Notification Setup
INSERT INTO notif_templates (id, school_id, name, type, trigger_event, content) VALUES
(1, NULL, 'Payment Success WA', 'whatsapp', 'PAYMENT_SUCCESS', 'Halo {name}, pembayaran untuk {bill_title} sebesar {amount} telah berhasil diterima. Terima kasih.');