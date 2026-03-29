'use client';

import { useEffect, useState } from 'react';
import StatsCard from '@/components/ui/StatsCard';
import { Users, School, Wallet, Receipt, TrendingUp, CreditCard, BarChart3, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

interface DashboardStats {
  totalSchools: number;
  totalStudents: number;
  totalUsers: number;
  totalBills: number;
  paidBills: number;
  unpaidBills: number;
  totalRevenue: string;
  partialBills: number;
  /** SUM transaksi sukses bulan berjalan (query partisi via rentang created_at) */
  transactionVolumeThisMonth?: string | number;
}

const QUICK_LINKS = [
  { label: 'Generate Tagihan', href: '/billing/generate', icon: <BarChart3 size={18} />, color: 'bg-orange-500' },
  { label: 'Matriks SPP', href: '/billing/matrix', icon: <TrendingUp size={18} />, color: 'bg-emerald-600' },
  { label: 'Kasir', href: '/billing/cashier', icon: <CreditCard size={18} />, color: 'bg-blue-600' },
  { label: 'Tambah Siswa', href: '/students', icon: <Users size={18} />, color: 'bg-violet-600' },
];

const mockRevenueData = [
  { name: 'Jan', value: 12000000 }, { name: 'Feb', value: 15000000 }, { name: 'Mar', value: 11000000 },
  { name: 'Apr', value: 18000000 }, { name: 'May', value: 25000000 }, { name: 'Jun', value: 21000000 },
];

const mockStudentsLevels = [
  { name: 'SD', count: 420 }, { name: 'SMP', count: 310 }, { name: 'SMA', count: 180 }
];
const COLORS = ['#8b5cf6', '#3b82f6', '#f59e0b', '#10b981'];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/superadmin/dashboard/stats')
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const fmt = (n?: number) => (n ?? 0).toLocaleString('id-ID');
  const fmtRp = (s?: string) => {
    const n = parseFloat(s ?? '0');
    return 'Rp ' + n.toLocaleString('id-ID');
  };
  const fmtShortRp = (val: any) => `Rp ${(val / 1000000)}M`;

  const billPieData = [
    { name: 'Lunas', value: stats?.paidBills || 1, color: '#10b981' },
    { name: 'Sebagian', value: stats?.partialBills || 1, color: '#f59e0b' },
    { name: 'Belum', value: stats?.unpaidBills || 1, color: '#f43f5e' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Selamat Datang, Superadmin 👋</h2>
          <p className="text-slate-400 text-[14px] mt-1">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${link.color} text-white px-3.5 py-2 rounded-2xl text-[12px] font-semibold flex items-center gap-2 hover:opacity-90 transition-all shadow-sm`}
            >
              {link.icon}
              <span className="hidden sm:inline">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Sekolah" value={loading ? '–' : fmt(stats?.totalSchools)} icon={<School size={18} />} color="bg-violet-100 text-violet-600" subtitle="Terdaftar" />
        <StatsCard title="Total Siswa" value={loading ? '–' : fmt(stats?.totalStudents)} icon={<Users size={18} />} color="bg-blue-100 text-blue-600" subtitle="Siswa Aktif" />
        <StatsCard title="Total Tagihan" value={loading ? '–' : fmt(stats?.totalBills)} icon={<Receipt size={18} />} color="bg-amber-100 text-amber-600" subtitle={`Lunas: ${fmt(stats?.paidBills)}`} />
        <StatsCard
          title="Pemasukan"
          value={loading ? '–' : fmtRp(stats?.totalRevenue)}
          icon={<Wallet size={18} />}
          color="bg-emerald-100 text-emerald-600"
          subtitle={
            loading
              ? '…'
              : `Transaksi sukses bulan ini: ${fmtRp(String(stats?.transactionVolumeThisMonth ?? 0))}`
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Pemasukan (Line Chart) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E2E8F1] p-5 shadow-sm">
           <h3 className="font-semibold text-slate-800 mb-4">Tren Pemasukan 6 Bulan Terakhir</h3>
           <div className="h-[250px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockRevenueData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F1" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={fmtShortRp} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                  <Tooltip formatter={(value) => [fmtRp(String(value)), 'Pendapatan']} contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F1' }} />
                  <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Distribusi Tagihan (Pie Chart / Gauge Concept) */}
        <div className="bg-white rounded-2xl border border-[#E2E8F1] p-5 shadow-sm flex flex-col items-center relative">
          <h3 className="font-semibold text-slate-800 mb-2 w-full text-left">Status Pembayaran Tagihan</h3>
          <div className="h-[200px] w-full relative mt-4">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={billPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                   {billPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                 </Pie>
                 <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
               </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-4">
                <span className="text-3xl font-bold text-slate-800">{stats?.totalBills || 0}</span>
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest">Tagihan</span>
             </div>
          </div>
          <div className="flex items-center justify-center gap-4 mt-2 w-full">
             {billPieData.map(d => (
               <div key={d.name} className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500">
                 <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} /> {d.name}
               </div>
             ))}
          </div>
        </div>

        {/* Distribusi Siswa (Bar Chart) */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-[#E2E8F1] p-5 shadow-sm">
           <h3 className="font-semibold text-slate-800 mb-4">Distribusi Siswa per Jenjang</h3>
           <div className="h-[220px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockStudentsLevels}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F1" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F1' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    {mockStudentsLevels.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Bar>
                </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Akses Cepat */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E2E8F1] p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Menu Akses Cepat</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Data Sekolah', href: '/master/schools', sub: 'Kelola sekolah', icon: <School size={18} />, color: 'text-violet-600 bg-violet-50' },
              { label: 'Induk Siswa', href: '/students', sub: 'Kelola data siswa', icon: <Users size={18} />, color: 'text-blue-600 bg-blue-50' },
              { label: 'Produk/Biaya', href: '/finance/products', sub: 'Setting SPP', icon: <Wallet size={18} />, color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Generate', href: '/billing/generate', sub: 'Tagihan Massal', icon: <BarChart3 size={18} />, color: 'text-orange-600 bg-orange-50' },
              { label: 'Matriks SPP', href: '/billing/matrix', sub: 'Buku Bantu', icon: <BookOpen size={18} />, color: 'text-pink-600 bg-pink-50' },
              { label: 'Kasir', href: '/billing/cashier', sub: 'Validasi', icon: <CreditCard size={18} />, color: 'text-teal-600 bg-teal-50' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col gap-2 p-4 rounded-2xl border border-[#E2E8F1] bg-white hover:bg-slate-50 transition-all group"
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${item.color} shrink-0`}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-[14px] font-bold text-slate-700 group-hover:text-violet-700 transition-colors">{item.label}</p>
                  <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{item.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
