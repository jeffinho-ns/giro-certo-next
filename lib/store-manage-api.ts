'use client';

import { useMemo } from 'react';
import { apiClient } from '@/lib/api';
import { useStoreManage } from '@/lib/store-manage-context';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://giro-certo-api.onrender.com';

function withActAsHeader(actAsPartnerId: string | null, options?: RequestInit): RequestInit {
  if (!actAsPartnerId) return options ?? {};
  const baseHeaders = (options?.headers as Record<string, string>) ?? {};
  return {
    ...options,
    headers: {
      ...baseHeaders,
      'X-Act-As-Partner': actAsPartnerId,
    },
  };
}

export interface StoreManageApi {
  get: <T>(endpoint: string, options?: RequestInit) => Promise<T>;
  post: <T>(endpoint: string, data?: unknown, options?: RequestInit) => Promise<T>;
  put: <T>(endpoint: string, data?: unknown, options?: RequestInit) => Promise<T>;
  delete: <T>(endpoint: string, options?: RequestInit) => Promise<T>;
  uploadImage: (file: File, entityId?: string) => Promise<string>;
}

function createStoreManageApi(actAsPartnerId: string | null): StoreManageApi {
  return {
    get: <T>(endpoint: string, options?: RequestInit) =>
      apiClient.get<T>(endpoint, withActAsHeader(actAsPartnerId, options)),
    post: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
      apiClient.post<T>(endpoint, data, withActAsHeader(actAsPartnerId, options)),
    put: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
      apiClient.put<T>(endpoint, data, withActAsHeader(actAsPartnerId, options)),
    delete: <T>(endpoint: string, options?: RequestInit) =>
      apiClient.delete<T>(endpoint, withActAsHeader(actAsPartnerId, options)),
    uploadImage: async (file: File, entityId: string = 'store') => {
      const form = new FormData();
      form.append('image', file);
      const folderId = actAsPartnerId ?? entityId;
      const url = `${API_URL}/api/images/upload/partner/${encodeURIComponent(folderId)}`;
      const headers: Record<string, string> = {};
      const token = apiClient.getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (actAsPartnerId) headers['X-Act-As-Partner'] = actAsPartnerId;

      const response = await fetch(url, { method: 'POST', headers, body: form });
      if (!response.ok) {
        let message = `Erro HTTP ${response.status}`;
        try {
          const errBody = await response.json();
          if (errBody && typeof errBody.error === 'string') message = errBody.error;
        } catch {
          /* corpo não JSON */
        }
        throw new Error(message);
      }
      const data = await response.json();
      const imageUrl = data?.image?.url as string | undefined;
      if (!imageUrl) throw new Error('Resposta de upload sem URL');
      return imageUrl;
    },
  };
}

export function useStoreManageApi(): StoreManageApi {
  const { actAsPartnerId } = useStoreManage();
  return useMemo(() => createStoreManageApi(actAsPartnerId), [actAsPartnerId]);
}
