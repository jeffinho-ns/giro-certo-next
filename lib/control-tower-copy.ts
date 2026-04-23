/** Texto operacional para a Torre de Controle (alinhado ao app / API). */
export function describeRiderOperationalLeg(
  status: string | null | undefined
): string {
  switch (status) {
    case 'accepted':
      return 'A caminho do estabelecimento (retirada do pedido)';
    case 'arrivedAtStore':
      return 'No estabelecimento — aguardando retirada do item';
    case 'inTransit':
    case 'inProgress':
      return 'A caminho do cliente (entrega do pedido)';
    default:
      return 'Sem etapa de corrida ativa (online sem pedido em rota)';
  }
}

export function formatDeliveryStatusPt(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pendente',
    accepted: 'Aceito — deslocamento à loja',
    arrivedAtStore: 'Na loja — retirada',
    inTransit: 'Em trânsito — indo ao cliente',
    inProgress: 'Em andamento',
    completed: 'Concluído',
    cancelled: 'Cancelado',
  };
  return map[status] ?? status;
}
