'use client';

import type { CheckoutData, CalculatedCheckout } from '@/types/checkout';
import { resolveCheckoutTemplate } from './templates/resolve-checkout-template';

interface CheckoutRuntimeProps {
  checkout: CheckoutData;
  isSandbox: boolean;
  initialCalculation?: CalculatedCheckout | null;
}

export function CheckoutRuntime({ checkout, isSandbox, initialCalculation }: CheckoutRuntimeProps) {
  const templateModule = resolveCheckoutTemplate(checkout.template.code);

  return templateModule.render({ checkout, isSandbox, initialCalculation: initialCalculation ?? null });
}
