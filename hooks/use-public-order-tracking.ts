'use client';

import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

function socketBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL || 'https://giro-certo-api.onrender.com';
  const uri = new URL(base.includes('://') ? base : `https://${base}`);
  const port =
    uri.port && uri.port !== '80' && uri.port !== '443' ? `:${uri.port}` : '';
  return `${uri.protocol}//${uri.host}${port}`;
}

/**
 * Socket anônimo: entra na sala da entrega via trackingToken
 * e recebe rider:location:update em tempo real.
 */
export function usePublicOrderTracking(
  trackingToken: string,
  enabled: boolean
): { rider: { lat: number; lng: number } | null; connected: boolean } {
  const [rider, setRider] = useState<{ lat: number; lng: number } | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled || !trackingToken) return;

    const socket = io(socketBaseUrl(), {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 8,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('tracking:join-by-token', { trackingToken });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('rider:location:update', (data: unknown) => {
      if (!data || typeof data !== 'object') return;
      const d = data as Record<string, unknown>;
      const lat = typeof d.lat === 'number' ? d.lat : parseFloat(String(d.lat ?? ''));
      const lng = typeof d.lng === 'number' ? d.lng : parseFloat(String(d.lng ?? ''));
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      setRider({ lat, lng });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [trackingToken, enabled]);

  return { rider, connected };
}
