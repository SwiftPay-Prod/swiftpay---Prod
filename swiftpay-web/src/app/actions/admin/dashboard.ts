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

const mockAdminDashboardData: AdminDashboardData = {
  users: {
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    suspendedUsers: 0,
    emailVerifiedUsers: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
    newUsersThisMonth: 0,
  },
  merchants: {
    totalMerchants: 0,
    activeMerchants: 0,
    draftMerchants: 0,
    suspendedMerchants: 0,
    pendingKycMerchants: 0,
    approvedKycMerchants: 0,
    rejectedKycMerchants: 0,
    newMerchantsThisMonth: 0,
  },
  financial: {
    totalVolume: 0,
    totalFees: 0,
    totalAcquirerFees: 0,
    totalNetRevenue: 0,
    volumeToday: 0,
    feesToday: 0,
    acquirerFeesToday: 0,
    netRevenueToday: 0,
    volumeThisWeek: 0,
    feesThisWeek: 0,
    acquirerFeesThisWeek: 0,
    netRevenueThisWeek: 0,
    volumeThisMonth: 0,
    feesThisMonth: 0,
    acquirerFeesThisMonth: 0,
    netRevenueThisMonth: 0,
    totalTransactions: 0,
    completedTransactions: 0,
    failedTransactions: 0,
    pendingTransactions: 0,
    approvalRate: 0,
    failedRate: 0,
    netMarginPercentage: 0,
    totalPayouts: 0,
    totalPayoutAmount: 0,
    totalPayoutFees: 0,
    totalPayoutAcquirerFees: 0,
  },
  volumeChart: [],
  registrationChart: [],
  cacheInfo: {
    lastUpdatedAt: new Date().toISOString(),
    nextUpdateAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    cacheDurationMinutes: 5,
    isProcessing: false,
  },
  periodInfo: {
    period: "this_week",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    label: "Esta semana",
  },
  growth: {
    volumeGrowth: 0,
    totalFeesGrowth: 0,
    totalAcquirerFeesGrowth: 0,
    netRevenueGrowth: 0,
    netMarginGrowth: 0,
    transactionsGrowth: 0,
    approvalRateGrowth: 0,
    failedRateGrowth: 0,
    payoutAmountGrowth: 0,
    payoutsGrowth: 0,
    usersGrowth: 0,
    merchantsGrowth: 0,
    activeUsersGrowth: 0,
    activeMerchantsGrowth: 0,
    pendingKycGrowth: 0,
    newUsersGrowth: 0,
    newMerchantsGrowth: 0,
    registrationsGrowth: 0,
    growthComparisonLabel: null,
  },
};

const mockAdminPlatformBalanceData: AdminPlatformBalanceData = {
  platformBlocked: 0,
  platformPayoutsOut: 0,
  totalPlatformOperationalBalance: 0,
  totalMerchantAvailable: 0,
  totalMerchantBlocked: 0,
  totalMerchantBalance: 0,
  totalAcquirerGrossBalance: 0,
  totalSwiftPayProfit: 0,
  consistencyDifference: 0,
  consistencyDifferenceAbsolute: 0,
  isConsistent: true,
  totalPlatformFees: 0,
  totalAvailableForWithdrawal: 0,
  totalWithdrawalFeeIfWithdrawAll: 0,
  netIfWithdrawAll: 0,
  acquirerBalances: [
    {
      acquirerId: "00000000-0000-0000-0000-000000000210",
      acquirerName: "MagicPay",
      acquirerDisplayName: "MagicPay PIX",
      acquirerCode: "magicpay",
      operationTypes: ["PIX_IN", "PIX_OUT"],
      acquirerLogoUrl: null,
      totalIn: 0,
      totalOut: 0,
      grossBalance: 0,
      merchantBalance: 0,
      merchantAvailableBalance: 0,
      swiftpayProfit: 0,
      totalAcquirerFees: 0,
      payoutFeeMode: "FixedOnly",
      payoutFeeFixed: 0,
      payoutFeePercentage: 0,
      availableForWithdrawal: 0,
      withdrawalFeeIfWithdrawAll: 0,
      netIfWithdrawAll: 0,
      platformPayoutsProcessing: 0,
    }
  ]
};

const mockAdminPlatformRevenueData: AdminPlatformRevenueData = {
  totalAvailableForWithdrawal: 0,
  totalVolume: 0,
  totalFees: 0,
  totalTransactions: 0,
  totalPayoutVolume: 0,
  totalPayoutFees: 0,
  totalPayoutTransactions: 0,
  totalRevenue: 0,
  totalAcquirers: 1,
  acquirerRevenues: [
    {
      acquirerId: "00000000-0000-0000-0000-000000000210",
      acquirerName: "MagicPay",
      acquirerCode: "magicpay",
      acquirerLogoUrl: null,
      operationTypes: ["PIX_IN", "PIX_OUT"],
      volume: 0,
      fees: 0,
      transactions: 0,
      settlement: 0,
      payoutVolume: 0,
      payoutFees: 0,
      payoutTransactions: 0,
    }
  ]
};

export async function adminGetDashboard(filters?: AdminDashboardFilters): Promise<ApiResponse<AdminDashboardData>> {
  try {
    const response = await client.get<any>("/v1/admin/dashboard", { params: filters });
    const raw = response?.data;
    if (!raw) return { data: mockAdminDashboardData, message: null, error: null };
    const data = (raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data) && 'volume' in raw.data) ? raw.data : (raw.volume !== undefined ? raw : mockAdminDashboardData);
    return { data, message: raw.message ?? null, error: raw.error ?? null };
  } catch (error) {
    console.warn(`[adminGetDashboard] Falha ao conectar ao backend. Retornando dados simulados.`);
    return {
      data: mockAdminDashboardData,
      message: null,
      error: null,
    };
  }
}

export async function adminGetPlatformBalance(): Promise<ApiResponse<AdminPlatformBalanceData>> {
  try {
    const response = await client.get<any>("/v1/admin/balance");
    const raw = response?.data;
    if (!raw) return { data: mockAdminPlatformBalanceData, message: null, error: null };
    const data = (raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data) && 'totalPlatformBalance' in raw.data) ? raw.data : (raw.totalPlatformBalance !== undefined ? raw : mockAdminPlatformBalanceData);
    return { data, message: raw.message ?? null, error: raw.error ?? null };
  } catch (error) {
    console.warn(`[adminGetPlatformBalance] Falha ao conectar ao backend. Retornando dados simulados.`);
    return {
      data: mockAdminPlatformBalanceData,
      message: null,
      error: null,
    };
  }
}

export async function adminRefreshPlatformBalance(): Promise<ApiResponse<null>> {
  const response = await client.post<ApiResponse<null>>("/v1/admin/balance/refresh");
  return response?.data ?? { data: null, message: null, error: null };
}

export async function adminReconcilePlatformBalance(params?: ReconcilePlatformBalanceRequest): Promise<ApiResponse<PlatformReconciliationData>> {
  const response = await client.post<ApiResponse<PlatformReconciliationData>>("/v1/admin/balance/reconcile", params);
  return response?.data ?? { data: null, message: null, error: null };
}

export async function adminGetPlatformBalanceAcquirerMerchantAvailability(
  acquirerId: string,
  params?: Omit<AdminReadPlatformBalanceAcquirerMerchantAvailabilityRequest, "acquirerId">
): Promise<ApiResponse<Paginated<AdminPlatformBalanceMerchantAvailabilityData>>> {
  const response = await client.get<ApiResponse<Paginated<AdminPlatformBalanceMerchantAvailabilityData>>>(
    `/v1/admin/balance/acquirers/${acquirerId}/merchant-availability`,
    { params }
  );
  return response?.data ?? { data: null, message: null, error: null };
}

export async function adminGetPlatformRevenue(params?: { maxAcquirers?: number }): Promise<ApiResponse<AdminPlatformRevenueData>> {
  try {
    const response = await client.get<any>("/v1/admin/revenue", { params });
    const raw = response?.data;
    if (!raw) return { data: mockAdminPlatformRevenueData, message: null, error: null };
    const data = raw.data ?? (raw.acquirerRevenues ? raw : mockAdminPlatformRevenueData);
    return { data, message: raw.message ?? null, error: raw.error ?? null };
  } catch (error) {
    console.warn(`[adminGetPlatformRevenue] Falha ao conectar ao backend. Retornando dados simulados.`);
    return {
      data: mockAdminPlatformRevenueData,
      message: null,
      error: null,
    };
  }
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
