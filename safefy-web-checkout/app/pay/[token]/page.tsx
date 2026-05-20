import { cache } from 'react';
import { getPaymentLink } from '@/actions/paymentLink';
import { PaymentLinkPageContent } from '@/templates/payment-link-fixed/payment-link-page-content';
import type { Metadata } from 'next';

const getPaymentLinkCached = cache(getPaymentLink);

interface PageProps {
	params: Promise<{ token: string }>;
}

function resolvePaymentLinkMetadataText(
	paymentLink: NonNullable<Awaited<ReturnType<typeof getPaymentLinkCached>>['paymentLink']>
): { title: string; description: string } {
	const amountStr = (paymentLink.amount / 100).toLocaleString('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	});

	const productName = paymentLink.productName?.trim() || null;
	const paymentDescription = paymentLink.description?.trim() || null;

	if (productName && paymentDescription) {
		return {
			title: `${productName} — ${amountStr}`,
			description: paymentDescription,
		};
	}

	if (productName) {
		return {
			title: `${productName} — ${amountStr}`,
			description: `Link de pagamento no valor de ${amountStr}.`,
		};
	}

	if (paymentDescription) {
		return {
			title: `Link de pagamento — ${amountStr}`,
			description: paymentDescription,
		};
	}

	return {
		title: `Link de pagamento — ${amountStr}`,
		description: `Link de pagamento no valor de ${amountStr}.`,
	};
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { token } = await params;
	const { paymentLink } = await getPaymentLinkCached(token);

	if (!paymentLink) {
		return { title: 'Link de Pagamento' };
	}

	const { title, description } = resolvePaymentLinkMetadataText(paymentLink);
	const metadataImage = paymentLink.productImageUrl || '/safefy-icon-logo.png';

	return {
		title,
		description,
		icons: {
			icon: '/safefy-icon-logo.png',
			shortcut: '/safefy-icon-logo.png',
			apple: '/safefy-icon-logo.png',
		},
		openGraph: {
			title,
			description,
			type: 'website',
			locale: 'pt_BR',
			images: [{ url: metadataImage, alt: title }],
		},
		twitter: {
			card: 'summary_large_image',
			title,
			description,
			images: [metadataImage],
		},
		robots: 'noindex, nofollow',
	};
}

export default async function PaymentLinkPage({ params }: PageProps) {
	const { token } = await params;
	return <PaymentLinkPageContent token={token} />;
}
