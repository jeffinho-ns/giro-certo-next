import { Partner, StoreManagementMode } from '@/lib/types';

export const GIRO_MANAGED_MODE: StoreManagementMode = 'giro_managed';

export function isGiroManagedStore(partner?: Partner | null): boolean {
  return partner?.storeManagementMode === GIRO_MANAGED_MODE;
}

export function isStoreReadOnly(partner?: Partner | null): boolean {
  return isGiroManagedStore(partner);
}
