'use client';

import { ReactNode } from 'react';

export type AcademicTabId = 'all' | 'summary';

type Props = {
  active: AcademicTabId;
  onChange: (tab: AcademicTabId) => void;
  allLabel?: string;
  summaryLabel?: string;
  allContent: ReactNode;
  summaryContent: ReactNode;
};

export default function AcademicResourceTabs({
  active,
  onChange,
  allLabel = 'Semua data',
  summaryLabel = 'Rekap per siswa',
  allContent,
  summaryContent,
}: Props) {
  return (
    <div className="space-y-5">
      <div className="flex gap-1 border-b border-slate-200">
        <button
          type="button"
          onClick={() => onChange('all')}
          className={`px-4 py-2.5 text-[13px] font-semibold rounded-t-lg border-b-2 -mb-px transition-colors ${
            active === 'all'
              ? 'border-sky-600 text-sky-800 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/80'
          }`}
        >
          {allLabel}
        </button>
        <button
          type="button"
          onClick={() => onChange('summary')}
          className={`px-4 py-2.5 text-[13px] font-semibold rounded-t-lg border-b-2 -mb-px transition-colors ${
            active === 'summary'
              ? 'border-sky-600 text-sky-800 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/80'
          }`}
        >
          {summaryLabel}
        </button>
      </div>
      {active === 'all' ? allContent : summaryContent}
    </div>
  );
}
