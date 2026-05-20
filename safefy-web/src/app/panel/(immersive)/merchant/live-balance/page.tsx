import { redirect } from 'next/navigation';
import { getSelectedMerchant } from '@/auth/session';
import { Routes } from '@/router/routes';
import { MerchantLiveBalancePage } from './page-client';

export default async function LiveBalancePage() {
  const merchant = await getSelectedMerchant();

  if (!merchant) {
    redirect(Routes.panel.merchant.new);
  }

  return <MerchantLiveBalancePage />;
}