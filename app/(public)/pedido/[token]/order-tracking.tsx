'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { PublicOrderStatus, StoreOrderStatus } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Circle, Clock, XCircle, Star } from 'lucide-react';

const money = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0);

const STATUS_LABEL: Record<StoreOrderStatus, string> = {
  [StoreOrderStatus.awaiting_payment]: 'Aguardando pagamento',
  [StoreOrderStatus.paid]: 'Pagamento confirmado',
  [StoreOrderStatus.accepted_by_store]: 'Aceito pela loja',
  [StoreOrderStatus.dispatched]: 'Saiu para entrega',
  [StoreOrderStatus.in_delivery]: 'A caminho',
  [StoreOrderStatus.completed]: 'Entregue',
  [StoreOrderStatus.cancelled]: 'Cancelado',
  [StoreOrderStatus.rejected]: 'Recusado',
};

const STEPS: { key: string; label: string; field: keyof PublicOrderStatus['timeline'] }[] = [
  { key: 'created', label: 'Pedido recebido', field: 'createdAt' },
  { key: 'paid', label: 'Pagamento confirmado', field: 'paidAt' },
  { key: 'accepted', label: 'Aceito pela loja', field: 'acceptedAt' },
  { key: 'dispatched', label: 'Saiu para entrega', field: 'dispatchedAt' },
  { key: 'completed', label: 'Entregue', field: 'completedAt' },
];

export function OrderTracking({ token }: { token: string }) {
  const { data, isLoading, isError } = useQuery<{ order: PublicOrderStatus }>({
    queryKey: ['public-order', token],
    queryFn: () => apiClient.get(`/api/store/public/orders/${token}`),
    refetchInterval: 15000,
  });

  const order = data?.order;
  const isCancelled =
    order?.status === StoreOrderStatus.cancelled || order?.status === StoreOrderStatus.rejected;

  return (
    <div className="min-h-screen bg-gray-50 py-8 dark:bg-gray-950">
      <div className="mx-auto max-w-xl space-y-6 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Acompanhe seu pedido</h1>
          {order && <p className="text-sm text-muted-foreground">{order.store.name}</p>}
        </div>

        {isLoading && <p className="text-center text-muted-foreground">Carregando...</p>}
        {isError && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Pedido não encontrado. Verifique o link.
            </CardContent>
          </Card>
        )}

        {order && (
          <>
            <Card>
              <CardContent className="space-y-1 p-4 text-center">
                <p className="text-xs text-muted-foreground">Pedido #{order.id.slice(-8)}</p>
                {isCancelled ? (
                  <Badge variant="destructive" className="text-sm">
                    {STATUS_LABEL[order.status]}
                  </Badge>
                ) : (
                  <Badge className="text-sm">{STATUS_LABEL[order.status]}</Badge>
                )}
              </CardContent>
            </Card>

            {!isCancelled && (
              <Card>
                <CardContent className="space-y-4 p-5">
                  {STEPS.map((step, idx) => {
                    const done = !!order.timeline[step.field];
                    const isLast = idx === STEPS.length - 1;
                    return (
                      <div key={step.key} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          {done ? (
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                          ) : (
                            <Circle className="h-6 w-6 text-muted-foreground/40" />
                          )}
                          {!isLast && (
                            <div className={`my-1 h-6 w-0.5 ${done ? 'bg-green-600' : 'bg-muted'}`} />
                          )}
                        </div>
                        <div className="pb-1">
                          <p className={done ? 'font-medium' : 'text-muted-foreground'}>{step.label}</p>
                          {done && order.timeline[step.field] && (
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {new Date(order.timeline[step.field] as string).toLocaleString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {isCancelled && order.timeline.cancelledAt && (
              <Card>
                <CardContent className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                  <XCircle className="h-5 w-5 text-red-600" />
                  Cancelado em {new Date(order.timeline.cancelledAt).toLocaleString('pt-BR')}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="space-y-2 p-4">
                <h2 className="font-semibold">Itens</h2>
                {order.items.map((it, idx) => (
                  <div key={idx} className="text-sm">
                    <div className="flex justify-between">
                      <span>
                        {it.quantity}× {it.name}
                      </span>
                      <span>{money(it.lineTotal)}</span>
                    </div>
                    {it.selectedOptions?.length > 0 && (
                      <p className="ml-4 text-xs text-muted-foreground">
                        {it.selectedOptions.map((o) => o.optionName).join(', ')}
                      </p>
                    )}
                  </div>
                ))}
                <div className="space-y-1 border-t border-border pt-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{money(order.subtotal)}</span>
                  </div>
                  {!!order.discount && order.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto{order.couponCode ? ` (${order.couponCode})` : ''}</span>
                      <span>-{money(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Taxa de entrega</span>
                    <span>{money(order.deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>{money(order.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {!isCancelled &&
              order.status !== StoreOrderStatus.awaiting_payment &&
              (order.reviewed ? (
                <Card>
                  <CardContent className="py-4 text-center text-sm text-green-600">
                    Obrigado pela sua avaliação!
                  </CardContent>
                </Card>
              ) : (
                <ReviewForm token={token} />
              ))}

            <p className="text-center text-xs text-muted-foreground">
              Esta página atualiza automaticamente. Guarde o link para acompanhar.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function ReviewForm({ token }: { token: string }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const submit = useMutation({
    mutationFn: () => {
      if (rating < 1) throw new Error('Escolha uma nota de 1 a 5');
      return apiClient.post(`/api/store/public/orders/${token}/review`, {
        rating,
        comment: comment.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-order', token] });
    },
    onError: (e: any) => setError(e?.message || 'Erro ao enviar avaliação'),
  });

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <p className="font-semibold">Avalie sua experiência</p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => {
            const value = i + 1;
            const filled = (hover || rating) >= value;
            return (
              <button
                key={i}
                type="button"
                onMouseEnter={() => setHover(value)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(value)}
                aria-label={`${value} estrela(s)`}
              >
                <Star
                  className={`h-7 w-7 transition-colors ${
                    filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`}
                />
              </button>
            );
          })}
        </div>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Conte como foi (opcional)"
          rows={3}
        />
        <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
          {submit.isPending ? 'Enviando...' : 'Enviar avaliação'}
        </Button>
      </CardContent>
    </Card>
  );
}
