'use server';

import client from '@/clients/client';
import type {
	CashoutDetailData,
	CashoutListItem,
	CashoutsFilters,
	CreateCashoutData,
	SimulateCashoutData,
	PreviewCashoutRequest,
	PreviewCashoutData,
} from '@/types/merchant/cashouts';
import type { ApiResponse, Paginated } from '@/types/common';
import { PayoutStatus, PixKeyType, SimulateCashoutAction } from '@/types/enums';

const MOCK_CASHOUTS: CashoutListItem[] = [
	{
		id: 'csh_9a8b7c6d5e4f',
		amount: 1500000,
		feeAmount: 350,
		netAmount: 1499650,
		status: PayoutStatus.Completed,
		pixEndToEndId: 'E12345678202608061200abcde',
		failureReason: null,
		requestedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
		processedAt: new Date(Date.now() - 3600000 * 1.8).toISOString(),
		completedAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
		payoutAccount: {
			id: 'acc_1',
			pixKeyType: PixKeyType.Cnpj,
			pixKey: '12.345.678/0001-90',
		},
	},
	{
		id: 'csh_8b7c6d5e4f3a',
		amount: 845000,
		feeAmount: 350,
		netAmount: 844650,
		status: PayoutStatus.Processing,
		pixEndToEndId: null,
		failureReason: null,
		requestedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
		processedAt: null,
		completedAt: null,
		payoutAccount: {
			id: 'acc_1',
			pixKeyType: PixKeyType.Cnpj,
			pixKey: '12.345.678/0001-90',
		},
	},
	{
		id: 'csh_7c6d5e4f3a2b',
		amount: 320000,
		feeAmount: 350,
		netAmount: 319650,
		status: PayoutStatus.Completed,
		pixEndToEndId: 'E98765432202608051400xyz',
		failureReason: null,
		requestedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
		processedAt: new Date(Date.now() - 86400000 * 2 + 600000).toISOString(),
		completedAt: new Date(Date.now() - 86400000 * 2 + 1800000).toISOString(),
		payoutAccount: {
			id: 'acc_2',
			pixKeyType: PixKeyType.Email,
			pixKey: 'financeiro@swiftpay.com',
		},
	},
];
export async function listCashouts(
	merchantId: string,
	filters?: CashoutsFilters
): Promise<ApiResponse<Paginated<CashoutListItem>>> {
	if (merchantId.startsWith('preview-merchant') || merchantId === 'preview-merchant-id') {
		return {
			data: {
				items: MOCK_CASHOUTS,
				totalItems: MOCK_CASHOUTS.length,
				page: 1,
				pageSize: 10,
				totalPages: 1,
			},
			message: null,
			error: null,
		};
	}

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

export async function simulateCashout(
	merchantId: string,
	cashoutId: string,
	action: SimulateCashoutAction
): Promise<ApiResponse<SimulateCashoutData>> {
	const response = await client.post<ApiResponse<SimulateCashoutData>>(
		`/v1/merchant/${merchantId}/cashouts/${cashoutId}/simulate`,
		{ action }
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
