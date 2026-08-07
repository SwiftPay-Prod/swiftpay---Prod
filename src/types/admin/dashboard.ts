import type { PaginationParams } from '../common';

export type AdminDashboardPeriod =
  | 'today'
  | 'yesterday'
  | '7d'
  | '14d'
  | '30d'
  | '90d'
  | 'this_week'
  | 'this_month'
  | 'all'
  | 'custom';

export interface AdminDashboardFilters {
  period?: AdminDashboardPeriod;
  startDate?: string;
  endDate?: string;
}

export interface AdminUserKpis {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  emailVerifiedUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
}

export interface AdminMerchantKpis {
  totalMerchants: number;
  activeMerchants: number;
  draftMerchants: number;
  suspendedMerchants: number;
  pendingKycMerchants: number;
  approvedKycMerchants: number;
  rejectedKycMerchants: number;
  newMerchantsThisMonth: number;
}

export interface AdminFinancialKpis {
  totalVolume: number;
  totalFees: number;
  totalAcquirerFees: number;
  totalNetRevenue: number;
  volumeToday: number;
  feesToday: number;
  acquirerFeesToday: number;
  netRevenueToday: number;
  volumeThisWeek: number;
  feesThisWeek: number;
  acquirerFeesThisWeek: number;
  netRevenueThisWeek: number;
  volumeThisMonth: number;
  feesThisMonth: number;
  acquirerFeesThisMonth: number;
  netRevenueThisMonth: number;
  totalTransactions: number;
  completedTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  approvalRate: number;
  failedRate: number;
  netMarginPercentage: number;
  totalPayouts: number;
  totalPayoutAmount: number;
  totalPayoutFees: number;
  totalPayoutAcquirerFees: number;
}

export interface AdminDailyVolumeData {
  date: string;
  volume: number;
  fees: number;
  acquirerFees: number;
  payoutFees: number;
  payoutAcquirerFees: number;
  transactionCount: number;
  completedTransactions: number;
  failedTransactions: number;
}

export interface AdminDailyRegistrationData {
  date: string;
  newUsers: number;
  newMerchants: number;
}

export interface AdminDashboardCacheInfo {
  lastUpdatedAt: string | null;
  nextUpdateAt: string | null;
  cacheDurationMinutes: number;
  isProcessing: boolean;
}

export interface AdminDashboardPeriodInfo {
  period: AdminDashboardPeriod;
  startDate: string;
  endDate: string;
  label: string;
}

export interface AdminDashboardGrowthKpis {
  volumeGrowth: number | null;
  totalFeesGrowth: number | null;
  totalAcquirerFeesGrowth: number | null;
  netRevenueGrowth: number | null;
  netMarginGrowth: number | null;
  transactionsGrowth: number | null;
  approvalRateGrowth: number | null;
  failedRateGrowth: number | null;
  payoutAmountGrowth: number | null;
  payoutsGrowth: number | null;
  usersGrowth: number | null;
  merchantsGrowth: number | null;
  activeUsersGrowth: number | null;
  activeMerchantsGrowth: number | null;
  pendingKycGrowth: number | null;
  newUsersGrowth: number | null;
  newMerchantsGrowth: number | null;
  registrationsGrowth: number | null;
  growthComparisonLabel: string | null;
}

export interface AdminChurnData {
  date: string;
  churnedMerchants: number;
  churnedUsers: number;
  reasons: {
    suspended: number;
    inactive: number;
    rejected: number;
  };
}

export interface AdminDashboardData {
  users: AdminUserKpis;
  merchants: AdminMerchantKpis;
  financial: AdminFinancialKpis;
  volumeChart: AdminDailyVolumeData[];
  registrationChart: AdminDailyRegistrationData[];
  churnChart?: AdminChurnData[];
  cacheInfo: AdminDashboardCacheInfo;
  periodInfo: AdminDashboardPeriodInfo;
  growth: AdminDashboardGrowthKpis;
}

export interface AdminAcquirerBalanceData {
  acquirerId: string;
  acquirerName: string;
  acquirerDisplayName?: string | null;
  acquirerCode: string;
  operationTypes?: string[];
  acquirerLogoUrl?: string | null;
  totalIn: number;
  totalOut: number;
  grossBalance: number;
  merchantBalance: number;
  merchantAvailableBalance: number;
  swiftpayProfit: number;
  totalAcquirerFees: number;
  payoutFeeMode: 'FixedOnly' | 'PercentageOnly' | 'FixedAndPercentage';
  payoutFeeFixed: number;
  payoutFeePercentage: number;
  availableForWithdrawal: number;
  withdrawalFeeIfWithdrawAll: number;
  netIfWithdrawAll: number;
  platformPayoutsProcessing: number;
}

export interface AdminPlatformBalanceMerchantAvailabilityData {
  merchantId: string;
  merchantName: string | null;
  email: string | null;
  documentNumber: string | null;
  documentType: string | null;
  availableBalance: number;
  blockedBalance: number;
}

export interface AdminReadPlatformBalanceAcquirerMerchantAvailabilityRequest extends PaginationParams {
  acquirerId: string;
  search?: string | null;
}

export interface AdminPlatformBalanceData {
  platformBlocked: number;
  platformPayoutsOut: number;
  totalPlatformOperationalBalance: number;
  totalMerchantAvailable: number;
  totalMerchantBlocked: number;
  totalMerchantBalance: number;
  totalAcquirerGrossBalance: number;
  totalSwiftPayProfit: number;
  consistencyDifference: number;
  consistencyDifferenceAbsolute: number;
  isConsistent: boolean;
  totalPlatformFees: number;
  totalAvailableForWithdrawal: number;
  totalWithdrawalFeeIfWithdrawAll: number;
  netIfWithdrawAll: number;
  acquirerBalances: AdminAcquirerBalanceData[];
}

export interface PlatformReconciliationSummary {
  platformMismatchAmount: number;
  criticalAcquirersCount: number;
  discrepantAcquirersCount: number;
  criticalOverdrawAmount: number;
}

export interface PlatformReconciliationAccount {
  current: number;
  expected: number;
  difference: number;
}

export interface PlatformReconciliationDetails {
  totalAvailableForWithdrawal: number;
  totalPlatformFeesFromPayments: number;
  totalAcquirerFeesFromPlatformPayouts: number;
  totalProcessingPayoutAmount: number;
  totalCompletedPayoutNetAmount: number;
  totalCompletedPayoutAmount: number;
  completedPaymentsCount: number;
  processingPayoutItemsCount: number;
  completedPayoutItemsCount: number;
}

export interface PlatformReconciliationData {
  hasDiscrepancy: boolean;
  wasFixed: boolean;
  summary: PlatformReconciliationSummary;
  totalAvailableForWithdrawal: PlatformReconciliationAccount;
  blocked: PlatformReconciliationAccount;
  payoutsOut: PlatformReconciliationAccount;
  details: PlatformReconciliationDetails;
  acquirers: AcquirerReconciliationData[];
}

export interface AcquirerReconciliationData {
  acquirerId: string;
  acquirerName: string;
  acquirerDisplayName?: string | null;
  acquirerCode?: string | null;
  acquirerLogoUrl?: string | null;
  hasDiscrepancy: boolean;
  /** Volume bruto (soma de Amount) - deve bater com Volume Total do dashboard */
  grossVolume: number;
  /** Total de taxas das adquirentes (soma de AcquirerFee) */
  totalAcquirerFees: number;
  /** Entradas no ledger da adquirente (settlement). */
  in: PlatformReconciliationAccount;
  /** Saídas no ledger da adquirente (payouts out). */
  out: PlatformReconciliationAccount;
  /** Saldo bruto físico da adquirente (in - out). */
  grossBalance: PlatformReconciliationAccount;
  /** Parcela do saldo bruto que pertence às organizações. */
  merchantBalance: PlatformReconciliationAccount;
  /** Parcela do saldo bruto que pertence à SwiftPay. */
  swiftpayProfit: PlatformReconciliationAccount;
  /** Excesso de saídas liquidadas acima do settlement corrente. */
  overdrawAmount: number;
  /** Soma absoluta das divergências principais desta adquirente. */
  totalMismatch: number;
  /** Settlement líquido no Ledger (Amount - AcquirerFee) */
  settlement: PlatformReconciliationAccount;
  /** Saques processados pela adquirente */
  payoutsOut: PlatformReconciliationAccount;
}

export interface ReconcilePlatformBalanceRequest {
  applyFix?: boolean;
}

export interface AdminAcquirerRevenueData {
  acquirerId: string;
  acquirerName: string;
  acquirerCode: string;
  acquirerLogoUrl: string | null;
  operationTypes: string[];
  volume: number;
  fees: number;
  transactions: number;
  settlement: number;
  payoutVolume: number;
  payoutFees: number;
  payoutTransactions: number;
}

export interface AdminPlatformRevenueData {
  totalAvailableForWithdrawal: number;
  totalVolume: number;
  totalFees: number;
  totalTransactions: number;
  totalPayoutVolume: number;
  totalPayoutFees: number;
  totalPayoutTransactions: number;
  totalRevenue: number;
  totalAcquirers: number;
  acquirerRevenues: AdminAcquirerRevenueData[];
}

export interface ReadPlatformRevenueRequest {
  maxAcquirers?: number;
}

