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
  UserCog,
  Store,
  AlertTriangle,
  FileText,
  Bell,
  ShieldCheck
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
    description: 'FASE 4: Monitoramento em tempo real',
  },
  {
    name: 'Lojistas',
    href: '/dashboard/partners',
    icon: Store,
    description: 'FASE 5: Gestão de parceiros',
  },
  {
    name: 'Delivery',
    href: '/dashboard/delivery',
    icon: Package,
  },
  {
    name: 'Central de Disputas',
    href: '/dashboard/disputes',
    icon: AlertTriangle,
    description: 'FASE 6: Mediação de conflitos',
  },
  {
    name: 'Relatórios',
    href: '/dashboard/reports',
    icon: FileText,
    description: 'FASE 8: Relatórios exportáveis',
  },
  {
    name: 'Alertas',
    href: '/dashboard/alerts',
    icon: Bell,
    description: 'FASE 9: Sistema de notificações',
  },
  {
    name: 'Documentos',
    href: '/dashboard/documents',
    icon: ShieldCheck,
    description: 'FASE 1: Aprovar documentos de entregadores',
  },
  {
    name: 'Usuários',
    href: '/dashboard/users',
    icon: UserCog,
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
      
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              title={item.description}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1">{item.name}</span>
              {item.description && (
                <span className={cn(
                  'absolute left-full ml-2 px-2 py-1 text-xs rounded-md bg-popover border border-border shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50',
                  isActive ? 'text-primary-foreground bg-primary/90' : 'text-foreground'
                )}>
                  {item.description}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
