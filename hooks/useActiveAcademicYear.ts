'use client';

import { useEffect, useState } from 'react';

/** Tahun ajaran aktif (`core_academic_years.is_active`) untuk filter kelas/siswa. */
export function useActiveAcademicYear(): number | null {
  const [id, setId] = useState<number | null>(null);
  useEffect(() => {
    void fetch('/api/master/academic-years')
      .then((r) => r.json())
      .then((rows: { id: number; is_active?: boolean }[]) => {
        if (!Array.isArray(rows)) {
          setId(null);
          return;
        }
        const active = rows.find((x) => x.is_active);
        setId(active?.id ?? null);
      })
      .catch(() => setId(null));
  }, []);
  return id;
}
