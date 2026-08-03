"use server";

import client from "@/clients/client";
import type { ReadMerchantDashboardData, DashboardPeriod } from "@/types/merchant/dashboard";
import type { ApiResponse } from "@/types/common";

export interface DashboardFilters {
  period?: DashboardPeriod;
  startDate?: string;
  endDate?: string;
}

const mockMerchantDashboardData: ReadMerchantDashboardData = {
  kpis: {
    totalSales: 0,
    totalVolume: 0,
    totalFees: 0,
    totalNetVolume: 0,
    totalPayouts: 0,
    pendingPayouts: 0,
    refundedAmount: 0,
    refundedTransactions: 0,
    volumeToday: 0,
    volumeThisWeek: 0,
    volumeThisMonth: 0,
    approvalRate: 0,
    approvalRateLevel: "medium" as any,
    chargebackCount: 0,
    chargebackRate: 0,
    failedTransactions: 0,
    failedRate: 0,
    totalTransactions: 0,
    completedTransactions: 0,
    volumeGrowth: 0,
    transactionsGrowth: 0,
    approvalRateGrowth: 0,
    failedRateGrowth: 0,
    growthComparisonLabel: "vs. período anterior",
  },
  balance: {
    currency: "BRL",
    available: 0,
    pending: 0,
    reserved: 0,
    total: 0,
  },
  volumeChart: [],
  weeklyChart: [],
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
};

export async function getMerchantDashboard(
  merchantId: string,
  filters?: DashboardFilters
): Promise<ApiResponse<ReadMerchantDashboardData>> {
  try {
    const response = await client.get<any>(
      `/v1/merchant/${merchantId}/dashboard`,
      { params: filters }
    );
    const raw = response?.data;
    if (!raw) return { data: mockMerchantDashboardData, message: null, error: null };
    const data = (raw.data && typeof raw.data === 'object' && 'kpis' in raw.data) ? raw.data : (raw.kpis ? raw : mockMerchantDashboardData);
    return { data, message: raw.message ?? null, error: raw.error ?? null };
  } catch (error) {
    console.warn(`[getMerchantDashboard] Falha ao conectar ao backend. Retornando estrutura limpa.`);
    return {
      data: mockMerchantDashboardData,
      message: null,
      error: null,
    };
  }
}
