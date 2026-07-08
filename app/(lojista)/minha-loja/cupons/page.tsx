'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStoreManageApi } from '@/lib/store-manage-api';
import { CouponDiscountType, StoreCoupon } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Power } from 'lucide-react';
import { ManagedStoreBanner } from '@/components/store/managed-store-banner';
import { useLojistaStore } from '@/lib/contexts/lojista-store-context';

const money = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0);

function describeDiscount(c: StoreCoupon) {
  return c.discountType === 'percent' ? `${c.discountValue}% off` : `${money(c.discountValue)} off`;
}

export default function CuponsPage() {
  const { readOnly } = useLojistaStore();
  const queryClient = useQueryClient();
  const storeApi = useStoreManageApi();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StoreCoupon | null>(null);

  const { data, isLoading } = useQuery<{ coupons: StoreCoupon[] }>({
    queryKey: ['store', 'coupons'],
    queryFn: () => storeApi.get('/api/store/manage/coupons'),
  });
  const coupons = data?.coupons ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['store', 'coupons'] });

  const toggle = useMutation({
    mutationFn: (c: StoreCoupon) =>
      storeApi.put(`/api/store/manage/coupons/${c.id}`, { active: !c.active }),
    onSuccess: invalidate,
    onError: (e: any) => alert(e?.message || 'Erro ao atualizar cupom'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => storeApi.delete(`/api/store/manage/coupons/${id}`),
    onSuccess: invalidate,
    onError: (e: any) => alert(e?.message || 'Erro ao excluir cupom'),
  });

  return (
    <div className="space-y-6">
      {readOnly && <ManagedStoreBanner />}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cupons</h1>
          <p className="text-sm text-muted-foreground">
            Descontos que o cliente aplica no checkout da vitrine.
          </p>
        </div>
        <Button
          disabled={readOnly}
          onClick={() => {
            if (readOnly) return;
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Novo cupom
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
      {!isLoading && coupons.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhum cupom cadastrado.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {coupons.map((c) => (
          <Card key={c.id} className={c.active ? '' : 'opacity-60'}>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold">{c.code}</span>
                  <Badge variant="outline">{describeDiscount(c)}</Badge>
                  {!c.active && <Badge variant="secondary">Inativo</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {c.minSubtotal > 0 ? `Mín. ${money(c.minSubtotal)} • ` : ''}
                  {c.maxUses != null ? `${c.usedCount}/${c.maxUses} usos` : `${c.usedCount} usos`}
                  {c.expiresAt
                    ? ` • expira ${new Date(c.expiresAt).toLocaleDateString('pt-BR')}`
                    : ''}
                </p>
              </div>
              {!readOnly && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditing(c);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
                </Button>
                <Button size="sm" variant="outline" onClick={() => toggle.mutate(c)}>
                  <Power className="mr-1 h-3.5 w-3.5" /> {c.active ? 'Desativar' : 'Ativar'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => {
                    if (confirm(`Excluir o cupom ${c.code}?`)) remove.mutate(c.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {dialogOpen && (
        <CouponDialog
          coupon={editing}
          onClose={() => setDialogOpen(false)}
          onSaved={() => {
            setDialogOpen(false);
            invalidate();
          }}
        />
      )}
    </div>
  );
}

function CouponDialog({
  coupon,
  onClose,
  onSaved,
}: {
  coupon: StoreCoupon | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const storeApi = useStoreManageApi();
  const [code, setCode] = useState(coupon?.code ?? '');
  const [discountType, setDiscountType] = useState<CouponDiscountType>(
    coupon?.discountType ?? 'percent'
  );
  const [discountValue, setDiscountValue] = useState(
    coupon ? String(coupon.discountValue) : ''
  );
  const [minSubtotal, setMinSubtotal] = useState(
    coupon?.minSubtotal ? String(coupon.minSubtotal) : ''
  );
  const [maxUses, setMaxUses] = useState(coupon?.maxUses != null ? String(coupon.maxUses) : '');
  const [expiresAt, setExpiresAt] = useState(
    coupon?.expiresAt ? coupon.expiresAt.slice(0, 10) : ''
  );
  const [active, setActive] = useState(coupon?.active ?? true);
  const [error, setError] = useState('');

  const save = useMutation({
    mutationFn: () => {
      if (!code.trim()) throw new Error('Informe o código');
      const value = Number(String(discountValue).replace(',', '.'));
      if (!Number.isFinite(value) || value <= 0) throw new Error('Valor de desconto inválido');
      if (discountType === 'percent' && value > 100) throw new Error('Percentual máximo é 100');
      const payload = {
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: value,
        minSubtotal: minSubtotal.trim() ? Number(minSubtotal.replace(',', '.')) : 0,
        maxUses: maxUses.trim() ? Number(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt + 'T23:59:59').toISOString() : null,
        active,
      };
      if (coupon) return storeApi.put(`/api/store/manage/coupons/${coupon.id}`, payload);
      return storeApi.post('/api/store/manage/coupons', payload);
    },
    onSuccess: onSaved,
    onError: (e: any) => setError(e?.message || 'Erro ao salvar cupom'),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{coupon ? 'Editar cupom' : 'Novo cupom'}</DialogTitle>
          <DialogDescription>O desconto é validado no servidor no checkout.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="space-y-2">
            <Label>Código</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="EX.: BEMVINDO10"
              className="font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={discountType} onValueChange={(v) => setDiscountType(v as CouponDiscountType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percentual (%)</SelectItem>
                  <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{discountType === 'percent' ? 'Desconto (%)' : 'Desconto (R$)'}</Label>
              <Input
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === 'percent' ? '10' : '5,00'}
                inputMode="decimal"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Subtotal mínimo (R$)</Label>
              <Input
                value={minSubtotal}
                onChange={(e) => setMinSubtotal(e.target.value)}
                placeholder="0,00"
                inputMode="decimal"
              />
            </div>
            <div className="space-y-2">
              <Label>Limite de usos</Label>
              <Input
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="ilimitado"
                inputMode="numeric"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Expira em (opcional)</Label>
            <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Ativo
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
