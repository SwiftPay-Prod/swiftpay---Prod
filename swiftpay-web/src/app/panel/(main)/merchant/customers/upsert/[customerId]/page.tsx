'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useParams, notFound } from 'next/navigation';

import { useMerchant } from '@/contexts/merchant-context';
import { useEnvironment } from '@/contexts/environment-context';

import { getCustomer } from '@/app/actions/merchant/customers';

import { CustomerUpsertForm, PageSkeleton } from './components/upsert-form';
import type { CustomerData } from '@/types/merchant/customers';
import type { ApiResponse } from '@/types/common';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type CustomerPromise = Promise<ApiResponse<CustomerData>>;

export default function CustomerUpsertPage() {
  const params = useParams();
  const customerId = params.customerId as string;
  const { selectedMerchant } = useMerchant();
  const { environment } = useEnvironment();

  const isNewMode = customerId === 'new';
  const isValidId = isNewMode || UUID_REGEX.test(customerId);

  const [customerPromise, setCustomerPromise] = useState<CustomerPromise | undefined>(undefined);
  const lastFetchKey = useRef<string | null>(null);

  useEffect(() => {
    if (isNewMode || !selectedMerchant) {
      lastFetchKey.current = null;
      return;
    }

    const fetchKey = `${selectedMerchant.id}-${customerId}`;
    if (lastFetchKey.current === fetchKey) return;
    lastFetchKey.current = fetchKey;

    getCustomer(selectedMerchant.id, customerId).then((res) => {
      setCustomerPromise(Promise.resolve(res));
    });
  }, [customerId, isNewMode, selectedMerchant]);

  if (!isValidId) {
    notFound();
  }

  if (!selectedMerchant) {
    return <PageSkeleton />;
  }

  if (isNewMode) {
    return (
      <CustomerUpsertForm
        merchantId={selectedMerchant.id}
        environment={environment}
      />
    );
  }

  if (!customerPromise) {
    return <PageSkeleton />;
  }

  return (
    <Suspense fallback={<PageSkeleton />}>
      <CustomerUpsertForm
        merchantId={selectedMerchant.id}
        environment={environment}
        customerPromise={customerPromise}
      />
    </Suspense>
  );
}
