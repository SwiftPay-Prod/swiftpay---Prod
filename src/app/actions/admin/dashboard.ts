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
  try {
    const response = await client.get<any>("/v1/admin/dashboard", { params: filters });
    const raw = response?.data;
    if (!raw || raw.error) return { data: null, message: null, error: { message: "Não foi possível carregar o dashboard admin." } };
    if (raw?.data && typeof raw.data === 'object' && !Array.isArray(raw.data) && 'financial' in raw.data) {
      return { data: raw.data, message: raw.message ?? null, error: null };
    }
    if (raw?.financial !== undefined) {
      return { data: raw, message: raw.message ?? null, error: null };
    }
    return { data: null, message: null, error: { message: "Formato inesperado do backend." } };
  } catch {
    return { data: null, message: null, error: { message: "Não foi possível carregar o dashboard admin." } };
  }
}

export async function adminGetPlatformBalance(): Promise<ApiResponse<AdminPlatformBalanceData>> {
  try {
    const response = await client.get<any>("/v1/admin/balance");
    const raw = response?.data;
    if (!raw || raw.error) return { data: null, message: null, error: { message: "Não foi possível carregar o balanço." } };
    const data =
      raw.data &&
      typeof raw.data === "object" &&
      !Array.isArray(raw.data) &&
      "totalPlatformOperationalBalance" in raw.data
        ? raw.data
        : raw.totalPlatformOperationalBalance !== undefined
          ? raw
          : null;
    if (!data) {
      return { data: null, message: null, error: { message: "Formato inesperado do backend." } };
    }
    return { data, message: raw.message ?? null, error: null };
  } catch {
    return { data: null, message: null, error: { message: "Não foi possível carregar o balanço." } };
  }
}

export async function adminRefreshPlatformBalance(): Promise<ApiResponse<null>> {
  try {
    const response = await client.post<ApiResponse<null>>("/v1/admin/balance/refresh");
    return response?.data ?? { data: null, message: null, error: null };
  } catch {
    return { data: null, message: null, error: { message: "Não foi possível atualizar o balanço." } };
  }
}

export async function adminReconcilePlatformBalance(params?: ReconcilePlatformBalanceRequest): Promise<ApiResponse<PlatformReconciliationData>> {
  try {
    const response = await client.post<ApiResponse<PlatformReconciliationData>>("/v1/admin/balance/reconcile", params);
    if (response?.data && !response.data.error) return response.data;
  } catch {
    // Intentionally no mock fallback.
  }

  return { data: null, message: null, error: { message: "Não foi possível reconciliar o balanço." } };
}

export async function adminGetPlatformBalanceAcquirerMerchantAvailability(
  acquirerId: string,
  params?: Omit<AdminReadPlatformBalanceAcquirerMerchantAvailabilityRequest, "acquirerId">
): Promise<ApiResponse<Paginated<AdminPlatformBalanceMerchantAvailabilityData>>> {
  try {
    const response = await client.get<ApiResponse<Paginated<AdminPlatformBalanceMerchantAvailabilityData>>>(
      `/v1/admin/balance/acquirers/${acquirerId}/merchant-availability`,
      { params }
    );
    if (response?.data && !response.data.error) return response.data;
  } catch {
    // Intentionally no mock fallback.
  }

  return { data: null, message: null, error: { message: "Não foi possível carregar a disponibilidade." } };
}

export async function adminGetPlatformRevenue(params?: { maxAcquirers?: number }): Promise<ApiResponse<AdminPlatformRevenueData>> {
  try {
    const response = await client.get<any>("/v1/admin/revenue", { params });
    const raw = response?.data;
    if (!raw || raw.error) return { data: null, message: null, error: { message: "Não foi possível carregar a receita." } };
    const data = raw.data ?? (raw.acquirerRevenues ? raw : null);
    if (!data) return { data: null, message: null, error: { message: "Formato inesperado do backend." } };
    return { data, message: raw.message ?? null, error: null };
  } catch {
    return { data: null, message: null, error: { message: "Não foi possível carregar a receita." } };
  }
}

export async function adminCreatePlatformBalanceAdjustment(
  data: AdminCreatePlatformBalanceAdjustmentRequest
): Promise<BaseResponse> {
  try {
    const response = await client.post<BaseResponse>("/v1/admin/balance/adjustment", data);
    if (response?.data) return response.data;
  } catch {
    // Intentionally no mock fallback.
  }

  return { message: null, error: { message: "Não foi possível criar o ajuste." } };
}

export async function adminListPlatformBalanceAdjustments(
  params?: AdminListPlatformBalanceAdjustmentsRequest
): Promise<ApiResponse<Paginated<AdminPlatformBalanceAdjustmentHistoryData>>> {
  try {
    const response = await client.get<ApiResponse<Paginated<AdminPlatformBalanceAdjustmentHistoryData>>>(
      "/v1/admin/balance/adjustments",
      { params }
    );
    if (response?.data && !response.data.error) return response.data;
  } catch {
    // Intentionally no mock fallback.
  }

  return { data: null, message: null, error: { message: "Não foi possível carregar os ajustes." } };
}
