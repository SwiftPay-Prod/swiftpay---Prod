"use server";

import client from "@/clients/client";
import type {
  AdminListCashoutsRequest,
  AdminMinimalCashout,
  AdminCashoutDetails,
  AdminEvaluateCashoutRequest,
  AdminEvaluateCashoutData,
  AdminReprocessCompletedCashoutDevData,
  AdminReprocessCashoutRequest,
  AdminForceAcquirerWebhookCashoutDevData,
} from "@/types/admin/cashouts";
import type { AdminForceAcquirerWebhookRequest } from "@/types/admin/transactions";
import type { ApiResponse, Paginated } from "@/types/common";

export async function adminListCashouts(
  params?: AdminListCashoutsRequest
): Promise<ApiResponse<Paginated<AdminMinimalCashout>>> {
  const response = await client.get<ApiResponse<Paginated<AdminMinimalCashout>>>(
    "/v1/admin/cashouts",
    { params }
  );
  return response?.data;
}

export async function adminGetCashout(
  cashoutId: string
): Promise<ApiResponse<AdminCashoutDetails>> {
  const response = await client.get<ApiResponse<AdminCashoutDetails>>(
    `/v1/admin/cashouts/${cashoutId}`
  );
  return response?.data;
}

export async function adminEvaluateCashout(
  cashoutId: string,
  data: AdminEvaluateCashoutRequest
): Promise<ApiResponse<AdminEvaluateCashoutData>> {
  const response = await client.post<ApiResponse<AdminEvaluateCashoutData>>(
    `/v1/admin/cashouts/${cashoutId}/evaluate`,
    data
  );
  return response?.data;
}

export async function adminReprocessCompletedCashoutDev(
  cashoutId: string,
  data: AdminReprocessCashoutRequest
): Promise<ApiResponse<AdminReprocessCompletedCashoutDevData>> {
  const response = await client.post<ApiResponse<AdminReprocessCompletedCashoutDevData>>(
    `/v1/admin/cashouts/${cashoutId}/dev/reprocess-completed`,
    data
  );
  return response?.data;
}

export async function adminForceAcquirerWebhookDevForCashout(
  cashoutId: string,
  data: AdminForceAcquirerWebhookRequest
): Promise<ApiResponse<AdminForceAcquirerWebhookCashoutDevData>> {
  const response = await client.post<ApiResponse<AdminForceAcquirerWebhookCashoutDevData>>(
    `/v1/admin/cashouts/${cashoutId}/dev/force-acquirer-webhook`,
    data
  );
  return response?.data;
}
