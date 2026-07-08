'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ClipboardList,
  Package,
  Store,
  ExternalLink,
  Megaphone,
  Palette,
  Ticket,
  Star,
  Settings,
  Copy,
  Check,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { Partner } from '@/lib/types';
import { useAuth } from '@/lib/contexts/auth-context';
import { useStoreManage } from '@/lib/store-manage-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const NAV_SEGMENTS = [
  { name: 'Pedidos', segment: 'pedidos', icon: ClipboardList },
  { name: 'Produtos', segment: 'produtos', icon: Package },
  { name: 'Promoções', segment: 'promocoes', icon: Megaphone },
  { name: 'Cupons', segment: 'cupons', icon: Ticket },
  { name: 'Avaliações', segment: 'avaliacoes', icon: Star },
  { name: 'Personalizar', segment: 'personalizar', icon: Palette },
  { name: 'Configurações', segment: 'configuracoes', icon: Settings },
] as const;

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export interface LojistaLayoutProps {
  children: React.ReactNode;
  basePath?: string;
  actAsPartnerId?: string;
  partnerLabel?: string;
  partnerSlug?: string | null;
  backHref?: string;
}

export function LojistaLayout({
  children,
  basePath = '/minha-loja',
  actAsPartnerId,
  partnerLabel,
  partnerSlug,
  backHref,
}: LojistaLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { partnerName, isAdminMode, readOnly } = useStoreManage();

  const navigation = NAV_SEGMENTS.map((item) => ({
    ...item,
    href: `${basePath}/${item.segment}`,
  }));

  const shouldFetchPartner = !isAdminMode;
  const { data } = useQuery<{ partner: Partner }>({
    queryKey: ['minha-loja', 'partner'],
    queryFn: () => apiClient.get<{ partner: Partner }>('/api/partners/me'),
    enabled: shouldFetchPartner,
  });

  const partner = data?.partner;
  const displayName =
    partnerLabel ||
    partnerName ||
    partner?.tradingName ||
    partner?.name ||
    'Minha Loja';
  const slug = partnerSlug ?? partner?.slug ?? null;
  const storefrontPath = slug ? `/loja/${slug}` : null;
  const [copied, setCopied] = useState(false);

  const copyStorefront = async () => {
    if (!storefrontPath || typeof window === 'undefined') return;
    const full = `${window.location.origin}${storefrontPath}`;
    await navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const content = (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="flex h-full w-64 flex-col border-r border-border bg-card">
        <div className="flex h-16 items-center gap-3 border-b border-border px-6">
          {backHref && (
            <Link
              href={backHref}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Voltar"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          )}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-foreground">{displayName}</h1>
            <p className="text-xs text-muted-foreground">
              {isAdminMode ? 'Gestão admin da vitrine' : 'Portal do Lojista'}
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="flex-1">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {storefrontPath && (
          <div className="space-y-1 border-t border-border px-3 py-3">
            <p className="px-3 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Vitrine pública
            </p>
            <p className="truncate px-3 font-mono text-xs text-foreground">{storefrontPath}</p>
            <div className="flex gap-1">
              <a
                href={storefrontPath}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Abrir</span>
              </a>
              <button
                type="button"
                onClick={copyStorefront}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {isAdminMode && (
          <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-6 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
            <Shield className="h-4 w-4 shrink-0" />
            <span>
              Gerenciando vitrine de <strong>{displayName}</strong> como admin
              {readOnly ? ' (somente leitura)' : ''}
            </span>
            {actAsPartnerId && (
              <span className="ml-auto font-mono text-xs opacity-70">{actAsPartnerId.slice(0, 8)}…</span>
            )}
          </div>
        )}

        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
          <h2 className="text-lg font-semibold text-foreground">
            {isAdminMode ? 'Gerenciar vitrine' : 'Minha Loja'}
          </h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full">
                <Avatar>
                  <AvatarFallback>{user ? getInitials(user.name) : '👤'}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5 text-sm">
                <p className="font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              {isAdminMode && backHref && (
                <DropdownMenuItem onClick={() => router.push(backHref)}>
                  Voltar ao painel
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );

  if (isAdminMode) {
    return <ProtectedRoute requireModerator>{content}</ProtectedRoute>;
  }

  return <ProtectedRoute requireLojista>{content}</ProtectedRoute>;
}
