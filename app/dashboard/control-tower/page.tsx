'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Package, Users, TrendingUp, Bike, ShieldCheck } from 'lucide-react';
import { ControlTowerMap } from '@/components/map/control-tower-map';
import { apiClient } from '@/lib/api';
import { DashboardStats, ActiveRider } from '@/lib/types';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function ControlTowerPage() {
  const [filters, setFilters] = useState({
    vehicleType: '' as string,
    hasVerifiedBadge: undefined as boolean | undefined,
    orderStatus: '' as string,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', filters.vehicleType, filters.hasVerifiedBadge],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.vehicleType) params.append('vehicleType', filters.vehicleType);
      if (filters.hasVerifiedBadge !== undefined) params.append('hasVerifiedBadge', String(filters.hasVerifiedBadge));
      
      const response = await apiClient.get<DashboardStats>(`/api/dashboard/stats?${params.toString()}`);
      return response;
    },
  });

  const { data: activeRiders, isLoading: ridersLoading } = useQuery<{ riders: ActiveRider[] }>({
    queryKey: ['active-riders', filters.vehicleType, filters.hasVerifiedBadge],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.vehicleType) params.append('vehicleType', filters.vehicleType);
      if (filters.hasVerifiedBadge !== undefined) params.append('hasVerifiedBadge', String(filters.hasVerifiedBadge));
      
      const response = await apiClient.get<{ riders: ActiveRider[] }>(`/api/dashboard/active-riders?${params.toString()}`);
      return response;
    },
    refetchInterval: 10000, // Atualizar a cada 10 segundos
  });

  const { data: orders, isLoading: ordersLoading } = useQuery<{ orders: any[] }>({
    queryKey: ['dashboard-orders', filters.orderStatus, filters.vehicleType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.orderStatus) params.append('status', filters.orderStatus);
      if (filters.vehicleType) params.append('vehicleType', filters.vehicleType);
      
      const response = await apiClient.get<{ orders: any[] }>(`/api/dashboard/orders?${params.toString()}`);
      return response;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Torre de Controle</h1>
          <p className="text-muted-foreground mt-2">
            Monitoramento em tempo real de entregadores e pedidos
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setFilters({ vehicleType: '', hasVerifiedBadge: undefined, orderStatus: '' });
          }}
        >
          Limpar Filtros
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Veículo</Label>
              <Select
                value={filters.vehicleType}
                onValueChange={(value) => setFilters({ ...filters, vehicleType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="MOTORCYCLE">Motos</SelectItem>
                  <SelectItem value="BICYCLE">Bicicletas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status do Pedido</Label>
              <Select
                value={filters.orderStatus}
                onValueChange={(value) => setFilters({ ...filters, orderStatus: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="accepted">Aceitos</SelectItem>
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
                    : ''
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
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="verified">Verificados</SelectItem>
                  <SelectItem value="not-verified">Não Verificados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregadores Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeRiders || '-'}</div>
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
            <div className="text-2xl font-bold">{stats?.verifiedRiders || '-'}</div>
            <p className="text-xs text-muted-foreground">Com selo de confiança</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Hoje</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todaysOrders || '-'}</div>
            <p className="text-xs text-muted-foreground">Total do dia</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.inProgressOrders || '-'}</div>
            <p className="text-xs text-muted-foreground">Sendo entregues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingOrders || '-'}</div>
            <p className="text-xs text-muted-foreground">Aguardando entregador</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos Hoje</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedOrders || '-'}</div>
            <p className="text-xs text-muted-foreground">Entregues hoje</p>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle>Mapa em Tempo Real</CardTitle>
          <CardDescription>
            Visualize entregadores ativos e pedidos em andamento
            {activeRiders?.riders && ` • ${activeRiders.riders.length} entregadores no mapa`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ControlTowerMap 
            riders={activeRiders?.riders || []} 
            orders={orders?.orders || []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
