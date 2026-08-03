import type { PaymentMethod } from '@/types/enums';
import type { TParse } from './types';

/**
 * Payment Method Parse
 * Converts PaymentMethod enum to label and description
 * Icons should be provided by each template
 */
export const paymentMethodParse: Record<PaymentMethod, Omit<TParse, 'icon'>> = {
  Pix: {
    label: 'PIX',
    color: 'success',
    description: 'Pagamento instantâneo',
  },
  CreditCard: {
    label: 'Cartão de Crédito',
    color: 'accent',
    description: 'Pague em até 12x',
  },
  Boleto: {
    label: 'Boleto',
    color: 'warning',
    description: 'Vencimento em 3 dias',
  },
};
