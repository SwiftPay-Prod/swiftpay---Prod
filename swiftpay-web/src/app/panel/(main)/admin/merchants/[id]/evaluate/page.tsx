import { Suspense } from 'react';
import { adminGetMerchant } from '@/app/actions/admin/merchants';
import { MerchantEvaluateWrapper } from './merchant-evaluate-wrapper';
import { MerchantEvaluateSkeleton } from './merchant-evaluate-skeleton';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MerchantEvaluatePage({ params }: PageProps) {
  const { id } = await params;
  const fetchPromise = adminGetMerchant(id);

  return (
    <Suspense fallback={<MerchantEvaluateSkeleton merchantId={id} />}>
      <MerchantEvaluateWrapper fetchPromise={fetchPromise} merchantId={id} />
    </Suspense>
  );
}
