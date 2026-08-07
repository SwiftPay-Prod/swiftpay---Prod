import { Suspense } from 'react';
import { CheckoutUpsertContent } from '@/app/panel/(main)/merchant/checkouts/upsert/[checkoutId]/components/checkout-upsert-content';
import { CheckoutUpsertFormSkeleton } from '@/app/panel/(main)/merchant/checkouts/upsert/[checkoutId]/checkout-upsert-form-skeleton';
import { getMerchantCheckout, listCheckoutTemplates } from '@/app/actions/merchant/checkouts';

export default async function MockCheckoutRealPage() {
  const merchantId = 'preview-merchant-id';
  const checkoutId = 'chk_918273645';

  const checkoutPromise = getMerchantCheckout(merchantId, checkoutId);
  const templatesPromise = listCheckoutTemplates(merchantId);

  return (
    <Suspense fallback={<CheckoutUpsertFormSkeleton />}>
      <CheckoutUpsertContent
        merchantId={merchantId}
        environment="Production"
        isNew={false}
        checkoutPromise={checkoutPromise}
        templatesPromise={templatesPromise}
      />
    </Suspense>
  );
}
