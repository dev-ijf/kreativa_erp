'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import { Button, Field, Input, Select } from '@/components/ui/FormFields';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { confirmToast } from '@/components/ui/confirmToast';
import Modal from '@/components/ui/Modal';

interface CohortRow {
  id: number;
  school_id: number;
  name: string;
  school_name: string;
}

export default function CohortsPage() {
  const [rows, setRows] = useState<CohortRow[]>([]);
  const [schools, setSchools] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const [modal, setModal] = useState<{ open: boolean; record: Partial<CohortRow> }>({
    open: false,
    record: {},
  });

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/master/cohorts').then((r) => r.json()),
      fetch('/api/master/schools').then((r) => r.json()),
    ]).then(([d, s]) => {
      setRows(d);
      setSchools(s);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const isUpdate = !!modal.record.id;
    const url = isUpdate ? `/api/master/cohorts/${modal.record.id}` : '/api/master/cohorts';
    const method = isUpdate ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        school_id: modal.record.school_id,
        name: modal.record.name,
      }),
    });

    setSaving(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error(j.error || 'Gagal menyimpan Angkatan');
      return;
    }

    toast.success('Angkatan berhasil disimpan');
    setModal({ open: false, record: {} });
    load();
  };

  const handleDelete = (id: number) => {
    confirmToast('Hapus Angkatan ini? Pastikan angkatan tidak terikat ke master siswa manapun.', {
      confirmLabel: 'Hapus',
      onConfirm: async () => {
        setDeleting(id);
        const res = await fetch(`/api/master/cohorts/${id}`, { method: 'DELETE' });
        setDeleting(null);
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          toast.error(j.error || 'Gagal menghapus Angkatan');
          return;
        }
        toast.success('Angkatan berhasil dihapus');
        load();
      },
    });
  };

  const columns = [
    { key: 'school_name', label: 'Sekolah', sortable: true },
    { key: 'name', label: 'Nama Angkatan', sortable: true },
    {
      key: 'actions',
      label: '',
      className: 'text-right w-24',
      render: (r: CohortRow) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setModal({ open: true, record: { ...r } })}
          >
            <Edit2 size={13} />
          </Button>
          <Button
            size="sm"
            variant="danger"
            loading={deleting === r.id}
            onClick={() => handleDelete(r.id)}
          >
            <Trash2 size={13} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-violet-600" /> Master Angkatan (Cohorts)
          </h2>
          <p className="text-slate-400 text-[13px]">
            Konfigurasi nama angkatan (contoh: Angkatan 2024, Batch 1)
          </p>
        </div>
        <Button onClick={() => setModal({ open: true, record: { school_id: schools[0]?.id } })}>
          <Plus size={15} /> Tambah Angkatan
        </Button>
      </div>

      <DataTable data={rows} columns={columns} loading={loading} rowKey={(r) => r.id} />

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, record: {} })}
        title={modal.record.id ? 'Edit Angkatan' : 'Tambah Angkatan'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Field label="Sekolah" required>
            <Select
              value={modal.record.school_id || ''}
              onChange={(e) =>
                setModal((m) => ({ ...m, record: { ...m.record, school_id: Number(e.target.value) } }))
              }
              required
            >
              <option value="">— Pilih Sekolah —</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nama Angkatan" required>
            <Input
              value={modal.record.name || ''}
              onChange={(e) => setModal((m) => ({ ...m, record: { ...m.record, name: e.target.value } }))}
              placeholder="Contoh: Angkatan 2024"
              required
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModal({ open: false, record: {} })}>
              Batal
            </Button>
            <Button type="submit" loading={saving}>
              Simpan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
