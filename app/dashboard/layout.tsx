'use client';

import { usePathname } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { StoreManageProvider } from '@/lib/store-manage-context';
import { LojistaLayout } from '@/components/layout/lojista-layout';

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStoreManage = pathname.startsWith('/dashboard/lojas/');

  if (isStoreManage) {
    return <>{children}</>;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
