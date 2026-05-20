'use server';

import client from '@/clients/client';
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

export async function getCheckout(checkoutId: string): Promise<GetCheckoutResult> {
	try {
		const response = await client.get<ApiResponse<CheckoutData>>(`/v1/checkouts/${checkoutId}`);
		const status = response?.status ?? 0;

		if (status !== 200 && status !== 404) {
			return {
				checkout: null,
				error: 'Erro de conexão com o servidor',
				errorType: 'api_error',
			};
		}

		const data = response?.data as ApiResponse<CheckoutData> | undefined;

		if (!data) {
			return {
				checkout: null,
				error: 'Erro de conexão com o servidor',
				errorType: 'api_error',
			};
		}

		if (status === 404) {
			return {
				checkout: null,
				error: 'Checkout não encontrado',
				errorType: 'not_found',
			};
		}

		if (status !== 200) {
			const errorMessage = data?.error?.message || 'Erro ao carregar checkout';
			return {
				checkout: null,
				error: errorMessage,
				errorType: 'api_error',
			};
		}

		if (data.error) {
			return {
				checkout: null,
				error: data.error.message,
				errorType: 'api_error',
			};
		}

		if (!data.data) {
			return {
				checkout: null,
				error: 'Checkout não encontrado',
				errorType: 'not_found',
			};
		}

		if (data.data.status !== 'Active') {
			return {
				checkout: null,
				error: 'Este checkout não está disponível no momento',
				errorType: 'not_found',
			};
		}

		return {
			checkout: data.data,
			error: null,
			errorType: null,
		};
	} catch (error) {
		console.error('Error fetching checkout:', error);
		return {
			checkout: null,
			error: 'Erro de conexão com o servidor',
			errorType: 'api_error',
		};
	}
}

export async function validateCoupon(checkoutId: string, couponCode: string): Promise<ApiResponse<ValidatedCoupon>> {
	try {
		const response = await client.post<ApiResponse<ValidatedCoupon>>(`/v1/checkouts/${checkoutId}/validate-coupon`, {
			couponCode,
		});

		if (!response || !response.data) {
			return {
				data: null,
				message: null,
				error: { message: 'Erro de conexão com o servidor' },
			};
		}

		return response.data;
	} catch (error) {
		console.error('Error validating coupon:', error);
		return {
			data: null,
			message: null,
			error: { message: 'Cupom inválido ou expirado' },
		};
	}
}

export async function createOrder(checkoutId: string, request: CreateOrderRequest): Promise<ApiResponse<OrderData>> {
	try {
		const response = await client.post<ApiResponse<OrderData>>(`/v1/checkouts/${checkoutId}/orders`, request);

		if (!response || !response.data) {
			return {
				data: null,
				message: null,
				error: { message: 'Erro de conexão com o servidor' },
			};
		}

		return response.data;
	} catch (error) {
		console.error('Error creating order:', error);
		return {
			data: null,
			message: null,
			error: { message: 'Erro ao criar pedido' },
		};
	}
}

export async function calculateCheckout(
	checkoutId: string,
	request: CalculateCheckoutRequest
): Promise<ApiResponse<CalculatedCheckout>> {
	try {
		const response = await client.post<ApiResponse<CalculatedCheckout>>(
			`/v1/checkouts/${checkoutId}/calculate`,
			request
		);

		if (!response || !response.data) {
			return {
				data: null,
				message: null,
				error: { message: 'Erro de conexão com o servidor' },
			};
		}

		return response.data;
	} catch (error) {
		console.error('Error calculating checkout:', error);
		return {
			data: null,
			message: null,
			error: { message: 'Erro ao calcular valores' },
		};
	}
}

export async function getOrder(checkoutId: string, orderId: string): Promise<ApiResponse<GetOrderData>> {
	try {
		const response = await client.get<ApiResponse<GetOrderData>>(`/v1/checkouts/${checkoutId}/orders/${orderId}`);

		if (!response || !response.data) {
			return {
				data: null,
				message: null,
				error: { message: 'Erro de conexão com o servidor' },
			};
		}

		return response.data;
	} catch (error) {
		console.error('Error fetching order:', error);
		return {
			data: null,
			message: null,
			error: { message: 'Erro ao recuperar pedido' },
		};
	}
}

export async function reserveOrder(
	checkoutId: string,
	request: ReserveOrderRequest
): Promise<ApiResponse<ReservedOrderData>> {
	try {
		const response = await client.post<ApiResponse<ReservedOrderData>>(
			`/v1/checkouts/${checkoutId}/orders/reserve`,
			request
		);

		if (!response || !response.data) {
			return {
				data: null,
				message: null,
				error: { message: 'Erro de conexão com o servidor' },
			};
		}

		return response.data;
	} catch (error) {
		console.error('Error reserving order:', error);
		return {
			data: null,
			message: null,
			error: { message: 'Erro ao reservar produtos' },
		};
	}
}

export async function reactivateOrder(
	checkoutId: string,
	orderId: string
): Promise<ApiResponse<ReservedOrderData>> {
	try {
		const response = await client.post<ApiResponse<ReservedOrderData>>(
			`/v1/checkouts/${checkoutId}/orders/${orderId}/reactivate`
		);

		if (!response || !response.data) {
			return {
				data: null,
				message: null,
				error: { message: 'Erro de conexão com o servidor' },
			};
		}

		return response.data;
	} catch (error) {
		console.error('Error reactivating order:', error);
		return {
			data: null,
			message: null,
			error: { message: 'Erro ao reativar pedido' },
		};
	}
}

export async function updateOrder(
	checkoutId: string,
	orderId: string,
	request: UpdateOrderRequest
): Promise<ApiResponse<UpdateOrderData>> {
	try {
		const response = await client.patch<ApiResponse<UpdateOrderData>>(
			`/v1/checkouts/${checkoutId}/orders/${orderId}`,
			request
		);

		if (!response || !response.data) {
			return {
				data: null,
				message: null,
				error: { message: 'Erro de conexão com o servidor' },
			};
		}

		return response.data;
	} catch (error) {
		console.error('Error updating order:', error);
		return {
			data: null,
			message: null,
			error: { message: 'Erro ao atualizar pedido' },
		};
	}
}
