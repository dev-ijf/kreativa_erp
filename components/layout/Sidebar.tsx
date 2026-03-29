'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, GraduationCap, Users, Wallet, BookOpen,
  CreditCard, Settings, ChevronDown, Banknote, LogOut,
  Building2, MapPin, UserPlus, ListTree, Layers,
  Receipt, ScanLine, Bell, ChevronRight, School, CalendarDays,
  UserCog, BarChart3, Landmark, House, Palette,
} from 'lucide-react';

const MODULES = [
  {
    id: 'masterUsers',
    name: 'Master & Pengguna',
    icon: <Building2 size={16} />,
    color: 'bg-violet-700',
    accent: '#7c3aed',
    menus: [
      { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={16} /> },
      { name: 'Sekolah', href: '/master/schools', icon: <School size={16} /> },
      { name: 'Tahun Ajaran', href: '/master/academic-years', icon: <CalendarDays size={16} /> },
      { name: 'Tingkat Kelas', href: '/master/level-grades', icon: <Layers size={16} /> },
      { name: 'Data Kelas', href: '/master/classes', icon: <BookOpen size={16} /> },
      { name: 'Naik kelas / Pembagian', href: '/master/class-promotion', icon: <ListTree size={16} /> },
      { name: 'Provinsi', href: '/master/provinces', icon: <MapPin size={16} /> },
      { name: 'Kabupaten/Kota', href: '/master/cities', icon: <Building2 size={16} /> },
      { name: 'Kecamatan', href: '/master/districts', icon: <Landmark size={16} /> },
      { name: 'Kelurahan', href: '/master/subdistricts', icon: <House size={16} /> },
      { name: 'Portal & modul', href: '/master/portal-modules', icon: <Palette size={16} /> },
      { name: 'Data Pengguna', href: '/users', icon: <UserCog size={16} /> },
    ],
  },
  {
    id: 'students',
    name: 'Manajemen Siswa',
    icon: <Users size={16} />,
    color: 'bg-blue-700',
    accent: '#1d4ed8',
    menus: [
      { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={16} /> },
      { name: 'Daftar Peserta Didik', href: '/students', icon: <UserPlus size={16} /> },
    ],
  },
  {
    id: 'financeBilling',
    name: 'Keuangan & Tagihan',
    icon: <Banknote size={16} />,
    color: 'bg-emerald-700',
    accent: '#047857',
    menus: [
      { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={16} /> },
      { name: 'Produk / Biaya', href: '/finance/products', icon: <Wallet size={16} /> },
      { name: 'Matriks Tarif', href: '/finance/product-tariffs', icon: <ScanLine size={16} /> },
      { name: 'Metode Pembayaran', href: '/finance/payment-methods', icon: <CreditCard size={16} /> },
      { name: 'Instruksi Bayar', href: '/finance/payment-instructions', icon: <ListTree size={16} /> },
      { name: 'Template Notifikasi', href: '/finance/notifications', icon: <Bell size={16} /> },
      { name: 'Generate Tagihan', href: '/billing/generate', icon: <BarChart3 size={16} /> },
      { name: 'Matriks SPP', href: '/billing/matrix', icon: <ScanLine size={16} /> },
      { name: 'Kasir', href: '/billing/cashier', icon: <CreditCard size={16} /> },
      { name: 'Riwayat Transaksi', href: '/billing/transactions', icon: <Receipt size={16} /> },
    ],
  },
];

function moduleForPathname(pathname: string) {
  if (pathname.startsWith('/master') || pathname.startsWith('/users') || pathname.startsWith('/settings')) {
    return MODULES.find((m) => m.id === 'masterUsers') ?? MODULES[0];
  }
  if (pathname.startsWith('/students')) {
    return MODULES.find((m) => m.id === 'students') ?? MODULES[0];
  }
  if (pathname.startsWith('/finance') || pathname.startsWith('/billing')) {
    return MODULES.find((m) => m.id === 'financeBilling') ?? MODULES[0];
  }
  return null;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [activeModule, setActiveModule] = useState(MODULES[0]);

  useEffect(() => {
    const mod = moduleForPathname(pathname);
    if (mod) setActiveModule(mod);
  }, [pathname]);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Backdrop for switcher */}
      {isSwitcherOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsSwitcherOpen(false)} />
      )}

      <aside
        className={`${collapsed ? 'w-20' : 'w-64'} ${activeModule.color} text-white flex flex-col shrink-0 transition-all duration-300 ease-in-out relative z-50 shadow-2xl`}
      >
        {/* Logo */}
        <div className="p-5 flex items-center gap-3 border-b border-white/10">
          <div className="w-9 h-9 bg-white/15 rounded-2xl flex items-center justify-center shrink-0 border border-white/20">
            <GraduationCap size={20} strokeWidth={1.5} />
          </div>
          {!collapsed && (
            <div>
              <p className="font-bold text-base tracking-tight leading-none">Kreativa</p>
              <p className="text-[9px] font-semibold tracking-[0.2em] opacity-50 mt-0.5">GLOBAL SCHOOL ERP</p>
            </div>
          )}
        </div>

        {/* Module Switcher */}
        <div className="px-3 py-4 relative">
          <button
            onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl bg-black/15 hover:bg-black/25 transition-all border border-white/10 ${collapsed ? 'justify-center' : ''}`}
          >
            <div className="shrink-0 opacity-80">{activeModule.icon}</div>
            {!collapsed && (
              <>
                <div className="flex-1 text-left overflow-hidden">
                  <p className="text-[10px] uppercase font-bold opacity-40 tracking-widest">Modul</p>
                  <p className="text-[13px] font-semibold truncate">{activeModule.name}</p>
                </div>
                <ChevronDown size={13} className={`opacity-40 shrink-0 transition-transform ${isSwitcherOpen ? 'rotate-180' : ''}`} />
              </>
            )}
          </button>

          {/* Dropdown */}
          {isSwitcherOpen && (
            <div className="absolute left-3 right-3 mt-2 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden animate-slideDown">
              <p className="px-4 pt-4 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ganti Modul</p>
              {MODULES.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => { setActiveModule(mod); setIsSwitcherOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 mx-1 mb-0.5 rounded-lg transition-all text-left ${
                    activeModule.id === mod.id
                      ? 'bg-slate-100 text-slate-800'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                  style={{ width: 'calc(100% - 8px)' }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: mod.accent }}
                  >
                    {mod.icon}
                  </div>
                  <span className="text-[13px] font-medium">{mod.name}</span>
                  {activeModule.id === mod.id && <ChevronRight size={13} className="ml-auto text-slate-400" />}
                </button>
              ))}
              <div className="h-2" />
            </div>
          )}
        </div>

        {/* Nav Menus */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-hide pb-4">
          {!collapsed && (
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-30 px-3 py-2">Menu</p>
          )}
          {activeModule.menus.map((menu) => {
            const isActive =
              pathname === menu.href ||
              (menu.href !== '/dashboard' && pathname.startsWith(`${menu.href}/`));
            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all group ${
                  collapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-white text-slate-800 shadow-md'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className={`shrink-0 ${isActive ? 'scale-110' : ''} transition-transform`}>
                  {menu.icon}
                </span>
                {!collapsed && (
                  <span className={`text-[13.5px] tracking-tight ${isActive ? 'font-semibold text-slate-800' : 'font-normal'}`}>
                    {menu.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Settings link */}
        <div className="px-3 pb-2 border-t border-white/10 pt-3">
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all text-white/50 hover:text-white hover:bg-white/10 ${collapsed ? 'justify-center' : ''}`}
          >
            <Settings size={16} />
            {!collapsed && <span className="text-[13.5px]">Pengaturan</span>}
          </Link>
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-white/10">
          <div className={`bg-black/20 rounded-2xl p-3 flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-lg bg-white/90 flex items-center justify-center text-slate-700 font-bold text-sm shrink-0">
              S
            </div>
            {!collapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="text-[13px] font-semibold truncate">Superadmin</p>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Yayasan</p>
              </div>
            )}
            {!collapsed && <LogOut size={14} className="text-white/20 hover:text-white cursor-pointer transition-colors shrink-0" />}
          </div>
        </div>
      </aside>
    </>
  );
}

export { MODULES };
