export const DEFAULT_DOCS_URL = 'https://swift-pay.top/docs';

export const USEFUL_LINKS = {
	supportPhone: '+55 11 9 3481-9868',
	supportWhatsAppNumber: '5511934819868',
	supportEmail: 'suporte@swiftpay.com.br',
	instagramUrl: 'https://instagram.com/swiftpay_pay',
	discordUrl: 'https://discord.gg/7e9BZB5qhG',
	telegramGroupUrl: 'https://t.me/swiftpay',
	docsDescription: 'Guias, tutoriais e referência da API.',
	docsActionLabel: 'Acessar docs',
} as const;

function normalizeBaseUrl(url: string): string {
	return url.endsWith('/') ? url.slice(0, -1) : url;
}

export function resolveDocsUrl(docsUrl?: string | null): string {
	return normalizeBaseUrl(docsUrl || DEFAULT_DOCS_URL);
}

export function resolvePushNotificationsDocsUrl(docsUrl?: string | null): string {
	return `${resolveDocsUrl(docsUrl)}/push-notifications`;
}

export function resolveWhatsAppSupportUrl(message: string): string {
	const encodedMessage = encodeURIComponent(message);
	return `https://wa.me/${USEFUL_LINKS.supportWhatsAppNumber}?text=${encodedMessage}`;
}