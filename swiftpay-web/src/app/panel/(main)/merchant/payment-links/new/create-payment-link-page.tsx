'use client';

import { use } from 'react';
import type { BillingFormState, ProductFormState, SettingsFormState, VisualFormState } from './use-create-payment-link-form';
import type { FeesPromise } from './constants';
import { CreatePaymentLinkFormContent } from './create-payment-link-form-content';
import type { PaymentMethod, PaymentStatus } from '@/types/enums';

interface CreatePaymentLinkPageProps {
  merchantId: string;
  feesPromise: FeesPromise;
  paymentLinkId?: string;
  mode?: 'view' | 'edit';
  canEdit?: boolean;
  linkStatus?: PaymentStatus;
  isExpiredLink?: boolean;
  initialBillingValues?: Partial<BillingFormState>;
  initialSettingsValues?: Partial<SettingsFormState>;
  initialVisualValues?: Partial<VisualFormState>;
  initialProductValues?: Partial<ProductFormState>;
  initialEnabledMethods?: PaymentMethod[];
}

export function CreatePaymentLinkPage(props: CreatePaymentLinkPageProps) {
  const feesData = use(props.feesPromise);

  return <CreatePaymentLinkFormContent {...props} feesData={feesData} />;
}
