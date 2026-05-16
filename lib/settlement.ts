import { apiClient } from '@/lib/api';

export interface PendingSettlementSummary {
  byStore: Array<{
    storeId: string;
    storeName: string | null;
    pendingCount: number;
    pendingStoreNet: number;
  }>;
  byRider: Array<{
    riderUserId: string;
    riderName: string | null;
    pendingCount: number;
    pendingRiderNet: number;
  }>;
  pendingRiderNetUnassigned: number;
}

export interface SettlementBatch {
  id: string;
  beneficiary_type: string;
  partner_id: string | null;
  rider_user_id: string | null;
  gross_amount: number;
  settlement_fee_flat: number;
  net_payable: number;
  line_count: number;
  currency: string;
  settlement_frequency: string;
  status: string;
  asaas_transfer_id: string | null;
  external_reference: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function fetchPendingSettlementSummary() {
  const res = await apiClient.get<{ summary: PendingSettlementSummary }>(
    '/api/settlement/ledger/pending-summary'
  );
  return res.summary;
}

export async function fetchSettlementBatches(status?: string) {
  const q = status ? `?status=${encodeURIComponent(status)}&limit=50` : '?limit=50';
  const res = await apiClient.get<{ batches: SettlementBatch[] }>(
    `/api/settlement/batches${q}`
  );
  return res.batches;
}

export async function composeSettlementBatches(cutoffAt?: string) {
  return apiClient.post<{
    ok: boolean;
    batches: string[];
    partnerBatches: number;
    riderBatches: number;
  }>('/api/settlement/batches/compose-from-ledger', cutoffAt ? { cutoffAt } : {});
}

export async function reconcileSettlementPayments(limit = 80) {
  return apiClient.post<{
    ok: boolean;
    scanned: number;
    updated: number;
    failures: Array<{ paymentId: string; error: string }>;
  }>('/api/settlement/reconcile/payments', { limit });
}

export async function reconcileSettlementTransfers(limit = 60) {
  return apiClient.post<{
    ok: boolean;
    scanned: number;
    flaggedFailed: number;
    failures: Array<{ batchId: string; error: string }>;
  }>('/api/settlement/reconcile/transfers', { limit });
}

export async function executeSettlementTransfer(batchId: string) {
  return apiClient.post<{ ok: boolean; asaasTransferId: string | null }>(
    `/api/settlement/batches/${batchId}/execute-transfer`,
    {}
  );
}

export function formatBrl(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function batchStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending_transfer: 'Aguardando transferência',
    no_transfer: 'Sem transferência (valor líquido zero)',
    transfer_requested: 'Transferência solicitada',
    transfer_done: 'Transferido',
    transfer_failed: 'Falha na transferência',
    cancelled: 'Cancelado',
  };
  return map[status] ?? status;
}
