import type { PaginationParams } from '../common';
import type { PaymentEnvironment } from '../enums';

export type AdjustmentScope = 'Acquirer' | 'Merchant' | 'Platform';
export type AcquirerAdjustmentTarget = 'Settlement' | 'MerchantBalance' | 'SafefyProfit';

export interface AdminCreatePlatformBalanceAdjustmentRequest {
  scope: AdjustmentScope;
  acquirerId?: string | null;
  acquirerTarget?: AcquirerAdjustmentTarget | null;
  merchantId?: string | null;
  merchantAcquirerId?: string | null;
  environment?: PaymentEnvironment | null;
  amount: number;
  isCredit: boolean;
  reason: string;
}

export interface AdminPlatformBalanceAdjustmentData {
  transactionId: string;
  scope: AdjustmentScope;
  acquirerId: string | null;
  acquirerName: string | null;
  acquirerCode: string | null;
  merchantId: string | null;
  merchantName: string | null;
  environment: PaymentEnvironment | null;
  amount: number;
  isCredit: boolean;
  notes: string | null;
  newTargetBalance: number;
  newPlatformBalance: number | null;
  createdAt: string;
}

export interface AdminPlatformBalanceAdjustmentHistoryData {
  transactionId: string;
  scope: AdjustmentScope;
  acquirerId: string | null;
  acquirerName: string | null;
  acquirerCode: string | null;
  merchantId: string | null;
  merchantName: string | null;
  environment: string | null;
  amount: number;
  isCredit: boolean;
  notes: string | null;
  createdAt: string;
}

export interface AdminListPlatformBalanceAdjustmentsRequest extends PaginationParams {
  scope?: AdjustmentScope | null;
  acquirerId?: string | null;
  merchantId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  excludeMerchant?: boolean;
}
