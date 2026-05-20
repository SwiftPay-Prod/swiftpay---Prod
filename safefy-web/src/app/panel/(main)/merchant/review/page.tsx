import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSelectedMerchant } from '@/auth/session';
import { getMerchant } from '@/app/actions/merchant/crud';
import { ReviewWrapper } from './review-wrapper';
import { ReviewSkeleton } from './review-skeleton';
import { Routes } from '@/router/routes';

export default async function MerchantReviewPage() {
  const selectedMerchant = await getSelectedMerchant();

  if (!selectedMerchant) {
    redirect(Routes.panel.merchant.new);
  }

  const merchantPromise = getMerchant(selectedMerchant.id);

  return (
    <Suspense fallback={<ReviewSkeleton />}>
      <ReviewWrapper fetchPromise={merchantPromise} />
    </Suspense>
  );
}

