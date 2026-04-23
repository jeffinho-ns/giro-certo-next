"use client";

import { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";
import { ActiveRider, DeliveryStatus, VehicleType } from "@/lib/types";
import {
  describeRiderOperationalLeg,
  formatDeliveryStatusPt,
} from "@/lib/control-tower-copy";
import L from "leaflet";

import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

const Polyline = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polyline),
  { ssr: false }
);

export interface ControlTowerOrderMarker {
  id: string;
  storeLatitude: number;
  storeLongitude: number;
  deliveryLatitude: number;
  deliveryLongitude: number;
  status: string;
  storeName?: string;
  deliveryAddress?: string;
  estimatedTime?: number;
  rider?: {
    id?: string;
    name?: string;
  };
  bike?: {
    vehicleType?: VehicleType;
  };
}

export interface ControlTowerMapProps {
  riders?: ActiveRider[];
  orders?: ControlTowerOrderMarker[];
  /** Opcionais: usados na Torre de Controle (mapa + rota). */
  selectedRiderId?: string | null;
  onSelectRider?: (id: string | null) => void;
  /** [lat, lng][] — pré-visualização da perna atual (API maps/directions). */
  routePreviewLatLngs?: [number, number][];
}

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

const deliveryIcon =
  typeof window !== "undefined"
    ? L.divIcon({
        className: "custom-delivery-icon",
        html: `
    <div style="
      background-color: #22c55e;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
    ">📦</div>
  `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      })
    : null;

const createVehicleIcon = (
  vehicleType: VehicleType | null,
  isVerified: boolean,
  currentOrderStatus?: DeliveryStatus | string | null,
  isSelected?: boolean
) => {
  const isArrivedAtStore = currentOrderStatus === DeliveryStatus.arrivedAtStore;
  const iconColor = isSelected
    ? "#a855f7"
    : isArrivedAtStore
      ? "#f97316"
      : vehicleType === VehicleType.BICYCLE
        ? "#10b981"
        : "#3b82f6";

  const iconSize: [number, number] = isVerified ? [32, 32] : [28, 28];

  return L.divIcon({
    className: "custom-vehicle-icon",
    html: `
      ${
        isArrivedAtStore
          ? `<style>
              @keyframes pulseDeliveryArrived {
                0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(249,115,22,0.7); }
                70% { transform: scale(1.06); box-shadow: 0 0 0 12px rgba(249,115,22,0); }
                100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(249,115,22,0); }
              }
            </style>`
          : ""
      }
      <div style="
        background-color: ${iconColor};
        width: ${iconSize[0]}px;
        height: ${iconSize[1]}px;
        border-radius: 50%;
        border: 2px solid ${isSelected ? "#faf5ff" : "white"};
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: ${iconSize[0] * 0.6}px;
        position: relative;
        ${isArrivedAtStore ? "animation: pulseDeliveryArrived 1.5s infinite;" : ""}
      ">
        ${
          isArrivedAtStore
            ? "🛵"
            : vehicleType === VehicleType.BICYCLE
              ? "🚲"
              : "🏍️"
        }
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

const ACTIVE_ORDER_FOR_CLIENT_PIN = new Set([
  "pending",
  "accepted",
  "arrivedAtStore",
  "inTransit",
  "inProgress",
]);

export function ControlTowerMap({
  riders = [],
  orders = [],
  selectedRiderId = null,
  onSelectRider = () => {},
  routePreviewLatLngs = [],
}: ControlTowerMapProps) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
      });
    }
  }, []);

  const center = useMemo(() => {
    if (riders.length === 0 && orders.length === 0) {
      return [-23.5505, -46.6333] as [number, number];
    }

    let totalLat = 0;
    let totalLng = 0;
    let count = 0;

    riders.forEach((rider) => {
      if (rider.lat != null && rider.lng != null) {
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
      ? ([totalLat / count, totalLng / count] as [number, number])
      : ([-23.5505, -46.6333] as [number, number]);
  }, [riders, orders]);

  return (
    <div className="h-[600px] w-full rounded-lg border border-border overflow-hidden relative">
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {routePreviewLatLngs.length >= 2 && (
          <Polyline
            positions={routePreviewLatLngs}
            pathOptions={{ color: "#2563eb", weight: 5, opacity: 0.88 }}
          />
        )}

        {riders.map((rider) => {
          if (rider.lat == null || rider.lng == null) return null;

          const vehicleType = rider.bike?.vehicleType || VehicleType.MOTORCYCLE;
          const selected = rider.id === selectedRiderId;
          const icon = createVehicleIcon(
            vehicleType,
            rider.hasVerifiedBadge || false,
            rider.currentOrderStatus,
            selected
          );

          return (
            <Marker
              key={rider.id}
              position={[rider.lat, rider.lng]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectRider(rider.id),
              }}
            >
              <Popup>
                <div className="space-y-2 min-w-[220px]">
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

                  <p className="text-sm font-medium text-foreground">
                    {describeRiderOperationalLeg(
                      rider.currentOrderStatus as string | undefined
                    )}
                  </p>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>
                      Rating:{" "}
                      {Number(rider.averageRating)
                        ? Number(rider.averageRating).toFixed(1)
                        : "N/A"}
                    </p>
                    <p>Pedidos ativos: {rider.activeOrders || 0}</p>
                    {rider.currentOrder && (
                      <>
                        <p className="font-medium text-foreground">
                          Pedido #{rider.currentOrder.id.slice(0, 8)}
                        </p>
                        <p>
                          Status:{" "}
                          {formatDeliveryStatusPt(rider.currentOrder.status)}
                        </p>
                        <p>Loja: {rider.currentOrder.storeName}</p>
                        <p>Entrega: {rider.currentOrder.deliveryAddress}</p>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Dica: clique no mapa fora do ícone para limpar a seleção.
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {orders.map((order) => {
          if (!order.storeLatitude || !order.storeLongitude) return null;

          const statusColors: Record<string, string> = {
            pending: "#f59e0b",
            accepted: "#3b82f6",
            arrivedAtStore: "#f97316",
            inTransit: "#10b981",
            inProgress: "#10b981",
            completed: "#6b7280",
            cancelled: "#ef4444",
          };

          return (
            <Marker
              key={`${order.id}-store`}
              position={[order.storeLatitude, order.storeLongitude]}
              icon={storeIcon || undefined}
            >
              <Popup>
                <div className="space-y-2 min-w-[180px]">
                  <p className="font-semibold text-sm">
                    {order.storeName || "Loja"}{" "}
                    <span className="text-muted-foreground font-normal">
                      #{order.id.slice(0, 8)}
                    </span>
                  </p>
                  <Badge
                    style={{
                      backgroundColor:
                        statusColors[order.status] || "#6b7280",
                      color: "white",
                    }}
                  >
                    {formatDeliveryStatusPt(order.status)}
                  </Badge>
                  {order.rider?.name && (
                    <p className="text-xs">Motociclista: {order.rider.name}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {orders.map((order) => {
          const showClient =
            order.deliveryLatitude != null &&
            order.deliveryLongitude != null &&
            ACTIVE_ORDER_FOR_CLIENT_PIN.has(order.status);
          if (!showClient) return null;
          return (
            <Marker
              key={`${order.id}-delivery`}
              position={[order.deliveryLatitude, order.deliveryLongitude]}
              icon={deliveryIcon || undefined}
            >
              <Popup>
                <div className="space-y-1 min-w-[160px]">
                  <p className="font-semibold text-sm">Cliente / entrega</p>
                  <p className="text-xs text-muted-foreground">
                    {order.deliveryAddress || "Endereço de entrega"}
                  </p>
                  <Badge variant="outline">
                    {formatDeliveryStatusPt(order.status)}
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
