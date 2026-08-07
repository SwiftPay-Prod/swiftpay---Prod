export function getCheckoutUrl(shortId: string, baseUrl?: string): string {
	const checkoutBaseUrl = baseUrl || 'https://swiftpayment.info/checkout';
	return `${checkoutBaseUrl}/${shortId}`;
}

