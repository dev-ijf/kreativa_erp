'use client';

import { useEffect, useRef } from 'react';

type Props = {
  latitude: number;
  longitude: number;
  /** Zoom peta (default 16 jika ada penanda, bisa di-override) */
  zoom?: number;
  /** Tampilkan penanda di koordinat (mis. false untuk peta default kota saja) */
  showMarker?: boolean;
  height?: number;
  className?: string;
};

/**
 * Pratinjau peta dengan Leaflet + tile OSM resmi (bukan iframe embed).
 */
export function OsmEmbedMap({
  latitude,
  longitude,
  zoom = 16,
  showMarker = true,
  height = 260,
  className = '',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);

  useEffect(() => {
    const la = Number(latitude);
    const lo = Number(longitude);
    if (!Number.isFinite(la) || !Number.isFinite(lo) || la < -90 || la > 90 || lo < -180 || lo > 180) {
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    let disposed = false;
    const z = Number(zoom);
    const markerOn = showMarker;

    void (async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (disposed || !containerRef.current) return;

      const map = L.map(el, { zoomControl: true }).setView([la, lo], Number.isFinite(z) ? z : 16);
      mapRef.current = map;

      if (disposed) {
        map.remove();
        mapRef.current = null;
        return;
      }

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" rel="noreferrer">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      if (markerOn) {
        L.marker([la, lo]).addTo(map);
      }

      if (disposed) {
        map.remove();
        mapRef.current = null;
        return;
      }

      requestAnimationFrame(() => {
        mapRef.current?.invalidateSize();
      });
    })();

    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, zoom, showMarker]);

  const la = Number(latitude);
  const lo = Number(longitude);
  const invalid =
    !Number.isFinite(la) ||
    !Number.isFinite(lo) ||
    la < -90 ||
    la > 90 ||
    lo < -180 ||
    lo > 180;

  if (invalid) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 text-slate-500 text-[13px] ${className}`}
        style={{ height }}
      >
        Koordinat tidak valid
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`w-full min-h-[200px] rounded-[inherit] bg-slate-100 [&_.leaflet-container]:z-0 [&_.leaflet-container]:font-sans ${className}`}
      style={{ height }}
    />
  );
}
