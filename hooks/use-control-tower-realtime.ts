'use client';

import { useEffect, type Dispatch, type SetStateAction } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';

function socketBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL || 'https://giro-certo-api.onrender.com';
  const uri = new URL(base.includes('://') ? base : `https://${base}`);
  const port =
    uri.port && uri.port !== '80' && uri.port !== '443' ? `:${uri.port}` : '';
  return `${uri.protocol}//${uri.host}${port}`;
}

/**
 * Socket público (sem auth no handshake): invalida queries e mescla posição live dos riders.
 */
export function useControlTowerRealtime(
  queryClient: QueryClient,
  setLiveRiderPositions: Dispatch<
    SetStateAction<Record<string, { lat: number; lng: number }>>
  >
): void {
  useEffect(() => {
    const url = socketBaseUrl();
    const socket: Socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 8,
      reconnectionDelay: 2000,
    });

    socket.on('rider:location:update', (data: unknown) => {
      if (!data || typeof data !== 'object') return;
      const d = data as Record<string, unknown>;
      const userId = d.userId;
      if (typeof userId !== 'string' || !userId) return;
      const lat = typeof d.lat === 'number' ? d.lat : parseFloat(String(d.lat ?? ''));
      const lng = typeof d.lng === 'number' ? d.lng : parseFloat(String(d.lng ?? ''));
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      setLiveRiderPositions((prev) => ({ ...prev, [userId]: { lat, lng } }));
    });

    const bumpLists = () => {
      void queryClient.invalidateQueries({ queryKey: ['active-riders'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard-orders'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    };

    socket.on('delivery:status:changed', bumpLists);
    socket.on('delivery:update', bumpLists);

    return () => {
      socket.disconnect();
    };
  }, [queryClient, setLiveRiderPositions]);
}
