'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useStoreManage } from '@/lib/store-manage-context';
import { Partner } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type DeliveryFeeMode = 'fixed' | 'distance_capped' | 'distance';

function readPartnerFeeMode(partner: Partner): DeliveryFeeMode {
  const raw = partner.storeDeliveryFeeMode ?? partner.store_delivery_fee_mode ?? 'distance_capped';
  if (raw === 'fixed' || raw === 'distance' || raw === 'distance_capped') return raw;
  return 'distance_capped';
}

function readPartnerFeeMax(partner: Partner): string {
  const v = partner.storeDeliveryFeeMax ?? partner.store_delivery_fee_max;
  return v != null ? String(v) : '';
}

function readPartnerFeeFixed(partner: Partner): string {
  const v = partner.storeDeliveryFeeFixed ?? partner.store_delivery_fee_fixed;
  return v != null ? String(v) : '';
}

type DayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

type DayHours = { open: string; close: string; closed: boolean };

const DAYS: { key: DayKey; label: string }[] = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

const DEFAULT_DAY: DayHours = { open: '08:00', close: '22:00', closed: false };

function defaultWeek(): Record<DayKey, DayHours> {
  return {
    monday: { ...DEFAULT_DAY },
    tuesday: { ...DEFAULT_DAY },
    wednesday: { ...DEFAULT_DAY },
    thursday: { ...DEFAULT_DAY },
    friday: { ...DEFAULT_DAY },
    saturday: { ...DEFAULT_DAY },
    sunday: { ...DEFAULT_DAY, closed: true },
  };
}

function parseOperatingHours(raw: unknown): Record<DayKey, DayHours> {
  const base = defaultWeek();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;

  const map = raw as Record<string, unknown>;
  for (const { key } of DAYS) {
    const day = map[key];
    if (!day || typeof day !== 'object' || Array.isArray(day)) continue;
    const d = day as { open?: string; close?: string; closed?: boolean };
    if (d.closed) {
      base[key] = { open: '08:00', close: '22:00', closed: true };
    } else {
      base[key] = {
        open: typeof d.open === 'string' && d.open ? d.open : '08:00',
        close: typeof d.close === 'string' && d.close ? d.close : '22:00',
        closed: false,
      };
    }
  }
  return base;
}

function toPayload(hours: Record<DayKey, DayHours>) {
  const out: Record<string, { open?: string; close?: string; closed?: boolean }> = {};
  for (const { key } of DAYS) {
    const day = hours[key];
    out[key] = day.closed
      ? { closed: true }
      : { open: day.open, close: day.close };
  }
  return out;
}

/** Espelha a lógica da API (America/Sao_Paulo) para exibir status na UI. */
function computeIsOpen(isBlocked: boolean, operatingHours: unknown): boolean {
  if (isBlocked) return false;
  if (
    !operatingHours ||
    typeof operatingHours !== 'object' ||
    Array.isArray(operatingHours)
  ) {
    return true;
  }

  const hoursMap = operatingHours as Record<string, unknown>;
  if (Object.keys(hoursMap).length === 0) return true;

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());

  const weekday = parts.find((p) => p.type === 'weekday')?.value?.toLowerCase();
  const hourStr = parts.find((p) => p.type === 'hour')?.value;
  const minuteStr = parts.find((p) => p.type === 'minute')?.value;
  if (!weekday || hourStr == null || minuteStr == null) return true;

  const dayHours = hoursMap[weekday];
  if (!dayHours || typeof dayHours !== 'object' || Array.isArray(dayHours)) {
    return false;
  }

  const day = dayHours as { open?: string; close?: string; closed?: boolean };
  if (day.closed) return false;
  if (!day.open || !day.close) return false;

  const toMinutes = (t: string): number | null => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(String(t).trim());
    if (!match) return null;
    const h = Number(match[1]);
    const m = Number(match[2]);
    if (!Number.isFinite(h) || !Number.isFinite(m) || h > 24 || m > 59) return null;
    return Math.min(h, 23) * 60 + m;
  };

  const hourNum = hourStr === '24' ? 0 : Number(hourStr);
  const minuteNum = Number(minuteStr);
  if (!Number.isFinite(hourNum) || !Number.isFinite(minuteNum)) return true;

  const nowMinutes = hourNum * 60 + minuteNum;
  const openMinutes = toMinutes(day.open);
  const closeMinutes = toMinutes(day.close);
  if (openMinutes == null || closeMinutes == null) return false;

  if (closeMinutes <= openMinutes) {
    return nowMinutes >= openMinutes || nowMinutes < closeMinutes;
  }
  return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
}

export default function ConfiguracoesPage() {
  const queryClient = useQueryClient();
  const { isAdminMode, actAsPartnerId } = useStoreManage();
  const { data, isLoading } = useQuery<{ partner: Partner }>({
    queryKey: ['minha-loja', 'partner', actAsPartnerId],
    queryFn: () => {
      if (isAdminMode && actAsPartnerId) {
        return apiClient.get<{ partner: Partner }>(`/api/partners/${actAsPartnerId}`);
      }
      return apiClient.get<{ partner: Partner }>('/api/partners/me');
    },
  });

  const [hours, setHours] = useState<Record<DayKey, DayHours>>(defaultWeek);
  const [phone, setPhone] = useState('');
  const [avgPreparationTime, setAvgPreparationTime] = useState('');
  const [maxServiceRadius, setMaxServiceRadius] = useState('');
  const [feeMode, setFeeMode] = useState<DeliveryFeeMode>('distance_capped');
  const [feeMax, setFeeMax] = useState('');
  const [feeFixed, setFeeFixed] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const partner = data?.partner;
    if (!partner) return;
    setHours(parseOperatingHours(partner.operatingHours));
    setPhone(partner.phone ?? '');
    setAvgPreparationTime(
      partner.avgPreparationTime != null ? String(partner.avgPreparationTime) : ''
    );
    setMaxServiceRadius(
      partner.maxServiceRadius != null ? String(partner.maxServiceRadius) : ''
    );
    setFeeMode(readPartnerFeeMode(partner));
    setFeeMax(readPartnerFeeMax(partner));
    setFeeFixed(readPartnerFeeFixed(partner));
  }, [data]);

  const isOpenNow = useMemo(() => {
    if (!data?.partner) return null;
    return computeIsOpen(!!data.partner.isBlocked, data.partner.operatingHours);
  }, [data?.partner]);

  const updateDay = (key: DayKey, patch: Partial<DayHours>) => {
    setHours((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...patch },
    }));
  };

  const save = useMutation({
    mutationFn: () => {
      setError('');
      for (const { key, label } of DAYS) {
        const day = hours[key];
        if (day.closed) continue;
        if (!/^\d{2}:\d{2}$/.test(day.open) || !/^\d{2}:\d{2}$/.test(day.close)) {
          throw new Error(`${label}: informe horários no formato HH:MM`);
        }
      }

      const payload: {
        operatingHours: ReturnType<typeof toPayload>;
        phone?: string;
        avgPreparationTime?: number;
        maxServiceRadius?: number;
        storeDeliveryFeeMode?: DeliveryFeeMode;
        storeDeliveryFeeMax?: number | null;
        storeDeliveryFeeFixed?: number | null;
      } = {
        operatingHours: toPayload(hours),
        storeDeliveryFeeMode: feeMode,
      };

      if (phone.trim()) payload.phone = phone.trim();

      if (avgPreparationTime.trim()) {
        const n = Number(avgPreparationTime);
        if (!Number.isFinite(n) || n < 0) {
          throw new Error('Tempo médio de preparo inválido');
        }
        payload.avgPreparationTime = Math.round(n);
      }

      if (maxServiceRadius.trim()) {
        const n = Number(maxServiceRadius);
        if (!Number.isFinite(n) || n < 0) {
          throw new Error('Raio de atendimento inválido');
        }
        payload.maxServiceRadius = n;
      }

      if (feeMode === 'fixed') {
        const fixed = feeFixed.trim() ? Number(feeFixed.replace(',', '.')) : NaN;
        if (!Number.isFinite(fixed) || fixed < 0) {
          throw new Error('Informe o valor fixo do frete (R$)');
        }
        payload.storeDeliveryFeeFixed = Math.round(fixed * 100) / 100;
        if (feeMax.trim()) {
          const max = Number(feeMax.replace(',', '.'));
          if (!Number.isFinite(max) || max < 0) throw new Error('Teto máximo de frete inválido');
          if (fixed > max) throw new Error('O frete fixo não pode ser maior que o teto');
          payload.storeDeliveryFeeMax = Math.round(max * 100) / 100;
        } else {
          payload.storeDeliveryFeeMax = null;
        }
      } else if (feeMode === 'distance_capped') {
        const max = feeMax.trim() ? Number(feeMax.replace(',', '.')) : NaN;
        if (!Number.isFinite(max) || max <= 0) {
          throw new Error('Informe o valor máximo do frete (ex.: 9,00)');
        }
        payload.storeDeliveryFeeMax = Math.round(max * 100) / 100;
        payload.storeDeliveryFeeFixed = null;
      } else {
        payload.storeDeliveryFeeMax = feeMax.trim()
          ? Math.round(Number(feeMax.replace(',', '.')) * 100) / 100
          : null;
        payload.storeDeliveryFeeFixed = null;
      }

      if (isAdminMode && actAsPartnerId) {
        return apiClient.put<{ partner: Partner }>(`/api/partners/${actAsPartnerId}`, payload);
      }
      return apiClient.put<{ partner: Partner }>('/api/partners/me', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['minha-loja', 'partner', actAsPartnerId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (e: any) => setError(e?.message || 'Erro ao salvar'),
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-sm text-muted-foreground">
            Defina os horários em que a vitrine aceita pedidos (horário de Brasília).
          </p>
        </div>
        {isOpenNow != null && (
          <Badge variant={isOpenNow ? 'default' : 'secondary'}>
            {data?.partner?.isBlocked
              ? 'Loja bloqueada'
              : isOpenNow
                ? 'Aberta agora'
                : 'Fechada agora'}
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Horários de funcionamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {DAYS.map(({ key, label }) => {
            const day = hours[key];
            return (
              <div
                key={key}
                className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-[10rem] items-center gap-2">
                  <input
                    type="checkbox"
                    id={`closed-${key}`}
                    checked={!day.closed}
                    onChange={(e) => updateDay(key, { closed: !e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor={`closed-${key}`} className="font-medium">
                    {label}
                  </Label>
                </div>
                {day.closed ? (
                  <span className="text-sm text-muted-foreground">Fechado</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={day.open}
                      onChange={(e) => updateDay(key, { open: e.target.value })}
                      className="w-[8rem]"
                    />
                    <span className="text-sm text-muted-foreground">até</span>
                    <Input
                      type="time"
                      value={day.close}
                      onChange={(e) => updateDay(key, { close: e.target.value })}
                      className="w-[8rem]"
                    />
                  </div>
                )}
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground">
            Quando a loja estiver fechada, a vitrine bloqueia novos pedidos.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Operação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone da loja</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prep">Tempo médio de preparo (min)</Label>
              <Input
                id="prep"
                type="number"
                min={0}
                value={avgPreparationTime}
                onChange={(e) => setAvgPreparationTime(e.target.value)}
                placeholder="30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="radius">Raio de atendimento (km)</Label>
              <Input
                id="radius"
                type="number"
                min={0}
                step="0.1"
                value={maxServiceRadius}
                onChange={(e) => setMaxServiceRadius(e.target.value)}
                placeholder="5"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Frete da loja virtual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Define quanto o cliente paga de entrega e o que o motoboy recebe por corrida saindo da
            sua loja. O valor aparece na vitrine antes do pagamento.
          </p>
          <div className="space-y-2">
            <Label>Como calcular o frete</Label>
            <Select value={feeMode} onValueChange={(v) => setFeeMode(v as DeliveryFeeMode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Valor fixo (sempre o mesmo)</SelectItem>
                <SelectItem value="distance_capped">
                  Por distância, com teto máximo (recomendado)
                </SelectItem>
                <SelectItem value="distance">Por distância, sem teto (automático)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {feeMode === 'fixed' && (
            <div className="space-y-2">
              <Label htmlFor="feeFixed">Valor fixo do frete (R$)</Label>
              <Input
                id="feeFixed"
                type="number"
                min={0}
                step="0.01"
                value={feeFixed}
                onChange={(e) => setFeeFixed(e.target.value)}
                placeholder="9,00"
              />
            </div>
          )}
          {(feeMode === 'distance_capped' || feeMode === 'fixed') && (
            <div className="space-y-2">
              <Label htmlFor="feeMax">
                {feeMode === 'distance_capped'
                  ? 'Valor máximo do frete (R$) *'
                  : 'Teto máximo opcional (R$)'}
              </Label>
              <Input
                id="feeMax"
                type="number"
                min={0}
                step="0.01"
                value={feeMax}
                onChange={(e) => setFeeMax(e.target.value)}
                placeholder={feeMode === 'distance_capped' ? '9,00' : 'Opcional'}
              />
              {feeMode === 'distance_capped' && (
                <p className="text-xs text-muted-foreground">
                  Ex.: com teto de R$ 9,00, corridas longas cobram no máximo R$ 9,00 do cliente. O
                  motoboy sabe que sua loja paga até esse valor.
                </p>
              )}
            </div>
          )}
          {feeMode === 'distance' && (
            <p className="text-xs text-muted-foreground">
              O frete é calculado automaticamente pela distância (rota + km). Sem limite — use se
              quiser repassar o valor integral ao motoboy.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? 'Salvando...' : 'Salvar configurações'}
        </Button>
        {saved && <span className="text-sm text-green-600">Salvo!</span>}
      </div>
    </div>
  );
}
