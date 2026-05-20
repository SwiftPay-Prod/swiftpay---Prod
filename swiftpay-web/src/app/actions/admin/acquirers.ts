"use server";

import client from "@/clients/client";
import type {
  AdminReadListAcquirersRequest,
  AdminAcquirerData,
  AdminUpdateAcquirerRequest,
  AdminUpdateAcquirerData,
  AdminSetMerchantAcquirerRequest,
  AdminSetMerchantAcquirerData,
  AdminAcquirerStatsData,
  AdminCreateAcquirerRequest,
  AdminCreateAcquirerData,
  AcquirerMerchantData,
  AdminReadAcquirerMerchantsRequest,
  AcquirerRequiredFieldsConfig,
  AdminAcquirerPixNominalHistoryItem,
  AdminSubmitMerchantSubmerchantRequest,
  AdminSubmitMerchantSubmerchantData,
  AdminRefreshSubmerchantStatusData,
  AdminCreateAcquirerAccessAccountRequest,
  AdminCreateAcquirerAccessAccountData,
  AdminDeleteAcquirerAccessAccountRequest,
  AdminDeleteAcquirerAccessAccountData,
} from "@/types/admin/acquirers";
import type { ApiResponse, Paginated } from "@/types/common";
import type { DashboardPeriod } from "@/types/merchant/dashboard";

export async function adminListAcquirers(
  params?: AdminReadListAcquirersRequest
): Promise<ApiResponse<Paginated<AdminAcquirerData>>> {
  const response = await client.get<ApiResponse<Paginated<AdminAcquirerData>>>(
    "/v1/admin/acquirers",
    { params }
  );
  return response?.data;
}

export async function adminGetAcquirer(
  acquirerId: string
): Promise<ApiResponse<AdminAcquirerData>> {
  const response = await client.get<ApiResponse<AdminAcquirerData>>(
    `/v1/admin/acquirers/${acquirerId}`
  );
  return response?.data;
}

export async function adminUpdateAcquirer(
  acquirerId: string,
  data: Partial<Omit<AdminUpdateAcquirerRequest, "acquirerId">>
): Promise<ApiResponse<AdminUpdateAcquirerData>> {
  const response = await client.patch<ApiResponse<AdminUpdateAcquirerData>>(
    `/v1/admin/acquirers/${acquirerId}`,
    data
  );
  return response?.data;
}

export async function adminSetMerchantAcquirer(
  merchantId: string,
  acquirerId: string,
  data?: Omit<AdminSetMerchantAcquirerRequest, "merchantId" | "acquirerId">
): Promise<ApiResponse<AdminSetMerchantAcquirerData>> {
  const response = await client.post<ApiResponse<AdminSetMerchantAcquirerData>>(
    `/v1/admin/merchant/${merchantId}/acquirer`,
    { acquirerId, ...data }
  );
  return response?.data;
}

export async function adminGetAcquirerStats(
  acquirerId: string,
  filters?: { period?: DashboardPeriod; startDate?: string; endDate?: string }
): Promise<ApiResponse<AdminAcquirerStatsData>> {
  const response = await client.get<ApiResponse<AdminAcquirerStatsData>>(
    `/v1/admin/acquirers/${acquirerId}/stats`,
    { params: filters }
  );
  return response?.data;
}

export async function adminGetAcquirerRequiredFields(
  acquirerId: string
): Promise<ApiResponse<AcquirerRequiredFieldsConfig>> {
  const response = await client.get<ApiResponse<AcquirerRequiredFieldsConfig>>(
    `/v1/admin/acquirers/${acquirerId}/required-fields`
  );
  return response?.data;
}

export async function adminCreateAcquirer(
  data: AdminCreateAcquirerRequest
): Promise<ApiResponse<AdminCreateAcquirerData>> {
  const response = await client.post<ApiResponse<AdminCreateAcquirerData>>(
    `/v1/admin/acquirers`,
    data
  );
  return response?.data;
}

export async function adminDeleteAcquirer(
  acquirerId: string
): Promise<ApiResponse<null>> {
  const response = await client.delete<ApiResponse<null>>(
    `/v1/admin/acquirers/${acquirerId}`
  );
  return response?.data;
}

export async function adminCreateAcquirerAccessAccount(
  data: AdminCreateAcquirerAccessAccountRequest
): Promise<ApiResponse<AdminCreateAcquirerAccessAccountData>> {
  const response = await client.post<ApiResponse<AdminCreateAcquirerAccessAccountData>>(
    `/v1/admin/acquirers/access-accounts`,
    data
  );
  return response?.data;
}

export async function adminDeleteAcquirerAccessAccount(
  data: AdminDeleteAcquirerAccessAccountRequest
): Promise<ApiResponse<AdminDeleteAcquirerAccessAccountData>> {
  const response = await client.delete<ApiResponse<AdminDeleteAcquirerAccessAccountData>>(
    `/v1/admin/acquirers/${data.acquirerId}/access-accounts/${data.accountIndex}`
  );
  return response?.data;
}

export async function adminResetAcquirerCredentialSchema(
  acquirerId: string
): Promise<ApiResponse<AdminAcquirerData>> {
  const response = await client.post<ApiResponse<AdminAcquirerData>>(
    `/v1/admin/acquirers/${acquirerId}/credentials/schema/reset`,
    {}
  );
  return response?.data;
}

export async function adminGetAcquirerPixNominalHistory(
  acquirerId: string
): Promise<ApiResponse<AdminAcquirerPixNominalHistoryItem[]>> {
  const response = await client.get<ApiResponse<AdminAcquirerPixNominalHistoryItem[]>>(
    `/v1/admin/acquirers/${acquirerId}/pix-nominal-history`
  );
  return response?.data;
}

export async function adminGetAcquirerMerchants(
  acquirerId: string,
  params?: Omit<AdminReadAcquirerMerchantsRequest, "acquirerId">
): Promise<ApiResponse<Paginated<AcquirerMerchantData>>> {
  const response = await client.get<ApiResponse<Paginated<AcquirerMerchantData>>>(
    `/v1/admin/acquirers/${acquirerId}/merchants`,
    { params }
  );
  return response?.data;
}

export async function adminSubmitMerchantSubmerchant(
  acquirerId: string,
  merchantId: string,
  data?: Omit<AdminSubmitMerchantSubmerchantRequest, "acquirerId" | "merchantId">
): Promise<ApiResponse<AdminSubmitMerchantSubmerchantData>> {
  const response = await client.post<ApiResponse<AdminSubmitMerchantSubmerchantData>>(
    `/v1/admin/acquirers/${acquirerId}/merchants/${merchantId}/submerchant/submit`,
    data ?? {}
  );
  return response?.data;
}

export async function adminRefreshMerchantSubmerchantStatus(
  acquirerId: string,
  merchantAcquirerId: string
): Promise<ApiResponse<AdminRefreshSubmerchantStatusData>> {
  const response = await client.post<ApiResponse<AdminRefreshSubmerchantStatusData>>(
    `/v1/admin/acquirers/${acquirerId}/merchant-acquirers/${merchantAcquirerId}/submerchant/refresh-status`,
    {}
  );
  return response?.data;
}
