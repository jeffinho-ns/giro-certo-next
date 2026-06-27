'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { StoreAppearance } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PRESET_COLORS = ['#FF6B00', '#E11D48', '#16A34A', '#2563EB', '#7C3AED', '#0891B2', '#CA8A04'];

export default function PersonalizarPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<{ appearance: StoreAppearance }>({
    queryKey: ['store', 'appearance'],
    queryFn: () => apiClient.get('/api/store/manage/appearance'),
  });

  const [tradingName, setTradingName] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [themeColor, setThemeColor] = useState('#FF6B00');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const a = data?.appearance;
    if (a) {
      setTradingName(a.tradingName ?? '');
      setDescription(a.description ?? '');
      setPhotoUrl(a.photoUrl ?? '');
      setCoverUrl(a.coverUrl ?? '');
      setThemeColor(a.themeColor ?? '#FF6B00');
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () => {
      setError('');
      if (themeColor && !/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(themeColor)) {
        throw new Error('Cor inválida (use hex, ex.: #FF6B00)');
      }
      return apiClient.put('/api/store/manage/appearance', {
        tradingName: tradingName.trim() || null,
        description: description.trim() || null,
        photoUrl: photoUrl.trim() || null,
        coverUrl: coverUrl.trim() || null,
        themeColor: themeColor.trim() || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store', 'appearance'] });
      queryClient.invalidateQueries({ queryKey: ['minha-loja', 'partner'] });
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
      <div>
        <h1 className="text-2xl font-bold">Personalizar loja</h1>
        <p className="text-sm text-muted-foreground">
          Defina a aparência da sua vitrine pública.
        </p>
      </div>

      {/* Pré-visualização */}
      <Card className="overflow-hidden">
        <div className="relative h-40 w-full bg-muted">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              Capa da loja
            </div>
          )}
          <div
            className="absolute -bottom-6 left-5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border-4 border-background bg-white text-2xl"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          >
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              '🏪'
            )}
          </div>
        </div>
        <CardContent className="pt-8">
          <p className="font-bold">{tradingName || 'Nome da sua loja'}</p>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          <span
            className="mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: themeColor }}
          >
            Cor de destaque
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="space-y-2">
            <Label>Nome de exibição (fantasia)</Label>
            <Input value={tradingName} onChange={(e) => setTradingName(e.target.value)} placeholder="Ex.: Burguer do Zé" />
          </div>
          <div className="space-y-2">
            <Label>Descrição curta</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex.: Os melhores lanches artesanais da cidade"
            />
          </div>
          <div className="space-y-2">
            <Label>URL do logo</Label>
            <Input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label>URL da capa</Label>
            <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label>Cor de destaque</Label>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setThemeColor(c)}
                  className={`h-8 w-8 rounded-full border-2 ${
                    themeColor.toLowerCase() === c.toLowerCase() ? 'border-foreground' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
              <Input
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                placeholder="#FF6B00"
                className="w-28"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? 'Salvando...' : 'Salvar alterações'}
        </Button>
        {saved && <span className="text-sm text-green-600">Salvo!</span>}
      </div>
    </div>
  );
}
