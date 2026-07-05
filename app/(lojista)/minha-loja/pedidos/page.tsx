'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { StoreOrder, StoreOrderStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle2, XCircle, Clock, Package, MapPin, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

const money = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0);

const STATUS_LABEL: Record<StoreOrderStatus, string> = {
  [StoreOrderStatus.awaiting_payment]: 'Aguardando pagamento',
  [StoreOrderStatus.paid]: 'Pago',
  [StoreOrderStatus.accepted_by_store]: 'Aceito',
  [StoreOrderStatus.dispatched]: 'Despachado',
  [StoreOrderStatus.in_delivery]: 'Em entrega',
  [StoreOrderStatus.completed]: 'Concluído',
  [StoreOrderStatus.cancelled]: 'Cancelado',
  [StoreOrderStatus.rejected]: 'Recusado',
};

function statusBadge(status: StoreOrderStatus) {
  const variant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    paid: 'default',
    dispatched: 'secondary',
    in_delivery: 'secondary',
    completed: 'outline',
    awaiting_payment: 'outline',
    cancelled: 'destructive',
    rejected: 'destructive',
    accepted_by_store: 'secondary',
  };
  return <Badge variant={variant[status] ?? 'outline'}>{STATUS_LABEL[status]}</Badge>;
}

type TabKey = 'novos' | 'andamento' | 'aguardando' | 'historico';

const TAB_FILTER: Record<TabKey, StoreOrderStatus[]> = {
  novos: [StoreOrderStatus.paid],
  andamento: [
    StoreOrderStatus.accepted_by_store,
    StoreOrderStatus.dispatched,
    StoreOrderStatus.in_delivery,
  ],
  aguardando: [StoreOrderStatus.awaiting_payment],
  historico: [StoreOrderStatus.completed, StoreOrderStatus.cancelled, StoreOrderStatus.rejected],
};

export default function PedidosPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabKey>('novos');
  const [detailId, setDetailId] = useState<string | null>(null);

  // Poll mais rápido na aba de pagos (Novos) para o lojista reagir a tempo.
  const { data, isLoading } = useQuery<{ orders: StoreOrder[] }>({
    queryKey: ['store', 'orders'],
    queryFn: () => apiClient.get('/api/store/manage/orders?limit=100'),
    refetchInterval: tab === 'novos' ? 15000 : 30000,
  });
  const orders = useMemo(() => data?.orders ?? [], [data]);

  const counts = useMemo(() => {
    const c: Record<TabKey, number> = { novos: 0, andamento: 0, aguardando: 0, historico: 0 };
    for (const o of orders) {
      (Object.keys(TAB_FILTER) as TabKey[]).forEach((k) => {
        if (TAB_FILTER[k].includes(o.status)) c[k] += 1;
      });
    }
    return c;
  }, [orders]);

  const visible = orders.filter((o) => TAB_FILTER[tab].includes(o.status));

  const acceptOrder = useMutation({
    mutationFn: (id: string) => apiClient.post(`/api/store/manage/orders/${id}/accept`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['store', 'orders'] }),
    onError: (e: any) => alert(e?.message || 'Erro ao aceitar pedido'),
  });

  const rejectOrder = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiClient.post<{ order: StoreOrder; message?: string }>(
        `/api/store/manage/orders/${id}/reject`,
        { reason }
      ),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['store', 'orders'] });
      if (res?.message) alert(res.message);
    },
    onError: (e: any) => alert(e?.message || 'Erro ao recusar pedido'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <p className="text-sm text-muted-foreground">
          Aceite os pedidos pagos para chamar um motoboy automaticamente.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList>
          <TabsTrigger value="novos" className="gap-1.5">
            Novos
            {counts.novos > 0 ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground animate-pulse">
                {counts.novos}
              </span>
            ) : (
              <span className="text-muted-foreground">(0)</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="andamento">Em andamento ({counts.andamento})</TabsTrigger>
          <TabsTrigger value="aguardando">Aguardando pgto ({counts.aguardando})</TabsTrigger>
          <TabsTrigger value="historico">Histórico ({counts.historico})</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando pedidos...</p>}
      {!isLoading && visible.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhum pedido nesta aba.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {visible.map((o) => {
          const isPaid = o.status === StoreOrderStatus.paid;
          return (
            <Card
              key={o.id}
              className={cn(
                isPaid && 'border-primary/50 bg-primary/5 shadow-sm ring-1 ring-primary/20'
              )}
            >
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">#{o.id.slice(-8)}</span>
                    {statusBadge(o.status)}
                    {isPaid && (
                      <Badge variant="outline" className="border-primary/40 text-primary">
                        Aguardando aceite
                      </Badge>
                    )}
                  </div>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Package className="h-3.5 w-3.5" /> {o.customerName}
                    <span className="mx-1">•</span>
                    <Phone className="h-3.5 w-3.5" /> {o.customerPhone}
                  </p>
                  <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {o.customerAddress}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(o.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="text-lg font-bold">{money(o.total)}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setDetailId(o.id)}>
                      Detalhes
                    </Button>
                    {isPaid && (
                      <Button
                        size="sm"
                        onClick={() => acceptOrder.mutate(o.id)}
                        disabled={acceptOrder.isPending}
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" /> Aceitar
                      </Button>
                    )}
                    {(isPaid || o.status === StoreOrderStatus.awaiting_payment) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          const reason = prompt('Motivo da recusa (opcional):') ?? undefined;
                          const paidWarning = isPaid
                            ? '\n\nAtenção: o pagamento já foi recebido. O estorno deve ser feito manualmente no painel do Asaas.'
                            : '';
                          if (confirm(`Confirmar recusa deste pedido?${paidWarning}`)) {
                            rejectOrder.mutate({ id: o.id, reason });
                          }
                        }}
                      >
                        <XCircle className="mr-1 h-4 w-4" /> Recusar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {detailId && <OrderDetailDialog id={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}

function OrderDetailDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, isLoading } = useQuery<{ order: StoreOrder }>({
    queryKey: ['store', 'order', id],
    queryFn: () => apiClient.get(`/api/store/manage/orders/${id}`),
  });
  const order = data?.order;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pedido #{id.slice(-8)}</DialogTitle>
          <DialogDescription>Itens e dados do cliente.</DialogDescription>
        </DialogHeader>

        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {order && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border p-3 text-sm">
              <p>
                <span className="text-muted-foreground">Cliente:</span> {order.customerName}
              </p>
              <p>
                <span className="text-muted-foreground">Telefone:</span> {order.customerPhone}
              </p>
              <p>
                <span className="text-muted-foreground">Endereço:</span> {order.customerAddress}
              </p>
              {order.notes && (
                <p>
                  <span className="text-muted-foreground">Obs.:</span> {order.notes}
                </p>
              )}
            </div>

            <div className="space-y-2">
              {(order.items ?? []).map((it, idx) => (
                <div key={idx} className="rounded-lg bg-muted/40 p-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">
                      {it.quantity}× {it.name}
                    </span>
                    <span>{money(it.lineTotal)}</span>
                  </div>
                  {it.selectedOptions?.length > 0 && (
                    <ul className="ml-4 list-disc text-xs text-muted-foreground">
                      {it.selectedOptions.map((op, i) => (
                        <li key={i}>
                          {op.groupName}: {op.optionName}
                          {op.priceDelta ? ` (${money(op.priceDelta)})` : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-1 border-t border-border pt-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{money(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Taxa de entrega</span>
                <span>{money(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{money(order.total)}</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
