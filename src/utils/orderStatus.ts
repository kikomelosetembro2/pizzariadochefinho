import { OrderStatus } from '../types';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pendente: 'Pendente',
  preparando: 'Em Preparo',
  em_entrega: 'Saiu para Entrega',
  pronto_retirada: 'Pronto p/ Retirada',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

export const ORDER_STATUS_RECEIPT_LABELS: Record<OrderStatus, string> = {
  pendente: 'PENDENTE COZINHA',
  preparando: 'EM PREPARO',
  em_entrega: 'SAIU PARA ENTREGA',
  pronto_retirada: 'PRONTO P/ RETIRADA',
  concluido: 'CONCLUÍDO',
  cancelado: 'CANCELADO',
};
