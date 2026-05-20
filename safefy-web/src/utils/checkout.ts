export function getCheckoutUrl(shortId: string, baseUrl?: string): string {
	const checkoutBaseUrl = baseUrl || 'https://checkout.safefypay.com.br';
	return `${checkoutBaseUrl}/${shortId}`;
}

