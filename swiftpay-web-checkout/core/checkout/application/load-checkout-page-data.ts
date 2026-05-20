import { calculateCheckout } from '@/actions/checkout';
import type { CheckoutData, CalculatedCheckout } from '@/types/checkout';

export async function calculateInitialCheckout(
  checkout: CheckoutData
): Promise<CalculatedCheckout | null> {
  if (!checkout.products?.length) return null;

  const response = await calculateCheckout(checkout.shortId, {
    items: checkout.products.map((p) => ({
      productId: p.productId,
      variantId: p.variantId,
      quantity: p.quantity,
    })),
    couponCode: null,
    zipCode: null,
  });

  return response.data ?? null;
}
