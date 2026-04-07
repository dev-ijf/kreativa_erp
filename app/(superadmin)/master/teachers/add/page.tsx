'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Input, Button, Select } from '@/components/ui/FormFields';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

type AvailUser = { id: number; full_name: string; email: string };

export default function AddTeacherPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'link' | 'create'>('link');
  const [available, setAvailable] = useState<AvailUser[]>([]);
  const [saving, setSaving] = useState(false);

  const [userId, setUserId] = useState('');
  const [nip, setNip] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [latestEducation, setLatestEducation] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    fetch('/api/master/teachers/available-users')
      .then((r) => r.json())
      .then((d) => setAvailable(Array.isArray(d) ? d : []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body =
        mode === 'link'
          ? {
              user_id: Number(userId),
              nip: nip || null,
              join_date: joinDate || null,
              latest_education: latestEducation || null,
            }
          : {
              full_name: fullName,
              email,
              school_id: schoolId ? Number(schoolId) : null,
              password_hash: password || 'hash',
              nip: nip || null,
              join_date: joinDate || null,
              latest_education: latestEducation || null,
            };

      if (mode === 'link' && !Number.isFinite(body.user_id)) {
        toast.error('Pilih pengguna');
        setSaving(false);
        return;
      }

      const res = await fetch('/api/master/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(j.error || 'Gagal menyimpan');
        setSaving(false);
        return;
      }
      toast.success('Guru ditambahkan');
      router.push('/master/teachers');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-[640px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/master/teachers">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Tambah Guru</h2>
          <p className="text-slate-400 text-[13px]">Hubungkan ke akun ada atau buat akun teacher baru</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden">
        <div className="p-6 space-y-5">
          <Field label="Mode">
            <Select value={mode} onChange={(e) => setMode(e.target.value as 'link' | 'create')}>
              <option value="link">Pilih pengguna yang sudah ada</option>
              <option value="create">Buat akun pengguna baru (role teacher)</option>
            </Select>
          </Field>

          {mode === 'link' ? (
            <Field label="Pengguna" required>
              <Select value={userId} onChange={(e) => setUserId(e.target.value)}>
                <option value="">— Pilih —</option>
                {available.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.email})
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <>
              <Field label="Nama lengkap" required>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </Field>
              <Field label="Email" required>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field label="School ID (opsional)">
                <Input value={schoolId} onChange={(e) => setSchoolId(e.target.value)} placeholder="mis. 4" />
              </Field>
              <Field label="Password hash / placeholder (opsional)">
                <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="default: hash" />
              </Field>
            </>
          )}

          <Field label="NIP">
            <Input value={nip} onChange={(e) => setNip(e.target.value)} />
          </Field>
          <Field label="Tanggal bergabung">
            <Input type="date" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} />
          </Field>
          <Field label="Pendidikan terakhir">
            <Input value={latestEducation} onChange={(e) => setLatestEducation(e.target.value)} />
          </Field>
        </div>
        <div className="bg-slate-50 border-t border-[#E2E8F1] p-5 flex justify-end gap-3">
          <Link href="/master/teachers">
            <Button variant="ghost" type="button">
              Batal
            </Button>
          </Link>
          <Button loading={saving} type="submit">
            Simpan
          </Button>
        </div>
      </form>
    </div>
  );
}
