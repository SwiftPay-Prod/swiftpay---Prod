'use client';

import { use, useEffect } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { MerchantKycStatus } from '@/types/enums';
import { MerchantEvaluate } from './merchant-evaluate';
import { Routes } from '@/router/routes';
import type { ApiResponse } from '@/types/common';
import type { AdminMerchantDetails } from '@/types/admin/merchants';

type FetchPromise = Promise<ApiResponse<AdminMerchantDetails>>;

interface MerchantEvaluateWrapperProps {
  fetchPromise: FetchPromise;
  merchantId: string;
}

export function MerchantEvaluateWrapper({ fetchPromise, merchantId }: MerchantEvaluateWrapperProps) {
  const router = useRouter();
  const response = use(fetchPromise);

  if (response?.error || !response?.data) {
    notFound();
  }

  const merchant = response.data;
  const evaluableStatuses = [MerchantKycStatus.Pending, MerchantKycStatus.UnderReview];
  const shouldRedirect = !evaluableStatuses.includes(merchant.kycStatus as MerchantKycStatus);

  useEffect(() => {
    if (!shouldRedirect) {
      return;
    }

    router.replace(Routes.panel.admin.merchantDetails(merchantId));
  }, [shouldRedirect, router, merchantId]);

  if (shouldRedirect) {
    return null;
  }

  return <MerchantEvaluate merchant={merchant} />;
}
