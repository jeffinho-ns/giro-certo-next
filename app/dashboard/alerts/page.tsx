'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
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
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, AlertCircle, Wrench, DollarSign, CheckCircle2, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Alert, AlertType, AlertSeverity } from '@/lib/types';

export default function AlertsPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');

  // Listar alertas
  const { data: alertsData, isLoading } = useQuery<{ alerts: Alert[]; total: number }>({
    queryKey: ['alerts', filterType, filterSeverity, filterRead],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      if (filterSeverity !== 'all') params.append('severity', filterSeverity);
      if (filterRead !== 'all') params.append('isRead', filterRead);
      params.append('limit', '100');
      
      const response = await apiClient.get<{ alerts: Alert[]; total: number }>(
        `/api/alerts?${params.toString()}`
      );
      return response;
    },
  });

  // Estatísticas
  const { data: stats } = useQuery<{
    total: number;
    unread: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  }>({
    queryKey: ['alerts-stats'],
    queryFn: async () => {
      const response = await apiClient.get<{
        total: number;
        unread: number;
        bySeverity: Record<string, number>;
        byType: Record<string, number>;
      }>('/api/alerts/stats/summary');
      return response;
    },
  });

  // Marcar como lido
  const markAsReadMutation = useMutation({
    mutationFn: async (alertId: string) => {
      return apiClient.put(`/api/alerts/${alertId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alerts-stats'] });
    },
  });

  // Marcar todos como lidos
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiClient.put('/api/alerts/read-all', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alerts-stats'] });
    },
  });

  // Deletar alerta
  const deleteMutation = useMutation({
    mutationFn: async (alertId: string) => {
      return apiClient.delete(`/api/alerts/${alertId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alerts-stats'] });
    },
  });

  const alerts = alertsData?.alerts || [];

  const getTypeIcon = (type: AlertType) => {
    switch (type) {
      case AlertType.DOCUMENT_EXPIRING:
        return <AlertCircle className="h-4 w-4" />;
      case AlertType.MAINTENANCE_CRITICAL:
        return <Wrench className="h-4 w-4" />;
      case AlertType.PAYMENT_OVERDUE:
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    const variants: Record<AlertSeverity, { className: string; label: string }> = {
      [AlertSeverity.LOW]: { className: 'bg-blue-500', label: 'Baixa' },
      [AlertSeverity.MEDIUM]: { className: 'bg-yellow-500', label: 'Média' },
      [AlertSeverity.HIGH]: { className: 'bg-orange-500', label: 'Alta' },
      [AlertSeverity.CRITICAL]: { className: 'bg-red-500', label: 'Crítica' },
    };
    const variant = variants[severity];
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getTypeLabel = (type: AlertType) => {
    switch (type) {
      case AlertType.DOCUMENT_EXPIRING:
        return 'Documento Expirando';
      case AlertType.MAINTENANCE_CRITICAL:
        return 'Manutenção Crítica';
      case AlertType.PAYMENT_OVERDUE:
        return 'Pagamento Atrasado';
      default:
        return type;
    }
  };

  return (
    <ProtectedRoute requireModerator>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Alertas e Notificações</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie alertas automáticos do sistema
          </p>
        </div>
          {stats && stats.unread > 0 ? (
            <Button
              variant="outline"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Marcar Todos como Lidos
            </Button>
          ) : null}
        </div>

        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <CardTitle className="text-sm font-medium">Não Lidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{stats.unread || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Críticos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  {stats.bySeverity?.CRITICAL || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Altos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">
                  {stats.bySeverity?.HIGH || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value={AlertType.DOCUMENT_EXPIRING}>
                      Documento Expirando
                    </SelectItem>
                    <SelectItem value={AlertType.MAINTENANCE_CRITICAL}>
                      Manutenção Crítica
                    </SelectItem>
                    <SelectItem value={AlertType.PAYMENT_OVERDUE}>
                      Pagamento Atrasado
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Severidade</Label>
                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value={AlertSeverity.CRITICAL}>Crítica</SelectItem>
                    <SelectItem value={AlertSeverity.HIGH}>Alta</SelectItem>
                    <SelectItem value={AlertSeverity.MEDIUM}>Média</SelectItem>
                    <SelectItem value={AlertSeverity.LOW}>Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filterRead} onValueChange={setFilterRead}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="false">Não Lidos</SelectItem>
                    <SelectItem value="true">Lidos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilterType('all');
                    setFilterSeverity('all');
                    setFilterRead('all');
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Alertas */}
        {isLoading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card
                key={alert.id}
                className={`transition-all ${
                  !alert.isRead ? 'border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">{getTypeIcon(alert.type)}</div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{alert.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {getTypeLabel(alert.type)} •{' '}
                          {new Date(alert.createdAt).toLocaleString('pt-BR')}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(alert.severity)}
                      {!alert.isRead && (
                        <Badge variant="destructive" className="text-xs">Novo</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{alert.message}</p>
                  <div className="flex justify-end gap-2 mt-4">
                    {!alert.isRead && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsReadMutation.mutate(alert.id)}
                        disabled={markAsReadMutation.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Marcar como Lido
                      </Button>
                    )}
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Deseja deletar este alerta?')) {
                            deleteMutation.mutate(alert.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {alerts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum alerta encontrado
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
