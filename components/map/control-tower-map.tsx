"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";
import { ActiveRider, VehicleType } from "@/lib/types";
import L from "leaflet";

// Importar estilos do Leaflet
import "leaflet/dist/leaflet.css";

// Importar dinamicamente para evitar problemas de SSR
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  {
    ssr: false,
  },
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  {
    ssr: false,
  },
);

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  {
    ssr: false,
  },
);

const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

interface Order {
  id: string;
  storeLatitude: number;
  storeLongitude: number;
  deliveryLatitude: number;
  deliveryLongitude: number;
  status: string;
  estimatedTime?: number;
  rider?: {
    name?: string;
  };
  bike?: {
    vehicleType?: VehicleType;
  };
}

interface ControlTowerMapProps {
  riders?: ActiveRider[];
  orders?: Order[];
}

// Ícone para as Lojas/Pedidos para evitar erro 404 de ícone padrão do Leaflet
const storeIcon =
  typeof window !== "undefined"
    ? L.divIcon({
        className: "custom-store-icon",
        html: `
    <div style="
      background-color: #f59e0b;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    ">🏪</div>
  `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })
    : null;

// Ícones customizados para diferentes tipos de veículo
const createVehicleIcon = (
  vehicleType: VehicleType | null,
  isVerified: boolean,
) => {
  const iconColor = vehicleType === VehicleType.BICYCLE ? "#10b981" : "#3b82f6";

  // CORREÇÃO BUILD: Tipagem explícita como tupla [number, number]
  const iconSize: [number, number] = isVerified ? [32, 32] : [28, 28];

  return L.divIcon({
    className: "custom-vehicle-icon",
    html: `
      <div style="
        background-color: ${iconColor};
        width: ${iconSize[0]}px;
        height: ${iconSize[1]}px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: ${iconSize[0] * 0.6}px;
        position: relative;
      ">
        ${vehicleType === VehicleType.BICYCLE ? "🚲" : "🏍️"}
        ${
          isVerified
            ? `
          <span style="
            position: absolute; 
            top: -4px; 
            right: -4px; 
            font-size: 10px; 
            background: #22c55e; 
            color: white; 
            border-radius: 50%; 
            width: 14px; 
            height: 14px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            border: 1px solid white;
          ">✓</span>`
            : ""
        }
      </div>
    `,
    iconSize: iconSize,
    iconAnchor: [iconSize[0] / 2, iconSize[1] / 2],
  });
};

export function ControlTowerMap({
  riders = [],
  orders = [],
}: ControlTowerMapProps) {
  // Correção para ícones padrão do Leaflet no Next.js/Vercel
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Em vez de 'delete', apenas mesclamos as novas URLs
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
      });
    }
  }, []);

  const calculateCenter = () => {
    if (riders.length === 0 && orders.length === 0) {
      return [-23.5505, -46.6333]; // São Paulo padrão
    }

    let totalLat = 0;
    let totalLng = 0;
    let count = 0;

    riders.forEach((rider) => {
      if (rider.lat && rider.lng) {
        totalLat += rider.lat;
        totalLng += rider.lng;
        count++;
      }
    });

    orders.forEach((order) => {
      if (order.storeLatitude && order.storeLongitude) {
        totalLat += order.storeLatitude;
        totalLng += order.storeLongitude;
        count++;
      }
    });

    return count > 0
      ? [totalLat / count, totalLng / count]
      : [-23.5505, -46.6333];
  };

  return (
    <div className="h-[600px] w-full rounded-lg border border-border overflow-hidden">
      <MapContainer
        center={calculateCenter() as [number, number]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Marcadores de Entregadores */}
        {riders.map((rider) => {
          if (!rider.lat || !rider.lng) return null;

          const vehicleType = rider.bike?.vehicleType || VehicleType.MOTORCYCLE;
          const icon = createVehicleIcon(
            vehicleType,
            rider.hasVerifiedBadge || false,
          );

          return (
            <Marker
              key={rider.id}
              position={[rider.lat, rider.lng]}
              icon={icon}
            >
              <Popup>
                <div className="space-y-2 min-w-[200px]">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{rider.name}</p>
                    {rider.hasVerifiedBadge && (
                      <ShieldCheck className="h-4 w-4 text-green-600" />
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <Badge variant={rider.isOnline ? "default" : "secondary"}>
                      {rider.isOnline ? "Online" : "Offline"}
                    </Badge>
                    <Badge variant="outline">
                      {vehicleType === VehicleType.BICYCLE
                        ? "🚲 Bicicleta"
                        : "🏍️ Moto"}
                    </Badge>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <p>
                      Rating:{" "}
                      {Number(rider.averageRating)
                        ? Number(rider.averageRating).toFixed(1)
                        : "N/A"}
                    </p>
                    <p>Pedidos ativos: {rider.activeOrders || 0}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Marcadores de Pedidos */}
        {orders.map((order) => {
          if (!order.storeLatitude || !order.storeLongitude) return null;

          const statusColors: Record<string, string> = {
            pending: "#f59e0b",
            accepted: "#3b82f6",
            inProgress: "#10b981",
            completed: "#6b7280",
            cancelled: "#ef4444",
          };

          return (
            <Marker
              key={order.id}
              position={[order.storeLatitude, order.storeLongitude]}
              icon={storeIcon || undefined}
            >
              <Popup>
                <div className="space-y-2 min-w-[150px]">
                  <p className="font-semibold text-sm">
                    Pedido #{order.id.slice(0, 8)}
                  </p>
                  <Badge
                    style={{
                      backgroundColor: statusColors[order.status] || "#6b7280",
                      color: "white",
                    }}
                  >
                    {order.status}
                  </Badge>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
