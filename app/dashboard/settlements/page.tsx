'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  batchStatusLabel,
  composeSettlementBatches,
  executeSettlementTransfer,
  fetchPendingSettlementSummary,
  fetchSettlementBatches,
  formatBrl,
  reconcileSettlementPayments,
  reconcileSettlementTransfers,
  type SettlementBatch,
} from '@/lib/settlement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProtectedRoute } from '@/components/auth/protected-route';
import {
  ArrowRightLeft,
  Banknote,
  Layers,
  RefreshCw,
  Wallet,
} from 'lucide-react';

function BatchStatusBadge({ status }: { status: string }) {
  const variant =
    status === 'transfer_done'
      ? 'outline'
      : status === 'transfer_failed' || status === 'cancelled'
        ? 'destructive'
        : status === 'pending_transfer'
          ? 'default'
          : 'secondary';
  return <Badge variant={variant}>{batchStatusLabel(status)}</Badge>;
}

export default function SettlementsPage() {
  const queryClient = useQueryClient();
  const [batchStatusFilter, setBatchStatusFilter] = useState<string>('all');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['settlement-pending-summary'],
    queryFn: fetchPendingSettlementSummary,
    refetchInterval: 60_000,
  });

  const { data: batches = [], isLoading: batchesLoading } = useQuery({
    queryKey: ['settlement-batches', batchStatusFilter],
    queryFn: () =>
      fetchSettlementBatches(
        batchStatusFilter === 'all' ? undefined : batchStatusFilter
      ),
    refetchInterval: 45_000,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['settlement-pending-summary'] });
    queryClient.invalidateQueries({ queryKey: ['settlement-batches'] });
  };

  const composeMutation = useMutation({
    mutationFn: () => composeSettlementBatches(),
    onSuccess: (res) => {
      setActionMessage(
        `Lotes criados: ${res.partnerBatches} loja(s), ${res.riderBatches} rider(s). Total IDs: ${res.batches.length}.`
      );
      setActionError(null);
      invalidateAll();
    },
    onError: (e: Error) => setActionError(e.message),
  });

  const reconcilePayMutation = useMutation({
    mutationFn: () => reconcileSettlementPayments(80),
    onSuccess: (res) => {
      setActionMessage(
        `Cobranças: ${res.scanned} analisadas, ${res.updated} atualizadas` +
          (res.failures.length ? `, ${res.failures.length} falha(s).` : '.')
      );
      setActionError(null);
      invalidateAll();
    },
    onError: (e: Error) => setActionError(e.message),
  });

  const reconcileTxMutation = useMutation({
    mutationFn: () => reconcileSettlementTransfers(60),
    onSuccess: (res) => {
      setActionMessage(
        `Transferências: ${res.scanned} analisadas, ${res.flaggedFailed} marcada(s) com falha` +
          (res.failures.length ? `, ${res.failures.length} erro(s) de API.` : '.')
      );
      setActionError(null);
      invalidateAll();
    },
    onError: (e: Error) => setActionError(e.message),
  });

  const executeMutation = useMutation({
    mutationFn: (batchId: string) => executeSettlementTransfer(batchId),
    onSuccess: (res, batchId) => {
      setActionMessage(
        `Repasse ${batchId.slice(-8)}: ${res.asaasTransferId ? `Asaas ${res.asaasTransferId}` : 'sem ID Asaas'}`
      );
      setActionError(null);
      invalidateAll();
    },
    onError: (e: Error) => setActionError(e.message),
  });

  const totalStorePending =
    summary?.byStore.reduce((s, r) => s + r.pendingStoreNet, 0) ?? 0;
  const totalRiderPending =
    summary?.byRider.reduce((s, r) => s + r.pendingRiderNet, 0) ?? 0;

  return (
    <ProtectedRoute requireAdmin>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Repasses (Asaas)</h1>
          <p className="text-muted-foreground mt-2">
            Livro de repasses, lotes e transferências para lojas e entregadores. Requer{' '}
            <code className="text-xs">ASAAS_ENABLE_PAYOUTS=true</code> para executar repasses reais.
          </p>
        </div>

        {(actionMessage || actionError) && (
          <Card
            className={
              actionError
                ? 'border-destructive/50 bg-destructive/5'
                : 'border-green-600/30 bg-green-600/5'
            }
          >
            <CardContent className="pt-4 text-sm">
              {actionError ? (
                <p className="text-destructive">{actionError}</p>
              ) : (
                <p className="text-foreground">{actionMessage}</p>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => composeMutation.mutate()}
            disabled={composeMutation.isPending}
          >
            <Layers className="mr-2 h-4 w-4" />
            {composeMutation.isPending ? 'A compor…' : 'Compor lotes'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => reconcilePayMutation.mutate()}
            disabled={reconcilePayMutation.isPending}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reconciliar cobranças
          </Button>
          <Button
            variant="secondary"
            onClick={() => reconcileTxMutation.mutate()}
            disabled={reconcileTxMutation.isPending}
          >
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Reconciliar transferências
          </Button>
          <Button variant="outline" onClick={() => invalidateAll()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                Lojas (pendente)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryLoading ? '…' : formatBrl(totalStorePending)}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary?.byStore.length ?? 0} loja(s) no livro
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Riders (pendente)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryLoading ? '…' : formatBrl(totalRiderPending)}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary?.byRider.length ?? 0} entregador(es)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Frete sem rider</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {summaryLoading
                  ? '…'
                  : formatBrl(summary?.pendingRiderNetUnassigned ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Atribuído quando o motoqueiro aceita
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Pendências por loja</CardTitle>
              <CardDescription>Linhas ainda sem lote</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loja</TableHead>
                    <TableHead className="text-right">Linhas</TableHead>
                    <TableHead className="text-right">Líquido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(summary?.byStore ?? []).slice(0, 12).map((row) => (
                    <TableRow key={row.storeId}>
                      <TableCell className="font-medium">
                        {row.storeName ?? row.storeId.slice(-8)}
                      </TableCell>
                      <TableCell className="text-right">{row.pendingCount}</TableCell>
                      <TableCell className="text-right">
                        {formatBrl(row.pendingStoreNet)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!summaryLoading && (summary?.byStore.length ?? 0) === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-muted-foreground">
                        Nenhuma pendência de loja.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pendências por entregador</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rider</TableHead>
                    <TableHead className="text-right">Linhas</TableHead>
                    <TableHead className="text-right">Líquido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(summary?.byRider ?? []).slice(0, 12).map((row) => (
                    <TableRow key={row.riderUserId}>
                      <TableCell className="font-medium">
                        {row.riderName ?? row.riderUserId.slice(-8)}
                      </TableCell>
                      <TableCell className="text-right">{row.pendingCount}</TableCell>
                      <TableCell className="text-right">
                        {formatBrl(row.pendingRiderNet)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!summaryLoading && (summary?.byRider.length ?? 0) === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-muted-foreground">
                        Nenhuma pendência de rider.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Lotes de repasse</CardTitle>
              <CardDescription>
                Execute transferência com perfil bancário já guardado pelo beneficiário
              </CardDescription>
            </div>
            <Select
              value={batchStatusFilter}
              onValueChange={setBatchStatusFilter}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filtrar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending_transfer">Aguardando transferência</SelectItem>
                <SelectItem value="transfer_done">Transferido</SelectItem>
                <SelectItem value="transfer_failed">Falha</SelectItem>
                <SelectItem value="no_transfer">Sem transferência</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Beneficiário</TableHead>
                  <TableHead className="text-right">Bruto</TableHead>
                  <TableHead className="text-right">Taxa</TableHead>
                  <TableHead className="text-right">Líquido</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((b: SettlementBatch) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs">{b.id.slice(-10)}</TableCell>
                    <TableCell>
                      {b.beneficiary_type === 'partner' ? 'Loja' : 'Rider'}
                      <span className="block text-xs text-muted-foreground">
                        {(b.partner_id ?? b.rider_user_id ?? '').slice(-12)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{formatBrl(b.gross_amount)}</TableCell>
                    <TableCell className="text-right">
                      {formatBrl(b.settlement_fee_flat)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatBrl(b.net_payable)}
                    </TableCell>
                    <TableCell>
                      <BatchStatusBadge status={b.status} />
                      {b.asaas_transfer_id && (
                        <span className="block text-xs text-muted-foreground mt-1">
                          {b.asaas_transfer_id.slice(-12)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {b.status === 'pending_transfer' && b.net_payable >= 0.01 && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={executeMutation.isPending}
                          onClick={() => executeMutation.mutate(b.id)}
                        >
                          Repassar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!batchesLoading && batches.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground">
                      Nenhum lote. Use &quot;Compor lotes&quot; após cobranças pagas no livro.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
