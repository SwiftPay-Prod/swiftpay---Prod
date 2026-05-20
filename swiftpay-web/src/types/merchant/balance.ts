export interface AcquirerBucketBalanceInfo {
  merchantAcquirerId: string | null;
  balance: number;
}

// Balance Info
export interface BalanceInfo {
  available: number;
  withdrawNowAvailable: number;
  requiresFullWithdrawalNow: boolean;
  pending: number;
  reserved: number;
  total: number;
  acquirerBucketBalances: AcquirerBucketBalanceInfo[];
}

export interface TotalsInfo {
  lifetimeVolume: number;
  lifetimePayouts: number;
  lifetimeRefunds: number;
  lifetimeFeesPaid: number;
}

export interface PeriodInfo {
  volumeToday: number;
  volumeThisWeek: number;
  volumeThisMonth: number;
}

export interface LastTransactionInfo {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

// Read Balance
export interface ReadBalanceRequest {
  merchantId: string;
}

export interface ReadBalanceData {
  currency: string;
  balance: BalanceInfo;
  totals: TotalsInfo;
  period: PeriodInfo;
  lastTransactions: LastTransactionInfo[];
  updatedAt: string;
}



