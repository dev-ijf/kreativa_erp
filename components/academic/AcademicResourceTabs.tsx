'use client';

import { ReactNode } from 'react';

export type AcademicTabId = 'all' | 'summary' | 'daily' | 'stats' | 'scorecard';

type TabDef = {
  id: AcademicTabId;
  label: string;
  content: ReactNode;
};

type Props = {
  active: AcademicTabId;
  onChange: (tab: AcademicTabId) => void;
  tabs: TabDef[];
};

/** Backward-compatible overload */
type LegacyProps = {
  active: AcademicTabId;
  onChange: (tab: AcademicTabId) => void;
  allLabel?: string;
  summaryLabel?: string;
  allContent: ReactNode;
  summaryContent: ReactNode;
  tabs?: undefined;
};

export default function AcademicResourceTabs(props: Props | LegacyProps) {
  const tabs: TabDef[] =
    props.tabs ??
    [
      { id: 'all' as const, label: (props as LegacyProps).allLabel ?? 'Semua data', content: (props as LegacyProps).allContent },
      { id: 'summary' as const, label: (props as LegacyProps).summaryLabel ?? 'Rekap per siswa', content: (props as LegacyProps).summaryContent },
    ];

  const activeTab = tabs.find((t) => t.id === props.active) ?? tabs[0];

  return (
    <div className="space-y-5">
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => props.onChange(t.id)}
            className={`px-4 py-2.5 text-[13px] font-semibold rounded-t-lg border-b-2 -mb-px transition-colors ${
              props.active === t.id
                ? 'border-sky-600 text-sky-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/80'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {activeTab.content}
    </div>
  );
}
