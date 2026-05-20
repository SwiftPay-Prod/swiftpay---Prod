'use client';

import { PaymentLinksTable } from './payment-links-table';

interface PaymentLinksContentProps {
  merchantId: string;
}

export function PaymentLinksContent({ merchantId }: PaymentLinksContentProps) {
  return <PaymentLinksTable merchantId={merchantId} />;
}
