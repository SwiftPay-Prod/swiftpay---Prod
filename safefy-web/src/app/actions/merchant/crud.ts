'use server';

import client from '@/clients/client';
import { buildQueryParams } from '@/clients/client-utils';
import {
	clearSelectedMerchant as clearSelectedMerchantCookie,
	setSelectedMerchant as setSelectedMerchantCookie,
} from '@/auth/session';
import type {
	CreateMerchantRequest,
	MerchantData,
	UpdateMerchantRequest,
	MinimalMerchant,
} from '@/types/merchant/crud';
import type { ApiResponse, Paginated } from '@/types/common';
import { MerchantStatus } from '@/types/enums';

export async function listMerchants(
	page: number = 1,
	pageSize: number = 50,
	merchantStatus?: MerchantStatus
): Promise<ApiResponse<Paginated<MinimalMerchant>>> {
	const queryParams = buildQueryParams({ page, pageSize, merchantStatus });
	const response = await client.get<ApiResponse<Paginated<MinimalMerchant>>>(`/v1/merchant?${queryParams}`);
	return response?.data;
}

export async function createMerchant(data: CreateMerchantRequest): Promise<ApiResponse<MerchantData>> {
	const response = await client.post<ApiResponse<MerchantData>>('/v1/merchant', data);

	return response?.data;
}

export async function getMerchant(id: string): Promise<ApiResponse<MerchantData>> {
	const response = await client.get<ApiResponse<MerchantData>>(`/v1/merchant/${id}`);
	return response?.data;
}

export async function updateMerchant(
	id: string,
	data: Omit<UpdateMerchantRequest, 'id'>
): Promise<ApiResponse<MerchantData>> {
	const response = await client.patch<ApiResponse<MerchantData>>(`/v1/merchant/${id}/onboarding`, data);
	return response?.data;
}

export async function submitOnboarding(id: string): Promise<ApiResponse<MerchantData>> {
	const response = await client.post<ApiResponse<MerchantData>>(`/v1/merchant/${id}/onboarding/submit`, {});
	return response?.data;
}

export async function requestDeleteMerchant(merchantId: string): Promise<ApiResponse<null>> {
	const response = await client.post<ApiResponse<null>>(`/v1/merchant/${merchantId}/request-delete`, {});
	return response?.data;
}

export async function confirmDeleteMerchant(merchantId: string, code: string): Promise<ApiResponse<null>> {
	const response = await client.post<ApiResponse<null>>(`/v1/merchant/${merchantId}/confirm-delete`, {
		code,
	});
	return response?.data;
}

export async function selectMerchant(merchant: MinimalMerchant | null): Promise<ApiResponse<MinimalMerchant | null>> {
	try {
		if (!merchant) {
			await clearSelectedMerchantCookie();
			await client.patch('/v1/session', { selectedMerchantId: null });

			return {
				data: null,
				message: null,
				error: null,
			};
		}

		if (!merchant.id) {
			return {
				data: null,
				message: null,
				error: { message: 'Merchant é obrigatório' },
			};
		}

		await setSelectedMerchantCookie(merchant);
		
		await client.patch('/v1/session', { selectedMerchantId: merchant.id });

		return {
			data: merchant,
			message: null,
			error: null,
		};
	} catch (error) {
		console.error('Error selecting merchant:', error);
		return {
			data: null,
			message: null,
			error: { message: 'Erro ao selecionar organização' },
		};
	}
}

export interface RespondKycPendingItemRequest {
	merchantId: string;
	itemId: string;
	response: string;
}

export interface RespondKycPendingItemResponse {
	message: string | null;
	error: { message: string | null } | null;
}

export async function respondKycPendingItem(
	merchantId: string,
	itemId: string,
	response: string
): Promise<RespondKycPendingItemResponse> {
	const result = await client.post<RespondKycPendingItemResponse>(
		`/v1/merchant/${merchantId}/pending-items/${itemId}/respond`,
		{ response }
	);
	return result?.data;
}
