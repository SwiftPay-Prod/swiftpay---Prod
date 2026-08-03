'use server';

import client from '@/clients/client';
import type { ApiResponse, PaymentLinkData } from '@/types/checkout';
import type { PaymentMethod } from '@/types/enums';
import { isGuid } from '@/utils';

export type PaymentLinkErrorType = 'not_found' | 'expired' | 'api_error' | null;

export interface GetPaymentLinkResult {
	paymentLink: PaymentLinkData | null;
	error: string | null;
	errorType: PaymentLinkErrorType;
}

export async function getPaymentLink(token: string): Promise<GetPaymentLinkResult> {
	try {
		const response = await client.get<ApiResponse<PaymentLinkData>>(`/v1/payment-links/${token}`);

		if (!response || !response.data) {
			return {
				paymentLink: null,
				error: 'Erro de conexão com o servidor',
				errorType: 'api_error',
			};
		}

		if (response.status === 404) {
			return {
				paymentLink: null,
				error: response.data.error?.message || 'Link de pagamento não encontrado',
				errorType: 'not_found',
			};
		}

		if (response.status === 410) {
			return {
				paymentLink: null,
				error: response.data.error?.message || 'Este link de pagamento expirou',
				errorType: 'expired',
			};
		}

		if (!response.data.data) {
			return {
				paymentLink: null,
				error: response.data.error?.message || 'Erro ao carregar link de pagamento',
				errorType: 'api_error',
			};
		}

		return {
			paymentLink: response.data.data,
			error: null,
			errorType: null,
		};
	} catch {
		return {
			paymentLink: null,
			error: 'Erro ao conectar com o servidor',
			errorType: 'api_error',
		};
	}
}

export async function getPaymentLinkByPaymentId(paymentId: string): Promise<GetPaymentLinkResult> {
	if (!isGuid(paymentId)) {
		return {
			paymentLink: null,
			error: 'Identificador de pagamento inválido',
			errorType: 'not_found',
		};
	}

	try {
		const response = await client.get<ApiResponse<PaymentLinkData>>(`/v1/payment-links/payments/${paymentId}`);

		if (!response || !response.data) {
			return {
				paymentLink: null,
				error: 'Erro de conexão com o servidor',
				errorType: 'api_error',
			};
		}

		if (response.status === 404) {
			return {
				paymentLink: null,
				error: response.data.error?.message || 'Pagamento não encontrado',
				errorType: 'not_found',
			};
		}

		if (response.status === 410) {
			return {
				paymentLink: null,
				error: response.data.error?.message || 'Este pagamento expirou',
				errorType: 'expired',
			};
		}

		if (!response.data.data) {
			return {
				paymentLink: null,
				error: response.data.error?.message || 'Erro ao carregar pagamento',
				errorType: 'api_error',
			};
		}

		return {
			paymentLink: response.data.data,
			error: null,
			errorType: null,
		};
	} catch {
		return {
			paymentLink: null,
			error: 'Erro ao conectar com o servidor',
			errorType: 'api_error',
		};
	}
}

export async function getPaymentLinkStatus(token: string): Promise<{ status: string | null; error: string | null }> {
	try {
		const response = await client.get<ApiResponse<PaymentLinkData>>(`/v1/payment-links/${token}`);

		if (!response?.data?.data) {
			return { status: null, error: 'Erro ao verificar status' };
		}

		return { status: response.data.data.status, error: null };
	} catch {
		return { status: null, error: 'Erro ao verificar status' };
	}
}

export async function getPaymentLinkSessionStatus(
	token: string,
	paymentId: string
): Promise<{ status: string | null; error: string | null }> {
	try {
		const response = await client.get<ApiResponse<{ status: string; completedAt: string | null }>>(
			`/v1/payment-links/${token}/payments/${paymentId}/status`
		);

		if (!response?.data?.data) {
			return { status: null, error: 'Erro ao verificar status da sessão' };
		}

		return { status: response.data.data.status, error: null };
	} catch {
		return { status: null, error: 'Erro ao verificar status da sessão' };
	}
}

export interface StartPaymentLinkInput {
	method: PaymentMethod;
	buyerName?: string;
	buyerEmail?: string;
	buyerPhone?: string;
	cardNumber?: string;
	cardHolderName?: string;
	cardExpirationMonth?: number;
	cardExpirationYear?: number;
	installments?: number;
	cardCvv?: string;
}

export async function startPaymentLink(
	token: string,
	input: StartPaymentLinkInput
): Promise<{ paymentLink: PaymentLinkData | null; error: string | null }> {
	try {
		const response = await client.post<ApiResponse<PaymentLinkData>>(`/v1/payment-links/${token}/start`, {
			method: input.method,
			buyerName: input.buyerName || undefined,
			buyerEmail: input.buyerEmail || undefined,
			buyerPhone: input.buyerPhone || undefined,
			cardNumber: input.cardNumber || undefined,
			cardHolderName: input.cardHolderName || undefined,
			cardExpirationMonth: input.cardExpirationMonth || undefined,
			cardExpirationYear: input.cardExpirationYear || undefined,
			installments: input.installments || undefined,
			cardCvv: input.cardCvv || undefined,
		});

		if (!response?.data?.data) {
			return {
				paymentLink: null,
				error: response?.data?.error?.message ?? 'Não foi possível iniciar o pagamento.',
			};
		}

		return {
			paymentLink: response.data.data,
			error: null,
		};
	} catch {
		return {
			paymentLink: null,
			error: 'Erro ao iniciar pagamento.',
		};
	}
}
