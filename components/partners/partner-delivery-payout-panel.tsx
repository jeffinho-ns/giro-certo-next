'use client';

import { Partner } from '@/lib/types';
import {
  collectionModeLabel,
  isPayoutProfileComplete,
  maskCpfCnpj,
  pixKeyTypeLabel,
  PayoutProfileJson,
  resolvePayoutMethod,
  settlementFrequencyLabel,
} from '@/lib/partner-delivery-payout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, Banknote, CheckCircle2, Info, Wallet } from 'lucide-react';

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <p className={`font-medium text-sm ${mono ? 'font-mono break-all' : ''}`}>{value}</p>
    </div>
  );
}

export function PartnerDeliveryPayoutPanel({ partner }: { partner: Partner }) {
  const profile = (partner.payout_bank_account_json ?? null) as PayoutProfileJson | null;
  const payoutMethod = resolvePayoutMethod(profile);
  const complete = isPayoutProfileComplete(profile);
  const collectionMode = partner.delivery_payment_collection_mode ?? 'prepaid';

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" />
              Pagamentos na entrega (Asaas)
            </CardTitle>
            <CardDescription className="mt-1">
              Cobrança ao cliente final e destino do repasse líquido para esta loja.
            </CardDescription>
          </div>
          {complete ? (
            <Badge className="bg-green-600 shrink-0">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Repasse configurado
            </Badge>
          ) : (
            <Badge variant="outline" className="border-amber-500 text-amber-700 shrink-0">
              <AlertCircle className="h-3 w-3 mr-1" />
              Repasse pendente
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground flex gap-2">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <strong className="text-foreground">Cobrança ao cliente</strong> entra na conta Asaas
            da plataforma (PIX/link conforme o modo).{' '}
            <strong className="text-foreground">Repasse</strong> é o valor líquido enviado para a
            conta ou chave PIX cadastrada abaixo (após pedidos pagos e composição de lote no painel
            Repasses).
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3">Quando cobrar o cliente</h4>
          <DetailRow label="Modo da loja" value={collectionModeLabel(collectionMode)} />
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Onde receber o repasse
          </h4>
          {!profile || !payoutMethod ? (
            <p className="text-sm text-muted-foreground">
              Nenhum dado cadastrado. O lojista preenche em{' '}
              <span className="font-medium">Configurações → Pagamentos na entrega</span> no app.
            </p>
          ) : payoutMethod === 'pix' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailRow label="Forma" value="Chave PIX" />
              <DetailRow
                label="Tipo da chave"
                value={pixKeyTypeLabel(profile.pixAddressKeyType)}
              />
              <div className="sm:col-span-2">
                <DetailRow label="Chave PIX" value={profile.pixAddressKey ?? '—'} mono />
              </div>
              {profile.ownerName?.trim() ? (
                <DetailRow label="Titular (referência)" value={profile.ownerName} />
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailRow label="Forma" value="Conta bancária" />
              <DetailRow label="Titular" value={profile.ownerName ?? '—'} />
              <DetailRow label="CPF/CNPJ" value={maskCpfCnpj(profile.cpfCnpj)} />
              <DetailRow
                label="Banco (código)"
                value={profile.bank?.code != null ? String(profile.bank.code) : '—'}
              />
              <DetailRow label="Agência" value={profile.agency ?? '—'} />
              <DetailRow
                label="Conta"
                value={
                  profile.account
                    ? `${profile.account}-${profile.accountDigit ?? ''}`
                    : '—'
                }
              />
            </div>
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-2">Liquidação agendada</h4>
          <DetailRow
            label="Periodicidade do repasse (loja)"
            value={settlementFrequencyLabel(partner.delivery_settlement_frequency)}
          />
        </div>

        {partner.linked_users && partner.linked_users.length > 0 ? (
          <div>
            <h4 className="text-sm font-semibold mb-2">Utilizadores vinculados (app)</h4>
            <ul className="text-sm space-y-1">
              {partner.linked_users.map((u) => (
                <li key={u.id} className="text-muted-foreground">
                  <span className="font-medium text-foreground">{u.name}</span>
                  {u.email ? ` · ${u.email}` : ''}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
