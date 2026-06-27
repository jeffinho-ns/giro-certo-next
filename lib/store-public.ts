import { PublicStorefront } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://giro-certo-api.onrender.com';

/**
 * Busca a vitrine pública por slug no servidor (Server Component / metadata).
 * Retorna null quando a loja não existe. Sem cache para refletir o catálogo atual.
 */
export async function fetchStorefront(slug: string): Promise<PublicStorefront | null> {
  try {
    const res = await fetch(`${API_URL}/api/store/public/${encodeURIComponent(slug)}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicStorefront;
  } catch {
    return null;
  }
}
