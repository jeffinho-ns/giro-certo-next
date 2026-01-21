'use client';

import { Sidebar } from './sidebar';
import { ApiStatus } from '@/components/api-status';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-foreground">Painel Administrativo</h2>
          </div>
          <div className="flex items-center gap-4">
            <ApiStatus />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full">
                  <Avatar>
                    <AvatarFallback>👤</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Perfil</DropdownMenuItem>
                <DropdownMenuItem>Configurações</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">Sair</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
