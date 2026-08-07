'use server';

import client from '@/clients/client';
import type {
	ListCashoutAccountsData,
	CashoutAccountsFilters,
	CreateCashoutAccountRequest,
	CashoutAccountData,
	RequestCashoutAccountActionData,
	ViewCashoutAccountData,
} from '@/types/merchant/cashout-accounts';
import { PayoutAccountActionType, PayoutAccountStatus, PixKeyType } from '@/types/enums';
import type { ApiResponse } from '@/types/common';

export async function listCashoutAccounts(
	merchantId: string,
	filters?: CashoutAccountsFilters
): Promise<ApiResponse<ListCashoutAccountsData>> {
	if (merchantId.startsWith('preview-merchant') || merchantId === 'preview-merchant-id') {
		return {
			data: {
				items: [
					{
						id: 'acc_1',
						pixKeyType: PixKeyType.Cnpj,
						pixKey: '12.345.678/0001-90',
						holderName: 'SwiftPay Ltda',
						bankName: 'Banco Itaú',
						status: PayoutAccountStatus.Active,
						isDefault: true,
						createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
					},
				],
				totalItems: 1,
			},
			message: null,
			error: null,
		};
	}

	const params = new URLSearchParams();

	if (filters?.statuses && filters.statuses.length > 0) {
		filters.statuses.forEach((status) => {
			params.append('statuses', status);
		});
	} else {
		params.append('statuses', PayoutAccountStatus.Active);
		params.append('statuses', PayoutAccountStatus.Pending);
	}

	const queryString = params.toString();
	const url = `/v1/merchant/${merchantId}/cashout-accounts${queryString ? `?${queryString}` : ''}`;

	const response = await client.get<ApiResponse<ListCashoutAccountsData>>(url);
	return response?.data;
}

export async function createCashoutAccount(
	merchantId: string,
	data: Omit<CreateCashoutAccountRequest, 'merchantId'>
): Promise<ApiResponse<CashoutAccountData>> {
	const response = await client.post<ApiResponse<CashoutAccountData>>(`/v1/merchant/${merchantId}/cashout-accounts`, data);
	return response?.data;
}

export async function verifyCashoutAccount(
	merchantId: string,
	accountId: string,
	code: string
): Promise<ApiResponse<CashoutAccountData>> {
	const response = await client.post<ApiResponse<CashoutAccountData>>(
		`/v1/merchant/${merchantId}/cashout-accounts/${accountId}/verify`,
		{ code }
	);
	return response?.data;
}

export async function resendVerificationCode(
	merchantId: string,
	accountId: string
): Promise<ApiResponse<null>> {
	const response = await client.post<ApiResponse<null>>(
		`/v1/merchant/${merchantId}/cashout-accounts/${accountId}/resend-code`,
		{}
	);
	return response?.data;
}

export async function requestCashoutAccountAction(
	merchantId: string,
	accountId: string,
	actionType: PayoutAccountActionType
): Promise<ApiResponse<RequestCashoutAccountActionData>> {
	const response = await client.post<ApiResponse<RequestCashoutAccountActionData>>(
		`/v1/merchant/${merchantId}/cashout-accounts/${accountId}/request-action`,
		{ actionType }
	);
	return response?.data;
}

export async function setDefaultCashoutAccount(
	merchantId: string,
	accountId: string,
	code: string
): Promise<ApiResponse<CashoutAccountData>> {
	const response = await client.patch<ApiResponse<CashoutAccountData>>(
		`/v1/merchant/${merchantId}/cashout-accounts/${accountId}/set-default`,
		{ code }
	);
	return response?.data;
}

export async function deleteCashoutAccount(
	merchantId: string,
	accountId: string,
	code: string
): Promise<ApiResponse<null>> {
	const response = await client.post<ApiResponse<null>>(
		`/v1/merchant/${merchantId}/cashout-accounts/${accountId}/delete`,
		{ code }
	);
	return response?.data;
}

export async function viewCashoutAccount(
	merchantId: string,
	accountId: string,
	code: string
): Promise<ApiResponse<ViewCashoutAccountData>> {
	const response = await client.post<ApiResponse<ViewCashoutAccountData>>(
		`/v1/merchant/${merchantId}/cashout-accounts/${accountId}/view`,
		{ code }
	);
	return response?.data;
}
