"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { confirmToast } from "@/components/ui/confirmToast";
import {
  LayoutDashboard, GraduationCap, Users, Wallet, BookOpen,
  CreditCard, Settings, ChevronDown, Banknote, LogOut,
  Building2, MapPin, UserPlus, ListTree, Layers,
  Receipt, ScanLine, Bell, ChevronRight, School, CalendarDays, FileText,
  UserCog, BarChart3, Landmark, House, Palette, ClipboardList,
  Megaphone, UserCheck, Stethoscope, Calendar, BookMarked, Brain, Library,
} from "lucide-react";

type PortalThemeState = {
  appTitle: string;
  logoMainUrl: string | null;
};

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
      { name: 'Master Angkatan', href: '/master/cohorts', icon: <Users size={16} /> },
      { name: 'Tahun Ajaran', href: '/master/academic-years', icon: <CalendarDays size={16} /> },
      { name: 'Tingkat Kelas', href: '/master/level-grades', icon: <Layers size={16} /> },
      { name: 'Provinsi', href: '/master/provinces', icon: <MapPin size={16} /> },
      { name: 'Kabupaten/Kota', href: '/master/cities', icon: <Building2 size={16} /> },
      { name: 'Kecamatan', href: '/master/districts', icon: <Landmark size={16} /> },
      { name: 'Kelurahan', href: '/master/subdistricts', icon: <House size={16} /> },
      { name: 'Portal & modul', href: '/master/portal-modules', icon: <Palette size={16} /> },
      { name: 'Data Guru', href: '/master/teachers', icon: <GraduationCap size={16} /> },
      { name: 'Data Pengguna', href: '/users', icon: <UserCog size={16} /> },
      { name: 'Pengaturan', href: '/settings', icon: <Settings size={16} /> },
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
      { name: 'Data Kelas', href: '/master/classes', icon: <BookOpen size={16} /> },
      { name: 'Naik kelas / Pembagian', href: '/master/class-promotion', icon: <ListTree size={16} /> },
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
      { name: 'Bill (Tagihan)', href: '/billing/bills', icon: <FileText size={16} /> },
      { name: 'Matriks Tarif', href: '/finance/product-tariffs', icon: <ScanLine size={16} /> },
      { name: 'Metode Pembayaran', href: '/finance/payment-methods', icon: <CreditCard size={16} /> },
      { name: 'Template Notifikasi', href: '/finance/notifications', icon: <Bell size={16} /> },
      { name: 'Generate Tagihan', href: '/billing/generate', icon: <BarChart3 size={16} /> },
      { name: 'Matriks SPP', href: '/billing/matrix', icon: <ScanLine size={16} /> },
      { name: 'Kasir', href: '/billing/cashier', icon: <CreditCard size={16} /> },
      { name: 'Riwayat pembayaran', href: '/billing/transactions', icon: <Receipt size={16} /> },
    ],
  },
  {
    id: 'academic',
    name: 'Akademik',
    icon: <BookMarked size={16} />,
    color: 'bg-sky-700',
    accent: '#0369a1',
    menus: [
      { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={16} /> },
      { name: 'Mapel', href: '/academic/subjects', icon: <BookOpen size={16} /> },
      { name: 'Semester', href: '/academic/semesters', icon: <CalendarDays size={16} /> },
      { name: 'Jadwal', href: '/academic/schedules', icon: <Calendar size={16} /> },
      { name: 'Kehadiran', href: '/academic/attendances', icon: <UserCheck size={16} /> },
      { name: 'Nilai / Rapor', href: '/academic/grades', icon: <ClipboardList size={16} /> },
      { name: 'Agenda', href: '/academic/agendas', icon: <Calendar size={16} /> },
      { name: 'Pengumuman', href: '/academic/announcements', icon: <Megaphone size={16} /> },
      { name: 'Kesehatan', href: '/academic/clinic-visits', icon: <Stethoscope size={16} /> },
      { name: 'Pembiasaan', href: '/academic/habits', icon: <UserCheck size={16} /> },
      { name: 'Tes adaptif', href: '/academic/adaptive-tests', icon: <Brain size={16} /> },
      { name: 'Bank Soal', href: '/academic/adaptive-questions-bank', icon: <Library size={16} /> },
    ],
  },
];

function moduleForPathname(pathname: string) {
  if (
    pathname.startsWith('/master/classes') ||
    pathname.startsWith('/master/class-promotion')
  ) {
    return MODULES.find((m) => m.id === 'students') ?? MODULES[0];
  }
  if (pathname.startsWith("/master") || pathname.startsWith("/users") || pathname.startsWith("/settings")) {
    return MODULES.find((m) => m.id === "masterUsers") ?? MODULES[0];
  }
  if (pathname.startsWith("/students")) {
    return MODULES.find((m) => m.id === "students") ?? MODULES[0];
  }
  if (pathname.startsWith("/finance") || pathname.startsWith("/billing")) {
    return MODULES.find((m) => m.id === "financeBilling") ?? MODULES[0];
  }
  if (pathname.startsWith("/academic")) {
    return MODULES.find((m) => m.id === "academic") ?? MODULES[0];
  }
  return null;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeModule, setActiveModule] = useState(MODULES[0]);
  const [portalTheme, setPortalTheme] = useState<PortalThemeState>({
    appTitle: "Kreativa",
    logoMainUrl: null,
  });

  useEffect(() => {
    const mod = moduleForPathname(pathname);
    if (mod) setActiveModule(mod);
  }, [pathname]);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/settings/portal-theme");
        const j = (await res.json().catch(() => null)) as
          | { appTitle?: string; logoMainUrl?: string | null }
          | null;
        if (!j) return;
        setPortalTheme((prev) => ({
          appTitle: j.appTitle && j.appTitle.trim() ? j.appTitle : prev.appTitle,
          logoMainUrl: j.logoMainUrl ?? prev.logoMainUrl,
        }));
      } catch {
        // ignore theme fetch errors, keep defaults
      }
    })();
  }, []);

  return (
    <>
      {/* Backdrop for switcher */}
      {isSwitcherOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsSwitcherOpen(false)} />
      )}

      <aside
        className={`${collapsed ? "w-20" : "w-64"} ${activeModule.color} text-white flex flex-col shrink-0 transition-all duration-300 ease-in-out relative z-50 shadow-2xl`}
      >
        {/* Logo */}
        <div className="p-5 flex items-center gap-3 border-b border-white/10">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden">
            {portalTheme.logoMainUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={portalTheme.logoMainUrl}
                alt={portalTheme.appTitle}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <GraduationCap size={20} strokeWidth={1.5} />
            )}
          </div>
          {!collapsed && (
            <div>
              <p className="font-bold text-base tracking-tight leading-none">{portalTheme.appTitle}</p>
              
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
                  onClick={() => {
                    setActiveModule(mod);
                    setIsSwitcherOpen(false);
                    const firstMenu = mod.menus[0];
                    if (firstMenu) {
                      router.push(firstMenu.href);
                    }
                  }}
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
              <button
                key={menu.href}
                type="button"
                onClick={() => {
                  if (pathname !== menu.href) {
                    router.push(menu.href);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all group text-left ${
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
                  <span
                    className={`text-[13.5px] tracking-tight ${
                      isActive ? 'font-semibold text-slate-800' : 'font-normal'
                    }`}
                  >
                    {menu.name}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-white/10">
          <div className={`bg-black/20 rounded-2xl p-3 flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <button
              type="button"
              onClick={() => {
                confirmToast('Yakin ingin keluar dari aplikasi?', {
                  confirmLabel: 'Keluar',
                  onConfirm: () => {
                    toast.success('Anda telah keluar');
                    signOut({ callbackUrl: "/login" });
                  },
                });
              }}
              className={`flex items-center gap-3 text-left ${collapsed ? "justify-center" : ""}`}
            >
              <div className="w-8 h-8 rounded-lg bg-white/90 flex items-center justify-center text-slate-700 font-bold text-sm shrink-0">
                S
              </div>
              {!collapsed && (
                <div className="flex-1 overflow-hidden">
                  <p className="text-[13px] font-semibold truncate">Superadmin</p>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Yayasan</p>
                </div>
              )}
              {!collapsed && (
                <span className="inline-flex items-center gap-1 text-[11px] text-white/70 hover:text-white">
                  <LogOut size={14} className="shrink-0" />
                  <span>Keluar</span>
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export { MODULES };
