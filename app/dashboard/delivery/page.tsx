'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { DeliveryOrder, DeliveryStatus } from '@/lib/types';
import { Package, Search, Filter, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import { apiClient } from '@/lib/api';

function getStatusBadge(status: DeliveryStatus) {
  const variants: Record<DeliveryStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'secondary',
    accepted: 'default',
    inProgress: 'default',
    completed: 'outline',
    cancelled: 'destructive',
  };

  const labels: Record<DeliveryStatus, string> = {
    pending: 'Pendente',
    accepted: 'Aceito',
    inProgress: 'Em Andamento',
    completed: 'Concluído',
    cancelled: 'Cancelado',
  };

  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}

function DeliveryOrderDetail({ order }: { order: DeliveryOrder }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Loja</p>
          <p className="font-medium">{order.storeName}</p>
          <p className="text-sm text-muted-foreground">{order.storeAddress}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Entrega</p>
          <p className="font-medium">{order.deliveryAddress}</p>
          {order.recipientName && (
            <p className="text-sm text-muted-foreground">{order.recipientName}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Valor do Pedido</p>
          <p className="font-medium">R$ {order.value.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Taxa de Entrega</p>
          <p className="font-medium">R$ {order.deliveryFee.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Comissão</p>
          <p className="font-medium">R$ {(order.appCommission ?? 0).toFixed(2)}</p>
        </div>
      </div>
      {order.riderName && (
        <div>
          <p className="text-sm text-muted-foreground">Motociclista</p>
          <p className="font-medium">{order.riderName}</p>
        </div>
      )}
    </div>
  );
}

export default function DeliveryPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['delivery-orders', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('limit', '100');
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await apiClient.get<{ orders: DeliveryOrder[]; total: number }>(
        `/api/delivery?${params.toString()}`
      );
      return res;
    },
  });

  const orders = data?.orders ?? [];

  const filteredOrders = orders?.filter((order) => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (searchQuery && !order.storeName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestão de Delivery</h1>
        <p className="text-muted-foreground mt-2">
          Monitoramento completo de pedidos de entrega
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por loja..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="accepted">Aceito</SelectItem>
                <SelectItem value="inProgress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos</CardTitle>
          <CardDescription>
            {error ? 'Erro ao carregar pedidos.' : `${filteredOrders?.length ?? 0} pedido(s) encontrado(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Motociclista</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">Carregando...</TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-destructive">
                    Erro ao carregar. <Button variant="link" onClick={() => refetch()}>Tentar novamente</Button>
                  </TableCell>
                </TableRow>
              ) : filteredOrders?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">Nenhum pedido encontrado</TableCell>
                </TableRow>
              ) : (
                filteredOrders?.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">#{order.id.slice(0, 8)}</TableCell>
                    <TableCell>{order.storeName}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{order.deliveryAddress}</TableCell>
                    <TableCell>R$ {order.value.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={(order.appCommission ?? 0) === 3 ? 'text-green-600 font-semibold' : ''}>
                        R$ {(order.appCommission ?? 0).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{order.riderName || '-'}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Detalhes do Pedido #{order.id.slice(0, 8)}</DialogTitle>
                            <DialogDescription>
                              Informações completas do pedido de entrega
                            </DialogDescription>
                          </DialogHeader>
                          <DeliveryOrderDetail order={order} />
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
