"use server";

import client from "@/clients/client";
import type {
	AdminPlatformPayoutAccountData,
	AdminCreatePlatformPayoutAccountRequest,
	AdminUpdatePlatformPayoutAccountRequest,
	AdminListPlatformPayoutAccountsRequest,
	AdminPlatformPayoutData,
	AdminListPlatformPayoutsRequest,
	AdminPreviewPlatformPayoutRequest,
	AdminPreviewPlatformPayoutData,
	AdminCreatePlatformPayoutRequest,
} from "@/types/admin/platform-payouts";
import type { ApiResponse, BaseResponse, Paginated } from "@/types/common";

export async function adminListPlatformPayoutAccounts(
	params?: AdminListPlatformPayoutAccountsRequest
): Promise<ApiResponse<Paginated<AdminPlatformPayoutAccountData>>> {
	const response = await client.get<ApiResponse<Paginated<AdminPlatformPayoutAccountData>>>(
		"/v1/admin/platform-payout-accounts",
		{ params }
	);
	return response?.data;
}

export async function adminGetActivePlatformPayoutAccount(): Promise<ApiResponse<AdminPlatformPayoutAccountData>> {
	const response = await client.get<ApiResponse<AdminPlatformPayoutAccountData>>(
		"/v1/admin/platform-payout-accounts/active"
	);
	return response?.data;
}

export async function adminCreatePlatformPayoutAccount(
	data: AdminCreatePlatformPayoutAccountRequest
): Promise<ApiResponse<AdminPlatformPayoutAccountData>> {
	const response = await client.post<ApiResponse<AdminPlatformPayoutAccountData>>(
		"/v1/admin/platform-payout-accounts",
		data
	);
	return response?.data;
}

export async function adminUpdatePlatformPayoutAccount(
	id: string,
	data: AdminUpdatePlatformPayoutAccountRequest
): Promise<ApiResponse<AdminPlatformPayoutAccountData>> {
	const response = await client.patch<ApiResponse<AdminPlatformPayoutAccountData>>(
		`/v1/admin/platform-payout-accounts/${id}`,
		data
	);
	return response?.data;
}

export async function adminDeletePlatformPayoutAccount(
	id: string
): Promise<BaseResponse> {
	const response = await client.delete<BaseResponse>(
		`/v1/admin/platform-payout-accounts/${id}`
	);
	return response?.data;
}

export async function adminSetDefaultPlatformPayoutAccount(
	id: string
): Promise<BaseResponse> {
	const response = await client.patch<BaseResponse>(
		`/v1/admin/platform-payout-accounts/${id}/set-default`,
		{}
	);
	return response?.data;
}

export async function adminListPlatformPayouts(
	params?: AdminListPlatformPayoutsRequest
): Promise<ApiResponse<Paginated<AdminPlatformPayoutData>>> {
	const response = await client.get<ApiResponse<Paginated<AdminPlatformPayoutData>>>(
		"/v1/admin/platform-payouts",
		{ params }
	);
	return response?.data;
}

export async function adminGetPlatformPayout(
	id: string
): Promise<ApiResponse<AdminPlatformPayoutData>> {
	const response = await client.get<ApiResponse<AdminPlatformPayoutData>>(
		`/v1/admin/platform-payouts/${id}`
	);
	return response?.data;
}

export async function adminPreviewPlatformPayout(
	data: AdminPreviewPlatformPayoutRequest
): Promise<ApiResponse<AdminPreviewPlatformPayoutData>> {
	const response = await client.post<ApiResponse<AdminPreviewPlatformPayoutData>>(
		"/v1/admin/platform-payouts/preview",
		data
	);
	return response?.data;
}

export async function adminCreatePlatformPayout(
	data: AdminCreatePlatformPayoutRequest
): Promise<ApiResponse<AdminPlatformPayoutData>> {
	const response = await client.post<ApiResponse<AdminPlatformPayoutData>>(
		"/v1/admin/platform-payouts",
		data
	);
	return response?.data;
}

export async function adminCancelPlatformPayout(
	id: string,
	reason?: string
): Promise<BaseResponse> {
	const response = await client.patch<BaseResponse>(
		`/v1/admin/platform-payouts/${id}/cancel`,
		{ reason }
	);
	return response?.data;
}

export async function adminCreateSimulatedPlatformPayout(
	data: AdminCreatePlatformPayoutRequest
): Promise<ApiResponse<AdminPlatformPayoutData>> {
	const response = await client.post<ApiResponse<AdminPlatformPayoutData>>(
		"/v1/admin/platform-payouts/simulated",
		data
	);
	return response?.data;
}

export async function adminReprocessPlatformPayoutItemDev(
	id: string,
	body: { targetStatus: string }
): Promise<BaseResponse> {
	const response = await client.post<BaseResponse>(
		`/v1/admin/platform-payout-items/${id}/dev/reprocess-completed`,
		body
	);
	return response?.data;
}
