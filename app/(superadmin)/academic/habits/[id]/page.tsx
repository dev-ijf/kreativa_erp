'use client';

import { useEffect, useState, use } from 'react';
import { Button } from '@/components/ui/FormFields';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const BOOL_KEYS = [
  { k: 'wake_up_early', l: 'Bangun sebelum Subuh' },
  { k: 'fajr', l: 'Subuh' },
  { k: 'dhuhr', l: 'Dzuhur' },
  { k: 'asr', l: 'Ashar' },
  { k: 'maghrib', l: 'Maghrib' },
  { k: 'isha', l: 'Isya' },
  { k: 'dhuha', l: 'Dhuha' },
  { k: 'tahajud', l: 'Tahajud' },
  { k: 'read_quran', l: 'Baca Quran' },
  { k: 'sunnah_fasting', l: 'Puasa sunnah' },
  { k: 'pray_with_parents', l: 'Mengaji bersama Orang Tua' },
  { k: 'give_greetings', l: 'Beri Salam ke Orang Tua' },
  { k: 'smile_greet_polite', l: 'Senyum Salam Sopan Santun (5S)' },
  { k: 'help_parents', l: 'Bantu orang tua' },
  { k: 'parent_hug_pray', l: 'Orang Tua Memeluk & Mendoakan' },
  { k: 'child_tell_parents', l: 'Anak Bercerita ke Orang Tua' },
] as const;

export default function HabitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [row, setRow] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/academic/habits/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setRow(d?.error ? null : d);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="p-10 text-center text-slate-400">Memuat…</div>;
  if (!row) return <div className="p-10 text-center text-rose-500">Data tidak ditemukan</div>;

  return (
    <div className="p-6 max-w-[720px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/academic/habits">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Detail pembiasaan</h2>
          <p className="text-slate-500 text-[13px]">
            {(row.student_name as string) || '—'} · {String(row.habit_date || '').slice(0, 10)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm p-6">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Checklist harian</p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px]">
          {BOOL_KEYS.map(({ k, l }) => (
            <li key={k} className="flex justify-between border-b border-slate-50 py-2">
              <span className="text-slate-600">{l}</span>
              <span className={row[k] ? 'text-emerald-600 font-medium' : 'text-slate-300'}>
                {row[k] ? 'Ya' : 'Tidak'}
              </span>
            </li>
          ))}
          <li className="flex justify-between border-b border-slate-50 py-2">
            <span className="text-slate-600">Datang Tepat Waktu</span>
            <span className="text-slate-700 font-medium">{(row.on_time_arrival as string) || '–'}</span>
          </li>
        </ul>
      </div>

      {((row.quran_juz_info as string) || '').trim() && (
        <div className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm p-6">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Jilid / Juz Al-Quran</p>
          <p className="text-[13px] text-slate-700">{row.quran_juz_info as string}</p>
        </div>
      )}
    </div>
  );
}
