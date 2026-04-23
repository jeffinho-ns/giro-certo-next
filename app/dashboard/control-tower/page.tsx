'use client';

import { useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Package, Users, TrendingUp, ShieldCheck, X } from 'lucide-react';
import {
  ControlTowerMap,
  type ControlTowerOrderMarker,
} from '@/components/map/control-tower-map';
import { apiClient } from '@/lib/api';
import { DashboardStats, ActiveRider } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useControlTowerRealtime } from '@/hooks/use-control-tower-realtime';
import {
  describeRiderOperationalLeg,
  formatDeliveryStatusPt,
} from '@/lib/control-tower-copy';

const ACTIVE_STATUSES_TOWER = 'accepted,arrivedAtStore,inTransit,inProgress';

function buildOrdersQueryParams(filters: {
  vehicleType: string;
  orderStatus: string;
}): URLSearchParams {
  const params = new URLSearchParams();
  params.append('limit', '60');
  if (filters.vehicleType) params.append('vehicleType', filters.vehicleType);

  if (filters.orderStatus === 'active') {
    params.append('statuses', ACTIVE_STATUSES_TOWER);
  } else if (filters.orderStatus) {
    params.append('status', filters.orderStatus);
  }
  return params;
}

export default function ControlTowerPage() {
  const queryClient = useQueryClient();
  const [liveRiderPositions, setLiveRiderPositions] = useState<
    Record<string, { lat: number; lng: number }>
  >({});
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    vehicleType: '' as string,
    hasVerifiedBadge: undefined as boolean | undefined,
    orderStatus: 'active' as string,
  });

  useControlTowerRealtime(queryClient, setLiveRiderPositions);

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', filters.vehicleType, filters.hasVerifiedBadge],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.vehicleType) params.append('vehicleType', filters.vehicleType);
      if (filters.hasVerifiedBadge !== undefined)
        params.append('hasVerifiedBadge', String(filters.hasVerifiedBadge));

      const queryString = params.toString();
      const url = `/api/dashboard/stats${queryString ? `?${queryString}` : ''}`;
      return apiClient.get<DashboardStats>(url);
    },
  });

  const { data: activeRiders } = useQuery<{ riders: ActiveRider[] }>({
    queryKey: ['active-riders', filters.vehicleType, filters.hasVerifiedBadge],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.vehicleType) params.append('vehicleType', filters.vehicleType);
      if (filters.hasVerifiedBadge !== undefined)
        params.append('hasVerifiedBadge', String(filters.hasVerifiedBadge));

      const queryString = params.toString();
      const url = `/api/dashboard/active-riders${queryString ? `?${queryString}` : ''}`;
      return apiClient.get<{ riders: ActiveRider[] }>(url);
    },
    refetchInterval: 10_000,
  });

  const { data: orders } = useQuery<{ orders: ControlTowerOrderMarker[] }>({
    queryKey: ['dashboard-orders', filters.orderStatus, filters.vehicleType],
    queryFn: async () => {
      const params = buildOrdersQueryParams({
        vehicleType: filters.vehicleType,
        orderStatus: filters.orderStatus,
      });
      const url = `/api/dashboard/orders?${params.toString()}`;
      return apiClient.get<{ orders: ControlTowerOrderMarker[] }>(url);
    },
    refetchInterval: 10_000,
  });

  const mergedRiders: ActiveRider[] = useMemo(() => {
    const list = activeRiders?.riders ?? [];
    return list.map((r) => {
      const live = liveRiderPositions[r.id];
      if (!live) return r;
      return { ...r, lat: live.lat, lng: live.lng };
    });
  }, [activeRiders, liveRiderPositions]);

  const selectedRider = useMemo(
    () => mergedRiders.find((r) => r.id === selectedRiderId) ?? null,
    [mergedRiders, selectedRiderId]
  );

  const { data: routeData } = useQuery({
    queryKey: [
      'control-tower-route',
      selectedRiderId,
      selectedRider?.lat,
      selectedRider?.lng,
      selectedRider?.currentOrder?.id,
      selectedRider?.currentOrder?.status,
    ],
    enabled: Boolean(
      selectedRider?.currentOrder?.id &&
        selectedRider?.lat != null &&
        selectedRider?.lng != null
    ),
    queryFn: async () => {
      const r = selectedRider!;
      const o = r.currentOrder!;
      const olat = r.lat;
      const olng = r.lng;
      let dlat = o.storeLatitude;
      let dlng = o.storeLongitude;
      if (o.status === 'inTransit' || o.status === 'inProgress') {
        dlat = o.deliveryLatitude;
        dlng = o.deliveryLongitude;
      }
      const qs = new URLSearchParams({
        originLat: String(olat),
        originLng: String(olng),
        destLat: String(dlat),
        destLng: String(dlng),
      }).toString();
      try {
        return await apiClient.get<{
          followsRoads?: boolean;
          points?: { lat: number; lng: number }[];
        }>(`/api/maps/directions?${qs}`);
      } catch {
        return { points: [] as { lat: number; lng: number }[] };
      }
    },
  });

  const routePreviewLatLngs: [number, number][] = useMemo(() => {
    const pts = routeData?.points;
    if (!pts || pts.length < 2) return [];
    return pts.map((p) => [p.lat, p.lng] as [number, number]);
  }, [routeData]);

  const onSelectRider = useCallback((id: string | null) => {
    setSelectedRiderId(id);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Torre de Controle</h1>
          <p className="text-muted-foreground mt-2">
            Monitoramento em tempo real de entregadores e pedidos (API + WebSocket)
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setFilters({
              vehicleType: '',
              hasVerifiedBadge: undefined,
              orderStatus: 'active',
            });
            setSelectedRiderId(null);
          }}
        >
          Limpar Filtros
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Veículo</Label>
              <Select
                value={filters.vehicleType || 'all'}
                onValueChange={(value) =>
                  setFilters({ ...filters, vehicleType: value === 'all' ? '' : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="MOTORCYCLE">Motos</SelectItem>
                  <SelectItem value="BICYCLE">Bicicletas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status do Pedido (mapa)</Label>
              <Select
                value={filters.orderStatus || 'active'}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    orderStatus: value === 'all' ? '' : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Em operação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Em operação (retirada + entrega)</SelectItem>
                  <SelectItem value="all">Todos (últimos 60)</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="accepted">Aceitos</SelectItem>
                  <SelectItem value="arrivedAtStore">Chegaram na Loja</SelectItem>
                  <SelectItem value="inTransit">Em Trânsito</SelectItem>
                  <SelectItem value="inProgress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluídos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status de Verificação</Label>
              <Select
                value={
                  filters.hasVerifiedBadge === true
                    ? 'verified'
                    : filters.hasVerifiedBadge === false
                      ? 'not-verified'
                      : 'all'
                }
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    hasVerifiedBadge:
                      value === 'verified' ? true : value === 'not-verified' ? false : undefined,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="verified">Verificados</SelectItem>
                  <SelectItem value="not-verified">Não Verificados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregadores Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeRiders ?? '-'}</div>
            <p className="text-xs text-muted-foreground">Online agora</p>
            {stats?.activeRidersByType && (
              <div className="mt-2 text-xs text-muted-foreground">
                <span>🏍️ {stats.activeRidersByType.motorcycles}</span>
                {' • '}
                <span>🚲 {stats.activeRidersByType.bicycles}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verificados</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.verifiedRiders ?? '-'}</div>
            <p className="text-xs text-muted-foreground">Com selo de confiança</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Hoje</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todaysOrders ?? '-'}</div>
            <p className="text-xs text-muted-foreground">Total do dia</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.inProgressOrders ?? '-'}</div>
            <p className="text-xs text-muted-foreground">Sendo entregues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingOrders ?? '-'}</div>
            <p className="text-xs text-muted-foreground">Aguardando entregador</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos Hoje</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedOrders ?? '-'}</div>
            <p className="text-xs text-muted-foreground">Entregues hoje</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mapa em Tempo Real</CardTitle>
          <CardDescription>
            Clique num entregador para ver a etapa e a rota estimada (azul). Loja 🏪 e entrega 📦.
            {activeRiders?.riders && ` • ${mergedRiders.length} no mapa`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col xl:flex-row gap-4">
            <div className="flex-1 min-w-0">
              <ControlTowerMap
                riders={mergedRiders}
                orders={orders?.orders ?? []}
                selectedRiderId={selectedRiderId}
                onSelectRider={onSelectRider}
                routePreviewLatLngs={routePreviewLatLngs}
              />
            </div>

            <div className="w-full xl:w-80 shrink-0 space-y-3">
              <div className="rounded-lg border border-border p-4 bg-card">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm">Detalhe do entregador</h3>
                  {selectedRiderId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setSelectedRiderId(null)}
                      aria-label="Fechar painel"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {!selectedRider ? (
                  <p className="text-sm text-muted-foreground mt-2">
                    Selecione um ícone de moto ou bicicleta no mapa para ver o pedido ativo e a
                    perna da rota (retirada ou entrega).
                  </p>
                ) : (
                  <div className="mt-3 space-y-3 text-sm">
                    <div>
                      <p className="font-medium">{selectedRider.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedRider.email}</p>
                    </div>

                    <Badge variant={selectedRider.isOnline ? 'default' : 'secondary'}>
                      {selectedRider.isOnline ? 'Online' : 'Offline'}
                    </Badge>

                    <p className="text-sm leading-snug">
                      {describeRiderOperationalLeg(
                        selectedRider.currentOrderStatus as string | undefined
                      )}
                    </p>

                    {selectedRider.currentOrder ? (
                      <div className="space-y-2 border-t border-border pt-3 text-xs">
                        <p>
                          <span className="text-muted-foreground">Pedido:</span>{' '}
                          <span className="font-mono">{selectedRider.currentOrder.id}</span>
                        </p>
                        <p>
                          <span className="text-muted-foreground">Status:</span>{' '}
                          {formatDeliveryStatusPt(selectedRider.currentOrder.status)}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Loja:</span>{' '}
                          {selectedRider.currentOrder.storeName}
                        </p>
                        <p className="text-muted-foreground">
                          {selectedRider.currentOrder.storeAddress}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Entrega:</span>{' '}
                          {selectedRider.currentOrder.deliveryAddress}
                        </p>
                        {routePreviewLatLngs.length >= 2 ? (
                          <p className="text-green-600 dark:text-green-400">
                            Rota estimada carregada ({routePreviewLatLngs.length} pontos).
                          </p>
                        ) : (
                          <p className="text-amber-600 dark:text-amber-400 text-[11px]">
                            Sem polyline (API de rotas indisponível ou pedido sem perna válida).
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground border-t border-border pt-3">
                        Este entregador está online sem pedido ativo nestes status.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
