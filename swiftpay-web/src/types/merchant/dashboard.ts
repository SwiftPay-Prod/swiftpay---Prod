import { ApprovalRateLevel } from "../enums";

export interface MerchantKpiData {
  totalSales: number;
  totalVolume: number;
  totalFees: number;
  totalNetVolume: number;
  totalPayouts: number;
  pendingPayouts: number;
  refundedAmount: number;
  refundedTransactions: number;
  volumeToday: number;
  volumeThisWeek: number;
  volumeThisMonth: number;
  approvalRate: number;
  approvalRateLevel?: ApprovalRateLevel;
  chargebackCount: number;
  chargebackRate: number;
  failedTransactions: number;
  failedRate: number;
  totalTransactions: number;
  completedTransactions: number;
  // Growth rates (percentage change vs previous equivalent period)
  volumeGrowth: number | null;
  transactionsGrowth: number | null;
  approvalRateGrowth: number | null;
  failedRateGrowth: number | null;
  growthComparisonLabel: string | null;
}

export interface MerchantBalanceData {
  currency: string;
  available: number;
  pending: number;
  reserved: number;
  total: number;
}

export interface MerchantDailyVolumeData {
  date: string;
  volume: number;
  transactionCount: number;
}

export interface MerchantWeeklyVolumeData {
  weekNumber: number;
  label: string;
  volume: number;
  transactionCount: number;
}

export interface DashboardCacheInfo {
  lastUpdatedAt: string | null;
  nextUpdateAt: string | null;
  cacheDurationMinutes: number;
  isProcessing: boolean;
}

export interface DashboardPeriodInfo {
  period: string;
  startDate: string;
  endDate: string;
  label: string;
}

export type DashboardPeriod = 'today' | 'yesterday' | '7d' | '14d' | '30d' | '90d' | 'this_week' | 'this_month' | 'all' | 'custom';

export interface ReadMerchantDashboardRequest {
  merchantId: string;
  period?: DashboardPeriod;
  startDate?: string;
  endDate?: string;
}

export interface ReadMerchantDashboardData {
  kpis: MerchantKpiData;
  balance: MerchantBalanceData;
  volumeChart: MerchantDailyVolumeData[];
  weeklyChart: MerchantWeeklyVolumeData[];
  cacheInfo: DashboardCacheInfo;
  periodInfo: DashboardPeriodInfo;
}



