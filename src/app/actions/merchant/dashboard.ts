"use server";

import client from "@/clients/client";
import type { ReadMerchantDashboardData, DashboardPeriod } from "@/types/merchant/dashboard";
import type { ApiResponse } from "@/types/common";
import type { AxiosError } from "axios";
import { ApprovalRateLevel } from "@/types/enums";

export interface DashboardFilters {
  period?: DashboardPeriod;
  startDate?: string;
  endDate?: string;
}

// Gera dados de volume diário mockados para os últimos N dias
function generateMockDailyVolume(days: number) {
  const data = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const base = 1800000 + Math.sin(i * 0.8) * 900000 + Math.random() * 500000;
    data.push({
      date: date.toISOString().split('T')[0]!,
      volume: Math.round(base),
      transactionCount: Math.round(base / 320),
    });
  }
  return data;
}

function generateMockWeeklyVolume() {
  return Array.from({ length: 8 }, (_, i) => ({
    weekNumber: i + 1,
    label: `S${i + 1}`,
    volume: Math.round(3500000 + Math.sin(i * 1.2) * 1000000 + Math.random() * 500000),
    transactionCount: Math.round(280 + i * 30 + Math.random() * 40),
  }));
}

const MOCK_DASHBOARD: ReadMerchantDashboardData = {
  kpis: {
    totalSales: 847,
    totalVolume: 28453000,
    totalFees: 853590,
    totalNetVolume: 27599410,
    totalPayouts: 19800000,
    pendingPayouts: 3120000,
    refundedAmount: 421050,
    refundedTransactions: 12,
    volumeToday: 1843200,
    volumeThisWeek: 9784000,
    volumeThisMonth: 28453000,
    approvalRate: 94.7,
    approvalRateLevel: ApprovalRateLevel.Good,
    chargebackCount: 2,
    chargebackRate: 0.24,
    failedTransactions: 45,
    failedRate: 5.3,
    totalTransactions: 892,
    completedTransactions: 847,
    volumeGrowth: 12.4,
    transactionsGrowth: 8.1,
    approvalRateGrowth: 1.3,
    failedRateGrowth: -0.8,
    growthComparisonLabel: 'vs. período anterior',
  },
  balance: {
    currency: 'BRL',
    available: 1543250,
    pending: 894020,
    reserved: 0,
    total: 2437270,
  },
  volumeChart: generateMockDailyVolume(30),
  weeklyChart: generateMockWeeklyVolume(),
  cacheInfo: {
    lastUpdatedAt: new Date(Date.now() - 3 * 60000).toISOString(),
    nextUpdateAt: new Date(Date.now() + 12 * 60000).toISOString(),
    cacheDurationMinutes: 15,
    isProcessing: false,
  },
  periodInfo: {
    period: 'this_month',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]!,
    endDate: new Date().toISOString().split('T')[0]!,
    label: 'Este mês',
  },
};

export async function getMerchantDashboard(
  merchantId: string,
  filters?: DashboardFilters
): Promise<ApiResponse<ReadMerchantDashboardData>> {
  // Modo auditoria: retorna dados mock para o merchant de preview
  if (merchantId.startsWith('preview-merchant') || merchantId === 'preview-merchant-id') {
    return { data: MOCK_DASHBOARD, message: null, error: null };
  }

  try {
    const response = await client.get<ApiResponse<ReadMerchantDashboardData>>(
      `/v1/merchant/${merchantId}/dashboard`,
      { params: filters }
    );
    if (!response?.data) {
      return { data: null, message: null, error: { message: "Resposta vazia do backend" } };
    }
    return response.data;
  } catch (error) {
    console.warn(`[getMerchantDashboard] Falha ao conectar ao backend. Retornando dados simulados.`);
    return { data: MOCK_DASHBOARD, message: null, error: null };
  }
}
