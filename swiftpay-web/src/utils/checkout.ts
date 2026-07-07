export function getCheckoutUrl(shortId: string, baseUrl?: string): string {
	const checkoutBaseUrl = baseUrl || 'https://checkout.swiftpay.com.br';
	return `${checkoutBaseUrl}/${shortId}`;
}

