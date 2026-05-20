'use server';

import client from '@/clients/client';
import type { ApiResponse } from '@/types/common';
import type {
	ReadMerchantIntegrationsData,
	UpdateMerchantIntegrationData,
	UpdateMerchantIntegrationRequest,
	MerchantIntegrationProvider,
} from '@/types/merchant/integrations';

export async function getMerchantIntegrations(merchantId: string): Promise<ApiResponse<ReadMerchantIntegrationsData>> {
	const response = await client.get<ApiResponse<ReadMerchantIntegrationsData>>(
		`/v1/merchant/${merchantId}/integrations`
	);
	return response?.data;
}

export async function updateMerchantIntegration(
	merchantId: string,
	provider: MerchantIntegrationProvider,
	data: UpdateMerchantIntegrationRequest
): Promise<ApiResponse<UpdateMerchantIntegrationData>> {
	const response = await client.patch<ApiResponse<UpdateMerchantIntegrationData>>(
		`/v1/merchant/${merchantId}/integrations/${provider}`,
		{
			provider,
			...data,
		}
	);
	return response?.data;
}
