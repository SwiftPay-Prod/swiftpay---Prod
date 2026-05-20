'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { FullPageLoader } from '@/components/ui/loader';
import { getCheckoutClient, type CheckoutErrorType } from '@/clients/checkout-api';
import type { CheckoutData } from '@/types/checkout';
import type { CheckoutColorMode } from '@/types/enums';

const CheckoutNotFound = dynamic(
	() => import('@/components/checkout-not-found').then((m) => m.CheckoutNotFound),
	{ ssr: false }
);

const CheckoutRuntime = dynamic(
	() => import('@/core/checkout').then((m) => m.CheckoutRuntime),
	{ ssr: false, loading: () => <FullPageLoader /> }
);

interface CheckoutPageClientProps {
	checkoutId: string;
	isSandbox: boolean;
}

function isHexColor(value: string): boolean {
	return /^#([0-9A-Fa-f]{3}){1,2}$/.test(value);
}

function parsePreviewColorMode(value: string | null): CheckoutColorMode | null {
	if (value === 'Single') return 'Single';
	if (value === 'Gradient') return 'Gradient';
	return null;
}

function resolvePreviewUrl(value: string | null): string | null {
	if (!value) return null;
	if (value === '__empty__') return null;
	return value;
}

function applyPreviewOverrides(checkout: CheckoutData, searchParams: URLSearchParams): CheckoutData {
	if (searchParams.get('previewMode') !== '1') {
		return checkout;
	}

	const previewPrimaryColor = searchParams.get('previewPrimaryColor');
	const previewSecondaryColor = searchParams.get('previewSecondaryColor');
	const previewColorMode = parsePreviewColorMode(searchParams.get('previewColorMode'));
	const previewLogoUrl = resolvePreviewUrl(searchParams.get('previewLogoUrl'));
	const previewBackgroundImageUrl = resolvePreviewUrl(searchParams.get('previewBackgroundImageUrl'));
	const previewFaviconUrl = resolvePreviewUrl(searchParams.get('previewFaviconUrl'));

	const nextConfig = {
		...checkout.config,
		primaryColor:
			previewPrimaryColor && isHexColor(previewPrimaryColor)
				? previewPrimaryColor.toUpperCase()
				: checkout.config.primaryColor,
		secondaryColor:
			previewSecondaryColor && isHexColor(previewSecondaryColor)
				? previewSecondaryColor.toUpperCase()
				: checkout.config.secondaryColor,
		colorMode: previewColorMode ?? checkout.config.colorMode,
		logoUrl: previewLogoUrl,
		backgroundImageUrl: previewBackgroundImageUrl,
		faviconUrl: previewFaviconUrl,
	};

	return {
		...checkout,
		config: nextConfig,
	};
}

export function CheckoutPageClient({ checkoutId, isSandbox }: CheckoutPageClientProps) {
	const searchParams = useSearchParams();
	const [isLoading, setIsLoading] = useState(true);
	const [checkout, setCheckout] = useState<CheckoutData | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [errorType, setErrorType] = useState<CheckoutErrorType>(null);

	useEffect(() => {
		let cancelled = false;

		async function loadCheckout() {
			const response = await getCheckoutClient(checkoutId);
			if (cancelled) return;

			setCheckout(response.checkout);
			setError(response.error);
			setErrorType(response.errorType);
			setIsLoading(false);
		}

		void loadCheckout();

		return () => {
			cancelled = true;
		};
	}, [checkoutId, isSandbox]);

	if (isLoading) {
		return <FullPageLoader />;
	}

	if (!checkout || error) {
		return <CheckoutNotFound message={error ?? undefined} errorType={errorType ?? undefined} />;
	}

	const checkoutWithPreview = applyPreviewOverrides(checkout, searchParams);

	return <CheckoutRuntime checkout={checkoutWithPreview} isSandbox={isSandbox} initialCalculation={null} />;
}
