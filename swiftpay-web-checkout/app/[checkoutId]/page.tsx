import { CheckoutPageClient } from '@/app/checkout-page-client';
import { PaymentLinkPageContent } from '@/templates/payment-link-fixed/payment-link-page-content';
import { PaymentLinkByIdPageContent } from '@/templates/payment-link-view/pages/payment-link-by-id-page-content';
import { isGuid } from '@/utils';
import type { Metadata } from 'next';

interface CheckoutPageProps {
	params: Promise<{ checkoutId: string }>;
}

export async function generateMetadata({ params }: CheckoutPageProps): Promise<Metadata> {
	const { checkoutId } = await params;
	if (checkoutId.toLowerCase().startsWith('pay_') || isGuid(checkoutId)) {
		return {
			title: 'Link de pagamento',
		};
	}

	return {
		title: `Checkout ${checkoutId}`,
	};
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
	const { checkoutId } = await params;
	if (checkoutId.toLowerCase().startsWith('pay_')) {
		return <PaymentLinkPageContent token={checkoutId} />;
	}

	if (isGuid(checkoutId)) {
		return <PaymentLinkByIdPageContent paymentId={checkoutId} />;
	}

	return <CheckoutPageClient checkoutId={checkoutId} isSandbox={false} />;
}
