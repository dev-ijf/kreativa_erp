import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Wallet, 
  BookOpen, 
  Ticket, 
  CreditCard, 
  Settings, 
  ChevronDown, 
  Search, 
  Bell,
  ScanLine,
  GraduationCap,
  Banknote,
  LogOut,
  Menu,
  PlusCircle,
  TrendingUp,
  UserPlus,
  ArrowUpDown,
  MoreVertical,
  Edit2,
  Trash2,
  Filter,
  Download,
  Mail,
  Lock,
  Check
} from 'lucide-react';

// --- DATA DEFINITIONS ---

const MODULES = [
  { id: 'event', name: 'Event Management', icon: <Ticket size={18} />, color: 'bg-[#5B21B6]', chartColor: '#7C3AED', hover: 'hover:bg-[#6D28D9]', active: 'bg-[#7C3AED]', text: 'text-purple-100' },
  { id: 'academic', name: 'Akademik', icon: <BookOpen size={18} />, color: 'bg-[#1E40AF]', chartColor: '#2563EB', hover: 'hover:bg-[#1D4ED8]', active: 'bg-[#2563EB]', text: 'text-blue-100' },
  { id: 'finance', name: 'Keuangan', icon: <Banknote size={18} />, color: 'bg-[#065F46]', chartColor: '#059669', hover: 'hover:bg-[#047857]', active: 'bg-[#059669]', text: 'text-emerald-100' },
  { id: 'master', name: 'Master Data', icon: <Users size={18} />, color: 'bg-[#9A3412]', chartColor: '#EA580C', hover: 'hover:bg-[#C2410C]', active: 'bg-[#EA580C]', text: 'text-orange-100' },
];

const MENUS = {
  event: [
    { name: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Events & Tickets', icon: <Calendar size={18} /> },
    { name: 'Orders', icon: <CreditCard size={18} /> },
    { name: 'Tickets', icon: <Ticket size={18} /> },
    { name: 'Scan QR', icon: <ScanLine size={18} /> },
    { name: 'Settings', icon: <Settings size={18} /> },
  ],
  academic: [
    { name: 'Dashboard Guru', icon: <LayoutDashboard size={18} /> },
    { name: 'Jadwal Pelajaran', icon: <Calendar size={18} /> },
    { name: 'Daftar Siswa', icon: <Users size={18} /> },
    { name: 'Input Nilai', icon: <GraduationCap size={18} /> },
    { name: 'Laporan Rapor', icon: <BookOpen size={18} /> },
  ],
  finance: [
    { name: 'Dashboard Finance', icon: <LayoutDashboard size={18} /> },
    { name: 'Tagihan SPP', icon: <Wallet size={18} /> },
    { name: 'Kasir / Bayar', icon: <CreditCard size={18} /> },
    { name: 'Laporan Keuangan', icon: <TrendingUp size={18} /> },
  ],
  master: [
    { name: 'Buku Induk Siswa', icon: <UserPlus size={18} /> },
    { name: 'Data Kelas', icon: <LayoutDashboard size={18} /> },
    { name: 'Data Guru/Staff', icon: <Users size={18} /> },
    { name: 'Profil Sekolah', icon: <Settings size={18} /> },
  ]
};

// --- CUSTOM CHART COMPONENTS ---

const GaugeChart = ({ value, color }) => {
  const radius = 60;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative w-full h-full min-h-[160px]">
      <svg className="w-48 h-32" viewBox="0 0 160 90">
        {/* Background Arc */}
        <path d="M 20 80 A 60 60 0 0 1 140 80" fill="none" stroke="#f1f5f9" strokeWidth="16" strokeLinecap="round" />
        {/* Value Arc */}
        <path 
          d="M 20 80 A 60 60 0 0 1 140 80" 
          fill="none" 
          stroke={color} 
          strokeWidth="16" 
          strokeLinecap="round" 
          strokeDasharray={circumference} 
          strokeDashoffset={strokeDashoffset} 
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute bottom-4 flex flex-col items-center">
        <span className="text-3xl font-bold text-slate-800 tracking-tight">{value}%</span>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Indeks KPI</span>
      </div>
    </div>
  );
};

const BarChart = ({ color }) => {
  const data = [40, 70, 45, 90, 65, 85, 100];
  const labels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  
  return (
    <div className="w-full h-48 flex items-end justify-between gap-2 mt-4 px-2">
      {data.map((val, i) => (
        <div key={i} className="flex flex-col items-center flex-1 group">
          <div className="w-full relative h-32 flex items-end justify-center">
            <div 
              className="w-full max-w-[24px] rounded-t-md transition-all duration-500 hover:opacity-80 relative"
              style={{ height: `${val}%`, backgroundColor: color }}
            >
              {/* Tooltip on hover */}
              <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded font-semibold transition-opacity pointer-events-none">
                {val}%
              </div>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 mt-3 font-medium">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
};

const LineChart = ({ color }) => {
  const data = [20, 50, 30, 80, 40, 90, 70, 100];
  const max = Math.max(...data);
  const min = 0;
  
  // Create SVG path points
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((val - min) / (max - min)) * 100;
    return `${x},${y}`;
  }).join(' ');

  // Create Area path
  const areaPoints = `0,100 ${points} 100,100`;

  return (
    <div className="w-full h-48 mt-4 relative">
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible preserveAspectRatio='none'">
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(line => (
          <line key={line} x1="0" y1={line} x2="100" y2={line} stroke="#f1f5f9" strokeWidth="0.5" />
        ))}
        {/* Area */}
        <polygon points={areaPoints} fill={`url(#grad-${color})`} />
        {/* Line */}
        <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {/* Data points */}
        {data.map((val, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = 100 - ((val - min) / (max - min)) * 100;
          return (
            <circle key={i} cx={x} cy={y} r="2" fill="white" stroke={color} strokeWidth="1.5" className="hover:r-4 transition-all" />
          )
        })}
      </svg>
    </div>
  );
};

// --- MAIN COMPONENTS ---

const DashboardCard = ({ title, value, icon, colorClass = "text-slate-400" }) => (
  <div className="bg-white p-7 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] group">
    <div className="flex justify-between items-start mb-5">
      <h3 className="text-slate-400 text-[12px] font-semibold uppercase tracking-[0.1em]">{title}</h3>
      <div className={`p-2.5 bg-slate-50 rounded-lg ${colorClass} group-hover:bg-opacity-80 transition-all`}>
        {icon}
      </div>
    </div>
    <div className="flex flex-col">
      <span className="text-3xl font-semibold text-slate-800 tracking-tight">{value}</span>
    </div>
  </div>
);

const ChartCard = ({ title, subtitle, children }) => (
  <div className="bg-white p-7 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
    <div className="mb-2">
      <h3 className="font-semibold text-lg text-slate-800 tracking-tight">{title}</h3>
      <p className="text-[12px] text-slate-400">{subtitle}</p>
    </div>
    <div className="flex-1 flex items-center justify-center">
      {children}
    </div>
  </div>
);

export default function App() {
  const [activeModule, setActiveModule] = useState(MODULES[0]);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [role, setRole] = useState('superadmin');
  
  // State for form components (Showcase)
  const [toggleSwitch, setToggleSwitch] = useState(true);

  // Inject Google Font
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  const currentMenus = MENUS[activeModule.id];

  const switchModule = (mod) => {
    setActiveModule(mod);
    setActiveMenu(MENUS[mod.id][0].name);
    setIsSwitcherOpen(false);
  };

  const fontStyle = { 
    fontFamily: "'Source Sans Pro', sans-serif",
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale'
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-600 overflow-hidden" style={fontStyle}>
      
      {/* SIDEBAR */}
      <aside 
        className={`${sidebarOpen ? 'w-72' : 'w-24'} ${activeModule.color} text-white flex flex-col transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] z-30 shadow-2xl shadow-indigo-900/10 shrink-0`}
      >
        {/* Logo Section */}
        <div className="p-8 flex items-center gap-3.5">
          <div className="w-10 h-10 bg-white/15 backdrop-blur-xl rounded-[14px] flex items-center justify-center text-white shrink-0 border border-white/20 shadow-sm">
            <GraduationCap size={22} strokeWidth={1.5} />
          </div>
          {sidebarOpen && (
            <div className="flex flex-col whitespace-nowrap">
              <span className="font-semibold text-[22px] tracking-tight leading-none italic">Kreativa</span>
              <span className="text-[9px] font-bold tracking-[0.2em] opacity-50 mt-1">GLOBAL SCHOOL</span>
            </div>
          )}
        </div>

        {/* CONTEXT SWITCHER */}
        <div className="px-6 mb-8">
          <div className="relative">
            <button 
              onClick={() => role === 'superadmin' && setIsSwitcherOpen(!isSwitcherOpen)}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all border ${
                role === 'superadmin' 
                ? 'bg-white/10 border-white/5 hover:bg-white/15 cursor-pointer shadow-sm' 
                : 'bg-black/5 border-transparent cursor-default'
              }`}
            >
              <div className="flex items-center gap-3.5 overflow-hidden">
                <div className="p-2 bg-white rounded-lg text-slate-600 shadow-md shrink-0">
                  {React.cloneElement(activeModule.icon, { size: 16 })}
                </div>
                {sidebarOpen && (
                  <div className="text-left overflow-hidden whitespace-nowrap">
                    <p className="text-[10px] uppercase font-bold opacity-40 leading-none mb-1 tracking-widest">Layanan</p>
                    <p className="text-[15px] font-semibold truncate tracking-tight">{activeModule.name}</p>
                  </div>
                )}
              </div>
              {sidebarOpen && role === 'superadmin' && (
                <ChevronDown size={14} className={`opacity-40 transition-transform duration-300 shrink-0 ${isSwitcherOpen ? 'rotate-180' : ''}`} />
              )}
            </button>

            {/* Dropdown Panel */}
            {isSwitcherOpen && (
              <div className="absolute left-0 right-0 mt-3 bg-white border border-slate-100 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-50 p-2.5 animate-in fade-in slide-in-from-top-2">
                <p className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1.5">Ganti Modul Aplikasi</p>
                {MODULES.map((mod) => (
                  <button
                    key={mod.id}
                    onClick={() => switchModule(mod)}
                    className={`w-full flex items-center gap-4 p-3 rounded-lg mb-1 transition-all ${
                      activeModule.id === mod.id 
                      ? 'bg-slate-50 text-slate-800 font-semibold' 
                      : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <div className={`p-2 ${mod.color} text-white rounded-lg shadow-sm scale-90 shrink-0`}>
                      {mod.icon}
                    </div>
                    <span className="text-[14px] tracking-tight whitespace-nowrap">{mod.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR MENUS */}
        <nav className="flex-1 px-6 space-y-1 overflow-y-auto scrollbar-hide">
          {currentMenus.map((menu) => {
            const isActive = activeMenu === menu.name;
            return (
              <button
                key={menu.name}
                onClick={() => setActiveMenu(menu.name)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group relative ${
                  isActive 
                    ? 'bg-white text-slate-800 shadow-lg shadow-black/5' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={`shrink-0 transition-all ${isActive ? 'scale-110' : 'opacity-80 group-hover:opacity-100'}`}>
                  {menu.icon}
                </span>
                {sidebarOpen && <span className={`text-[15px] tracking-tight whitespace-nowrap ${isActive ? 'font-semibold' : 'font-normal'}`}>{menu.name}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-6">
          <div className={`bg-black/10 rounded-xl p-3.5 flex items-center shadow-inner ${sidebarOpen ? 'gap-4' : 'justify-center'}`}>
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-slate-600 font-semibold shadow-sm text-sm shrink-0">
              D
            </div>
            {sidebarOpen && (
              <div className="flex-1 overflow-hidden whitespace-nowrap">
                <p className="text-[14px] font-semibold truncate tracking-tight text-white/95">Dev Indonesia</p>
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mt-0.5">{role}</p>
              </div>
            )}
            {sidebarOpen && <LogOut size={14} className="text-white/20 cursor-pointer hover:text-white transition-colors shrink-0" />}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* HEADER */}
        <header className="h-20 bg-white border-b border-slate-100 px-10 flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-lg transition-all"
            >
              <Menu size={20} strokeWidth={1.5} />
            </button>
            <div>
               <h1 className="text-xl font-semibold text-slate-800 tracking-tight leading-none mb-1.5">{activeMenu}</h1>
               <div className="flex items-center gap-2">
                 <span className={`w-1.5 h-1.5 rounded-full ${activeModule.color.replace('bg-', 'bg-')}`}></span>
                 <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-[0.15em]">{activeModule.name}</p>
               </div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden lg:flex items-center bg-slate-50/80 p-1.5 rounded-xl gap-1 border border-slate-100/50">
              {['superadmin', 'guru', 'finance'].map((r) => (
                <button 
                  key={r}
                  onClick={() => {
                    setRole(r);
                    if(r === 'guru') switchModule(MODULES[1]);
                    if(r === 'finance') switchModule(MODULES[2]);
                    if(r === 'superadmin') switchModule(MODULES[0]);
                  }}
                  className={`px-4 py-2 text-[10px] font-bold uppercase rounded-lg transition-all tracking-wide ${role === r ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="relative group hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-500 transition-colors" size={16} strokeWidth={2} />
              <input 
                type="text" 
                placeholder="Cari data..." 
                className="bg-white border border-slate-300 rounded-lg py-2.5 pl-11 pr-5 text-[14px] focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-400 focus:shadow-sm transition-all w-64 placeholder:text-slate-400"
              />
            </div>
            
            <button className="relative p-2.5 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-lg transition-all">
              <Bell size={20} strokeWidth={1.5} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* CONTENT SCROLLABLE AREA */}
        <div className="flex-1 p-8 md:p-10 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto space-y-8">
            
            {/* WELCOME BANNER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <h2 className="text-3xl font-semibold text-slate-800 tracking-tight mb-2">
                   Halo, Selamat Datang Kembali
                </h2>
                <p className="text-[15px] text-slate-400 font-normal tracking-tight">Monitor aktivitas sekolah Anda hari ini, Rabu 12 Maret 2026</p>
              </div>
              <button className={`${activeModule.color} text-white px-6 py-3.5 rounded-lg font-semibold text-[13px] uppercase tracking-wide flex items-center gap-3 shadow-xl shadow-indigo-200/50 hover:translate-y-[-2px] active:translate-y-[0px] transition-all shrink-0`}>
                <PlusCircle size={18} strokeWidth={2} />
                <span>Tambah Entri</span>
              </button>
            </div>

            {/* DYNAMIC STATS (CARDS) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {activeModule.id === 'event' ? (
                <>
                  <DashboardCard title="Total Events" value="4" icon={<Calendar size={20} />} colorClass="text-purple-500" />
                  <DashboardCard title="Total Customers" value="1.733" icon={<Users size={20} />} colorClass="text-pink-500" />
                  <DashboardCard title="Total Orders" value="475" icon={<CreditCard size={20} />} colorClass="text-blue-500" />
                  <DashboardCard title="Total Revenue" value="Rp 92.834k" icon={<Banknote size={20} />} colorClass="text-emerald-500" />
                </>
              ) : (
                <>
                  <DashboardCard title="Total Siswa" value="1.240" icon={<Users size={20} />} colorClass="text-indigo-500" />
                  <DashboardCard title="Rata-rata Nilai" value="84.5" icon={<TrendingUp size={20} />} colorClass="text-amber-500" />
                  <DashboardCard title="Kehadiran" value="98%" icon={<Calendar size={20} />} colorClass="text-emerald-500" />
                  <DashboardCard title="Staf Aktif" value="42" icon={<UserPlus size={20} />} colorClass="text-rose-500" />
                </>
              )}
            </div>

            {/* CHARTS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ChartCard title="Statistik Kunjungan" subtitle="Data harian sepekan terakhir">
                <BarChart color={activeModule.chartColor} />
              </ChartCard>
              <ChartCard title="Tren Aktivitas" subtitle="Aktivitas rata-rata per jam">
                <LineChart color={activeModule.chartColor} />
              </ChartCard>
              <ChartCard title="Performa Sistem" subtitle="Stabilitas dan respon aplikasi">
                <GaugeChart value={86} color={activeModule.chartColor} />
              </ChartCard>
            </div>

            {/* DATAGRID & FORMS SECTION */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* ADVANCED DATAGRID TABLE */}
              <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-semibold text-lg text-slate-800 tracking-tight">Manajemen Data Lanjutan</h3>
                    <p className="text-[13px] text-slate-400 mt-0.5">Tabel interaktif dengan fitur sortir dan seleksi</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="p-2 border border-slate-300 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all">
                      <Filter size={16} />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-all">
                      <Download size={14} />
                      Eksport
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200">
                        <th className="px-6 py-4 w-12">
                          <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                        </th>
                        <th className="px-6 py-4 text-[13px] font-bold text-slate-700 cursor-pointer hover:text-slate-900 transition-colors group">
                          <div className="flex items-center gap-1">Referensi <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" /></div>
                        </th>
                        <th className="px-6 py-4 text-[13px] font-bold text-slate-700">Informasi Utama</th>
                        <th className="px-6 py-4 text-[13px] font-bold text-slate-700">Tanggal</th>
                        <th className="px-6 py-4 text-[13px] font-bold text-slate-700">Status</th>
                        <th className="px-6 py-4 text-[13px] font-bold text-slate-700 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/80">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                          </td>
                          <td className="px-6 py-4 text-[13px] font-mono text-slate-500 font-medium">
                            #TRX-{202600 + i}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-[14px] font-semibold text-slate-700">
                              {activeModule.id === 'event' ? `Registrasi Peserta VIP ${i}` : `Pembayaran SPP Bulan Maret`}
                            </p>
                            <p className="text-[12px] text-slate-400 mt-0.5">System Administrator</p>
                          </td>
                          <td className="px-6 py-4 text-[13px] text-slate-500">
                            12 Mar 2026
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 text-[11px] font-bold uppercase rounded-full inline-block shadow-sm ${
                              i % 3 === 0 ? 'bg-amber-500 text-white' : 
                              i % 4 === 0 ? 'bg-rose-500 text-white' : 
                              'bg-emerald-500 text-white'
                            }`}>
                              {i % 3 === 0 ? 'Pending' : i % 4 === 0 ? 'Gagal' : 'Selesai'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-1.5 text-slate-500 hover:text-blue-600 bg-white hover:bg-blue-50 rounded-lg shadow-sm border border-slate-200"><Edit2 size={14} /></button>
                              <button className="p-1.5 text-slate-500 hover:text-rose-600 bg-white hover:bg-rose-50 rounded-lg shadow-sm border border-slate-200"><Trash2 size={14} /></button>
                              <button className="p-1.5 text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-50 rounded-lg shadow-sm border border-slate-200"><MoreVertical size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                  <span className="text-[13px] text-slate-400">Menampilkan 1-5 dari 42 data</span>
                  <div className="flex gap-1">
                    <button className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-[13px] font-medium text-slate-500 hover:bg-slate-50">Prev</button>
                    <button className="px-3 py-1.5 border border-slate-200 bg-indigo-600 text-white rounded-lg text-[13px] font-medium">1</button>
                    <button className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-[13px] font-medium text-slate-500 hover:bg-slate-50">2</button>
                    <button className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-[13px] font-medium text-slate-500 hover:bg-slate-50">Next</button>
                  </div>
                </div>
              </div>

              {/* ALL FORM COMPONENTS SHOWCASE */}
              <div className="bg-white p-7 rounded-xl shadow-sm border border-slate-200 space-y-6">
                <div className="mb-4">
                  <h3 className="font-semibold text-lg text-slate-800 tracking-tight">Kompilasi Input Form</h3>
                  <p className="text-[13px] text-slate-400 mt-0.5">Demonstrasi semua elemen form UI</p>
                </div>

                <form className="space-y-5" onSubmit={e => e.preventDefault()}>
                  
                  {/* Text Input with Icon */}
                  <div>
                    <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2">Nama Lengkap</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="email" 
                        placeholder="email@sekolah.edu" 
                        className="w-full bg-white border border-slate-300 rounded-lg py-2.5 pl-10 pr-4 text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Select Dropdown */}
                  <div>
                    <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2">Pilih Departemen</label>
                    <div className="relative">
                      <select className="w-full bg-white border border-slate-300 rounded-lg py-2.5 pl-4 pr-10 text-[14px] appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-600">
                        <option value="">Pilih Departemen...</option>
                        <option value="it">Teknologi Informasi</option>
                        <option value="hr">Sumber Daya Manusia</option>
                        <option value="finance">Keuangan</option>
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                  </div>

                  {/* Textarea */}
                  <div>
                    <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2">Catatan Tambahan</label>
                    <textarea 
                      rows="3"
                      placeholder="Tulis keterangan di sini..."
                      className="w-full bg-white border border-slate-300 rounded-lg py-3 px-4 text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 resize-none"
                    ></textarea>
                  </div>

                  {/* Radio Buttons */}
                  <div>
                    <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-3">Prioritas</label>
                    <div className="flex gap-4">
                      {['Rendah', 'Sedang', 'Tinggi'].map((level, idx) => (
                        <label key={idx} className="flex items-center gap-2 cursor-pointer group">
                          <div className="relative flex items-center justify-center">
                            <input type="radio" name="priority" className="peer appearance-none w-4 h-4 border border-slate-300 rounded-full checked:border-indigo-600 checked:bg-indigo-600 transition-all" />
                            <div className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                          </div>
                          <span className="text-[13px] text-slate-600 group-hover:text-slate-800 transition-colors">{level}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Checkboxes & Toggle Switch */}
                  <div className="flex items-center justify-between pt-2">
                    
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input type="checkbox" className="peer appearance-none w-5 h-5 border border-slate-300 rounded-md checked:bg-indigo-600 checked:border-indigo-600 transition-all" />
                        <Check size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                      </div>
                      <span className="text-[13px] text-slate-600 group-hover:text-slate-800 transition-colors">Setuju Ketentuan</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-[13px] text-slate-600">Status Aktif</span>
                      <div className="relative">
                        <input type="checkbox" className="sr-only peer" checked={toggleSwitch} onChange={() => setToggleSwitch(!toggleSwitch)} />
                        <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </div>
                    </label>

                  </div>

                  <button className={`w-full ${activeModule.color} text-white mt-2 py-3.5 rounded-lg font-bold text-[13px] uppercase tracking-wide shadow-lg shadow-indigo-200/50 hover:opacity-90 transition-opacity`}>
                    Simpan Data Form
                  </button>

                </form>
              </div>

            </div>

          </div>
        </div>
      </main>
    </div>
  );
}