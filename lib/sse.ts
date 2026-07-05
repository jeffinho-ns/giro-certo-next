const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://giro-certo-api.onrender.com';

export function apiBaseUrl(): string {
  const base = API_URL;
  const uri = new URL(base.includes('://') ? base : `https://${base}`);
  const port =
    uri.port && uri.port !== '80' && uri.port !== '443' ? `:${uri.port}` : '';
  return `${uri.protocol}//${uri.host}${port}`;
}

export type SseHandler = (event: string, data: unknown) => void;

/**
 * Conecta a um endpoint SSE da API. Usa fetch + ReadableStream (suporta token na query).
 */
export function connectSse(
  path: string,
  onEvent: SseHandler,
  opts: { token?: string | null; signal?: AbortSignal } = {}
): () => void {
  const controller = new AbortController();
  const signal = opts.signal ?? controller.signal;

  const url = new URL(path, apiBaseUrl());
  if (opts.token) {
    url.searchParams.set('token', opts.token);
  }

  let buffer = '';

  void (async () => {
    try {
      const res = await fetch(url.toString(), {
        headers: { Accept: 'text/event-stream' },
        signal,
        cache: 'no-store',
      });
      if (!res.ok || !res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const block of parts) {
          if (!block.trim() || block.startsWith(':')) continue;
          let event = 'message';
          let dataStr = '';
          for (const line of block.split('\n')) {
            if (line.startsWith('event:')) event = line.slice(6).trim();
            else if (line.startsWith('data:')) dataStr += line.slice(5).trim();
          }
          if (!dataStr) continue;
          try {
            onEvent(event, JSON.parse(dataStr));
          } catch {
            onEvent(event, dataStr);
          }
        }
      }
    } catch {
      /* conexão encerrada */
    }
  })();

  return () => controller.abort();
}
