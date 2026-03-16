'use client';

import { ReactNode, useState } from 'react';
import { ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  actions?: ReactNode;
  emptyText?: string;
  pageSize?: number;
  pageSizeOptions?: number[];
  rowKey?: (row: T) => string | number;
}

export default function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  searchable = true,
  searchPlaceholder = 'Cari data...',
  actions,
  emptyText = 'Tidak ada data',
  pageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  rowKey,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(pageSize);

  const filtered = data.filter((row) =>
    !search ||
    Object.values(row).some((v) =>
      String(v ?? '').toLowerCase().includes(search.toLowerCase())
    )
  );

  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const va = String(a[sortKey] ?? '');
        const vb = String(b[sortKey] ?? '');
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      })
    : filtered;

  const totalPages = Math.max(1, Math.ceil(sorted.length / limit));
  const currentPage = Math.min(page, totalPages);
  const paginated = sorted.slice((currentPage - 1) * limit, currentPage * limit);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const getValue = (row: T, key: string) => {
    const parts = key.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return parts.reduce((acc: any, p) => acc?.[p], row);
  };

  const pageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden">
      {/* Toolbar */}
      {(searchable || actions) && (
        <div className="px-5 py-4 border-b border-[#E2E8F1] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {searchable && (
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder={searchPlaceholder}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] w-60 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 placeholder:text-slate-400"
              />
            </div>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-[#E2E8F1]">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap ${col.sortable ? 'cursor-pointer select-none hover:text-slate-700' : ''} ${col.className ?? ''}`}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && (
                      <span className="text-slate-300">
                        {sortKey === String(col.key)
                          ? sortDir === 'asc' ? <ChevronUp size={13} className="text-violet-500" /> : <ChevronDown size={13} className="text-violet-500" />
                          : <ChevronUp size={13} />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[#E2E8F1]">
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-5 py-3.5">
                      <div className="h-4 bg-slate-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-16 text-slate-400 text-[13px]">
                  {emptyText}
                </td>
              </tr>
            ) : (
              paginated.map((row, i) => (
                <tr
                  key={rowKey ? rowKey(row) : i}
                  className="border-b border-[#E2E8F1] last:border-0 hover:bg-slate-50/50 transition-colors"
                >
                  {columns.map((col) => (
                    <td key={String(col.key)} className={`px-5 py-3.5 text-[13px] text-slate-700 ${col.className ?? ''}`}>
                      {col.render ? col.render(row) : String(getValue(row, String(col.key)) ?? '–')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="px-5 py-3.5 border-t border-[#E2E8F1] flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-3">
            <p className="text-[12px] text-slate-400">
              {sorted.length} data · Halaman {currentPage} dari {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-slate-400">Baris per halaman:</span>
              <select 
                value={limit} 
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="text-[12px] border border-[#E2E8F1] rounded p-1 outline-none text-slate-500 bg-white"
              >
                {pageSizeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={currentPage === 1} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-all">
              <ChevronsLeft size={15} />
            </button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-all">
              <ChevronLeft size={15} />
            </button>
            {pageNumbers().map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} className="px-2 text-slate-400 text-[13px]">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`min-w-[32px] h-8 rounded-lg text-[12px] font-medium transition-all ${
                    currentPage === p
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-all">
              <ChevronRight size={15} />
            </button>
            <button onClick={() => setPage(totalPages)} disabled={currentPage === totalPages} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-all">
              <ChevronsRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
