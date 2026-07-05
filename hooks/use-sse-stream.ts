'use client';

import { useEffect, useRef } from 'react';
import { connectSse } from '@/lib/sse';
import { apiClient } from '@/lib/api';

/** SSE autenticado (lojista, admin, rider). Invalida queries ou chama callback por evento. */
export function useAuthenticatedSse(
  enabled: boolean,
  onEvent: (event: string, data: unknown) => void,
  opts: { orderId?: string } = {}
) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled) return;
    const token = apiClient.getToken();
    if (!token) return;

    let path = '/api/realtime/stream';
    if (opts.orderId) {
      path += `?orderId=${encodeURIComponent(opts.orderId)}`;
    }

    const disconnect = connectSse(
      path,
      (event, data) => onEventRef.current(event, data),
      { token }
    );
    return disconnect;
  }, [enabled, opts.orderId]);
}

/** SSE público da vitrine por trackingToken. */
export function usePublicStoreOrderSse(
  trackingToken: string,
  enabled: boolean,
  onEvent: (event: string, data: unknown) => void
) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled || !trackingToken) return;

    const disconnect = connectSse(
      `/api/realtime/store-order/${encodeURIComponent(trackingToken)}/stream`,
      (event, data) => onEventRef.current(event, data)
    );
    return disconnect;
  }, [trackingToken, enabled]);
}
