import { OrderTracking } from './order-tracking';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function PedidoPage({ params }: PageProps) {
  const { token } = await params;
  return <OrderTracking token={token} />;
}
