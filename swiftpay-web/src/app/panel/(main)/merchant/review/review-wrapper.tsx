'use client';

import { use } from 'react';
import { Card } from '@heroui/react';
import { ReviewContent } from './review-content';
import type { MerchantData } from '@/types/merchant/crud';
import type { ApiResponse } from '@/types/common';

type ReviewPromise = Promise<ApiResponse<MerchantData>>;

interface ReviewWrapperProps {
  fetchPromise: ReviewPromise;
}

export function ReviewWrapper({ fetchPromise }: ReviewWrapperProps) {
  const response = use(fetchPromise);

  if (response?.error || !response?.data) {
    return (
      <Card>
        <Card.Content className="p-8 text-center">
          <p className="text-default-500">{response?.error?.message ?? 'Organização não encontrada.'}</p>
        </Card.Content>
      </Card>
    );
  }

  return <ReviewContent merchant={response.data} />;
}

