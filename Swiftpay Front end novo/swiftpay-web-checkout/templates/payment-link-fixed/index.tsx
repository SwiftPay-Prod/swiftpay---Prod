import { PaymentLinkClient } from './payment-link-client';
import type { PaymentLinkData } from '@/types/checkout';

interface PaymentLinkFixedTemplateProps {
	paymentLink: PaymentLinkData;
	token: string;
}

export default function PaymentLinkFixedTemplate({ paymentLink, token }: PaymentLinkFixedTemplateProps) {
	return <PaymentLinkClient paymentLink={paymentLink} token={token} />;
}
