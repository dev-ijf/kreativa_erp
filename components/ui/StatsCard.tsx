import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color?: string;
  subtitle?: string;
  trend?: { value: string; positive: boolean };
}

export default function StatsCard({ title, value, icon, color = 'bg-slate-100 text-slate-500', subtitle, trend }: StatsCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F1] p-5 hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-4">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        <div className={`p-2.5 rounded-2xl ${color} transition-all`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-semibold text-slate-800 tracking-tight">{value}</p>
      {(subtitle || trend) && (
        <div className="flex items-center gap-2 mt-1.5">
          {subtitle && <p className="text-[12px] text-slate-400">{subtitle}</p>}
          {trend && (
            <span className={`text-[11px] font-semibold ${trend.positive ? 'text-emerald-600' : 'text-rose-500'}`}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
