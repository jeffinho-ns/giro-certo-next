'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRightLeft,
  Bike,
  CreditCard,
  DollarSign,
  Package,
  Store,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  fetchDashboardFinancial,
  formatBrl,
  TRANSACTION_TYPE_LABELS,
  transactionStatusLabel,
  type FinancialTransactionType,
} from '@/lib/financial';

const CHART_COLORS = ['#f97316', '#22c55e', '#3b82f6', '#a855f7', '#eab308'];

const PERIOD_OPTIONS = [
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
  { value: '365', label: 'Último ano' },
];

function brlTooltip(value: number | string | undefined) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '';
  return formatBrl(n);
}

function typeBadgeVariant(
  type: FinancialTransactionType
): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (type === 'delivery_charge') return 'default';
  if (type === 'payout_transfer') return 'secondary';
  if (type === 'wallet_withdrawal') return 'outline';
  return 'secondary';
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function FinancialPage() {
  const [days, setDays] = useState('30');

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['dashboard-financial', days],
    queryFn: () => fetchDashboardFinancial(Number(days)),
    refetchInterval: 120_000,
  });

  const s = data?.summary;

  return (
    <ProtectedRoute requireModerator>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Histórico de cobranças de entrega, comissões, assinaturas e repasses.
              Dados em tempo real da API — período selecionável abaixo.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? 'Atualizando…' : 'Atualizar'}
            </Button>
            <Button variant="secondary" size="sm" asChild>
              <Link href="/dashboard/settlements">
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Repasses Asaas
              </Link>
            </Button>
          </div>
        </div>

        {isError && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-4 text-sm text-destructive">
              {(error as Error)?.message || 'Não foi possível carregar o financeiro.'}
            </CardContent>
          </Card>
        )}

        {/* KPIs — entregas */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Entregas e cobranças
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Volume cobrado (clientes)"
              icon={DollarSign}
              value={isLoading ? '…' : formatBrl(s?.totalCustomerVolume ?? 0)}
              hint={`${s?.paidDeliveryCount ?? 0} pagamento(s) confirmado(s)`}
            />
            <StatCard
              title="Receita plataforma (corridas)"
              icon={TrendingUp}
              value={isLoading ? '…' : formatBrl(s?.platformRevenueDelivery ?? 0)}
              hint="Taxas loja + moto por pedido pago"
              accent="text-green-600"
            />
            <StatCard
              title="Líquido lojas (acumulado)"
              icon={Store}
              value={isLoading ? '…' : formatBrl(s?.storeNetAccrued ?? 0)}
              hint={`Pendente repasse: ${isLoading ? '…' : formatBrl(s?.pendingStorePayout ?? 0)}`}
            />
            <StatCard
              title="Líquido entregadores"
              icon={Bike}
              value={isLoading ? '…' : formatBrl(s?.riderNetAccrued ?? 0)}
              hint={`Pendente repasse: ${isLoading ? '…' : formatBrl(s?.pendingRiderPayout ?? 0)}`}
            />
          </div>
        </div>

        {/* KPIs — assinaturas e carteira */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Comissões carteira (motoboy)"
            icon={Wallet}
            value={isLoading ? '…' : formatBrl(s?.walletCommissionRevenue ?? 0)}
            hint={`${s?.walletCommissionCount ?? 0} lançamento(s) · modelo legado`}
          />
          <StatCard
            title="Assinantes premium"
            icon={Users}
            value={isLoading ? '…' : String(s?.premiumSubscribers ?? 0)}
            hint="Motoboys com plano premium ativo"
          />
          <StatCard
            title="MRR lojas (mensalidade)"
            icon={CreditCard}
            value={isLoading ? '…' : formatBrl(s?.subscriptionMrrEstimate ?? 0)}
            hint={`${s?.activeSubscriptionPartners ?? 0} loja(s) com plano mensal`}
          />
          <StatCard
            title="Repasses executados"
            icon={ArrowRightLeft}
            value={isLoading ? '…' : formatBrl(s?.payoutsExecutedTotal ?? 0)}
            hint={`${s?.payoutsExecutedCount ?? 0} lote(s) no período`}
          />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Volume e receita por mês</CardTitle>
              <CardDescription>
                Cobranças de pedidos pagos e taxa da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[320px]">
              {isLoading ? (
                <ChartSkeleton />
              ) : (data?.monthlySeries.length ?? 0) === 0 ? (
                <EmptyChart message="Nenhum pagamento de entrega no período." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data?.monthlySeries}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) =>
                        v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`
                      }
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11 }}
                      allowDecimals={false}
                    />
                    <Tooltip formatter={brlTooltip} />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="customerVolume"
                      name="Volume clientes"
                      fill={CHART_COLORS[2]}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="platformRevenue"
                      name="Receita plataforma"
                      fill={CHART_COLORS[0]}
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="deliveryCount"
                      name="Pedidos pagos"
                      stroke={CHART_COLORS[1]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Composição da receita</CardTitle>
              <CardDescription>
                Corridas, carteira motoboy e mensalidades de lojas
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[320px]">
              {isLoading ? (
                <ChartSkeleton />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.revenueBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) =>
                        `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                    >
                      {(data?.revenueBreakdown ?? []).map((entry, index) => (
                        <Cell
                          key={entry.key}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={brlTooltip} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Comissões carteira por mês (se houver) */}
        {(data?.monthlySeries.some((m) => m.walletCommissions > 0) || isLoading) && (
          <Card>
            <CardHeader>
              <CardTitle>Comissões carteira por mês</CardTitle>
              <CardDescription>Modelo legado de comissão por corrida na carteira</CardDescription>
            </CardHeader>
            <CardContent className="h-[260px]">
              {isLoading ? (
                <ChartSkeleton />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.monthlySeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthLabel" />
                    <YAxis tickFormatter={(v) => `R$${v}`} />
                    <Tooltip formatter={brlTooltip} />
                    <Bar
                      dataKey="walletCommissions"
                      name="Comissões carteira"
                      fill={CHART_COLORS[4]}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}

        {/* Histórico */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Histórico de movimentações
            </CardTitle>
            <CardDescription>
              Cobranças de pedidos, carteira motoboy e lotes de repasse — últimos{' '}
              {data?.transactions.length ?? 0} registros no período
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Carregando…</p>
            ) : (data?.transactions.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Nenhuma movimentação no período. Confirme pagamentos Asaas (webhook) ou amplie o
                intervalo.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Contraparte</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Detalhe</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.transactions.map((tx) => {
                      const isOutflow =
                        tx.type === 'wallet_withdrawal' ||
                        (tx.type === 'payout_transfer' && tx.status === 'transfer_done');
                      const typeLabel = TRANSACTION_TYPE_LABELS[tx.type];
                      return (
                        <TableRow key={`${tx.type}-${tx.id}`}>
                          <TableCell className="whitespace-nowrap text-sm">
                            {formatDateTime(tx.occurredAt)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={typeBadgeVariant(tx.type)}>{typeLabel}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[220px]">
                            <span className="text-sm">{tx.description}</span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {tx.counterparty ?? '—'}
                          </TableCell>
                          <TableCell
                            className={`text-right font-semibold whitespace-nowrap ${
                              isOutflow ? 'text-amber-700 dark:text-amber-400' : 'text-green-600'
                            }`}
                          >
                            {isOutflow ? '−' : '+'}
                            {formatBrl(tx.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{transactionStatusLabel(tx.status)}</Badge>
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {tx.type === 'delivery_charge' && tx.meta?.platformFee != null ? (
                              <span>
                                Taxa {formatBrl(tx.meta.platformFee)}
                                <br />
                                Loja {formatBrl(tx.meta.storeNet ?? 0)} · Moto{' '}
                                {formatBrl(tx.meta.riderNet ?? 0)}
                              </span>
                            ) : tx.referenceId ? (
                              <span className="font-mono">…{tx.referenceId.slice(-8)}</span>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground pb-4">
          Pedidos concluídos no período: {s?.completedOrdersInWindow ?? '—'}. Saques carteira
          (pendentes + concluídos): {isLoading ? '…' : formatBrl(s?.walletWithdrawalsTotal ?? 0)}.
          Repasses pendentes são liquidados em{' '}
          <Link href="/dashboard/settlements" className="underline">
            Repasses Asaas
          </Link>
          .
        </p>
      </div>
    </ProtectedRoute>
  );
}


function StatCard({
  title,
  icon: Icon,
  value,
  hint,
  accent,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  hint: string;
  accent?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${accent ?? ''}`}>{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{hint}</p>
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-full w-full animate-pulse rounded-lg bg-muted/40 flex items-center justify-center text-sm text-muted-foreground">
      Carregando gráfico…
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-full flex items-center justify-center text-sm text-muted-foreground text-center px-4">
      {message}
    </div>
  );
}
