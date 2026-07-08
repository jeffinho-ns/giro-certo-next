'use client';

import { createContext, useContext, useMemo } from 'react';

export interface StoreManageContextValue {
  actAsPartnerId: string | null;
  partnerName: string;
  readOnly: boolean;
  isAdminMode: boolean;
}

const StoreManageContext = createContext<StoreManageContextValue | null>(null);

export interface StoreManageProviderProps {
  children: React.ReactNode;
  actAsPartnerId?: string | null;
  partnerName?: string;
  readOnly?: boolean;
  isAdminMode?: boolean;
}

export function StoreManageProvider({
  children,
  actAsPartnerId = null,
  partnerName = '',
  readOnly = false,
  isAdminMode = false,
}: StoreManageProviderProps) {
  const value = useMemo(
    () => ({
      actAsPartnerId,
      partnerName,
      readOnly,
      isAdminMode,
    }),
    [actAsPartnerId, partnerName, readOnly, isAdminMode]
  );

  return <StoreManageContext.Provider value={value}>{children}</StoreManageContext.Provider>;
}

export function useStoreManage(): StoreManageContextValue {
  const ctx = useContext(StoreManageContext);
  if (!ctx) {
    return {
      actAsPartnerId: null,
      partnerName: '',
      readOnly: false,
      isAdminMode: false,
    };
  }
  return ctx;
}
