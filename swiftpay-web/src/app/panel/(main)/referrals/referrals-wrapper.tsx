'use client';

import { use } from 'react';
import { Alert } from '@heroui/react';
import type { ApiResponse } from '@/types/common';
import type { UserReferralsData } from '@/types/user/referrals';
import { ReferralsContent } from './referrals-content';

type ReferralsPromise = Promise<ApiResponse<UserReferralsData>>;

interface ReferralsWrapperProps {
  fetchPromise: ReferralsPromise;
}

export function ReferralsWrapper({ fetchPromise }: ReferralsWrapperProps) {
  const response = use(fetchPromise);
  const referrals = response?.data;

  return (
    <div className="flex flex-col gap-6">
      {response?.error && (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Não foi possível carregar os dados de indicação</Alert.Title>
            <Alert.Description>{response.error.message}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      {referrals && <ReferralsContent data={referrals} />}
    </div>
  );
}
