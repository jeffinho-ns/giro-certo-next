import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export function useApiHealth() {
  return useQuery({
    queryKey: ['api-health'],
    queryFn: () => apiClient.health(),
    refetchInterval: 30000, // Verifica a cada 30 segundos
    retry: 1,
  });
}
