'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Sidebar } from './sidebar';
import { ApiStatus } from '@/components/api-status';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useAuth } from '@/lib/contexts/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAdmin, isModerator } = useAuth();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <ProtectedRoute requireModerator>
      <div className="flex h-dvh overflow-hidden bg-background">
        <aside className="hidden md:flex md:shrink-0">
          <Sidebar />
        </aside>

        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent
            side="left"
            showCloseButton={false}
            className="w-[min(100%,18rem)] border-r p-0 sm:max-w-none"
          >
            <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
            <Sidebar
              className="w-full border-r-0"
              onNavigate={() => setMobileNavOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-3 sm:h-16 sm:px-4 md:px-6">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 md:hidden"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h2 className="truncate text-base font-semibold text-foreground sm:text-lg">
                Painel Administrativo
              </h2>
              {user && (
                <span className="hidden shrink-0 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary sm:inline">
                  {isAdmin ? 'Administrador' : isModerator ? 'Moderador' : 'Usuário'}
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
              <div className="hidden sm:block">
                <ApiStatus />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full" type="button">
                    <Avatar>
                      <AvatarFallback>
                        {user ? getInitials(user.name) : '👤'}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-sm">
                    <p className="font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    {user && (
                      <p className="mt-1 text-xs text-primary sm:hidden">
                        {isAdmin ? 'Administrador' : isModerator ? 'Moderador' : 'Usuário'}
                      </p>
                    )}
                  </div>
                  <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
