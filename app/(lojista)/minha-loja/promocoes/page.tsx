'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { StoreBanner } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';

export default function PromocoesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StoreBanner | null>(null);

  const { data, isLoading } = useQuery<{ banners: StoreBanner[] }>({
    queryKey: ['store', 'banners'],
    queryFn: () => apiClient.get('/api/store/manage/banners'),
  });
  const banners = data?.banners ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['store', 'banners'] });

  const toggleActive = useMutation({
    mutationFn: (b: StoreBanner) =>
      apiClient.put(`/api/store/manage/banners/${b.id}`, { active: !b.active }),
    onSuccess: invalidate,
    onError: (e: any) => alert(e?.message || 'Erro ao atualizar banner'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/store/manage/banners/${id}`),
    onSuccess: invalidate,
    onError: (e: any) => alert(e?.message || 'Erro ao excluir banner'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Promoções</h1>
          <p className="text-sm text-muted-foreground">
            Banners exibidos no topo da sua vitrine pública.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Novo banner
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
      {!isLoading && banners.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhum banner cadastrado. Crie um para destacar promoções na vitrine.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {banners.map((b) => (
          <Card key={b.id} className={b.active ? '' : 'opacity-60'}>
            <CardContent className="space-y-3 p-4">
              <div className="relative h-36 w-full overflow-hidden rounded-lg bg-muted">
                {b.imageUrl && (
                  <Image src={b.imageUrl} alt={b.title ?? ''} fill className="object-cover" unoptimized />
                )}
                {b.discount ? (
                  <Badge className="absolute right-2 top-2 bg-red-600 hover:bg-red-600">
                    -{b.discount}%
                  </Badge>
                ) : null}
              </div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{b.title || 'Sem título'}</p>
                  {b.linkUrl && (
                    <p className="truncate text-xs text-muted-foreground">{b.linkUrl}</p>
                  )}
                </div>
                {!b.active && <Badge variant="secondary">Inativo</Badge>}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditing(b);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
                </Button>
                <Button size="sm" variant="outline" onClick={() => toggleActive.mutate(b)}>
                  {b.active ? (
                    <>
                      <EyeOff className="mr-1 h-3.5 w-3.5" /> Desativar
                    </>
                  ) : (
                    <>
                      <Eye className="mr-1 h-3.5 w-3.5" /> Ativar
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => {
                    if (confirm('Excluir este banner?')) remove.mutate(b.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {dialogOpen && (
        <BannerDialog
          banner={editing}
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

function BannerDialog({
  banner,
  onClose,
  onSaved,
}: {
  banner: StoreBanner | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [imageUrl, setImageUrl] = useState(banner?.imageUrl ?? '');
  const [title, setTitle] = useState(banner?.title ?? '');
  const [linkUrl, setLinkUrl] = useState(banner?.linkUrl ?? '');
  const [discount, setDiscount] = useState(banner?.discount ? String(banner.discount) : '');
  const [active, setActive] = useState(banner?.active ?? true);
  const [error, setError] = useState('');

  const save = useMutation({
    mutationFn: () => {
      if (!imageUrl.trim()) throw new Error('Informe a URL da imagem');
      const discountNum = discount.trim() ? Number(discount) : undefined;
      if (discountNum !== undefined && (!Number.isFinite(discountNum) || discountNum < 0 || discountNum > 100)) {
        throw new Error('Desconto deve ser entre 0 e 100');
      }
      const payload = {
        imageUrl: imageUrl.trim(),
        title: title.trim() || undefined,
        linkUrl: linkUrl.trim() || undefined,
        discount: discountNum,
        active,
      };
      if (banner) return apiClient.put(`/api/store/manage/banners/${banner.id}`, payload);
      return apiClient.post('/api/store/manage/banners', payload);
    },
    onSuccess: onSaved,
    onError: (e: any) => setError(e?.message || 'Erro ao salvar banner'),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{banner ? 'Editar banner' : 'Novo banner'}</DialogTitle>
          <DialogDescription>Exibido no carrossel de promoções da vitrine.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="space-y-2">
            <Label>URL da imagem</Label>
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
          </div>
          {imageUrl.trim() && (
            <div className="relative h-32 w-full overflow-hidden rounded-lg bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            </div>
          )}
          <div className="space-y-2">
            <Label>Título (opcional)</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Combo do dia" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Desconto % (opcional)</Label>
              <Input value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="10" inputMode="numeric" />
            </div>
            <div className="space-y-2">
              <Label>Link (opcional)</Label>
              <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Ativo (visível na vitrine)
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
