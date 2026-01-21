'use client';

import { useApiHealth } from '@/lib/hooks/use-api-health';

export function ApiConnectionCard() {
  const { data, isLoading, isError, error } = useApiHealth();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  return (
    <div className="rounded-lg border border-border bg-card p-6 mb-8">
      <h3 className="text-xl font-semibold text-foreground mb-4">
        Status da Conexão com a API
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">URL da API:</span>
          <code className="px-2 py-1 rounded bg-muted text-foreground text-sm">
            {apiUrl}
          </code>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status:</span>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${
              isLoading ? 'bg-yellow-500 animate-pulse' :
              isError ? 'bg-red-500' :
              'bg-green-500'
            }`} />
            <span className={`text-sm font-medium ${
              isLoading ? 'text-yellow-600 dark:text-yellow-400' :
              isError ? 'text-red-600 dark:text-red-400' :
              'text-green-600 dark:text-green-400'
            }`}>
              {isLoading ? 'Conectando...' :
               isError ? 'Desconectado' :
               'Conectado'}
            </span>
          </div>
        </div>

        {data && (
          <div className="rounded-lg bg-muted/50 p-3 mt-4">
            <p className="text-xs text-muted-foreground mb-1">Mensagem da API:</p>
            <p className="text-sm text-foreground">{data.message}</p>
          </div>
        )}

        {isError && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 mt-4">
            <p className="text-xs text-red-600 dark:text-red-400 mb-1">Erro:</p>
            <p className="text-sm text-red-600 dark:text-red-400">
              {error instanceof Error ? error.message : 'Não foi possível conectar à API'}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Certifique-se de que o servidor back-end está rodando em {apiUrl}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
