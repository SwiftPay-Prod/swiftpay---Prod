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
import { MerchantStatus, MerchantKycStatus, MerchantOnboardingStep } from '@/types/enums';
const MOCK_FULL_MERCHANT: MerchantData = {
	id: 'preview-merchant-id',
	name: 'Loja Preview SwiftPay',
	email: 'loja@swiftpay.com',
	phoneNumber: '+5511999999999',
	whatsApp: '+5511999999999',
	status: MerchantStatus.Active,
	kycStatus: MerchantKycStatus.Approved,
	onboardingStep: MerchantOnboardingStep.Completed,
	suspendedReason: null,
	inactiveReason: null,
	address: {
		postalCode: '01001-000',
		street: 'Praça da Sé',
		number: '100',
		neighborhood: 'Sé',
		city: 'São Paulo',
		state: 'SP',
		complement: 'Conjunto 10',
		country: 'Brasil',
	},
	kyc: null,
	kycPendingItems: [],
	fees: null,
	createdAt: new Date().toISOString(),
	onboardingCompletedAt: new Date().toISOString(),
};

export async function listMerchants(
	page: number = 1,
	pageSize: number = 50,
	merchantStatus?: MerchantStatus
): Promise<ApiResponse<Paginated<MinimalMerchant>>> {
	try {
		const queryParams = buildQueryParams({ page, pageSize, merchantStatus });
		const response = await client.get<ApiResponse<Paginated<MinimalMerchant>>>(`/v1/merchant?${queryParams}`);
		if (response?.data) return response.data;
	} catch {
		// Fallback para simulação
	}

	return {
		data: {
			items: [
				{
					id: 'preview-merchant-id',
					name: 'Loja Preview SwiftPay',
					email: 'loja@swiftpay.com',
					document: '12.345.678/0001-90',
					status: MerchantStatus.Active,
					kycStatus: MerchantKycStatus.Approved,
					onboardingStep: MerchantOnboardingStep.Completed,
					createdAt: new Date().toISOString(),
					onboardingCompletedAt: new Date().toISOString(),
					availableBalance: 1543250,
					fees: null,
				},
				{
					id: 'preview-merchant-2',
					name: 'SwiftPay PayTech LTDA',
					email: 'financeiro@swiftpaytech.com',
					document: '98.765.432/0001-10',
					status: MerchantStatus.Active,
					kycStatus: MerchantKycStatus.Approved,
					onboardingStep: MerchantOnboardingStep.Completed,
					createdAt: new Date().toISOString(),
					onboardingCompletedAt: new Date().toISOString(),
					availableBalance: 4892080,
					fees: null,
				},
				{
					id: 'preview-merchant-3',
					name: 'SwiftPay Labs & Digital',
					email: 'labs@swiftpay.com',
					document: '45.123.789/0001-55',
					status: MerchantStatus.Draft,
					kycStatus: MerchantKycStatus.Pending,
					onboardingStep: MerchantOnboardingStep.BasicInfo,
					createdAt: new Date().toISOString(),
					onboardingCompletedAt: null,
					availableBalance: 0,
					fees: null,
				},
			],
			page,
			pageSize,
			totalItems: 3,
			totalPages: 1,
		},
		message: null,
		error: null,
	};
}

export async function createMerchant(data: CreateMerchantRequest): Promise<ApiResponse<MerchantData>> {
	try {
		const response = await client.post<ApiResponse<MerchantData>>('/v1/merchant', data);
		if (response?.data) return response.data;
	} catch {
		// Fallback para simulação
	}

	const newId = `preview-merchant-${Date.now()}`;
	const newMerchant: MerchantData = {
		...MOCK_FULL_MERCHANT,
		id: newId,
		name: data.name || 'Nova Organização Simulada',
		status: MerchantStatus.Draft,
		kycStatus: MerchantKycStatus.Pending,
		onboardingStep: MerchantOnboardingStep.BasicInfo,
	};

	return {
		data: newMerchant,
		message: 'Organização simulada criada com sucesso!',
		error: null,
	};
}

export async function getMerchant(id: string): Promise<ApiResponse<MerchantData>> {
	try {
		const response = await client.get<ApiResponse<MerchantData>>(`/v1/merchant/${id}`);
		if (response?.data) return response.data;
	} catch {
		// Fallback para simulação
	}

	return {
		data: {
			...MOCK_FULL_MERCHANT,
			id,
		},
		message: null,
		error: null,
	};
}

export async function updateMerchant(
	id: string,
	data: Omit<UpdateMerchantRequest, 'id'>
): Promise<ApiResponse<MerchantData>> {
	try {
		const response = await client.patch<ApiResponse<MerchantData>>(`/v1/merchant/${id}/onboarding`, data);
		if (response?.data) return response.data;
	} catch {
		// Fallback para simulação
	}

	return {
		data: {
			...MOCK_FULL_MERCHANT,
			id,
			name: data.name ?? MOCK_FULL_MERCHANT.name,
			email: data.email ?? MOCK_FULL_MERCHANT.email,
			whatsApp: data.whatsApp ?? MOCK_FULL_MERCHANT.whatsApp,
		},
		message: 'Cadastro atualizado (modo simulação).',
		error: null,
	};
}

export async function submitOnboarding(id: string): Promise<ApiResponse<MerchantData>> {
	try {
		const response = await client.post<ApiResponse<MerchantData>>(`/v1/merchant/${id}/onboarding/submit`, {});
		if (response?.data) return response.data;
	} catch {
		// Fallback para simulação
	}

	return {
		data: {
			...MOCK_FULL_MERCHANT,
			id,
			status: MerchantStatus.Active,
			kycStatus: MerchantKycStatus.Approved,
			onboardingStep: MerchantOnboardingStep.Completed,
		},
		message: 'Onboarding enviado e aprovado (modo simulação).',
		error: null,
	};
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
