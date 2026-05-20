"use server";

import client from "@/clients/client";
import type {
  AdminDashboardData,
  AdminDashboardFilters,
  AdminPlatformBalanceData,
  AdminPlatformBalanceMerchantAvailabilityData,
  AdminPlatformRevenueData,
  AdminReadPlatformBalanceAcquirerMerchantAvailabilityRequest,
  PlatformReconciliationData,
  ReconcilePlatformBalanceRequest,
} from "@/types/admin/dashboard";
import type { AdminCreatePlatformBalanceAdjustmentRequest, AdminPlatformBalanceAdjustmentHistoryData, AdminListPlatformBalanceAdjustmentsRequest } from "@/types/admin/platform-balance";
import type { ApiResponse, BaseResponse, Paginated } from "@/types/common";

export async function adminGetDashboard(filters?: AdminDashboardFilters): Promise<ApiResponse<AdminDashboardData>> {
  const response = await client.get<ApiResponse<AdminDashboardData>>("/v1/admin/dashboard", { params: filters });
  return response?.data;
}

export async function adminGetPlatformBalance(): Promise<ApiResponse<AdminPlatformBalanceData>> {
  const response = await client.get<ApiResponse<AdminPlatformBalanceData>>("/v1/admin/balance");
  return response?.data;
}

export async function adminRefreshPlatformBalance(): Promise<ApiResponse<null>> {
  const response = await client.post<ApiResponse<null>>("/v1/admin/balance/refresh");
  return response?.data;
}

export async function adminReconcilePlatformBalance(params?: ReconcilePlatformBalanceRequest): Promise<ApiResponse<PlatformReconciliationData>> {
  const response = await client.post<ApiResponse<PlatformReconciliationData>>("/v1/admin/balance/reconcile", params);
  return response?.data;
}

export async function adminGetPlatformBalanceAcquirerMerchantAvailability(
  acquirerId: string,
  params?: Omit<AdminReadPlatformBalanceAcquirerMerchantAvailabilityRequest, "acquirerId">
): Promise<ApiResponse<Paginated<AdminPlatformBalanceMerchantAvailabilityData>>> {
  const response = await client.get<ApiResponse<Paginated<AdminPlatformBalanceMerchantAvailabilityData>>>(
    `/v1/admin/balance/acquirers/${acquirerId}/merchant-availability`,
    { params }
  );
  return response?.data;
}

export async function adminGetPlatformRevenue(params?: { maxAcquirers?: number }): Promise<ApiResponse<AdminPlatformRevenueData>> {
  const response = await client.get<ApiResponse<AdminPlatformRevenueData>>("/v1/admin/revenue", { params });
  return response?.data;
}

export async function adminCreatePlatformBalanceAdjustment(
  data: AdminCreatePlatformBalanceAdjustmentRequest
): Promise<BaseResponse> {
  const response = await client.post<BaseResponse>("/v1/admin/balance/adjustment", data);
  return response?.data;
}

export async function adminListPlatformBalanceAdjustments(
  params?: AdminListPlatformBalanceAdjustmentsRequest
): Promise<ApiResponse<Paginated<AdminPlatformBalanceAdjustmentHistoryData>>> {
  const response = await client.get<ApiResponse<Paginated<AdminPlatformBalanceAdjustmentHistoryData>>>(
    "/v1/admin/balance/adjustments",
    { params }
  );
  return response?.data;
}
