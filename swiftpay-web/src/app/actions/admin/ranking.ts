"use server";

import client from "@/clients/client";
import type { ApiResponse } from "@/types/common";
import type { AdminAcquirerRankingData, AdminReadAcquirerRankingRequest } from "@/types/admin/ranking";

export async function adminGetAcquirerRanking(
	params?: AdminReadAcquirerRankingRequest
): Promise<ApiResponse<AdminAcquirerRankingData>> {
	const queryParams = {
		operationTypes: params?.operationTypes?.join(','),
	};

	const response = await client.get<ApiResponse<AdminAcquirerRankingData>>(
		"/v1/admin/ranking/acquirers",
		{ params: queryParams }
	);
	return response?.data;
}

export async function adminTriggerRankingReprocess(): Promise<ApiResponse<null>> {
	const response = await client.post<ApiResponse<null>>("/v1/admin/ranking/reprocess");
	return response?.data;
}
