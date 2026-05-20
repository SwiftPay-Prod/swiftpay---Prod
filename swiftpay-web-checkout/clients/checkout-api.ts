'use client';

import browserClient from '@/clients/browser-client';
import type {
	CheckoutData,
	ValidatedCoupon,
	ApiResponse,
	CreateOrderRequest,
	OrderData,
	CalculateCheckoutRequest,
	CalculatedCheckout,
	GetOrderData,
	ReserveOrderRequest,
	ReservedOrderData,
	UpdateOrderRequest,
	UpdateOrderData,
} from '@/types/checkout';

export type CheckoutErrorType = 'not_found' | 'expired' | 'api_error' | null;

export interface GetCheckoutResult {
	checkout: CheckoutData | null;
	error: string | null;
	errorType: CheckoutErrorType;
}

export async function getCheckoutClient(checkoutId: string): Promise<GetCheckoutResult> {
	try {
		const response = await browserClient.get<ApiResponse<CheckoutData>>(`/v1/checkouts/${checkoutId}`);
		const status = response?.status ?? 0;
		const data = response?.data;

		if (!data) {
			return { checkout: null, error: 'Erro de conexao com o servidor', errorType: 'api_error' };
		}

		if (status === 404) {
			return { checkout: null, error: 'Checkout nao encontrado', errorType: 'not_found' };
		}

		if (status !== 200) {
			return { checkout: null, error: data?.error?.message ?? 'Erro ao carregar checkout', errorType: 'api_error' };
		}

		if (data.error) {
			return { checkout: null, error: data.error.message, errorType: 'api_error' };
		}

		if (!data.data) {
			return { checkout: null, error: 'Checkout nao encontrado', errorType: 'not_found' };
		}

		if (data.data.isExpired) {
			return {
				checkout: data.data,
				error: data.data.expirationReason || 'Este checkout expirou',
				errorType: 'expired',
			};
		}

		if (data.data.status !== 'Active') {
			return {
				checkout: null,
				error: 'Este checkout nao esta disponivel no momento',
				errorType: 'not_found',
			};
		}

		return { checkout: data.data, error: null, errorType: null };
	} catch {
		return { checkout: null, error: 'Erro de conexao com o servidor', errorType: 'api_error' };
	}
}

export async function validateCouponClient(checkoutId: string, couponCode: string): Promise<ApiResponse<ValidatedCoupon>> {
	const response = await browserClient.post<ApiResponse<ValidatedCoupon>>(`/v1/checkouts/${checkoutId}/validate-coupon`, {
		couponCode,
	});
	return response?.data ?? { data: null, message: null, error: { message: 'Cupom invalido ou expirado' } };
}

export async function createOrderClient(checkoutId: string, request: CreateOrderRequest): Promise<ApiResponse<OrderData>> {
	const response = await browserClient.post<ApiResponse<OrderData>>(`/v1/checkouts/${checkoutId}/orders`, request);
	return response?.data ?? { data: null, message: null, error: { message: 'Erro ao criar pedido' } };
}

export async function calculateCheckoutClient(
	checkoutId: string,
	request: CalculateCheckoutRequest,
	signal?: AbortSignal
): Promise<ApiResponse<CalculatedCheckout>> {
	const response = await browserClient.post<ApiResponse<CalculatedCheckout>>(`/v1/checkouts/${checkoutId}/calculate`, request, { signal });
	return response?.data ?? { data: null, message: null, error: { message: 'Erro ao calcular valores' } };
}

export async function getOrderClient(checkoutId: string, orderId: string): Promise<ApiResponse<GetOrderData>> {
	const response = await browserClient.get<ApiResponse<GetOrderData>>(`/v1/checkouts/${checkoutId}/orders/${orderId}`);
	return response?.data ?? { data: null, message: null, error: { message: 'Erro ao recuperar pedido' } };
}

export async function reserveOrderClient(
	checkoutId: string,
	request: ReserveOrderRequest
): Promise<ApiResponse<ReservedOrderData>> {
	const response = await browserClient.post<ApiResponse<ReservedOrderData>>(`/v1/checkouts/${checkoutId}/orders/reserve`, request);
	return response?.data ?? { data: null, message: null, error: { message: 'Erro ao reservar produtos' } };
}

export async function reactivateOrderClient(checkoutId: string, orderId: string): Promise<ApiResponse<ReservedOrderData>> {
	const response = await browserClient.post<ApiResponse<ReservedOrderData>>(`/v1/checkouts/${checkoutId}/orders/${orderId}/reactivate`);
	return response?.data ?? { data: null, message: null, error: { message: 'Erro ao reativar pedido' } };
}

export async function updateOrderClient(
	checkoutId: string,
	orderId: string,
	request: UpdateOrderRequest
): Promise<ApiResponse<UpdateOrderData>> {
	const response = await browserClient.patch<ApiResponse<UpdateOrderData>>(`/v1/checkouts/${checkoutId}/orders/${orderId}`, request);
	return response?.data ?? { data: null, message: null, error: { message: 'Erro ao atualizar pedido' } };
}
