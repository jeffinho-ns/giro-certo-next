'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(
  () => import('react-leaflet').then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((m) => m.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((m) => m.Popup),
  { ssr: false }
);

export interface TrackingCoords {
  active: boolean;
  storeLat: number | null;
  storeLng: number | null;
  deliveryLat: number | null;
  deliveryLng: number | null;
  riderLat: number | null;
  riderLng: number | null;
}

function pinIcon(color: string, label: string) {
  if (typeof window === 'undefined') return undefined;
  return L.divIcon({
    className: 'order-track-pin',
    html: `<div style="background:${color};color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export function OrderTrackingMap({
  tracking,
  liveRider,
}: {
  tracking: TrackingCoords;
  liveRider?: { lat: number; lng: number } | null;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const riderLat = liveRider?.lat ?? tracking.riderLat;
  const riderLng = liveRider?.lng ?? tracking.riderLng;

  const points = useMemo(() => {
    const list: [number, number][] = [];
    if (tracking.storeLat != null && tracking.storeLng != null) {
      list.push([tracking.storeLat, tracking.storeLng]);
    }
    if (tracking.deliveryLat != null && tracking.deliveryLng != null) {
      list.push([tracking.deliveryLat, tracking.deliveryLng]);
    }
    if (riderLat != null && riderLng != null) {
      list.push([riderLat, riderLng]);
    }
    return list;
  }, [tracking, riderLat, riderLng]);

  const center = points[0] ?? ([-23.55, -46.63] as [number, number]);

  if (!ready || points.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-lg border border-border bg-muted text-sm text-muted-foreground">
        Aguardando localização da entrega...
      </div>
    );
  }

  const storeIcon = pinIcon('#f59e0b', 'L');
  const clientIcon = pinIcon('#2563eb', 'C');
  const riderIcon = pinIcon('#16a34a', 'M');

  return (
    <div className="h-56 overflow-hidden rounded-lg border border-border">
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {tracking.storeLat != null && tracking.storeLng != null && storeIcon && (
          <Marker position={[tracking.storeLat, tracking.storeLng]} icon={storeIcon}>
            <Popup>Loja</Popup>
          </Marker>
        )}
        {tracking.deliveryLat != null &&
          tracking.deliveryLng != null &&
          clientIcon && (
            <Marker
              position={[tracking.deliveryLat, tracking.deliveryLng]}
              icon={clientIcon}
            >
              <Popup>Entrega</Popup>
            </Marker>
          )}
        {riderLat != null && riderLng != null && riderIcon && (
          <Marker position={[riderLat, riderLng]} icon={riderIcon}>
            <Popup>Entregador</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
