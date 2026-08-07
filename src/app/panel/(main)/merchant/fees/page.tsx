import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSelectedMerchant } from '@/auth/session';
import { getMerchantFees } from '@/app/actions/merchant/settings';
import { FeesWrapper } from './fees-wrapper';
import { FeesSkeleton } from './fees-skeleton';
import { Routes } from '@/router/routes';

export default async function MerchantFeesPage() {
  const merchant = await getSelectedMerchant();

  if (!merchant) {
    redirect(Routes.panel.merchant.new);
  }

  const feesPromise = getMerchantFees(merchant.id);

  return (
    <Suspense fallback={<FeesSkeleton />}>
      <FeesWrapper fetchPromise={feesPromise} />
    </Suspense>
  );
}

