'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Partner } from '@/lib/types';
import { StoreManageProvider } from '@/lib/store-manage-context';
import { LojistaStoreProvider } from '@/lib/contexts/lojista-store-context';
import { LojistaLayout } from '@/components/layout/lojista-layout';

export default function AdminStoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ partnerId: string }>;
}) {
  const { partnerId } = use(params);

  const { data, isLoading, isError } = useQuery<{ partner: Partner }>({
    queryKey: ['partner', partnerId],
    queryFn: () => apiClient.get<{ partner: Partner }>(`/api/partners/${partnerId}`),
  });

  const partner = data?.partner;
  const basePath = `/dashboard/lojas/${partnerId}`;
  const displayName = partner?.tradingName || partner?.name || 'Loja';

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground">Carregando loja...</p>
        </div>
      </div>
    );
  }

  if (isError || !partner) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold">Loja não encontrada</h1>
          <p className="text-muted-foreground">Verifique o ID do parceiro e tente novamente.</p>
        </div>
      </div>
    );
  }

  return (
    <StoreManageProvider
      actAsPartnerId={partnerId}
      partnerName={displayName}
      isAdminMode
      readOnly={false}
    >
      <LojistaStoreProvider>
        <LojistaLayout
          basePath={basePath}
          actAsPartnerId={partnerId}
          partnerLabel={displayName}
          partnerSlug={partner.slug}
          backHref="/dashboard/partners"
        >
          {children}
        </LojistaLayout>
      </LojistaStoreProvider>
    </StoreManageProvider>
  );
}
