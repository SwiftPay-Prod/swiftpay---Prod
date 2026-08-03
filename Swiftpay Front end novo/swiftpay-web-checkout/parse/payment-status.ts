import type { PaymentStatus } from '@/types/enums';
import type { TParse } from './types';

/**
 * Payment Status Parse
 * Converts PaymentStatus enum to label and description
 * Icons should be provided by each template
 */
export const paymentStatusParse: Record<PaymentStatus, Omit<TParse, 'icon'>> = {
  Pending: {
    label: 'Aguardando Pagamento',
    color: 'warning',
    description: 'O pagamento está pendente',
  },
  Processing: {
    label: 'Processando',
    color: 'accent',
    description: 'O pagamento está sendo processado',
  },
  Confirming: {
    label: 'Confirmando',
    color: 'accent',
    description: 'Confirmação em andamento',
  },
  Completed: {
    label: 'Pagamento Confirmado',
    color: 'success',
    description: 'O pagamento foi confirmado com sucesso',
  },
  Cancelled: {
    label: 'Cancelado',
    color: 'danger',
    description: 'O pagamento foi cancelado',
  },
  Expired: {
    label: 'Expirado',
    color: 'danger',
    description: 'O tempo para pagamento expirou',
  },
  Failed: {
    label: 'Pagamento Falhou',
    color: 'danger',
    description: 'Houve um erro no pagamento',
  },
  Refunded: {
    label: 'Estornado',
    color: 'secondary',
    description: 'O pagamento foi estornado',
  },
  PartiallyRefunded: {
    label: 'Parcialmente Estornado',
    color: 'secondary',
    description: 'O pagamento foi parcialmente estornado',
  },
};
