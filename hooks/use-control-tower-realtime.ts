'use client';

import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { apiClient } from '@/lib/api';

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
  setLiveRiderPositions: Dispatch<SetStateAction<Record<string, { lat: number; lng: number }>>>,
  orderIds: string[]
): void {
  const socketRef = useRef<Socket | null>(null);
  const joinedRoomsRef = useRef<Set<string>>(new Set());
  const invalidateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPositionsRef = useRef<Record<string, { lat: number; lng: number }>>({});
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const url = socketBaseUrl();
    const token = apiClient.getToken();
    const socket: Socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 8,
      reconnectionDelay: 2000,
      auth: token ? { token } : undefined,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('auth', { token: token ?? undefined });
      for (const orderId of joinedRoomsRef.current) {
        if (orderId) socket.emit('tracking:join-order', { orderId });
      }
    });

    socket.on('rider:location:update', (data: unknown) => {
      if (!data || typeof data !== 'object') return;
      const d = data as Record<string, unknown>;
      const userId = d.userId;
      if (typeof userId !== 'string' || !userId) return;
      const lat = typeof d.lat === 'number' ? d.lat : parseFloat(String(d.lat ?? ''));
      const lng = typeof d.lng === 'number' ? d.lng : parseFloat(String(d.lng ?? ''));
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      pendingPositionsRef.current[userId] = { lat, lng };
      if (flushTimerRef.current) return;
      flushTimerRef.current = setTimeout(() => {
        flushTimerRef.current = null;
        const batch = pendingPositionsRef.current;
        pendingPositionsRef.current = {};
        if (Object.keys(batch).length === 0) return;
        setLiveRiderPositions((prev) => ({ ...prev, ...batch }));
      }, 250);
    });

    const bumpLists = () => {
      if (invalidateTimerRef.current) return;
      invalidateTimerRef.current = setTimeout(() => {
        invalidateTimerRef.current = null;
        void queryClient.invalidateQueries({ queryKey: ['active-riders'] });
        void queryClient.invalidateQueries({ queryKey: ['dashboard-orders'] });
        void queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      }, 450);
    };

    socket.on('delivery:status:changed', bumpLists);
    socket.on('delivery:update', bumpLists);

    return () => {
      if (invalidateTimerRef.current) {
        clearTimeout(invalidateTimerRef.current);
        invalidateTimerRef.current = null;
      }
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      pendingPositionsRef.current = {};
      socket.disconnect();
      socketRef.current = null;
      joinedRoomsRef.current.clear();
    };
  }, [queryClient, setLiveRiderPositions]);

  useEffect(() => {
    const socket = socketRef.current;
    const nextRooms = new Set(orderIds.filter(Boolean));
    const currentRooms = joinedRoomsRef.current;
    if (!socket) {
      joinedRoomsRef.current = nextRooms;
      return;
    }

    for (const room of currentRooms) {
      if (!nextRooms.has(room)) {
        socket.emit('tracking:leave-order', { orderId: room });
      }
    }
    for (const room of nextRooms) {
      if (!currentRooms.has(room)) {
        socket.emit('tracking:join-order', { orderId: room });
      }
    }
    joinedRoomsRef.current = nextRooms;
  }, [orderIds]);
}
