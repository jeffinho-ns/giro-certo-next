'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';

interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  customerName: string | null;
  createdAt: string;
}

interface ReviewsResponse {
  average: number;
  count: number;
  reviews: ReviewRow[];
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
}

export default function AvaliacoesPage() {
  const { data, isLoading } = useQuery<ReviewsResponse>({
    queryKey: ['store', 'reviews'],
    queryFn: () => apiClient.get('/api/store/manage/reviews'),
  });

  const reviews = data?.reviews ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Avaliações</h1>
        <p className="text-sm text-muted-foreground">O que os clientes acharam da sua loja.</p>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4 py-5">
          <div className="text-4xl font-bold">{(data?.average ?? 0).toFixed(1)}</div>
          <div>
            <Stars value={Math.round(data?.average ?? 0)} />
            <p className="text-sm text-muted-foreground">{data?.count ?? 0} avaliação(ões)</p>
          </div>
        </CardContent>
      </Card>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
      {!isLoading && reviews.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Você ainda não recebeu avaliações.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {reviews.map((r) => (
          <Card key={r.id}>
            <CardContent className="space-y-1 py-4">
              <div className="flex items-center justify-between">
                <Stars value={r.rating} />
                <span className="text-xs text-muted-foreground">
                  {new Date(r.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
              {r.customerName && <p className="text-sm font-medium">{r.customerName}</p>}
              {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
