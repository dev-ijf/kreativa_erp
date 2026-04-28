import { NextRequest, NextResponse } from 'next/server';
import { loadReceiptPayload, type ReceiptPayload } from '@/lib/billing-receipt-query';
import {
  createReceiptPdfDocument,
  drawReceiptPdf,
  fetchLogoBuffer,
  resolveLogoFetchUrl,
} from '@/lib/receipt-pdf';

export const runtime = 'nodejs';

/**
 * GET — stream PDF bukti pembayaran dari DB ke klien (chunked HTTP, tanpa blob URL di browser).
 * Query wajib: created_at (ISO, partition key).
 * `Content-Disposition: inline` agar tab baru menampilkan pratinjau PDF native.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const txId = Number(id);
  if (!Number.isFinite(txId)) {
    return NextResponse.json({ error: 'id tidak valid' }, { status: 400 });
  }

  const createdAtStr = new URL(req.url).searchParams.get('created_at');
  if (!createdAtStr) {
    return NextResponse.json(
      { error: 'Parameter created_at wajib (ISO timestamp header transaksi)' },
      { status: 400 }
    );
  }

  const createdAt = new Date(createdAtStr);
  if (Number.isNaN(createdAt.getTime())) {
    return NextResponse.json({ error: 'created_at tidak valid' }, { status: 400 });
  }

  let payload: ReceiptPayload;
  try {
    const loaded = await loadReceiptPayload(txId, createdAt);
    if (!loaded) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }
    payload = loaded;
  } catch (error) {
    console.error('receipt-pdf load error:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data transaksi' },
      { status: 500 }
    );
  }

  const rawName = String(payload.header.reference_no || `tx-${txId}`).replace(/[^\w.-]+/g, '_');
  const filename = `bukti-${rawName}.pdf`;
  const requestUrl = req.url;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const doc = createReceiptPdfDocument();
      doc.on('data', (chunk: Buffer) => {
        controller.enqueue(new Uint8Array(chunk));
      });
      doc.once('error', (err) => controller.error(err));
      doc.once('end', () => {
        try {
          controller.close();
        } catch {
          /* noop */
        }
      });
      try {
        const logoUrl = resolveLogoFetchUrl(
          requestUrl,
          payload.header.school_logo_url != null
            ? String(payload.header.school_logo_url)
            : null
        );
        const logoBuf = await fetchLogoBuffer(logoUrl);
        drawReceiptPdf(doc, payload, logoBuf);
        doc.end();
      } catch (e) {
        controller.error(e instanceof Error ? e : new Error(String(e)));
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
