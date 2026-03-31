'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface ZipMapProps {
  zip: string;
  lat: number;
  lon: number;
  neighborhood: string;
  borough: string;
  locatedInLabel: string;
}

export default function ZipMapLeaflet({ zip, lat, lon, neighborhood, borough, locatedInLabel }: ZipMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(containerRef.current, { zoomControl: true }).setView([lat, lon], 13);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    let cancelled = false;

    fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${zip}&country=US&format=json&polygon_geojson=1&limit=1`,
      { headers: { 'User-Agent': 'NYCRentals/1.0 (contact@nycrentals.example)' } }
    )
      .then((r) => r.json())
      .then((data: Array<{ geojson?: object; boundingbox?: string[] }>) => {
        if (cancelled || !mapRef.current) return;
        if (data?.[0]?.geojson) {
          const layer = L.geoJSON(data[0].geojson as GeoJSON.GeoJsonObject, {
            style: {
              color: '#2563eb',
              weight: 2,
              fillColor: '#3b82f6',
              fillOpacity: 0.15,
            },
          }).addTo(mapRef.current);
          mapRef.current.fitBounds(layer.getBounds(), { padding: [16, 16] });
        }
      })
      .catch(() => {
        // Nominatim unavailable — map stays centred on lat/lon
      });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [zip, lat, lon]);

  return (
    <div>
      <div
        ref={containerRef}
        className="h-[300px] w-full rounded-xl overflow-hidden border border-zinc-200"
      />
      <p className="text-sm text-zinc-500 mt-2">
        {locatedInLabel}
      </p>
    </div>
  );
}
