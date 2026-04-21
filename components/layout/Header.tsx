'use client';

import { useState } from 'react';
import { Search, Bell, Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';

const BREADCRUMB_MAP: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/master/schools': 'Data Sekolah',
  '/master/academic-years': 'Tahun Ajaran',
  '/master/level-grades': 'Tingkat Kelas',
  '/master/classes': 'Data Kelas',
  '/master/class-promotion': 'Naik kelas / Pembagian',
  '/master/provinces': 'Provinsi',
  '/master/provinces/add': 'Tambah Provinsi',
  '/master/cities': 'Kabupaten / Kota',
  '/master/cities/add': 'Tambah Kabupaten/Kota',
  '/master/districts': 'Kecamatan',
  '/master/districts/add': 'Tambah Kecamatan',
  '/master/subdistricts': 'Kelurahan / Desa',
  '/master/subdistricts/add': 'Tambah Kelurahan',
  '/master/portal-modules': 'Portal & modul',
  '/master/teachers': 'Data Guru',
  '/master/teachers/add': 'Tambah Guru',
  '/academic/subjects': 'Mata Pelajaran',
  '/academic/subjects/add': 'Tambah Mapel',
  '/academic/semesters': 'Semester',
  '/academic/semesters/add': 'Tambah Semester',
  '/academic/schedules': 'Jadwal',
  '/academic/schedules/add': 'Tambah Jadwal',
  '/academic/attendances': 'Kehadiran',
  '/academic/attendances/add': 'Tambah Kehadiran',
  '/academic/grades': 'Nilai / Rapor',
  '/academic/grades/add': 'Tambah Nilai',
  '/academic/agendas': 'Agenda',
  '/academic/agendas/add': 'Tambah Agenda',
  '/academic/announcements': 'Pengumuman',
  '/academic/announcements/add': 'Tambah Pengumuman',
  '/academic/clinic-visits': 'Klinik UKS',
  '/academic/clinic-visits/add': 'Tambah Kunjungan UKS',
  '/academic/habits': 'Pembiasaan',
  '/academic/adaptive-tests': 'Tes adaptif',
  '/students': 'Buku Induk Siswa',
  '/students/documents': 'Dokumen Siswa',
  '/students/promotions': 'Promosi Kelas',
  '/finance/products': 'Produk / Biaya',
  '/finance/payment-methods': 'Metode Pembayaran',
  '/finance/payment-instructions': 'Instruksi Pembayaran',
  '/finance/notifications': 'Template Notifikasi',
  '/billing/generate': 'Generate Tagihan',
  '/billing/matrix': 'Matriks SPP',
  '/billing/cashier': 'Kasir',
  '/billing/transactions': 'Riwayat Transaksi',
  '/users': 'Data Pengguna',
  '/settings': 'Pengaturan',
};

function resolvePageTitle(pathname: string): string {
  if (BREADCRUMB_MAP[pathname]) return BREADCRUMB_MAP[pathname];
  if (/^\/academic\/schedules\/class\/\d+$/.test(pathname)) {
    return 'Jadwal — per kelas';
  }
  if (/^\/academic\/attendances\/student\/\d+$/.test(pathname)) {
    return 'Kehadiran — per siswa';
  }
  if (/^\/academic\/grades\/student\/\d+$/.test(pathname)) {
    return 'Nilai / rapor — per siswa';
  }
  if (/^\/academic\/clinic-visits\/student\/\d+$/.test(pathname)) {
    return 'Klinik UKS — per siswa';
  }
  if (/^\/academic\/habits\/student\/\d+$/.test(pathname)) {
    return 'Pembiasaan — per siswa';
  }
  if (/^\/academic\/adaptive-tests\/student\/\d+$/.test(pathname)) {
    return 'Tes adaptif — per siswa';
  }
  if (pathname.startsWith('/master/provinces/') && pathname !== '/master/provinces/add') {
    return 'Edit Provinsi';
  }
  if (pathname.startsWith('/master/cities/') && pathname !== '/master/cities/add') {
    return 'Edit Kabupaten/Kota';
  }
  if (pathname.startsWith('/master/districts/') && pathname !== '/master/districts/add') {
    return 'Edit Kecamatan';
  }
  if (pathname.startsWith('/master/subdistricts/') && pathname !== '/master/subdistricts/add') {
    return 'Edit Kelurahan';
  }
  if (/^\/master\/teachers\/\d+$/.test(pathname)) {
    return 'Edit Guru';
  }
  if (/^\/academic\/subjects\/\d+$/.test(pathname)) {
    return 'Edit Mapel';
  }
  if (/^\/academic\/semesters\/\d+$/.test(pathname)) {
    return 'Edit Semester';
  }
  if (/^\/academic\/schedules\/\d+$/.test(pathname)) {
    return 'Edit Jadwal';
  }
  if (/^\/academic\/attendances\/\d+$/.test(pathname)) {
    return 'Edit Kehadiran';
  }
  if (/^\/academic\/grades\/\d+$/.test(pathname)) {
    return 'Edit Nilai';
  }
  if (/^\/academic\/agendas\/\d+$/.test(pathname)) {
    return 'Edit Agenda';
  }
  if (/^\/academic\/announcements\/\d+$/.test(pathname)) {
    return 'Edit Pengumuman';
  }
  if (/^\/academic\/clinic-visits\/\d+$/.test(pathname)) {
    return 'Edit Kunjungan UKS';
  }
  if (/^\/academic\/habits\/\d+$/.test(pathname)) {
    return 'Detail pembiasaan';
  }
  if (/^\/academic\/adaptive-tests\/\d+$/.test(pathname)) {
    return 'Detail tes adaptif';
  }
  return BREADCRUMB_MAP[pathname] || 'Dashboard';
}

interface HeaderProps {
  onMenuToggle?: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  const title = resolvePageTitle(pathname);

  return (
    <header className="h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between z-20 shrink-0 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
        >
          <Menu size={18} strokeWidth={1.5} />
        </button>
        <div>
          <h1 className="text-[17px] font-semibold text-slate-800 tracking-tight leading-none">{title}</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">Kreativa ERP · Superadmin</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className={`relative transition-all duration-200 ${searchOpen ? 'w-64' : 'w-9'}`}>
          {searchOpen ? (
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
              <Search size={15} className="ml-3 text-slate-400 shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Cari data..."
                className="bg-transparent pl-2 pr-3 py-2 text-[13px] outline-none w-full text-slate-700 placeholder:text-slate-400"
              />
              <button onClick={() => setSearchOpen(false)} className="pr-2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
            >
              <Search size={18} strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Notifications */}
        <button className="relative w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all">
          <Bell size={18} strokeWidth={1.5} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-semibold text-[13px]">
            S
          </div>
          <div className="hidden sm:block">
            <p className="text-[13px] font-semibold text-slate-700 leading-none">Superadmin</p>
            <p className="text-[11px] text-slate-400 mt-0.5">superadmin@yayasan.com</p>
          </div>
        </div>
      </div>
    </header>
  );
}
