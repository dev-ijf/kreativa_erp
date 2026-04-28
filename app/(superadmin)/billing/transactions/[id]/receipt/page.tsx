'use client';

import { Suspense, use, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { terbilang } from '@/lib/terbilang';

type Header = {
  id: string | number;
  created_at: string;
  reference_no: string;
  total_amount: string;
  status: string | null;
  payment_date: string | null;
  va_no: string | null;
  payment_method_name: string | null;
  payment_method_category: string | null;
  payer_name: string | null;
  payer_email: string | null;
  student_id: number | null;
  student_name: string | null;
  nis: string | null;
  program: string | null;
  school_id: number | null;
  school_name: string | null;
  school_address: string | null;
  school_logo_url: string | null;
  bank_channel_code: string | null;
  school_code: string | null;
  academic_year_id: number | null;
  academic_year_name: string | null;
  class_name: string | null;
  cash: boolean;
};

type Item = {
  id: string | number;
  amount_paid: string;
  bill_id: number;
  product_id: number;
  bill_title: string;
  bill_month: number | null;
  bill_year: number | null;
  related_month: string | null;
  product_name: string;
  product_payment_type: string;
};

type ReceiptResponse = { header: Header; items: Item[] };

function fmtMoney(v: string | number | null | undefined): string {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? 0));
  if (!Number.isFinite(n)) return 'Rp 0';
  return 'Rp ' + n.toLocaleString('id-ID', { minimumFractionDigits: 0 });
}

function fmtDateLong(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return format(d, 'd MMMM yyyy', { locale: idLocale }).toUpperCase();
}

async function dataUrlFromImage(src: string): Promise<string | null> {
  try {
    const res = await fetch(src, { cache: 'no-cache' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(typeof reader.result === 'string' ? reader.result : null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function ReceiptInner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const createdAt = searchParams.get('created_at');

  const [data, setData] = useState<ReceiptResponse | null>(null);
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<'load' | 'render' | 'preview' | 'fallback'>('load');
  const canvasNode = useRef<HTMLDivElement | null>(null);
  const pdfTriggered = useRef(false);

  // 1. Fetch payload + logo data url.
  useEffect(() => {
    if (!createdAt) {
      setError('Parameter created_at hilang. Buka dari Riwayat Pembayaran.');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/billing/transactions/${id}/receipt-data?created_at=${encodeURIComponent(createdAt)}`
        );
        const json = (await res.json()) as ReceiptResponse | { error?: string };
        if (!res.ok) {
          throw new Error(('error' in json && json.error) || 'Gagal memuat bukti');
        }
        const payload = json as ReceiptResponse;
        if (cancelled) return;
        setData(payload);
        if (payload.header.school_logo_url) {
          const url = await dataUrlFromImage(payload.header.school_logo_url);
          if (!cancelled) setLogoSrc(url);
        }
        if (!cancelled) setPhase('render');
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, createdAt]);

  // 2. Setelah node siap, generate PDF lalu replace tab dengan blob URL.
  useEffect(() => {
    if (phase !== 'render') return;
    if (!data || !canvasNode.current) return;
    if (pdfTriggered.current) return;
    pdfTriggered.current = true;

    const node = canvasNode.current;
    const fileSafe = `bukti-${data.header.reference_no || data.header.id}`.replace(
      /[^a-zA-Z0-9_-]+/g,
      '_'
    );

    (async () => {
      try {
        const [{ default: html2canvas }, jspdfMod] = await Promise.all([
          import('html2canvas'),
          import('jspdf'),
        ]);
        const JsPDFCtor = jspdfMod.jsPDF ?? jspdfMod.default;

        // Beri waktu render font + image data url settle dulu.
        await new Promise((r) => setTimeout(r, 80));

        const canvas = await html2canvas(node, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new JsPDFCtor({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4',
        });

        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const margin = 8;
        const maxW = pageW - margin * 2;
        const maxH = pageH - margin * 2;

        const ratio = canvas.width / canvas.height;
        let drawW = maxW;
        let drawH = drawW / ratio;
        if (drawH > maxH) {
          drawH = maxH;
          drawW = drawH * ratio;
        }
        const offsetX = (pageW - drawW) / 2;
        const offsetY = (pageH - drawH) / 2;

        pdf.addImage(imgData, 'PNG', offsetX, offsetY, drawW, drawH, undefined, 'FAST');

        const blob = pdf.output('blob');
        const url = URL.createObjectURL(blob);
        try {
          window.history.replaceState(null, '', `${window.location.pathname}#${fileSafe}`);
        } catch {
          /* ignore */
        }
        setPhase('preview');
        // Replace current tab dengan PDF preview di viewer browser.
        // Kalau gagal (mis. extension blokir), tampilkan tombol manual.
        setTimeout(() => {
          try {
            window.location.replace(url);
          } catch {
            setPhase('fallback');
          }
        }, 50);
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : 'Gagal membuat PDF');
      }
    })();
  }, [phase, data]);

  const totalNumber = useMemo(() => {
    if (!data) return 0;
    const n = parseFloat(String(data.header.total_amount ?? 0));
    return Number.isFinite(n) ? n : 0;
  }, [data]);

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <p className="text-red-600 mb-3">{error}</p>
        <Link href="/billing/transactions" className="text-blue-600 hover:underline text-[13px]">
          Kembali ke Riwayat Pembayaran
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-slate-500 text-[13px] text-center">Memuat data bukti pembayaran…</div>
    );
  }

  const { header, items } = data;
  const dateForKw =
    header.payment_date ?? header.created_at ?? new Date().toISOString();
  const cashLabel = header.cash ? 'TUNAI' : 'NON TUNAI';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 gap-4">
      <div className="text-slate-500 text-[13px]">
        {phase === 'preview'
          ? 'Membuka pratinjau PDF…'
          : 'Memproses bukti pembayaran sebagai PDF…'}
      </div>
      <Link
        href={`/billing/transactions/${id}?created_at=${encodeURIComponent(createdAt ?? '')}`}
        className="text-blue-600 hover:underline text-[12px]"
      >
        Kembali ke detail transaksi
      </Link>

      {/* Off-screen kwitansi yang akan ditangkap html2canvas. */}
      <div
        style={{
          position: 'fixed',
          left: -10000,
          top: 0,
          width: 1024,
          background: '#ffffff',
        }}
        aria-hidden="true"
      >
        <div
          ref={canvasNode}
          style={{
            width: 1024,
            padding: 32,
            background: '#ffffff',
            color: '#0f172a',
            fontFamily:
              "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
            fontSize: 14,
            lineHeight: 1.4,
            border: '1px solid #e2e8f0',
            boxSizing: 'border-box',
          }}
        >
          {/* Header: logo + nama sekolah | nomor kwitansi + tanggal + cash flag */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              borderBottom: '2px solid #0f172a',
              paddingBottom: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {logoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoSrc}
                  alt=""
                  style={{ width: 84, height: 84, objectFit: 'contain' }}
                  crossOrigin="anonymous"
                />
              ) : (
                <div
                  style={{
                    width: 84,
                    height: 84,
                    background: '#f1f5f9',
                    borderRadius: 8,
                  }}
                />
              )}
              <div style={{ borderLeft: '2px solid #94a3b8', paddingLeft: 16 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
                  {header.school_name || '—'}
                </div>
                {header.school_address ? (
                  <div style={{ fontSize: 13, color: '#475569' }}>{header.school_address}</div>
                ) : null}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 13, color: '#0f172a' }}>
              <div>
                <strong>NO KWITANSI :</strong>{' '}
                <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                  {header.reference_no || '-'}
                </span>
              </div>
              <div style={{ marginTop: 2 }}>{fmtDateLong(dateForKw)}</div>
              <div style={{ marginTop: 2, fontWeight: 700 }}>{cashLabel}</div>
            </div>
          </div>

          {/* Title */}
          <div
            style={{
              textAlign: 'center',
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 1,
              padding: '20px 0 16px',
            }}
          >
            BUKTI PEMBAYARAN
          </div>

          {/* Identitas siswa */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 32,
              padding: '8px 0 12px',
              borderBottom: '1px solid #cbd5e1',
            }}
          >
            <div>
              <FieldLine label="NIS" value={header.nis ?? '-'} />
              <FieldLine label="NAMA" value={header.student_name ?? '-'} />
              <FieldLine label="NO VA" value={header.va_no ?? '-'} />
            </div>
            <div>
              <FieldLine label="PROGAM KELAS" value={header.program ?? '-'} />
              <FieldLine
                label="ROMBONGAN BELAJAR"
                value={header.class_name ?? '-'}
              />
              <FieldLine
                label="TAHUN AJARAN"
                value={header.academic_year_name ?? '-'}
              />
            </div>
          </div>

          {/* Tabel detail */}
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: 12,
              fontSize: 13,
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '8px 4px',
                    width: 40,
                    fontWeight: 700,
                  }}
                >
                  NO.
                </th>
                <th style={{ textAlign: 'left', padding: '8px 4px', fontWeight: 700 }}>
                  NAMA PEMBAYARAN
                </th>
                <th
                  style={{
                    textAlign: 'right',
                    padding: '8px 4px',
                    width: 180,
                    fontWeight: 700,
                  }}
                >
                  NOMINAL
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: 12, color: '#64748b' }}>
                    Tidak ada detail.
                  </td>
                </tr>
              ) : (
                items.map((d, i) => (
                  <tr key={String(d.id)}>
                    <td style={{ padding: '8px 4px', verticalAlign: 'top' }}>{i + 1}</td>
                    <td style={{ padding: '8px 4px' }}>
                      <div>{d.bill_title}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        {d.product_name}
                        {header.nis ? ` · ${header.nis}` : ''}
                        {d.bill_month && d.bill_year
                          ? ` · ${monthLabel(d.bill_month)} ${d.bill_year}`
                          : ''}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '8px 4px',
                        textAlign: 'right',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {fmtMoney(d.amount_paid)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 700 }}>
                  TOTAL :
                </td>
                <td
                  style={{
                    padding: '10px 4px',
                    textAlign: 'right',
                    fontWeight: 800,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {fmtMoney(totalNumber)}
                </td>
              </tr>
              <tr>
                <td
                  colSpan={3}
                  style={{
                    padding: '4px 4px 12px',
                    textAlign: 'right',
                    fontStyle: 'italic',
                    color: '#0f172a',
                    borderBottom: '1px solid #cbd5e1',
                  }}
                >
                  TERBILANG : {terbilang(totalNumber).toUpperCase()}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Footer 3 kolom */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
              marginTop: 24,
              fontSize: 13,
            }}
          >
            <div>
              <div style={{ fontWeight: 700, marginBottom: 56 }}>KETERANGAN</div>
              <div style={{ color: '#475569', fontSize: 12 }}>
                {header.payment_method_name
                  ? `Metode: ${header.payment_method_name}`
                  : ''}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, marginBottom: 56 }}>PENYETOR</div>
              <div style={{ fontWeight: 600 }}>{header.payer_name || '-'}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, marginBottom: 56 }}>PETUGAS</div>
              <div style={{ fontWeight: 700 }}>SYSTEM BANK</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldLine({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '180px 1fr',
        gap: 4,
        padding: '4px 0',
        fontSize: 13,
      }}
    >
      <div style={{ fontWeight: 700 }}>{label}</div>
      <div>: {value}</div>
    </div>
  );
}

function monthLabel(m: number): string {
  const names = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];
  return names[m - 1] ?? String(m);
}

export default function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400 text-[13px] text-center">Memuat…</div>}>
      <ReceiptInner params={params} />
    </Suspense>
  );
}
