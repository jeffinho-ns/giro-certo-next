import { StoreManageProvider } from '@/lib/store-manage-context';
import { LojistaStoreProvider } from '@/lib/contexts/lojista-store-context';
import { LojistaLayout } from '@/components/layout/lojista-layout';

export default function LojistaRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreManageProvider>
      <LojistaStoreProvider>
        <LojistaLayout>{children}</LojistaLayout>
      </LojistaStoreProvider>
    </StoreManageProvider>
  );
}
