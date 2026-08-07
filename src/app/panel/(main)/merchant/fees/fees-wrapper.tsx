'use client';

import { use } from 'react';
import { Alert } from '@heroui/react';
import { FeesContent } from './fees-content';
import type { ReadFeesData } from '@/types/merchant/settings';
import type { ApiResponse } from '@/types/common';

type FeesPromise = Promise<ApiResponse<ReadFeesData>>;

interface FeesWrapperProps {
  fetchPromise: FeesPromise;
}

export function FeesWrapper({ fetchPromise }: FeesWrapperProps) {
  const response = use(fetchPromise);

  if (!response?.data) {
    return (
      <Alert status="danger">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Erro ao carregar taxas</Alert.Title>
          <Alert.Description>Não foi possível carregar as taxas e limites da organização.</Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }

  return <FeesContent fees={response.data} />;
}

