import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchStorefront } from '@/lib/store-public';
import { StorefrontClient } from './storefront-client';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchStorefront(slug);
  if (!data) {
    return { title: 'Loja não encontrada | Giro Certo' };
  }
  const name = data.store.tradingName || data.store.name;
  return {
    title: `${name} | Giro Certo`,
    description: `Peça online em ${name}. Entrega rápida com Giro Certo.`,
    openGraph: {
      title: name,
      description: `Peça online em ${name}.`,
      images: data.store.photoUrl ? [data.store.photoUrl] : undefined,
    },
  };
}

export default async function LojaPage({ params }: PageProps) {
  const { slug } = await params;
  const storefront = await fetchStorefront(slug);
  if (!storefront) {
    notFound();
  }
  return <StorefrontClient slug={slug} storefront={storefront} />;
}
