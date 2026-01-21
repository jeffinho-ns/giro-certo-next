'use client';

import dynamic from 'next/dynamic';
import { Badge } from '@/components/ui/badge';

// Importar estilos do Leaflet
import 'leaflet/dist/leaflet.css';

// Importar dinamicamente para evitar problemas de SSR
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), {
  ssr: false,
});

const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), {
  ssr: false,
});

const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), {
  ssr: false,
});

const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), {
  ssr: false,
});

interface Rider {
  id: string;
  name: string;
  lat: number;
  lng: number;
  isOnline: boolean;
}

interface Order {
  id: string;
  storeLat: number;
  storeLng: number;
  deliveryLat: number;
  deliveryLng: number;
  status: string;
}

export function ControlTowerMap() {
  // Mock data - será substituído pela API real
  const mockRiders: Rider[] = [
    { id: '1', name: 'João Silva', lat: -23.5505, lng: -46.6333, isOnline: true },
    { id: '2', name: 'Maria Santos', lat: -23.5515, lng: -46.6343, isOnline: true },
    { id: '3', name: 'Pedro Costa', lat: -23.5495, lng: -46.6323, isOnline: false },
  ];

  const mockOrders: Order[] = [
    { id: '1', storeLat: -23.5505, storeLng: -46.6333, deliveryLat: -23.5515, deliveryLng: -46.6343, status: 'inProgress' },
    { id: '2', storeLat: -23.5525, storeLng: -46.6353, deliveryLat: -23.5535, deliveryLng: -46.6363, status: 'pending' },
  ];

  return (
    <div className="h-[600px] w-full rounded-lg border border-border overflow-hidden">
      <MapContainer
        center={[-23.5505, -46.6333]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mockRiders.map((rider) => (
          <Marker key={rider.id} position={[rider.lat, rider.lng]}>
            <Popup>
              <div>
                <p className="font-semibold">{rider.name}</p>
                <Badge variant={rider.isOnline ? 'default' : 'secondary'}>
                  {rider.isOnline ? 'Online' : 'Offline'}
                </Badge>
              </div>
            </Popup>
          </Marker>
        ))}
        {mockOrders.map((order) => (
          <Marker key={order.id} position={[order.storeLat, order.storeLng]}>
            <Popup>
              <div>
                <p className="font-semibold">Pedido {order.id}</p>
                <Badge>{order.status}</Badge>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
