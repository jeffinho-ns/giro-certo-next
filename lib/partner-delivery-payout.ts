/** Perfil gravado em Partner.payout_bank_account_json (espelho do app / API). */
export type PayoutProfileJson = {
  payoutMethod?: 'bank' | 'pix';
  pixAddressKey?: string;
  pixAddressKeyType?: string;
  ownerName?: string;
  cpfCnpj?: string;
  agency?: string;
  account?: string;
  accountDigit?: string;
  bank?: { code?: string | number };
};

const COLLECTION_MODE_LABELS: Record<string, string> = {
  prepaid: 'Pré-pago — cliente paga antes do despacho',
  postpaid_pix: 'PIX na entrega — cliente paga via PIX Asaas na corrida',
  authorize_capture: 'Cartão — autorizar e capturar (evolução)',
};

const PIX_TYPE_LABELS: Record<string, string> = {
  CPF: 'CPF',
  CNPJ: 'CNPJ',
  EMAIL: 'E-mail',
  PHONE: 'Telefone',
  EVP: 'Chave aleatória (EVP)',
};

const SETTLEMENT_FREQ_LABELS: Record<string, string> = {
  daily: 'Diário',
  weekly: 'Semanal',
  monthly: 'Mensal',
};

export function collectionModeLabel(mode: string | null | undefined): string {
  if (!mode) return 'Pré-pago (padrão)';
  return COLLECTION_MODE_LABELS[mode] ?? mode;
}

export function settlementFrequencyLabel(freq: string | null | undefined): string {
  if (!freq) return 'Semanal (padrão)';
  return SETTLEMENT_FREQ_LABELS[freq] ?? freq;
}

export function resolvePayoutMethod(
  profile: PayoutProfileJson | null | undefined
): 'bank' | 'pix' | null {
  if (!profile || typeof profile !== 'object') return null;
  if (profile.payoutMethod === 'pix') return 'pix';
  if (profile.pixAddressKey?.trim()) return 'pix';
  if (profile.ownerName || profile.account) return 'bank';
  return null;
}

export function isPayoutProfileComplete(
  profile: PayoutProfileJson | null | undefined
): boolean {
  const method = resolvePayoutMethod(profile);
  if (!profile) return false;
  if (method === 'pix') {
    return Boolean(profile.pixAddressKey?.trim() && profile.pixAddressKeyType?.trim());
  }
  if (method === 'bank') {
    const bank = profile.bank;
    const code =
      bank && typeof bank === 'object' && bank.code != null
        ? String(bank.code).trim()
        : '';
    return Boolean(
      profile.ownerName?.trim() &&
        profile.cpfCnpj?.trim() &&
        profile.agency?.trim() &&
        profile.account?.trim() &&
        profile.accountDigit?.trim() &&
        code
    );
  }
  return false;
}

export function pixKeyTypeLabel(type: string | null | undefined): string {
  if (!type) return '—';
  return PIX_TYPE_LABELS[type.toUpperCase()] ?? type;
}

export function maskCpfCnpj(value: string | undefined): string {
  const digits = (value ?? '').replace(/\D/g, '');
  if (digits.length === 11) {
    return `***.***.${digits.slice(6, 9)}-**`;
  }
  if (digits.length === 14) {
    return `**.***.***/${digits.slice(8, 12)}-**`;
  }
  return value ?? '—';
}
