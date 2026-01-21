'use client';

import { useApiHealth } from '@/lib/hooks/use-api-health';

export function ApiStatus() {
  const { data, isLoading, isError, error } = useApiHealth();

  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 w-2 rounded-full ${
        isLoading ? 'bg-yellow-500 animate-pulse' :
        isError ? 'bg-red-500' :
        'bg-green-500'
      }`} />
      <span className="text-xs text-muted-foreground">
        {isLoading ? 'Conectando...' :
         isError ? 'API Offline' :
         'API Online'}
      </span>
    </div>
  );
}
