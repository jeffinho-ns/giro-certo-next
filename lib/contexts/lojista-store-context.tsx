'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Partner } from '@/lib/types';
import { isGiroManagedStore, isStoreReadOnly } from '@/lib/store-management';
import { useStoreManage } from '@/lib/store-manage-context';

interface LojistaStoreContextValue {
  partner: Partner | undefined;
  isLoading: boolean;
  isGiroManaged: boolean;
  readOnly: boolean;
}

const LojistaStoreContext = createContext<LojistaStoreContextValue | undefined>(undefined);

export function LojistaStoreProvider({ children }: { children: ReactNode }) {
  const { actAsPartnerId, isAdminMode } = useStoreManage();

  const { data, isLoading } = useQuery<{ partner: Partner }>({
    queryKey: ['minha-loja', 'partner', actAsPartnerId],
    queryFn: () => {
      if (isAdminMode && actAsPartnerId) {
        return apiClient.get<{ partner: Partner }>(`/api/partners/${actAsPartnerId}`);
      }
      return apiClient.get<{ partner: Partner }>('/api/partners/me');
    },
  });

  const partner = data?.partner;
  const isGiroManaged = isGiroManagedStore(partner);
  const readOnly = isAdminMode ? false : isStoreReadOnly(partner);

  return (
    <LojistaStoreContext.Provider value={{ partner, isLoading, isGiroManaged, readOnly }}>
      {children}
    </LojistaStoreContext.Provider>
  );
}

export function useLojistaStore() {
  const context = useContext(LojistaStoreContext);
  if (!context) {
    throw new Error('useLojistaStore deve ser usado dentro de LojistaStoreProvider');
  }
  return context;
}
