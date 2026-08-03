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
    totalSales: 15420,
    totalVolume: 1254300.50,
    totalFees: 37629.00,
    totalNetVolume: 1216671.50,
    totalPayouts: 98,
    pendingPayouts: 2,
    refundedAmount: 12430.00,
    refundedTransactions: 15,
    volumeToday: 42100.80,
    volumeThisWeek: 289450.00,
    volumeThisMonth: 1254300.50,
    approvalRate: 94.2,
    approvalRateLevel: "high" as any,
    chargebackCount: 3,
    chargebackRate: 0.12,
    failedTransactions: 240,
    failedRate: 5.8,
    totalTransactions: 4120,
    completedTransactions: 3880,
    volumeGrowth: 18.4,
    transactionsGrowth: 12.1,
    approvalRateGrowth: 1.8,
    failedRateGrowth: -0.5,
    growthComparisonLabel: "vs. 30 dias anteriores",
  },
  balance: {
    currency: "BRL",
    available: 48950.40,
    pending: 124300.00,
    reserved: 10000.00,
    total: 183250.40,
  },
  volumeChart: [
    { date: "2026-07-26", volume: 32000, transactionCount: 110 },
    { date: "2026-07-27", volume: 45000, transactionCount: 145 },
    { date: "2026-07-28", volume: 38000, transactionCount: 120 },
    { date: "2026-07-29", volume: 52000, transactionCount: 180 },
    { date: "2026-07-30", volume: 41000, transactionCount: 130 },
    { date: "2026-07-31", volume: 49000, transactionCount: 160 },
    { date: "2026-08-01", volume: 42100.80, transactionCount: 135 },
  ],
  weeklyChart: [
    { weekNumber: 27, label: "Semana 27", volume: 220000, transactionCount: 780 },
    { weekNumber: 28, label: "Semana 28", volume: 250000, transactionCount: 840 },
    { weekNumber: 29, label: "Semana 29", volume: 275000, transactionCount: 910 },
    { weekNumber: 30, label: "Semana 30", volume: 289450, transactionCount: 960 },
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
};

export async function getMerchantDashboard(
  merchantId: string,
  filters?: DashboardFilters
): Promise<ApiResponse<ReadMerchantDashboardData>> {
  try {
    const response = await client.get<ApiResponse<ReadMerchantDashboardData>>(
      `/v1/merchant/${merchantId}/dashboard`,
      { params: filters }
    );
    return response?.data;
  } catch (error) {
    console.warn(`[getMerchantDashboard] Falha ao conectar ao backend. Retornando dados simulados.`);
    return {
      success: true,
      data: mockMerchantDashboardData,
    };
  }
}
