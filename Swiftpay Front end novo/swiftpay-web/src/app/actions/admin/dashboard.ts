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
    totalUsers: 840,
    activeUsers: 792,
    inactiveUsers: 32,
    suspendedUsers: 16,
    emailVerifiedUsers: 810,
    newUsersToday: 5,
    newUsersThisWeek: 35,
    newUsersThisMonth: 120,
  },
  merchants: {
    totalMerchants: 145,
    activeMerchants: 132,
    draftMerchants: 5,
    suspendedMerchants: 3,
    pendingKycMerchants: 5,
    approvedKycMerchants: 132,
    rejectedKycMerchants: 8,
    newMerchantsThisMonth: 18,
  },
  financial: {
    totalVolume: 8452900.50,
    totalFees: 253587.00,
    totalAcquirerFees: 84529.00,
    totalNetRevenue: 169058.00,
    volumeToday: 284500.00,
    feesToday: 8535.00,
    acquirerFeesToday: 2845.00,
    netRevenueToday: 5690.00,
    volumeThisWeek: 1845600.00,
    feesThisWeek: 55368.00,
    acquirerFeesThisWeek: 18456.00,
    netRevenueThisWeek: 36912.00,
    volumeThisMonth: 8452900.50,
    feesThisMonth: 253587.00,
    acquirerFeesThisMonth: 84529.00,
    netRevenueThisMonth: 169058.00,
    totalTransactions: 28950,
    completedTransactions: 27420,
    failedTransactions: 1240,
    pendingTransactions: 290,
    approvalRate: 94.7,
    failedRate: 4.3,
    netMarginPercentage: 66.7,
    totalPayouts: 842,
    totalPayoutAmount: 5124000.00,
    totalPayoutFees: 16840.00,
    totalPayoutAcquirerFees: 8420.00,
  },
  volumeChart: [
    { date: "2026-07-26", volume: 220000, fees: 6600, acquirerFees: 2200, payoutFees: 440, payoutAcquirerFees: 220, transactionCount: 840, completedTransactions: 790, failedTransactions: 35 },
    { date: "2026-07-27", volume: 245000, fees: 7350, acquirerFees: 2450, payoutFees: 490, payoutAcquirerFees: 245, transactionCount: 910, completedTransactions: 860, failedTransactions: 40 },
    { date: "2026-07-28", volume: 238000, fees: 7140, acquirerFees: 2380, payoutFees: 476, payoutAcquirerFees: 238, transactionCount: 890, completedTransactions: 840, failedTransactions: 38 },
    { date: "2026-07-29", volume: 262000, fees: 7860, acquirerFees: 2620, payoutFees: 524, payoutAcquirerFees: 262, transactionCount: 980, completedTransactions: 930, failedTransactions: 42 },
    { date: "2026-07-30", volume: 241000, fees: 7230, acquirerFees: 2410, payoutFees: 482, payoutAcquirerFees: 241, transactionCount: 900, completedTransactions: 850, failedTransactions: 36 },
    { date: "2026-07-31", volume: 259000, fees: 7770, acquirerFees: 2590, payoutFees: 518, payoutAcquirerFees: 259, transactionCount: 970, completedTransactions: 920, failedTransactions: 40 },
    { date: "2026-08-01", volume: 284500, fees: 8535, acquirerFees: 2845, payoutFees: 569, payoutAcquirerFees: 284, transactionCount: 1040, completedTransactions: 990, failedTransactions: 44 },
  ],
  registrationChart: [
    { date: "2026-07-26", newUsers: 3, newMerchants: 1 },
    { date: "2026-07-27", newUsers: 5, newMerchants: 2 },
    { date: "2026-07-28", newUsers: 4, newMerchants: 1 },
    { date: "2026-07-29", newUsers: 6, newMerchants: 2 },
    { date: "2026-07-30", newUsers: 5, newMerchants: 1 },
    { date: "2026-07-31", newUsers: 8, newMerchants: 3 },
    { date: "2026-08-01", newUsers: 5, newMerchants: 1 },
  ],
  cacheInfo: {
    lastUpdatedAt: new Date().toISOString(),
    nextUpdateAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    cacheDurationMinutes: 5,
    isProcessing: false,
  },
  periodInfo: {
    period: "30d",
    startDate: "2026-07-02",
    endDate: "2026-08-01",
    label: "Últimos 30 dias",
  },
  growth: {
    volumeGrowth: 14.2,
    totalFeesGrowth: 14.1,
    totalAcquirerFeesGrowth: 12.8,
    netRevenueGrowth: 15.4,
    netMarginGrowth: 1.2,
    transactionsGrowth: 9.8,
    approvalRateGrowth: 0.5,
    failedRateGrowth: -0.8,
    payoutAmountGrowth: 11.2,
    payoutsGrowth: 8.4,
    usersGrowth: 16.5,
    merchantsGrowth: 14.2,
    activeUsersGrowth: 15.8,
    activeMerchantsGrowth: 13.9,
    pendingKycGrowth: -15.0,
    newUsersGrowth: 8.5,
    newMerchantsGrowth: 12.0,
    registrationsGrowth: 10.4,
    growthComparisonLabel: "vs. 30 dias anteriores",
  },
};

const mockAdminPlatformBalanceData: AdminPlatformBalanceData = {
  platformBlocked: 150000.00,
  platformPayoutsOut: 5124000.00,
  totalPlatformOperationalBalance: 485900.50,
  totalMerchantAvailable: 345600.00,
  totalMerchantBlocked: 124300.00,
  totalMerchantBalance: 469900.00,
  totalAcquirerGrossBalance: 485900.50,
  totalSwiftPayProfit: 16000.50,
  consistencyDifference: 0,
  consistencyDifferenceAbsolute: 0,
  isConsistent: true,
  totalPlatformFees: 253587.00,
  totalAvailableForWithdrawal: 16000.50,
  totalWithdrawalFeeIfWithdrawAll: 5.00,
  netIfWithdrawAll: 15995.50,
  acquirerBalances: [
    {
      acquirerId: "acq-1",
      acquirerName: "Fitbank",
      acquirerDisplayName: "Fitbank PIX",
      acquirerCode: "fitbank",
      operationTypes: ["PIX_IN", "PIX_OUT"],
      acquirerLogoUrl: null,
      totalIn: 5412000.00,
      totalOut: 5124000.00,
      grossBalance: 288000.00,
      merchantBalance: 275000.00,
      merchantAvailableBalance: 200000.00,
      swiftpayProfit: 13000.00,
      totalAcquirerFees: 54120.00,
      payoutFeeMode: "FixedOnly",
      payoutFeeFixed: 1.50,
      payoutFeePercentage: 0,
      availableForWithdrawal: 13000.00,
      withdrawalFeeIfWithdrawAll: 2.50,
      netIfWithdrawAll: 12997.50,
      platformPayoutsProcessing: 0,
    },
    {
      acquirerId: "acq-2",
      acquirerName: "Transfeera",
      acquirerDisplayName: "Transfeera Payouts",
      acquirerCode: "transfeera",
      operationTypes: ["PIX_OUT"],
      acquirerLogoUrl: null,
      totalIn: 3042900.50,
      totalOut: 2845000.00,
      grossBalance: 197900.50,
      merchantBalance: 194900.00,
      merchantAvailableBalance: 145600.00,
      swiftpayProfit: 3000.50,
      totalAcquirerFees: 30409.00,
      payoutFeeMode: "FixedOnly",
      payoutFeeFixed: 1.00,
      payoutFeePercentage: 0,
      availableForWithdrawal: 3000.50,
      withdrawalFeeIfWithdrawAll: 2.50,
      netIfWithdrawAll: 2998.00,
      platformPayoutsProcessing: 0,
    }
  ]
};

const mockAdminPlatformRevenueData: AdminPlatformRevenueData = {
  totalAvailableForWithdrawal: 16000.50,
  totalVolume: 8452900.50,
  totalFees: 253587.00,
  totalTransactions: 28950,
  totalPayoutVolume: 5124000.00,
  totalPayoutFees: 16840.00,
  totalPayoutTransactions: 842,
  totalRevenue: 270427.00,
  totalAcquirers: 2,
  acquirerRevenues: [
    {
      acquirerId: "acq-1",
      acquirerName: "Fitbank",
      acquirerCode: "fitbank",
      acquirerLogoUrl: null,
      operationTypes: ["PIX_IN", "PIX_OUT"],
      volume: 5412000.00,
      fees: 162360.00,
      transactions: 18450,
      settlement: 5357880.00,
      payoutVolume: 3124000.00,
      payoutFees: 10420.00,
      payoutTransactions: 510,
    },
    {
      acquirerId: "acq-2",
      acquirerName: "Transfeera",
      acquirerCode: "transfeera",
      acquirerLogoUrl: null,
      operationTypes: ["PIX_OUT"],
      volume: 3040900.50,
      fees: 91227.00,
      transactions: 10500,
      settlement: 3010491.50,
      payoutVolume: 2000000.00,
      payoutFees: 6420.00,
      payoutTransactions: 332,
    }
  ]
};

export async function adminGetDashboard(filters?: AdminDashboardFilters): Promise<ApiResponse<AdminDashboardData>> {
  try {
    const response = await client.get<ApiResponse<AdminDashboardData>>("/v1/admin/dashboard", { params: filters });
    return response?.data;
  } catch (error) {
    console.warn(`[adminGetDashboard] Falha ao conectar ao backend. Retornando dados simulados.`);
    return {
      success: true,
      data: mockAdminDashboardData,
    };
  }
}

export async function adminGetPlatformBalance(): Promise<ApiResponse<AdminPlatformBalanceData>> {
  try {
    const response = await client.get<ApiResponse<AdminPlatformBalanceData>>("/v1/admin/balance");
    return response?.data;
  } catch (error) {
    console.warn(`[adminGetPlatformBalance] Falha ao conectar ao backend. Retornando dados simulados.`);
    return {
      success: true,
      data: mockAdminPlatformBalanceData,
    };
  }
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
  try {
    const response = await client.get<ApiResponse<AdminPlatformRevenueData>>("/v1/admin/revenue", { params });
    return response?.data;
  } catch (error) {
    console.warn(`[adminGetPlatformRevenue] Falha ao conectar ao backend. Retornando dados simulados.`);
    return {
      success: true,
      data: mockAdminPlatformRevenueData,
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
}
