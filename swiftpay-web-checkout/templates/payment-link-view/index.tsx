import PaymentLinkViewTemplate from './components/payment-link-view-client';
import type { PaymentLinkData } from '@/types/checkout';

interface PaymentLinkViewProps {
	paymentLink: PaymentLinkData;
	token: string;
	disableStatusPolling?: boolean;
}

export default function PaymentLinkView({
	paymentLink,
	token,
	disableStatusPolling = false,
}: PaymentLinkViewProps) {
	return (
		<PaymentLinkViewTemplate
			paymentLink={paymentLink}
			token={token}
			disableStatusPolling={disableStatusPolling}
		/>
	);
}
