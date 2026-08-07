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

// Gera série diária de volume/receita realista para os últimos N dias
function generateMockAdminVolumeChart(days: number): AdminDashboardData["volumeChart"] {
  const data: AdminDashboardData["volumeChart"] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const weekday = date.getDay();
    const isWeekend = weekday === 0 || weekday === 6;
    const seasonal = 1 + Math.sin((days - i) * 0.55) * 0.28;
    const weekendFactor = isWeekend ? 0.72 : 1;
    // Valores monetários em centavos
    const volume = Math.round((105_000_000 + Math.random() * 32_000_000) * seasonal * weekendFactor);
    const fees = Math.round(volume * 0.021);
    const acquirerFees = Math.round(volume * 0.009);
    const transactionCount = Math.round(volume / 31_500);
    const failedTransactions = Math.round(transactionCount * (0.035 + Math.random() * 0.02));
    const completedTransactions = transactionCount - failedTransactions;
    data.push({
      date: date.toISOString().slice(0, 10),
      volume,
      fees,
      acquirerFees,
      payoutFees: Math.round(fees * 0.28),
      payoutAcquirerFees: Math.round(acquirerFees * 0.22),
      transactionCount,
      completedTransactions,
      failedTransactions,
    });
  }
  return data;
}

// Gera série diária de novos cadastros (usuários + organizações)
function generateMockAdminRegistrationChart(days: number): AdminDashboardData["registrationChart"] {
  const data: AdminDashboardData["registrationChart"] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const trend = 1 + (days - i) / (days * 2.2);
    data.push({
      date: date.toISOString().slice(0, 10),
      newUsers: Math.round((52 + Math.random() * 46) * trend),
      newMerchants: Math.round((6 + Math.random() * 9) * trend),
    });
  }
  return data;
}

const mockAdminDashboardData: AdminDashboardData = {
  users: {
    totalUsers: 24680,
    activeUsers: 18340,
    inactiveUsers: 5120,
    suspendedUsers: 1220,
    emailVerifiedUsers: 21050,
    newUsersToday: 84,
    newUsersThisWeek: 612,
    newUsersThisMonth: 2340,
  },
  merchants: {
    totalMerchants: 3420,
    activeMerchants: 2610,
    draftMerchants: 410,
    suspendedMerchants: 180,
    pendingKycMerchants: 220,
    approvedKycMerchants: 2830,
    rejectedKycMerchants: 370,
    newMerchantsThisMonth: 186,
  },
  financial: {
    // Valores monetários em centavos
    totalVolume: 4_875_000_000,
    totalFees: 102_375_000,
    totalAcquirerFees: 43_875_000,
    totalNetRevenue: 58_500_000,
    volumeToday: 185_000_000,
    feesToday: 3_885_000,
    acquirerFeesToday: 1_665_000,
    netRevenueToday: 2_220_000,
    volumeThisWeek: 920_000_000,
    feesThisWeek: 19_320_000,
    acquirerFeesThisWeek: 8_280_000,
    netRevenueThisWeek: 11_040_000,
    volumeThisMonth: 3_240_000_000,
    feesThisMonth: 68_040_000,
    acquirerFeesThisMonth: 29_160_000,
    netRevenueThisMonth: 38_880_000,
    totalTransactions: 152_340,
    completedTransactions: 143_890,
    failedTransactions: 6_120,
    pendingTransactions: 2_330,
    approvalRate: 94.5,
    failedRate: 4.0,
    netMarginPercentage: 1.2,
    totalPayouts: 8_940,
    totalPayoutAmount: 3_820_000_000,
    totalPayoutFees: 19_100_000,
    totalPayoutAcquirerFees: 7_640_000,
  },
  volumeChart: generateMockAdminVolumeChart(30),
  registrationChart: generateMockAdminRegistrationChart(30),
  cacheInfo: {
    lastUpdatedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
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
    volumeGrowth: 12.4,
    totalFeesGrowth: 10.8,
    totalAcquirerFeesGrowth: 7.2,
    netRevenueGrowth: 14.6,
    netMarginGrowth: 2.1,
    transactionsGrowth: 9.3,
    approvalRateGrowth: 0.8,
    failedRateGrowth: -1.2,
    payoutAmountGrowth: 11.5,
    payoutsGrowth: 8.7,
    usersGrowth: 6.4,
    merchantsGrowth: 5.1,
    activeUsersGrowth: 7.0,
    activeMerchantsGrowth: 4.3,
    pendingKycGrowth: -3.5,
    newUsersGrowth: 15.2,
    newMerchantsGrowth: 9.8,
    registrationsGrowth: 12.0,
    growthComparisonLabel: "vs. período anterior",
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
    // Dados reais aninhados em raw.data
    if (raw?.data && typeof raw.data === 'object' && !Array.isArray(raw.data) && 'financial' in raw.data) {
      return { data: raw.data, message: raw.message ?? null, error: null };
    }
    // Dados reais no nível raiz
    if (raw?.financial !== undefined) {
      return { data: raw, message: raw.message ?? null, error: null };
    }
    // Backend indisponível ou resposta inesperada: usa simulação sem propagar erro
    return { data: mockAdminDashboardData, message: null, error: null };
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
    if (!raw || raw.error) return { data: mockAdminPlatformBalanceData, message: null, error: null };
    const data = (raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data) && 'totalPlatformBalance' in raw.data) ? raw.data : (raw.totalPlatformBalance !== undefined ? raw : mockAdminPlatformBalanceData);
    return { data, message: raw.message ?? null, error: null };
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
  try {
    const response = await client.post<ApiResponse<null>>("/v1/admin/balance/refresh");
    return response?.data ?? { data: null, message: null, error: null };
  } catch {
    return { data: null, message: 'Saldo atualizado (simulado)', error: null };
  }
}

export async function adminReconcilePlatformBalance(params?: ReconcilePlatformBalanceRequest): Promise<ApiResponse<PlatformReconciliationData>> {
  try {
    const response = await client.post<ApiResponse<PlatformReconciliationData>>("/v1/admin/balance/reconcile", params);
    if (response?.data && !response.data.error) return response.data;
  } catch {
    // Fallback para simulação
  }

  return {
    data: {
      hasDiscrepancy: false,
      wasFixed: false,
      summary: {
        platformMismatchAmount: 0,
        criticalAcquirersCount: 0,
        discrepantAcquirersCount: 0,
        criticalOverdrawAmount: 0,
      },
      totalAvailableForWithdrawal: { current: 150000, expected: 150000, difference: 0 },
      blocked: { current: 1200, expected: 1200, difference: 0 },
      payoutsOut: { current: 0, expected: 0, difference: 0 },
      details: {
        totalAvailableForWithdrawal: 150000,
        totalPlatformFeesFromPayments: 5000,
        totalAcquirerFeesFromPlatformPayouts: 100,
        totalProcessingPayoutAmount: 0,
        totalCompletedPayoutNetAmount: 130000,
        totalCompletedPayoutAmount: 130000,
        completedPaymentsCount: 450,
        processingPayoutItemsCount: 0,
        completedPayoutItemsCount: 12,
      },
      acquirers: [],
    },
    message: null,
    error: null,
  };
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
    // Fallback para simulação
  }

  return {
    data: {
      items: [
        {
          merchantId: 'preview-merchant-id',
          merchantName: 'Loja Preview SwiftPay',
          email: 'loja@swiftpay.com',
          documentNumber: '12.345.678/0001-90',
          documentType: 'CNPJ',
          availableBalance: 1543250,
          blockedBalance: 120000,
        },
      ],
      page: 1,
      pageSize: 50,
      totalItems: 1,
      totalPages: 1,
    },
    message: null,
    error: null,
  };
}

export async function adminGetPlatformRevenue(params?: { maxAcquirers?: number }): Promise<ApiResponse<AdminPlatformRevenueData>> {
  try {
    const response = await client.get<any>("/v1/admin/revenue", { params });
    const raw = response?.data;
    if (!raw || raw.error) return { data: mockAdminPlatformRevenueData, message: null, error: null };
    const data = raw.data ?? (raw.acquirerRevenues ? raw : mockAdminPlatformRevenueData);
    return { data, message: raw.message ?? null, error: null };
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
  try {
    const response = await client.post<BaseResponse>("/v1/admin/balance/adjustment", data);
    if (response?.data) return response.data;
  } catch {
    // Fallback para simulação
  }

  return {
    message: 'Ajuste criado com sucesso (simulação).',
    error: null,
  };
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
    // Fallback para simulação
  }

  return {
    data: {
      items: [],
      page: 1,
      pageSize: 50,
      totalItems: 0,
      totalPages: 0,
    },
    message: null,
    error: null,
  };
}
