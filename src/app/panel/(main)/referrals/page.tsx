import { Suspense } from 'react';
import { getMyReferrals } from '@/app/actions/user';
import { ReferralsWrapper } from './referrals-wrapper';
import { ReferralsSkeleton } from './referrals-skeleton';

export default async function ReferralsPage() {
  const referralsPromise = getMyReferrals();

  return (
    <Suspense fallback={<ReferralsSkeleton />}>
      <ReferralsWrapper fetchPromise={referralsPromise} />
    </Suspense>
  );
}
