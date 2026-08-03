'use client';

import { use } from 'react';
import { Card, Skeleton } from '@heroui/react';
import type { CustomerData } from '@/types/merchant/customers';
import type { ApiResponse } from '@/types/common';
import type { PaymentEnvironment } from '@/types/enums';
import { CustomerUpsertFormContent } from './customer-upsert-form-content';

type CustomerPromise = Promise<ApiResponse<CustomerData>>;

interface CustomerUpsertFormProps {
  merchantId: string;
  environment: PaymentEnvironment;
  customerPromise?: CustomerPromise;
}

export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>
      </div>

      <Skeleton className="h-14 rounded-xl" />

      <Card>
        <Card.Content className="flex flex-col gap-4 p-4">
          <Skeleton className="h-12 w-full rounded-lg" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </Card.Content>
      </Card>
    </div>
  );
}

export function CustomerUpsertForm({ merchantId, environment, customerPromise }: CustomerUpsertFormProps) {
  const customerResponse = customerPromise ? use(customerPromise) : null;
  const customer = customerResponse?.data ?? undefined;

  return <CustomerUpsertFormContent merchantId={merchantId} environment={environment} customer={customer} />;
}
