import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Routes } from '@/router/routes';
import { getSelectedMerchant } from '@/auth/session';
import { getMerchantIntegrations } from '@/app/actions/merchant/integrations';
import { IntegrationsContent } from './integrations-content';

export default async function IntegrationsPage() {
  const merchant = await getSelectedMerchant();

  if (!merchant) {
    redirect(Routes.panel.merchant.new);
  }

  const integrationsPromise = getMerchantIntegrations(merchant.id);

  return (
    <Suspense>
      <IntegrationsContent merchantId={merchant.id} fetchPromise={integrationsPromise} />
    </Suspense>
  );
}
