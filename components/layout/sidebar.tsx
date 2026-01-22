'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  DollarSign, 
  Crown, 
  Trophy, 
  Users,
  MapPin,
  Home,
  UserCog
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Torre de Controle',
    href: '/dashboard/control-tower',
    icon: MapPin,
  },
  {
    name: 'Delivery',
    href: '/dashboard/delivery',
    icon: Package,
  },
  {
    name: 'Financeiro',
    href: '/dashboard/financial',
    icon: DollarSign,
  },
  {
    name: 'Assinantes',
    href: '/dashboard/subscribers',
    icon: Crown,
  },
  {
    name: 'Gamificação',
    href: '/dashboard/gamification',
    icon: Trophy,
  },
  {
    name: 'Moderação',
    href: '/dashboard/moderation',
    icon: Users,
  },
  {
    name: 'Usuários',
    href: '/dashboard/users',
    icon: UserCog,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <span className="text-xl font-bold">🏍️</span>
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Giro Certo</h1>
          <p className="text-xs text-muted-foreground">Admin</p>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
