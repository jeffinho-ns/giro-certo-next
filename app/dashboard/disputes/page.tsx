'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { Dispute, DisputeStatus, DisputeType } from '@/lib/types';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import dynamic from 'next/dynamic';

// Importar mapa dinamicamente para evitar problemas de SSR
const ControlTowerMap = dynamic(
  () => import('@/components/map/control-tower-map').then((mod) => ({ default: mod.ControlTowerMap })),
  { ssr: false }
);
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Clock, Package, DollarSign, User, Store, MapPin } from 'lucide-react';

export default function DisputesPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);

  // Listar disputas
  const { data: disputesData, isLoading } = useQuery<{ disputes: Dispute[]; total: number }>({
    queryKey: ['disputes', filterStatus, filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterType !== 'all') params.append('disputeType', filterType);
      params.append('limit', '50');
      
      const response = await apiClient.get<{ disputes: Dispute[]; total: number }>(
        `/api/disputes?${params.toString()}`
      );
      return response;
    },
  });

  // Estatísticas
  const { data: stats } = useQuery<{
    total: number;
    open: number;
    underReview: number;
    resolved: number;
    closed: number;
    byType: Record<string, number>;
  }>({
    queryKey: ['disputes-stats'],
    queryFn: async () => {
      const response = await apiClient.get<{
        total: number;
        open: number;
        underReview: number;
        resolved: number;
        closed: number;
        byType: Record<string, number>;
      }>('/api/disputes/stats/summary');
      return response;
    },
  });

  // Buscar disputa por ID
  const { data: disputeDetail } = useQuery<{ dispute: Dispute } | null>({
    queryKey: ['dispute', selectedDispute?.id],
    queryFn: async () => {
      if (!selectedDispute?.id) return null;
      const response = await apiClient.get<{ dispute: Dispute }>(
        `/api/disputes/${selectedDispute.id}`
      );
      return response;
    },
    enabled: !!selectedDispute?.id,
  });

  // Resolver disputa
  const resolveMutation = useMutation({
    mutationFn: async ({ disputeId, data }: { disputeId: string; data: any }) => {
      return apiClient.put(`/api/disputes/${disputeId}/resolve`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      queryClient.invalidateQueries({ queryKey: ['dispute'] });
      queryClient.invalidateQueries({ queryKey: ['disputes-stats'] });
      setIsResolveModalOpen(false);
      setSelectedDispute(null);
    },
  });

  // Atualizar status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ disputeId, status }: { disputeId: string; status: DisputeStatus }) => {
      return apiClient.put(`/api/disputes/${disputeId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      queryClient.invalidateQueries({ queryKey: ['dispute'] });
    },
  });

  const disputes = disputesData?.disputes || [];

  const getStatusBadge = (status: DisputeStatus) => {
    const variants: Record<DisputeStatus, { className: string; icon: any; label: string }> = {
      [DisputeStatus.OPEN]: {
        className: 'bg-red-500',
        icon: AlertCircle,
        label: 'Aberta',
      },
      [DisputeStatus.UNDER_REVIEW]: {
        className: 'bg-yellow-500',
        icon: Clock,
        label: 'Em Análise',
      },
      [DisputeStatus.RESOLVED]: {
        className: 'bg-green-500',
        icon: CheckCircle2,
        label: 'Resolvida',
      },
      [DisputeStatus.CLOSED]: {
        className: 'bg-gray-500',
        icon: CheckCircle2,
        label: 'Fechada',
      },
    };
    const variant = variants[status];
    const Icon = variant.icon;
    return (
      <Badge className={variant.className}>
        <Icon className="h-3 w-3 mr-1" />
        {variant.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: DisputeType) => {
    const variants: Record<DisputeType, { className: string; icon: any; label: string }> = {
      [DisputeType.DELIVERY_ISSUE]: {
        className: 'bg-blue-500',
        icon: Package,
        label: 'Problema na Entrega',
      },
      [DisputeType.PAYMENT_ISSUE]: {
        className: 'bg-purple-500',
        icon: DollarSign,
        label: 'Problema de Pagamento',
      },
      [DisputeType.RIDER_COMPLAINT]: {
        className: 'bg-orange-500',
        icon: User,
        label: 'Reclamação sobre Entregador',
      },
      [DisputeType.STORE_COMPLAINT]: {
        className: 'bg-pink-500',
        icon: Store,
        label: 'Reclamação sobre Loja',
      },
    };
    const variant = variants[type];
    const Icon = variant.icon;
    return (
      <Badge className={variant.className}>
        <Icon className="h-3 w-3 mr-1" />
        {variant.label}
      </Badge>
    );
  };

  const handleResolve = async (dispute: Dispute, resolution: string, status: DisputeStatus) => {
    await resolveMutation.mutateAsync({
      disputeId: dispute.id,
      data: { resolution, status },
    });
  };

  const handleStatusChange = async (dispute: Dispute, newStatus: DisputeStatus) => {
    await updateStatusMutation.mutateAsync({
      disputeId: dispute.id,
      status: newStatus,
    });
  };

  return (
    <ProtectedRoute requireModerator>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Central de Disputas</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie e resolva conflitos e reclamações do sistema
          </p>
        </div>

        {stats ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Abertas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{stats.open || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Em Análise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-500">{stats.underReview || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Resolvidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{stats.resolved || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Fechadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-500">{stats.closed || 0}</div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value={DisputeStatus.OPEN}>Abertas</SelectItem>
                    <SelectItem value={DisputeStatus.UNDER_REVIEW}>Em Análise</SelectItem>
                    <SelectItem value={DisputeStatus.RESOLVED}>Resolvidas</SelectItem>
                    <SelectItem value={DisputeStatus.CLOSED}>Fechadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value={DisputeType.DELIVERY_ISSUE}>Problema na Entrega</SelectItem>
                    <SelectItem value={DisputeType.PAYMENT_ISSUE}>Problema de Pagamento</SelectItem>
                    <SelectItem value={DisputeType.RIDER_COMPLAINT}>Reclamação sobre Entregador</SelectItem>
                    <SelectItem value={DisputeType.STORE_COMPLAINT}>Reclamação sobre Loja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilterStatus('all');
                    setFilterType('all');
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Disputas */}
        {isLoading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute) => (
              <Card
                key={dispute.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedDispute(dispute)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Disputa #{dispute.id.slice(0, 8)}</CardTitle>
                      <CardDescription>
                        Reportada por {dispute.reporter?.name || 'Usuário'} em{' '}
                        {new Date(dispute.createdAt).toLocaleDateString('pt-BR')}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getTypeBadge(dispute.disputeType)}
                      {getStatusBadge(dispute.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {dispute.description}
                  </p>
                  {dispute.deliveryOrderId && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <Package className="h-3 w-3 inline mr-1" />
                      Relacionada ao pedido #{dispute.deliveryOrderId.slice(0, 8)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de Detalhes */}
        {selectedDispute && disputeDetail && (
          <Dialog open={!!selectedDispute} onOpenChange={(open) => !open && setSelectedDispute(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Detalhes da Disputa</DialogTitle>
                <DialogDescription>
                  Disputa #{selectedDispute.id.slice(0, 8)} -{' '}
                  {new Date(selectedDispute.createdAt).toLocaleDateString('pt-BR')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Status e Tipo */}
                <div className="flex gap-4">
                  {getTypeBadge(disputeDetail.dispute.disputeType)}
                  {getStatusBadge(disputeDetail.dispute.status)}
                </div>

                {/* Informações do Reportador */}
                <div>
                  <Label className="text-muted-foreground">Reportado por</Label>
                  <p className="font-medium">
                    {disputeDetail.dispute.reporter?.name || 'Usuário'} (
                    {disputeDetail.dispute.reporter?.email || 'N/A'})
                  </p>
                </div>

                {/* Descrição */}
                <div>
                  <Label className="text-muted-foreground">Descrição</Label>
                  <p className="mt-1 whitespace-pre-wrap">{disputeDetail.dispute.description}</p>
                </div>

                {/* Pedido Relacionado */}
                {disputeDetail.dispute.deliveryOrder && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Pedido Relacionado</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <Label className="text-muted-foreground">ID do Pedido</Label>
                        <p className="font-medium">{disputeDetail.dispute.deliveryOrder.id}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Status</Label>
                        <p className="font-medium">{disputeDetail.dispute.deliveryOrder.status}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Valor</Label>
                        <p className="font-medium">
                          R$ {disputeDetail.dispute.deliveryOrder.value?.toFixed(2).replace('.', ',') || '0,00'}
                        </p>
                      </div>
                      {disputeDetail.dispute.deliveryOrder.storeAddress && (
                        <div>
                          <Label className="text-muted-foreground">Endereço da Loja</Label>
                          <p className="font-medium">{disputeDetail.dispute.deliveryOrder.storeAddress}</p>
                        </div>
                      )}
                      {disputeDetail.dispute.deliveryOrder.deliveryAddress && (
                        <div>
                          <Label className="text-muted-foreground">Endereço de Entrega</Label>
                          <p className="font-medium">{disputeDetail.dispute.deliveryOrder.deliveryAddress}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Logs de Geolocalização */}
                {disputeDetail.dispute.locationLogs && Array.isArray(disputeDetail.dispute.locationLogs) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Logs de Geolocalização</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] rounded-lg overflow-hidden">
                        <ControlTowerMap
                          riders={[]}
                          orders={
                            disputeDetail.dispute.deliveryOrder
                              ? [
                                  {
                                    id: disputeDetail.dispute.deliveryOrder.id,
                                    storeLatitude:
                                      disputeDetail.dispute.deliveryOrder.storeLatitude || 0,
                                    storeLongitude:
                                      disputeDetail.dispute.deliveryOrder.storeLongitude || 0,
                                    deliveryLatitude:
                                      disputeDetail.dispute.deliveryOrder.deliveryLatitude || 0,
                                    deliveryLongitude:
                                      disputeDetail.dispute.deliveryOrder.deliveryLongitude || 0,
                                    status: disputeDetail.dispute.deliveryOrder.status || 'pending',
                                  },
                                ]
                              : []
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Resolução */}
                {disputeDetail.dispute.resolution && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Resolução</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{disputeDetail.dispute.resolution}</p>
                      {disputeDetail.dispute.resolver && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Resolvido por {disputeDetail.dispute.resolver.name} em{' '}
                          {disputeDetail.dispute.resolvedAt
                            ? new Date(disputeDetail.dispute.resolvedAt).toLocaleDateString('pt-BR')
                            : 'N/A'}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              <DialogFooter className="flex justify-between">
                <div className="flex gap-2">
                  {isAdmin && disputeDetail.dispute.status === DisputeStatus.OPEN && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        handleStatusChange(disputeDetail.dispute, DisputeStatus.UNDER_REVIEW)
                      }
                    >
                      Marcar como Em Análise
                    </Button>
                  )}
                  {isAdmin && disputeDetail.dispute.status === DisputeStatus.RESOLVED && (
                    <Button
                      variant="outline"
                      onClick={() => handleStatusChange(disputeDetail.dispute, DisputeStatus.CLOSED)}
                    >
                      Fechar Disputa
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  {isAdmin && disputeDetail.dispute.status !== DisputeStatus.CLOSED && (
                    <Dialog open={isResolveModalOpen} onOpenChange={setIsResolveModalOpen}>
                      <DialogTrigger asChild>
                        <Button>Resolver Disputa</Button>
                      </DialogTrigger>
                      <ResolveDisputeDialog
                        dispute={disputeDetail.dispute}
                        onResolve={(resolution, status) => {
                          handleResolve(disputeDetail.dispute, resolution, status);
                        }}
                        isLoading={resolveMutation.isPending}
                      />
                    </Dialog>
                  )}
                  <Button variant="outline" onClick={() => setSelectedDispute(null)}>
                    Fechar
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </ProtectedRoute>
  );
}

function ResolveDisputeDialog({
  dispute,
  onResolve,
  isLoading,
}: {
  dispute: Dispute;
  onResolve: (resolution: string, status: DisputeStatus) => void;
  isLoading: boolean;
}) {
  const [resolution, setResolution] = useState('');
  const [status, setStatus] = useState<DisputeStatus>(DisputeStatus.RESOLVED);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolution.trim()) {
      alert('Por favor, preencha a resolução');
      return;
    }
    onResolve(resolution, status);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Resolver Disputa</DialogTitle>
        <DialogDescription>
          Descreva a resolução aplicada para esta disputa
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Status Final *</Label>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as DisputeStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DisputeStatus.RESOLVED}>Resolvida</SelectItem>
              <SelectItem value={DisputeStatus.CLOSED}>Fechada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Resolução *</Label>
          <Textarea
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="Descreva a resolução aplicada..."
            rows={6}
            required
          />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Resolver Disputa'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
