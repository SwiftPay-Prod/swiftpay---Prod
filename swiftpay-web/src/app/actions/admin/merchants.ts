"use server";

import { revalidatePath } from "next/cache";
import client from "@/clients/client";
import type {
  ReadListMerchantsRequest,
  AdminMinimalMerchant,
  AdminMerchantDetails,
  AdminUpdateMerchantSettingsRequest,
  AdminMerchantSettingsData,
  EvaluateMerchantKycRequest,
  EvaluateKycPendingItemData,
  AdminMerchantDashboardData,
  AdminPaymentLedgerData,
  AcquirerHistoryItem,
  SettingsHistoryItem,
  ReadMerchantAcquirerHistoryRequest,
  ReadMerchantSettingsHistoryRequest,
  AdminMerchantBalancesData,
} from "@/types/admin/merchants";
import { KycPendingItemEvaluationStatus } from "@/types/admin/merchants";
import type { MerchantData } from "@/types/merchant/crud";
import type { ApiResponse, Paginated } from "@/types/common";

export async function adminListMerchants(
  params?: ReadListMerchantsRequest
): Promise<ApiResponse<Paginated<AdminMinimalMerchant>>> {
  const response = await client.get<ApiResponse<Paginated<AdminMinimalMerchant>>>(
    "/v1/admin/merchants",
    { params }
  );
  return response?.data;
}

export async function adminGetMerchant(
  merchantId: string
): Promise<ApiResponse<AdminMerchantDetails>> {
  const response = await client.get<ApiResponse<AdminMerchantDetails>>(
    `/v1/admin/merchants/${merchantId}`
  );
  return response?.data;
}

export async function adminUpdateMerchant(
  merchantId: string,
  data: { status?: string | null; kycStatus?: string | null }
): Promise<ApiResponse<MerchantData>> {
  const response = await client.patch<ApiResponse<MerchantData>>(
    `/v1/admin/merchants/${merchantId}`,
    data
  );
  return response?.data;
}

export async function adminApproveKyc(
  merchantId: string
): Promise<ApiResponse<MerchantData>> {
  const response = await client.post<ApiResponse<MerchantData>>(
    `/v1/admin/merchants/${merchantId}/approve-kyc`,
    {}
  );
  return response?.data;
}

export async function adminRejectKyc(
  merchantId: string,
  reason?: string
): Promise<ApiResponse<MerchantData>> {
  const response = await client.post<ApiResponse<MerchantData>>(
    `/v1/admin/merchants/${merchantId}/reject-kyc`,
    { reason }
  );
  return response?.data;
}

export async function adminGetMerchantSettings(
  merchantId: string
): Promise<ApiResponse<AdminMerchantSettingsData>> {
  const response = await client.get<ApiResponse<AdminMerchantSettingsData>>(
    `/v1/admin/merchant/${merchantId}/settings`
  );
  return response?.data;
}

export async function adminUpdateMerchantSettings(
  merchantId: string,
  data: Omit<AdminUpdateMerchantSettingsRequest, "merchantId">
): Promise<ApiResponse<AdminMerchantSettingsData>> {
  const response = await client.patch<ApiResponse<AdminMerchantSettingsData>>(
    `/v1/admin/merchant/${merchantId}/settings`,
    data
  );

  if (response?.data && !response.data.error) {
    revalidatePath('/panel/admin/merchants');
    revalidatePath(`/panel/admin/merchants/${merchantId}`);
  }

  return response?.data;
}

export async function adminSuspendMerchant(
  merchantId: string,
  reason: string
): Promise<ApiResponse<string>> {
  const response = await client.post<ApiResponse<string>>(
    `/v1/admin/merchants/${merchantId}/suspend`,
    { reason }
  );
  return response?.data;
}

export async function adminActivateMerchant(
  merchantId: string
): Promise<ApiResponse<string>> {
  const response = await client.post<ApiResponse<string>>(
    `/v1/admin/merchants/${merchantId}/activate`,
    {}
  );
  return response?.data;
}

export async function adminInactivateMerchant(
  merchantId: string,
  reason: string
): Promise<ApiResponse<string>> {
  const response = await client.post<ApiResponse<string>>(
    `/v1/admin/merchants/${merchantId}/inactivate`,
    { reason }
  );
  return response?.data;
}

export async function adminEvaluateMerchantKyc(
  merchantId: string,
  data: Omit<EvaluateMerchantKycRequest, "merchantId">
): Promise<ApiResponse<MerchantData>> {
  const response = await client.post<ApiResponse<MerchantData>>(
    `/v1/admin/merchant/${merchantId}/evaluate`,
    data
  );
  
  if (response?.data && !response.data.error) {
    revalidatePath("/panel/admin/merchants");
    revalidatePath(`/panel/admin/merchants/${merchantId}`);
  }
  
  return response?.data;
}

export async function adminEvaluateKycPendingItem(
  merchantId: string,
  itemId: string,
  data: { status: KycPendingItemEvaluationStatus; notes?: string | null }
): Promise<ApiResponse<EvaluateKycPendingItemData>> {
  const response = await client.post<ApiResponse<EvaluateKycPendingItemData>>(
    `/v1/admin/merchant/${merchantId}/pending-items/${itemId}/evaluate`,
    data
  );
  
  if (response?.data && !response.data.error) {
    revalidatePath("/panel/admin/merchants");
    revalidatePath(`/panel/admin/merchants/${merchantId}`);
    revalidatePath(`/panel/admin/merchants/${merchantId}/evaluate`);
  }
  
  return response?.data;
}

export async function adminGetMerchantDashboard(
  merchantId: string
): Promise<ApiResponse<AdminMerchantDashboardData>> {
  const response = await client.get<ApiResponse<AdminMerchantDashboardData>>(
    `/v1/admin/merchant/${merchantId}/dashboard`
  );
  return response?.data;
}

export async function adminGetPaymentLedger(
  merchantId: string,
  paymentId: string
): Promise<ApiResponse<AdminPaymentLedgerData>> {
  const response = await client.get<ApiResponse<AdminPaymentLedgerData>>(
    `/v1/admin/merchant/${merchantId}/payments/${paymentId}/ledger`
  );
  return response?.data;
}

export async function adminGetMerchantAcquirerHistory(
  merchantId: string,
  params?: Omit<ReadMerchantAcquirerHistoryRequest, "merchantId">
): Promise<ApiResponse<Paginated<AcquirerHistoryItem>>> {
  const response = await client.get<ApiResponse<Paginated<AcquirerHistoryItem>>>(
    `/v1/admin/merchant/${merchantId}/acquirer-history`,
    { params }
  );
  return response?.data;
}

export async function adminGetMerchantSettingsHistory(
  merchantId: string,
  params?: Omit<ReadMerchantSettingsHistoryRequest, "merchantId">
): Promise<ApiResponse<Paginated<SettingsHistoryItem>>> {
  const response = await client.get<ApiResponse<Paginated<SettingsHistoryItem>>>(
    `/v1/admin/merchant/${merchantId}/settings-history`,
    { params }
  );
  return response?.data;
}

export async function adminGetMerchantBalances(
  merchantId: string
): Promise<ApiResponse<AdminMerchantBalancesData>> {
  const response = await client.get<ApiResponse<AdminMerchantBalancesData>>(
    `/v1/admin/merchants/${merchantId}/balances`
  );
  return response?.data;
}
