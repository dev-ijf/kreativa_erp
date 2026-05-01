import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type PDFKit from 'pdfkit';
import PDFDocument from 'pdfkit';
import { terbilang } from '@/lib/terbilang';
import type { ReceiptItemRow, ReceiptPayload } from '@/lib/billing-receipt-query';

function s(v: unknown): string {
  if (v == null) return '';
  return String(v);
}

function fmtMoney(n: unknown): string {
  const x = typeof n === 'number' ? n : parseFloat(String(n ?? 0));
  if (!Number.isFinite(x)) return 'Rp 0';
  return 'Rp ' + x.toLocaleString('id-ID', { minimumFractionDigits: 0 });
}

/** Pending → dokumen invoice; selain itu (success/paid/dll.) → bukti pembayaran. */
export function receiptPdfIsPending(status: unknown): boolean {
  return String(status || '').toLowerCase().trim() === 'pending';
}

export function receiptPdfMainTitle(status: unknown): string {
  return receiptPdfIsPending(status) ? 'INVOICE' : 'BUKTI PEMBAYARAN';
}

export function receiptPdfStatusLabel(status: unknown): string {
  return receiptPdfIsPending(status) ? 'Pending' : 'Lunas';
}

export function receiptPdfDownloadBasename(status: unknown, referenceSafe: string): string {
  const prefix = receiptPdfIsPending(status) ? 'invoice' : 'bukti';
  return `${prefix}-${referenceSafe}.pdf`;
}

/** URL absolut untuk fetch logo dari server (path relatif → origin request). */
export function resolveLogoFetchUrl(requestUrl: string, logoUrl: string | null): string | null {
  if (!logoUrl || !logoUrl.trim()) return null;
  const u = logoUrl.trim();
  if (/^https?:\/\//i.test(u)) return u;
  try {
    const origin = new URL(requestUrl).origin;
    if (u.startsWith('/')) return `${origin}${u}`;
  } catch {
    /* ignore */
  }
  return null;
}

export async function fetchLogoBuffer(url: string | null): Promise<Buffer | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/** Gambar isi kwitansi ke dokumen PDFKit (sync). */
export function drawReceiptPdf(
  doc: PDFKit.PDFDocument,
  payload: ReceiptPayload,
  logoBuffer: Buffer | null
): void {
  const { header: h, items } = payload;
  const pending = receiptPdfIsPending(h.status);
  doc.info.Title = pending ? 'Invoice' : 'Bukti Pembayaran';

  const pageW = doc.page.width;
  const margin = 36;
  const contentW = pageW - margin * 2;
  let y = margin;

  const dateSrc = s(h.payment_date) || s(h.created_at);
  let dateLine = '';
  if (dateSrc) {
    const d = new Date(dateSrc);
    if (!Number.isNaN(d.getTime())) {
      dateLine = format(d, 'd MMMM yyyy', { locale: idLocale }).toUpperCase();
    }
  }

  const cashLabel = h.cash ? 'TUNAI' : 'NON TUNAI';
  const ref = s(h.reference_no) || '-';
  const logoTop = y;

  if (logoBuffer) {
    try {
      doc.image(logoBuffer, margin, y, { width: 56, height: 56, fit: [56, 56] });
    } catch {
      /* format tidak didukung */
    }
  }

  const textStartX = margin + (logoBuffer ? 68 : 0);
  doc.font('Helvetica-Bold').fontSize(16).fillColor('#0f172a');
  doc.text(s(h.school_name) || '—', textStartX, y, { width: 300 });
  y += 20;
  doc.font('Helvetica').fontSize(10).fillColor('#475569');
  const addr = s(h.school_address);
  if (addr) {
    doc.text(addr, textStartX, y, { width: 300 });
    y += doc.heightOfString(addr, { width: 300 }) + 6;
  } else {
    y += 6;
  }

  const rightW = 240;
  const rightX = pageW - margin - rightW;
  let ry = logoTop;
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a');
  doc.text(`NO KWITANSI : ${ref}`, rightX, ry, { width: rightW, align: 'right' });
  ry += 14;
  doc.font('Helvetica').fontSize(10);
  doc.text(dateLine, rightX, ry, { width: rightW, align: 'right' });
  ry += 14;
  doc.font('Helvetica-Bold').text(cashLabel, rightX, ry, { width: rightW, align: 'right' });

  y = Math.max(y, logoTop + 60) + 14;
  doc.moveTo(margin, y).lineTo(pageW - margin, y).strokeColor('#94a3b8').lineWidth(0.7).stroke();
  y += 12;

  const mainTitle = receiptPdfMainTitle(h.status);
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#0f172a');
  doc.text(mainTitle, margin, y, { width: contentW, align: 'center' });
  y += 16;
  const statusLabel = receiptPdfStatusLabel(h.status);
  doc.font('Helvetica-Bold').fontSize(10).fillColor(pending ? '#b45309' : '#15803d');
  doc.text(`STATUS : ${statusLabel.toUpperCase()}`, margin, y, { width: contentW, align: 'center' });
  y += 20;

  const colGap = 20;
  const half = (contentW - colGap) / 2;
  const x2 = margin + half + colGap;
  let yL = y;
  let yR = y;
  const nis = s(h.nis);

  const pushL = (label: string, val: string) => {
    doc.font('Helvetica').fontSize(10).fillColor('#0f172a');
    const text = `${label} : ${val || '-'}`;
    doc.text(text, margin, yL, { width: half });
    yL += doc.heightOfString(text, { width: half }) + 4;
  };
  const pushR = (label: string, val: string) => {
    doc.font('Helvetica').fontSize(10).fillColor('#0f172a');
    const text = `${label} : ${val || '-'}`;
    doc.text(text, x2, yR, { width: half });
    yR += doc.heightOfString(text, { width: half }) + 4;
  };

  pushL('NIS', nis);
  pushR('PROGAM KELAS', s(h.program));
  pushL('NAMA', s(h.student_name));
  pushR('ROMBONGAN BELAJAR', s(h.class_name));
  pushL('NO VA', s(h.va_no));
  pushR('TAHUN AJARAN', s(h.academic_year_name));

  y = Math.max(yL, yR) + 10;
  doc.moveTo(margin, y).lineTo(pageW - margin, y).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
  y += 10;

  doc.font('Helvetica-Bold').fontSize(9).fillColor('#0f172a');
  doc.text('NO.', margin, y, { width: 28 });
  doc.text('NAMA PEMBAYARAN', margin + 32, y, { width: contentW - 120 });
  doc.text('NOMINAL', margin + contentW - 88, y, { width: 88, align: 'right' });
  y += 14;
  doc.moveTo(margin, y).lineTo(pageW - margin, y).strokeColor('#e2e8f0').stroke();
  y += 8;

  doc.font('Helvetica').fontSize(9);
  const descW = contentW - 120;
  items.forEach((row: ReceiptItemRow, i) => {
    const title = s(row.bill_title);
    const prod = s(row.product_name);
    const subParts = [prod];
    if (prod && nis) subParts.push(nis);
    else if (!prod && nis) subParts.push(nis);
    const sub = subParts.filter(Boolean).join(' · ');

    const rowTop = y;
    doc.fillColor('#0f172a').text(String(i + 1), margin, rowTop, { width: 28 });
    doc.font('Helvetica-Bold').text(title, margin + 32, rowTop, { width: descW });
    let blockH = doc.heightOfString(title, { width: descW });
    if (sub) {
      doc.font('Helvetica').fontSize(8).fillColor('#64748b');
      doc.text(sub, margin + 32, rowTop + blockH, { width: descW });
      blockH += doc.heightOfString(sub, { width: descW });
    }
    doc.font('Helvetica').fontSize(9).fillColor('#0f172a');
    doc.text(fmtMoney(row.amount_paid), margin + contentW - 88, rowTop, {
      width: 88,
      align: 'right',
    });
    y = rowTop + Math.max(blockH + 6, 18);
  });

  y += 6;
  const lineSum = items.reduce((acc, row) => {
    const v = parseFloat(String(row.amount_paid ?? 0));
    return acc + (Number.isFinite(v) ? v : 0);
  }, 0);
  const grandTotal = parseFloat(String(h.total_amount ?? 0));
  const showSubtotal =
    items.length > 1 ||
    (items.length === 1 && Math.abs(lineSum - grandTotal) > 0.005);

  doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a');
  if (showSubtotal) {
    doc.text('SUBTOTAL :', margin + contentW - 200, y, { width: 112, align: 'right' });
    doc.text(fmtMoney(lineSum), margin + contentW - 88, y, { width: 88, align: 'right' });
    y += 16;
  }
  doc.text('GRAND TOTAL :', margin + contentW - 200, y, { width: 112, align: 'right' });
  doc.text(fmtMoney(grandTotal), margin + contentW - 88, y, { width: 88, align: 'right' });
  y += 18;

  doc.font('Helvetica-Oblique').fontSize(8);
  const tb = `TERBILANG : ${terbilang(grandTotal).toUpperCase()}`;
  doc.text(tb, margin, y, { width: contentW, align: 'center' });
  y += doc.heightOfString(tb, { width: contentW }) + 12;

  doc.moveTo(margin, y).lineTo(pageW - margin, y).strokeColor('#cbd5e1').stroke();
  y += 14;

  const fw = contentW / 3;
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#0f172a');
  doc.text('KETERANGAN', margin, y);
  doc.text('PENYETOR', margin + fw, y, { width: fw, align: 'center' });
  doc.text('PETUGAS', margin + 2 * fw, y, { width: fw, align: 'center' });
  y += 44;
  doc.font('Helvetica').fontSize(8).fillColor('#475569');
  const meth = s(h.payment_method_name);
  doc.text(meth ? `Metode: ${meth}` : ' ', margin, y, { width: fw - 4 });
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9);
  doc.text(s(h.payer_name) || '-', margin + fw, y, { width: fw, align: 'center' });
  doc.text('SYSTEM BANK', margin + 2 * fw, y, { width: fw, align: 'center' });
}

/** Buat PDFKit document landscape A4 (caller memanggil doc.end()). */
export function createReceiptPdfDocument(): PDFKit.PDFDocument {
  return new PDFDocument({
    layout: 'landscape',
    size: 'A4',
    margin: 36,
    info: { Title: 'Dokumen pembayaran', Author: 'Kreativa ERP' },
  });
}
