'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { Partner } from '@/lib/types';
import { useAuth } from '@/lib/contexts/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navigation = [
  { name: 'Pedidos', href: '/minha-loja/pedidos', icon: ClipboardList },
  { name: 'Produtos', href: '/minha-loja/produtos', icon: Package },
  { name: 'Promoções', href: '/minha-loja/promocoes', icon: Megaphone },
  { name: 'Cupons', href: '/minha-loja/cupons', icon: Ticket },
  { name: 'Avaliações', href: '/minha-loja/avaliacoes', icon: Star },
  { name: 'Personalizar', href: '/minha-loja/personalizar', icon: Palette },
  { name: 'Configurações', href: '/minha-loja/configuracoes', icon: Settings },
];

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function LojistaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const { data } = useQuery<{ partner: Partner }>({
    queryKey: ['minha-loja', 'partner'],
    queryFn: () => apiClient.get<{ partner: Partner }>('/api/partners/me'),
  });
  const partner = data?.partner;
  const [copied, setCopied] = useState(false);

  const storefrontPath = partner?.slug ? `/loja/${partner.slug}` : null;

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

  return (
    <ProtectedRoute requireLojista>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar */}
        <div className="flex h-full w-64 flex-col border-r border-border bg-card">
          <div className="flex h-16 items-center gap-3 border-b border-border px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-foreground">
                {partner?.tradingName || partner?.name || 'Minha Loja'}
              </h1>
              <p className="text-xs text-muted-foreground">Portal do Lojista</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
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

          {partner?.slug && (
            <div className="space-y-1 border-t border-border px-3 py-3">
              <p className="px-3 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Vitrine pública
              </p>
              <p className="truncate px-3 font-mono text-xs text-foreground">
                /loja/{partner.slug}
              </p>
              <div className="flex gap-1">
                <a
                  href={storefrontPath!}
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

        {/* Conteúdo */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
            <h2 className="text-lg font-semibold text-foreground">Minha Loja</h2>
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
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
