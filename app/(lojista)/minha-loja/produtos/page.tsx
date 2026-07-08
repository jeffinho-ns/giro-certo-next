'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStoreManageApi } from '@/lib/store-manage-api';
import { Product, ProductCategory, ProductOptionGroup } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, Pencil, Trash2, Settings2, Tag } from 'lucide-react';
import { ImageUploadField } from '@/components/store/image-upload-field';
import { ManagedStoreBanner } from '@/components/store/managed-store-banner';
import { useLojistaStore } from '@/lib/contexts/lojista-store-context';

const money = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0);

export default function ProdutosPage() {
  const { readOnly } = useLojistaStore();
  const queryClient = useQueryClient();
  const storeApi = useStoreManageApi();
  const [newCategory, setNewCategory] = useState('');
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [variationsProduct, setVariationsProduct] = useState<Product | null>(null);

  const { data: categoriesData } = useQuery<{ categories: ProductCategory[] }>({
    queryKey: ['store', 'categories'],
    queryFn: () => storeApi.get('/api/store/manage/categories'),
  });
  const categories = categoriesData?.categories ?? [];

  const { data: productsData, isLoading } = useQuery<{ products: Product[] }>({
    queryKey: ['store', 'products'],
    queryFn: () => storeApi.get('/api/store/manage/products'),
  });
  const products = productsData?.products ?? [];

  const createCategory = useMutation({
    mutationFn: (name: string) => storeApi.post('/api/store/manage/categories', { name }),
    onSuccess: () => {
      setNewCategory('');
      queryClient.invalidateQueries({ queryKey: ['store', 'categories'] });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) => storeApi.delete(`/api/store/manage/categories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['store', 'categories'] }),
    onError: (e: any) => alert(e?.message || 'Erro ao excluir categoria'),
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => storeApi.delete(`/api/store/manage/products/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['store', 'products'] }),
    onError: (e: any) => alert(e?.message || 'Erro ao excluir produto'),
  });

  const categoryName = (id: string | null) =>
    id ? categories.find((c) => c.id === id)?.name ?? 'Sem categoria' : 'Sem categoria';

  return (
    <div className="space-y-8">
      {readOnly && <ManagedStoreBanner />}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie o catálogo, categorias e variações da sua loja.
          </p>
        </div>
        <Button
          disabled={readOnly}
          onClick={() => {
            if (readOnly) return;
            setEditingProduct(null);
            setProductDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Novo produto
        </Button>
      </div>

      {/* Categorias */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Tag className="h-4 w-4" /> Categorias
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nova categoria (ex.: Lanches, Bebidas)"
              value={newCategory}
              disabled={readOnly}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => {
                if (readOnly) return;
                if (e.key === 'Enter' && newCategory.trim()) createCategory.mutate(newCategory.trim());
              }}
            />
            <Button
              variant="secondary"
              disabled={readOnly || !newCategory.trim() || createCategory.isPending}
              onClick={() => createCategory.mutate(newCategory.trim())}
            >
              Adicionar
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma categoria ainda.</p>
            )}
            {categories.map((c) => (
              <Badge key={c.id} variant="outline" className="flex items-center gap-1 py-1">
                {c.name}
                {!readOnly && (
                <button
                  className="ml-1 text-muted-foreground hover:text-red-600"
                  onClick={() => {
                    if (confirm(`Excluir a categoria "${c.name}"?`)) deleteCategory.mutate(c.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
                )}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Produtos */}
      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando produtos...</p>}
        {!isLoading && products.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Nenhum produto cadastrado. Clique em &quot;Novo produto&quot; para começar.
            </CardContent>
          </Card>
        )}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Card key={p.id} className={p.active ? '' : 'opacity-60'}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{categoryName(p.categoryId)}</p>
                  </div>
                  <span className="whitespace-nowrap font-semibold">{money(p.basePrice)}</span>
                </div>
                {p.description && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                )}
                <div className="flex items-center gap-2">
                  {!p.active && <Badge variant="secondary">Inativo</Badge>}
                </div>
                {!readOnly && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingProduct(p);
                      setProductDialogOpen(true);
                    }}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setVariationsProduct(p)}>
                    <Settings2 className="mr-1 h-3.5 w-3.5" /> Variações
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => {
                      if (confirm(`Excluir o produto "${p.name}"?`)) deleteProduct.mutate(p.id);
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
      </div>

      {productDialogOpen && (
        <ProductDialog
          product={editingProduct}
          categories={categories}
          onClose={() => setProductDialogOpen(false)}
          onSaved={() => {
            setProductDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ['store', 'products'] });
          }}
        />
      )}

      {variationsProduct && (
        <VariationsDialog
          product={variationsProduct}
          onClose={() => setVariationsProduct(null)}
        />
      )}
    </div>
  );
}

// ============================================
// Diálogo de produto (criar/editar)
// ============================================
function ProductDialog({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: Product | null;
  categories: ProductCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const storeApi = useStoreManageApi();
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [basePrice, setBasePrice] = useState(String(product?.basePrice ?? ''));
  const [categoryId, setCategoryId] = useState<string>(product?.categoryId ?? 'none');
  const [active, setActive] = useState(product?.active ?? true);
  const [photoUrl, setPhotoUrl] = useState(product?.photoUrl ?? '');
  const [error, setError] = useState('');

  const save = useMutation({
    mutationFn: async () => {
      const price = Number(String(basePrice).replace(',', '.'));
      if (!name.trim()) throw new Error('Informe o nome do produto');
      if (!Number.isFinite(price) || price < 0) throw new Error('Informe um preço válido');
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        basePrice: price,
        categoryId: categoryId === 'none' ? null : categoryId,
        active,
        photoUrl: photoUrl.trim() || undefined,
      };
      if (product) return storeApi.put(`/api/store/manage/products/${product.id}`, payload);
      return storeApi.post('/api/store/manage/products', payload);
    },
    onSuccess: onSaved,
    onError: (e: any) => setError(e?.message || 'Erro ao salvar produto'),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product ? 'Editar produto' : 'Novo produto'}</DialogTitle>
          <DialogDescription>Os preços são sempre confirmados no servidor.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: X-Burguer" />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ingredientes, detalhes..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Preço base (R$)</Label>
              <Input
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="0,00"
                inputMode="decimal"
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sem categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <ImageUploadField
            label="Foto do produto (opcional)"
            value={photoUrl}
            onChange={setPhotoUrl}
            aspect="wide"
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Produto ativo (visível na vitrine)
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

// ============================================
// Diálogo de variações (grupos de opção + opções)
// ============================================
function VariationsDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  const queryClient = useQueryClient();
  const storeApi = useStoreManageApi();
  const [groupName, setGroupName] = useState('');
  const [groupRequired, setGroupRequired] = useState(false);
  const [groupMin, setGroupMin] = useState('0');
  const [groupMax, setGroupMax] = useState('1');

  const { data, isLoading } = useQuery<{ product: Product }>({
    queryKey: ['store', 'product', product.id],
    queryFn: () => storeApi.get(`/api/store/manage/products/${product.id}`),
  });
  const groups = data?.product?.optionGroups ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['store', 'product', product.id] });

  const addGroup = useMutation({
    mutationFn: () =>
      storeApi.post(`/api/store/manage/products/${product.id}/option-groups`, {
        name: groupName.trim(),
        minSelect: Number(groupMin) || 0,
        maxSelect: Number(groupMax) || 1,
        required: groupRequired,
      }),
    onSuccess: () => {
      setGroupName('');
      setGroupRequired(false);
      setGroupMin('0');
      setGroupMax('1');
      invalidate();
    },
    onError: (e: any) => alert(e?.message || 'Erro ao criar grupo'),
  });

  const deleteGroup = useMutation({
    mutationFn: (id: string) => storeApi.delete(`/api/store/manage/option-groups/${id}`),
    onSuccess: invalidate,
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Variações — {product.name}</DialogTitle>
          <DialogDescription>
            Crie grupos (ex.: &quot;Tamanho&quot;, &quot;Adicionais&quot;) e suas opções.
          </DialogDescription>
        </DialogHeader>

        {/* Novo grupo */}
        <div className="space-y-3 rounded-lg border border-border p-3">
          <Label>Novo grupo de opções</Label>
          <Input
            placeholder="Nome do grupo (ex.: Tamanho)"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Mínimo</Label>
              <Input value={groupMin} onChange={(e) => setGroupMin(e.target.value)} inputMode="numeric" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Máximo</Label>
              <Input value={groupMax} onChange={(e) => setGroupMax(e.target.value)} inputMode="numeric" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={groupRequired}
              onChange={(e) => setGroupRequired(e.target.checked)}
            />
            Obrigatório escolher
          </label>
          <Button
            size="sm"
            disabled={!groupName.trim() || addGroup.isPending}
            onClick={() => addGroup.mutate()}
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar grupo
          </Button>
        </div>

        {/* Grupos existentes */}
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        <div className="space-y-4">
          {groups.map((g) => (
            <GroupBlock key={g.id} group={g} onChanged={invalidate} onDelete={() => deleteGroup.mutate(g.id)} />
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GroupBlock({
  group,
  onChanged,
  onDelete,
}: {
  group: ProductOptionGroup;
  onChanged: () => void;
  onDelete: () => void;
}) {
  const storeApi = useStoreManageApi();
  const [optName, setOptName] = useState('');
  const [optPrice, setOptPrice] = useState('');

  const addOption = useMutation({
    mutationFn: () =>
      storeApi.post(`/api/store/manage/option-groups/${group.id}/options`, {
        name: optName.trim(),
        priceDelta: Number(String(optPrice).replace(',', '.')) || 0,
      }),
    onSuccess: () => {
      setOptName('');
      setOptPrice('');
      onChanged();
    },
    onError: (e: any) => alert(e?.message || 'Erro ao adicionar opção'),
  });

  const deleteOption = useMutation({
    mutationFn: (id: string) => storeApi.delete(`/api/store/manage/options/${id}`),
    onSuccess: onChanged,
  });

  const money = (n: number) =>
    n ? `+ ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)}` : 'Grátis';

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <span className="font-medium">{group.name}</span>{' '}
          <span className="text-xs text-muted-foreground">
            ({group.required ? 'obrigatório' : 'opcional'}, {group.minSelect}–{group.maxSelect})
          </span>
        </div>
        <button className="text-muted-foreground hover:text-red-600" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-1">
        {(group.options ?? []).map((o) => (
          <div key={o.id} className="flex items-center justify-between rounded bg-muted/50 px-2 py-1 text-sm">
            <span>{o.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{money(o.priceDelta)}</span>
              <button
                className="text-muted-foreground hover:text-red-600"
                onClick={() => deleteOption.mutate(o.id)}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 flex gap-2">
        <Input
          className="h-8"
          placeholder="Opção (ex.: Grande)"
          value={optName}
          onChange={(e) => setOptName(e.target.value)}
        />
        <Input
          className="h-8 w-28"
          placeholder="+R$"
          value={optPrice}
          onChange={(e) => setOptPrice(e.target.value)}
          inputMode="decimal"
        />
        <Button size="sm" disabled={!optName.trim() || addOption.isPending} onClick={() => addOption.mutate()}>
          Add
        </Button>
      </div>
    </div>
  );
}
