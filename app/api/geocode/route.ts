import { NextRequest, NextResponse } from 'next/server';

/** Proxy ringan ke Nominatim (OSM) — patuhi kebijakan penggunaan wajar. */
export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get('q')?.trim();
  if (!q || q.length < 3) {
    return NextResponse.json({ error: 'Parameter q minimal 3 karakter' }, { status: 400 });
  }

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '5');
  url.searchParams.set('q', q);

  const res = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'KreativaERP/1.0 (school admin geocoding)',
      Accept: 'application/json',
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Gagal menghubungi layanan peta' }, { status: 502 });
  }

  const data = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  const results = data.map((r) => ({
    lat: Number(r.lat),
    lon: Number(r.lon),
    display_name: r.display_name,
  }));

  return NextResponse.json({ results });
}
