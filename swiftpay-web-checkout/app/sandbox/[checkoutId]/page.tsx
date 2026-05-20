import { CheckoutPageClient } from '@/app/checkout-page-client';
import type { Metadata } from 'next';

interface CheckoutPageProps {
	params: Promise<{ checkoutId: string }>;
}

export async function generateMetadata({ params }: CheckoutPageProps): Promise<Metadata> {
	const { checkoutId } = await params;
	return {
		title: `Sandbox Checkout ${checkoutId}`,
		robots: 'noindex, nofollow',
	};
}

export default async function SandboxCheckoutPage({ params }: CheckoutPageProps) {
	const { checkoutId } = await params;
	return <CheckoutPageClient checkoutId={checkoutId} isSandbox />;
}
