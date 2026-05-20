import type { ReactNode } from 'react';
import type { CheckoutData, CalculatedCheckout } from '@/types/checkout';

export interface CheckoutTemplateRenderInput {
  checkout: CheckoutData;
  isSandbox: boolean;
  initialCalculation: CalculatedCheckout | null;
}

export interface CheckoutTemplateModule {
  code: string;
  aliases?: string[];
  render: (input: CheckoutTemplateRenderInput) => ReactNode;
}
