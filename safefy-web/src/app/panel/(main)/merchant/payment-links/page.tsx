import { redirect } from 'next/navigation';
import { getSelectedMerchant } from '@/auth/session';
import { Routes } from '@/router/routes';
import { PaymentLinksContent } from './payment-links-content';

export default async function PaymentLinksPage() {
  const merchant = await getSelectedMerchant();

  if (!merchant) {
    redirect(Routes.panel.merchant.new);
  }

  return <PaymentLinksContent merchantId={merchant.id} />;
}
