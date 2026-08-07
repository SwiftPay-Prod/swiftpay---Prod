'use server';

import client from '@/clients/client';
import type {
	CashoutDetailData,
	CashoutListItem,
	CashoutsFilters,
	CreateCashoutData,
	PreviewCashoutRequest,
	PreviewCashoutData,
} from '@/types/merchant/cashouts';
import type { ApiResponse, Paginated } from '@/types/common';

export async function listCashouts(
	merchantId: string,
	filters?: CashoutsFilters
): Promise<ApiResponse<Paginated<CashoutListItem>>> {
	const params = new URLSearchParams();

	if (filters?.status) {
		params.set('status', filters.status);
	}

	if (filters?.search) {
		params.set('search', filters.search);
	}

	if (filters?.payoutAccountId) {
		params.set('payoutAccountId', filters.payoutAccountId);
	}

	if (filters?.startDate) {
		params.set('startDate', filters.startDate);
	}

	if (filters?.endDate) {
		params.set('endDate', filters.endDate);
	}

	if (filters?.page) {
		params.set('page', String(filters.page));
	}

	if (filters?.pageSize) {
		params.set('pageSize', String(filters.pageSize));
	}

	if (filters?.sortBy) {
		params.set('sortBy', filters.sortBy);
	}

	if (filters?.sortOrder) {
		params.set('sortOrder', filters.sortOrder);
	}

	const queryString = params.toString();
	const url = `/v1/merchant/${merchantId}/cashouts${queryString ? `?${queryString}` : ''}`;

	const response = await client.get<ApiResponse<Paginated<CashoutListItem>>>(url);
	return response?.data;
}

export async function getCashout(
	merchantId: string,
	cashoutId: string
): Promise<ApiResponse<CashoutDetailData>> {
	const response = await client.get<ApiResponse<CashoutDetailData>>(
		`/v1/merchant/${merchantId}/cashouts/${cashoutId}`
	);
	return response?.data;
}

export async function createCashout(
	merchantId: string,
	amount: number,
	payoutAccountId?: string | null,
	merchantAcquirerId?: string | null,
	consolidateAllAcquirers?: boolean
): Promise<ApiResponse<CreateCashoutData>> {
	const response = await client.post<ApiResponse<CreateCashoutData>>(
		`/v1/merchant/${merchantId}/cashouts`,
		{
			amount,
			payoutAccountId: payoutAccountId || undefined,
			merchantAcquirerId: merchantAcquirerId || undefined,
			consolidateAllAcquirers: consolidateAllAcquirers || undefined,
		}
	);
	return response?.data;
}

export async function cancelCashout(
	merchantId: string,
	cashoutId: string
): Promise<ApiResponse<null>> {
	const response = await client.post<ApiResponse<null>>(
		`/v1/merchant/${merchantId}/cashouts/${cashoutId}/cancel`,
		{}
	);
	return response?.data;
}


export async function previewCashout(
	merchantId: string,
	data: PreviewCashoutRequest
): Promise<ApiResponse<PreviewCashoutData>> {
	const response = await client.post<ApiResponse<PreviewCashoutData>>(
		`/v1/merchant/${merchantId}/cashouts/preview`,
		data
	);
	return response?.data;
}
