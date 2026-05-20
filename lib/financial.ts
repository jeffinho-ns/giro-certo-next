import { apiClient } from '@/lib/api';

export type FinancialTransactionType =
  | 'delivery_charge'
  | 'wallet_commission'
  | 'wallet_withdrawal'
  | 'wallet_bonus'
  | 'wallet_refund'
  | 'payout_transfer';

export interface FinancialTransaction {
  id: string;
  type: FinancialTransactionType;
  amount: number;
  status: string;
  description: string;
  counterparty: string | null;
  referenceId: string | null;
  occurredAt: string;
  meta?: {
    platformFee?: number;
    storeNet?: number;
    riderNet?: number;
    customerTotal?: number;
    storeName?: string | null;
    riderName?: string | null;
    beneficiaryType?: string;
  };
}

export interface DashboardFinancialReport {
  windowDays: number;
  summary: {
    totalCustomerVolume: number;
    platformRevenueDelivery: number;
    storeNetAccrued: number;
    riderNetAccrued: number;
    paidDeliveryCount: number;
    completedOrdersInWindow: number;
    walletCommissionRevenue: number;
    walletCommissionCount: number;
    walletWithdrawalsTotal: number;
    pendingStorePayout: number;
    pendingRiderPayout: number;
    payoutsExecutedTotal: number;
    payoutsExecutedCount: number;
    premiumSubscribers: number;
    activeSubscriptionPartners: number;
    subscriptionMrrEstimate: number;
  };
  revenueBreakdown: Array<{ name: string; value: number; key: string }>;
  monthlySeries: Array<{
    monthKey: string;
    monthLabel: string;
    customerVolume: number;
    platformRevenue: number;
    deliveryCount: number;
    walletCommissions: number;
  }>;
  transactions: FinancialTransaction[];
}

export async function fetchDashboardFinancial(days: number) {
  return apiClient.get<DashboardFinancialReport>(
    `/api/dashboard/financial?days=${encodeURIComponent(String(days))}`
  );
}

export function formatBrl(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export const TRANSACTION_TYPE_LABELS: Record<FinancialTransactionType, string> = {
  delivery_charge: 'Cobrança pedido',
  wallet_commission: 'Comissão motoboy',
  wallet_withdrawal: 'Saque carteira',
  wallet_bonus: 'Bônus carteira',
  wallet_refund: 'Estorno carteira',
  payout_transfer: 'Repasse Asaas',
};

export function transactionStatusLabel(status: string) {
  const map: Record<string, string> = {
    paid: 'Pago',
    completed: 'Concluído',
    pending: 'Pendente',
    transfer_done: 'Transferido',
    transfer_failed: 'Falhou',
    transfer_requested: 'Em processamento',
    pending_transfer: 'Aguardando',
    failed: 'Falhou',
    cancelled: 'Cancelado',
  };
  return map[status] ?? status;
}
