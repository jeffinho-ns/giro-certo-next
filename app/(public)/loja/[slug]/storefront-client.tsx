'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import {
  CouponPreview,
  CreatedStoreOrder,
  PublicCatalogProduct,
  PublicStorefront,
  StoreCheckoutResult,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Minus, Plus, ShoppingBag, Trash2, MapPin, Star, Clock, Copy, Check } from 'lucide-react';

const money = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0);

interface CartLine {
  key: string;
  product: PublicCatalogProduct;
  selectedOptionIds: string[];
  selectedOptions: { groupName: string; optionName: string; priceDelta: number }[];
  quantity: number;
  unitPrice: number;
}

export function StorefrontClient({
  slug,
  storefront,
}: {
  slug: string;
  storefront: PublicStorefront;
}) {
  const { store, banners, categories } = storefront;
  const reviews = storefront.reviews ?? [];
  const theme = store.themeColor || '#FF6B00';
  const [cart, setCart] = useState<CartLine[]>([]);
  const [activeProduct, setActiveProduct] = useState<PublicCatalogProduct | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const itemCount = cart.reduce((acc, l) => acc + l.quantity, 0);
  const subtotal = cart.reduce((acc, l) => acc + l.unitPrice * l.quantity, 0);

  const addToCart = (line: CartLine) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.key === line.key);
      if (existing) {
        return prev.map((l) =>
          l.key === line.key ? { ...l, quantity: l.quantity + line.quantity } : l
        );
      }
      return [...prev, line];
    });
  };

  const changeQty = (key: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0)
    );
  };

  const removeLine = (key: string) => setCart((prev) => prev.filter((l) => l.key !== key));

  return (
    <div className="min-h-screen bg-gray-50 pb-28 dark:bg-gray-950">
      {/* Capa (hero) */}
      {store.coverUrl && (
        <div className="relative h-40 w-full sm:h-52">
          <Image src={store.coverUrl} alt="" fill className="object-cover" unoptimized priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      )}

      {/* Cabeçalho da loja */}
      <header className="bg-white shadow-sm dark:bg-gray-900">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="flex items-center gap-4">
            {store.photoUrl ? (
              <Image
                src={store.photoUrl}
                alt={store.name}
                width={72}
                height={72}
                className="h-16 w-16 rounded-xl object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                🏪
              </div>
            )}
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold">{store.tradingName || store.name}</h1>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  {store.rating?.toFixed(1) ?? '0.0'} ({store.reviewCount})
                </span>
                {store.avgPreparationTime ? (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> ~{store.avgPreparationTime} min
                  </span>
                ) : null}
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="h-3.5 w-3.5" /> {store.address}
                </span>
              </p>
              <div className="mt-1">
                {store.isOpen ? (
                  <Badge className="bg-green-600 hover:bg-green-600">Aberta</Badge>
                ) : (
                  <Badge variant="destructive">Fechada</Badge>
                )}
              </div>
            </div>
          </div>
          {store.description && (
            <p className="mt-3 text-sm text-muted-foreground">{store.description}</p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-4 py-6">
        {/* Banners */}
        {banners.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {banners.map((b) => (
              <div key={b.id} className="relative h-32 w-72 flex-shrink-0 overflow-hidden rounded-xl">
                <Image src={b.imageUrl} alt={b.title ?? ''} fill className="object-cover" unoptimized />
                {b.title && (
                  <div className="absolute inset-x-0 bottom-0 bg-black/50 p-2 text-sm font-medium text-white">
                    {b.title}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Catálogo */}
        {categories.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">
            Esta loja ainda não cadastrou produtos.
          </p>
        )}
        {categories.map((cat) => (
          <section key={cat.id} className="space-y-3">
            <h2 className="text-lg font-bold">{cat.name}</h2>
            <div className="space-y-2">
              {cat.products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveProduct(p)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-white p-3 text-left transition hover:border-primary dark:bg-gray-900"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{p.name}</p>
                    {p.description && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                    )}
                    <p className="mt-1 font-semibold" style={{ color: theme }}>
                      {money(p.basePrice)}
                    </p>
                  </div>
                  {p.photoUrl ? (
                    <Image
                      src={p.photoUrl}
                      alt={p.name}
                      width={80}
                      height={80}
                      className="h-20 w-20 rounded-lg object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-muted text-2xl">
                      🍽️
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>
        ))}

        {/* Avaliações da loja */}
        {(store.reviewCount > 0 || reviews.length > 0) && (
          <section className="mt-8">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-lg font-bold">Avaliações</h2>
              {store.reviewCount > 0 && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {store.rating.toFixed(1)} ({store.reviewCount})
                </span>
              )}
            </div>
            <div className="space-y-3">
              {reviews.length === 0 && (
                <p className="text-sm text-muted-foreground">Ainda sem comentários.</p>
              )}
              {reviews.map((r, i) => (
                <div key={i} className="rounded-lg border border-border bg-white p-3 dark:bg-gray-900">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star
                        key={s}
                        className={`h-3.5 w-3.5 ${
                          s < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                    {r.customerName && (
                      <span className="ml-2 text-xs font-medium text-muted-foreground">
                        {r.customerName}
                      </span>
                    )}
                  </div>
                  {r.comment && <p className="mt-1 text-sm">{r.comment}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Barra de carrinho */}
      {itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white p-3 shadow-lg dark:bg-gray-900">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <div className="text-sm">
              <span className="font-semibold">{itemCount}</span> item(s) •{' '}
              <span className="font-semibold">{money(subtotal)}</span>
              <span className="block text-xs text-muted-foreground">+ taxa de entrega no checkout</span>
            </div>
            <Button onClick={() => setCheckoutOpen(true)} style={{ backgroundColor: theme }}>
              <ShoppingBag className="mr-2 h-4 w-4" /> Ver carrinho
            </Button>
          </div>
        </div>
      )}

      {activeProduct && (
        <ProductOptionsDialog
          product={activeProduct}
          onClose={() => setActiveProduct(null)}
          onAdd={(line) => {
            addToCart(line);
            setActiveProduct(null);
          }}
        />
      )}

      {checkoutOpen && (
        <CheckoutDialog
          slug={slug}
          cart={cart}
          subtotal={subtotal}
          onClose={() => setCheckoutOpen(false)}
          onChangeQty={changeQty}
          onRemove={removeLine}
        />
      )}
    </div>
  );
}

// ============================================
// Diálogo de opções do produto
// ============================================
function ProductOptionsDialog({
  product,
  onClose,
  onAdd,
}: {
  product: PublicCatalogProduct;
  onClose: () => void;
  onAdd: (line: CartLine) => void;
}) {
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');

  const toggleOption = (groupId: string, optionId: string, maxSelect: number) => {
    setSelected((prev) => {
      const current = prev[groupId] ?? [];
      const has = current.includes(optionId);
      let next: string[];
      if (has) {
        next = current.filter((id) => id !== optionId);
      } else if (maxSelect === 1) {
        next = [optionId];
      } else if (current.length >= maxSelect) {
        next = current; // já no máximo
      } else {
        next = [...current, optionId];
      }
      return { ...prev, [groupId]: next };
    });
  };

  const { selectedOptionIds, selectedOptions, unitPrice } = useMemo(() => {
    const ids: string[] = [];
    const opts: { groupName: string; optionName: string; priceDelta: number }[] = [];
    let delta = 0;
    for (const g of product.optionGroups) {
      for (const o of g.options) {
        if ((selected[g.id] ?? []).includes(o.id)) {
          ids.push(o.id);
          opts.push({ groupName: g.name, optionName: o.name, priceDelta: o.priceDelta });
          delta += o.priceDelta;
        }
      }
    }
    return { selectedOptionIds: ids, selectedOptions: opts, unitPrice: product.basePrice + delta };
  }, [selected, product]);

  const handleAdd = () => {
    for (const g of product.optionGroups) {
      const count = (selected[g.id] ?? []).length;
      const min = g.required ? Math.max(g.minSelect, 1) : g.minSelect;
      if (count < min) {
        setError(`Selecione ao menos ${min} opção(ões) em "${g.name}"`);
        return;
      }
    }
    const key = `${product.id}::${[...selectedOptionIds].sort().join(',')}`;
    onAdd({ key, product, selectedOptionIds, selectedOptions, quantity, unitPrice });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          {product.description && <DialogDescription>{product.description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-4">
          {product.optionGroups.map((g) => (
            <div key={g.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">{g.name}</Label>
                <span className="text-xs text-muted-foreground">
                  {g.required ? 'Obrigatório' : 'Opcional'}
                  {g.maxSelect > 1 ? ` • até ${g.maxSelect}` : ''}
                </span>
              </div>
              <div className="space-y-1">
                {g.options.map((o) => {
                  const checked = (selected[g.id] ?? []).includes(o.id);
                  return (
                    <button
                      key={o.id}
                      onClick={() => toggleOption(g.id, o.id, g.maxSelect)}
                      className={`flex w-full items-center justify-between rounded-lg border p-2 text-sm transition ${
                        checked ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                            checked ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'
                          }`}
                        >
                          {checked && <Check className="h-3 w-3" />}
                        </span>
                        {o.name}
                      </span>
                      {o.priceDelta > 0 && (
                        <span className="text-muted-foreground">+ {money(o.priceDelta)}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <Button size="icon" variant="outline" onClick={() => setQuantity((q) => q + 1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <span className="font-semibold">{money(unitPrice * quantity)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleAdd} className="w-full">
            Adicionar ao carrinho
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Diálogo de carrinho + checkout (criar pedido + PIX)
// ============================================
type Step = 'cart' | 'form' | 'payment';

function CheckoutDialog({
  slug,
  cart,
  subtotal,
  onClose,
  onChangeQty,
  onRemove,
}: {
  slug: string;
  cart: CartLine[];
  subtotal: number;
  onClose: () => void;
  onChangeQty: (key: string, delta: number) => void;
  onRemove: (key: string) => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('cart');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [cpf, setCpf] = useState('');
  const [notes, setNotes] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<CreatedStoreOrder | null>(null);
  const [payment, setPayment] = useState<StoreCheckoutResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<CouponPreview | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const discount = coupon?.discount ?? 0;
  const totalWithDiscount = Math.max(0, subtotal - discount);

  const applyCoupon = async () => {
    setCouponError('');
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    try {
      const res = await apiClient.post<CouponPreview>(
        `/api/store/public/${slug}/coupon/preview`,
        { code: couponInput.trim(), subtotal }
      );
      setCoupon(res);
    } catch (e: any) {
      setCoupon(null);
      setCouponError(e?.message || 'Cupom inválido');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada neste navegador');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLoading(false);
      },
      () => {
        setError('Não foi possível obter sua localização');
        setGeoLoading(false);
      }
    );
  };

  const createOrder = async () => {
    setError('');
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setError('Preencha nome, telefone e endereço');
      return;
    }
    if (cpf.replace(/\D/g, '').length < 11) {
      setError('Informe um CPF válido (exigido para o pagamento)');
      return;
    }
    setLoading(true);
    try {
      const body = {
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerAddress: address.trim(),
        customerCpf: cpf.replace(/\D/g, ''),
        customerLatitude: coords?.lat,
        customerLongitude: coords?.lng,
        notes: notes.trim() || undefined,
        couponCode: coupon?.code,
        items: cart.map((l) => ({
          productId: l.product.id,
          quantity: l.quantity,
          selectedOptionIds: l.selectedOptionIds,
        })),
      };
      const res = await apiClient.post<{ order: CreatedStoreOrder }>(
        `/api/store/public/${slug}/orders`,
        body
      );
      setOrder(res.order);
      setStep('payment');
      await startCheckout(res.order);
    } catch (e: any) {
      setError(e?.message || 'Erro ao criar pedido');
    } finally {
      setLoading(false);
    }
  };

  const startCheckout = async (created: CreatedStoreOrder) => {
    setError('');
    setLoading(true);
    try {
      const res = await apiClient.post<StoreCheckoutResult>(
        `/api/store/public/orders/${created.trackingToken}/checkout`,
        { cpf: cpf.replace(/\D/g, ''), billingType: 'PIX' }
      );
      setPayment(res);
    } catch (e: any) {
      setError(e?.message || 'Erro ao gerar o pagamento');
    } finally {
      setLoading(false);
    }
  };

  const copyPix = async () => {
    if (!payment?.pix?.payload) return;
    await navigator.clipboard.writeText(payment.pix.payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'cart' && 'Seu carrinho'}
            {step === 'form' && 'Dados de entrega'}
            {step === 'payment' && 'Pagamento'}
          </DialogTitle>
          <DialogDescription>
            {step === 'payment'
              ? 'Pague via PIX para confirmar. O lojista só recebe após a confirmação.'
              : 'Os valores são confirmados pelo servidor.'}
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {step === 'cart' && (
          <div className="space-y-3">
            {cart.map((l) => (
              <div key={l.key} className="flex items-start justify-between gap-2 border-b border-border pb-2">
                <div className="min-w-0">
                  <p className="font-medium">{l.product.name}</p>
                  {l.selectedOptions.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {l.selectedOptions.map((o) => o.optionName).join(', ')}
                    </p>
                  )}
                  <div className="mt-1 flex items-center gap-2">
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => onChangeQty(l.key, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm">{l.quantity}</span>
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => onChangeQty(l.key, 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                    <button className="ml-1 text-muted-foreground hover:text-red-600" onClick={() => onRemove(l.key)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <span className="whitespace-nowrap font-semibold">{money(l.unitPrice * l.quantity)}</span>
              </div>
            ))}
            {/* Cupom de desconto */}
            <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
              {coupon ? (
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-mono font-semibold">{coupon.code}</span>{' '}
                    <span className="text-green-600">aplicado (-{money(coupon.discount)})</span>
                  </div>
                  <button className="text-xs text-muted-foreground hover:text-red-600" onClick={removeCoupon}>
                    remover
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Cupom de desconto"
                    className="h-9 font-mono"
                  />
                  <Button variant="outline" className="h-9" onClick={applyCoupon} disabled={couponLoading}>
                    {couponLoading ? '...' : 'Aplicar'}
                  </Button>
                </div>
              )}
              {couponError && <p className="text-xs text-red-600">{couponError}</p>}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Desconto</span>
                  <span>-{money(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold">
                <span>Total parcial</span>
                <span>{money(totalWithDiscount)}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">A taxa de entrega é calculada no próximo passo.</p>
          </div>
        )}

        {step === 'form' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
            </div>
            <div className="space-y-1">
              <Label>Telefone (WhatsApp)</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-1">
              <Label>CPF</Label>
              <Input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" inputMode="numeric" />
            </div>
            <div className="space-y-1">
              <Label>Endereço de entrega</Label>
              <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro, complemento" />
            </div>
            <div className="space-y-1">
              <Label>Observações (opcional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: sem cebola, troco para R$50" />
            </div>
            <Button variant="outline" className="w-full" onClick={useMyLocation} disabled={geoLoading}>
              <MapPin className="mr-2 h-4 w-4" />
              {coords ? 'Localização capturada ✓' : geoLoading ? 'Obtendo...' : 'Usar minha localização (melhora a taxa)'}
            </Button>
          </div>
        )}

        {step === 'payment' && (
          <div className="space-y-4">
            {loading && <p className="text-center text-sm text-muted-foreground">Gerando pagamento...</p>}
            {order && (
              <div className="space-y-1 rounded-lg border border-border p-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{money(order.subtotal)}</span>
                </div>
                {!!order.discount && order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto{order.couponCode ? ` (${order.couponCode})` : ''}</span>
                    <span>-{money(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Taxa de entrega</span>
                  <span>{money(order.deliveryFee)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{money(order.total)}</span>
                </div>
              </div>
            )}

            {payment?.pix?.encodedImage && (
              <div className="flex flex-col items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/png;base64,${payment.pix.encodedImage}`}
                  alt="QR Code PIX"
                  className="h-56 w-56 rounded-lg border border-border"
                />
                <p className="text-xs text-muted-foreground">Escaneie o QR Code no app do seu banco</p>
              </div>
            )}

            {payment?.pix?.payload && (
              <div className="space-y-1">
                <Label>PIX copia e cola</Label>
                <div className="flex gap-2">
                  <Input readOnly value={payment.pix.payload} className="text-xs" />
                  <Button size="icon" variant="outline" onClick={copyPix}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            {payment && !payment.pix && payment.invoiceUrl && (
              <a href={payment.invoiceUrl} target="_blank" rel="noopener noreferrer">
                <Button className="w-full">Abrir página de pagamento</Button>
              </a>
            )}

            {order && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => router.push(`/pedido/${order.trackingToken}`)}
              >
                Acompanhar meu pedido
              </Button>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'cart' && (
            <Button className="w-full" disabled={cart.length === 0} onClick={() => setStep('form')}>
              Ir para entrega
            </Button>
          )}
          {step === 'form' && (
            <div className="flex w-full gap-2">
              <Button variant="outline" onClick={() => setStep('cart')}>
                Voltar
              </Button>
              <Button className="flex-1" onClick={createOrder} disabled={loading}>
                {loading ? 'Criando...' : 'Criar pedido e pagar'}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
