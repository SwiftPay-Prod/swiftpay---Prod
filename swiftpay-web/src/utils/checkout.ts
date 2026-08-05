export function getCheckoutUrl(shortId: string, baseUrl?: string): string {
	const checkoutBaseUrl = baseUrl || 'https://swift-pay.top/checkout';
	return `${checkoutBaseUrl}/${shortId}`;
}

