import { NextRequest, NextResponse } from 'next/server';

type GeoResult = { lat: number; lon: number; display_name: string };

const ID_BBOX = '95,-11,141,6';

/** Variasi query: dari utuh lalu buang kata dari belakang (alamat rumah sering berisik untuk geocoder). */
function buildQueryVariants(raw: string): string[] {
  const words = raw
    .trim()
    .replace(/\s+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const seen = new Set<string>();
  const add = (s: string) => {
    const t = s.trim();
    if (t.length < 3) return;
    seen.add(t);
    seen.add(`${t}, Indonesia`);
  };

  if (words.length === 1) {
    add(words[0]!);
    return [...seen];
  }

  for (let i = words.length; i >= 2; i--) {
    add(words.slice(0, i).join(' '));
  }
  return [...seen];
}

function photonFeaturesToResults(data: {
  features?: {
    geometry?: { coordinates?: [number, number] };
    properties?: Record<string, string | number | undefined>;
  }[];
}): GeoResult[] {
  return (data.features ?? [])
    .map((f) => {
      const coords = f.geometry?.coordinates;
      if (!coords || coords.length < 2) return null;
      const lon = Number(coords[0]);
      const lat = Number(coords[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
      const p = f.properties ?? {};
      const display_name = [
        p.name,
        p.street,
        p.city,
        p.district,
        p.county,
        p.state,
        p.country,
      ]
        .filter((x): x is string => typeof x === 'string' && x.trim() !== '')
        .join(', ');
      return {
        lat,
        lon,
        display_name: display_name || 'Lokasi',
      };
    })
    .filter((x): x is GeoResult => x != null);
}

async function fetchPhoton(q: string, bbox: string | null): Promise<GeoResult[]> {
  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', q);
  url.searchParams.set('limit', '10');
  url.searchParams.set('lang', 'id');
  if (bbox) url.searchParams.set('bbox', bbox);

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const data = (await res.json()) as Parameters<typeof photonFeaturesToResults>[0];
  return photonFeaturesToResults(data);
}

async function fetchNominatim(q: string): Promise<GeoResult[]> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '6');
  url.searchParams.set('q', q);
  url.searchParams.set('countrycodes', 'id');

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'KreativaERP/1.0 (school admin geocoding; +https://github.com/)',
    },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  return data.map((r) => ({
    lat: Number(r.lat),
    lon: Number(r.lon),
    display_name: r.display_name,
  }));
}

/** Photon (tanpa bbox) → Photon (bbox ID) → Nominatim per variasi query. */
export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get('q')?.trim();
  if (!q || q.length < 3) {
    return NextResponse.json({ error: 'Parameter q minimal 3 karakter' }, { status: 400 });
  }

  const variants = buildQueryVariants(q);
  /* Batasi jumlah request */
  const maxV = 14;
  const list = variants.slice(0, maxV);

  for (const v of list) {
    const r = await fetchPhoton(v, null);
    if (r.length) return NextResponse.json({ results: r });
  }
  for (const v of list) {
    const r = await fetchPhoton(v, ID_BBOX);
    if (r.length) return NextResponse.json({ results: r });
  }

  /* Nominatim: cadangan; batasi panggilan & jeda ~1 detik (kebijakan penggunaan wajar) */
  const nomIdx = new Set<number>();
  nomIdx.add(0);
  if (list.length > 1) nomIdx.add(1);
  if (list.length > 2) nomIdx.add(2);
  if (list.length > 1) nomIdx.add(list.length - 1);
  const nominatimOrder = [...nomIdx].sort((a, b) => a - b);

  for (let j = 0; j < nominatimOrder.length; j++) {
    const idx = nominatimOrder[j]!;
    if (j > 0) await new Promise((r) => setTimeout(r, 1100));
    const r = await fetchNominatim(list[idx]!);
    if (r.length) return NextResponse.json({ results: r });
  }

  return NextResponse.json({
    error: 'Lokasi tidak ditemukan',
    results: [] as GeoResult[],
  });
}
