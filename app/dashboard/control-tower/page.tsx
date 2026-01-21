'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Package, Users, TrendingUp } from 'lucide-react';
import { ControlTowerMap } from '@/components/map/control-tower-map';

export default function ControlTowerPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Mock data até a API estar pronta
      return {
        activeRiders: 12,
        todaysOrders: 45,
        inProgressOrders: 8,
        pendingOrders: 5,
      };
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Torre de Controle</h1>
        <p className="text-muted-foreground mt-2">
          Monitoramento em tempo real de motociclistas e pedidos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Motociclistas Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeRiders || '-'}</div>
            <p className="text-xs text-muted-foreground">Online agora</p>
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
            <p className="text-xs text-muted-foreground">Aguardando motociclista</p>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle>Mapa em Tempo Real</CardTitle>
          <CardDescription>
            Visualize motociclistas ativos e pedidos em andamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ControlTowerMap />
        </CardContent>
      </Card>
    </div>
  );
}
