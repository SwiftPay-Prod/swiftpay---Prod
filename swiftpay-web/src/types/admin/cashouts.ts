import {
  PaymentEnvironment,
  PayoutStatus,
  PixKeyType,
  PayoutAccountStatus,
  MerchantStatus,
  CashoutEvaluateAction,
  ProviderCategory,
  AcquirerType,
} from '../enums';
import type { PaginationParams } from '../common';

export interface AdminListCashoutsRequest extends PaginationParams {
  status?: PayoutStatus | null;
  merchantId?: string | null;
  acquirerId?: string | null;
  environment?: PaymentEnvironment | null;
  search?: string | null;
}

export interface AdminMinimalCashout {
  id: string;
  amount: number;
  feeAmount: number;
  acquirerFeeAmount: number;
  safefyProfitAmount: number;
  netAmount: number;
  status: PayoutStatus;
  requestedAt: string;
  processedAt: string | null;
  completedAt: string | null;
  failureReason: string | null;
  merchant: AdminMinimalCashoutMerchantInfo;
  payoutAccount: AdminMinimalCashoutAccountInfo | null;
  inlinePixKeyType?: string | null;
  inlinePixKey?: string | null;
  acquirer: AdminMinimalCashoutAcquirerInfo | null;
}

export interface AdminMinimalCashoutMerchantInfo {
  id: string;
  name: string;
  email: string | null;
  document: string | null;
}

export interface AdminMinimalCashoutAccountInfo {
  id: string;
  pixKeyType: PixKeyType;
  pixKey: string;
  holderName: string | null;
}

export interface AdminMinimalCashoutAcquirerInfo {
  id: string;
  name: string;
  displayName: string | null;
  code: string;
  nominal: string | null;
  logoUrl: string | null;
  providerCategory?: ProviderCategory | null;
}

export interface AdminCashoutDetails {
  id: string;
  amount: number;
  feeAmount: number;
  acquirerFeeAmount: number;
  safefyProfitAmount: number;
  netAmount: number;
  status: PayoutStatus;
  requestedAt: string;
  processedAt: string | null;
  completedAt: string | null;
  failureReason: string | null;
  acquirerTransactionId: string | null;
  merchant: AdminCashoutMerchantDetails;
  payoutAccount: AdminCashoutAccountDetails;
  acquirer: AdminCashoutAcquirerDetails | null;
  evaluation: AdminCashoutEvaluationDetails | null;
  ledgerEntries: AdminCashoutLedgerEntry[];
}

export interface AdminCashoutEvaluationDetails {
  evaluatedAt: string;
  evaluatedBy: AdminCashoutEvaluatorDetails;
}

export interface AdminCashoutEvaluatorDetails {
  id: string;
  name: string | null;
  email: string;
}

export interface AdminCashoutMerchantDetails {
  id: string;
  name: string;
  email: string | null;
  status: MerchantStatus;
  user: AdminCashoutUserDetails;
}

export interface AdminCashoutUserDetails {
  id: string;
  name: string | null;
  email: string;
}

export interface AdminCashoutAccountDetails {
  id: string;
  pixKeyType: PixKeyType;
  pixKey: string;
  holderName: string | null;
  holderDocument: string | null;
  status: PayoutAccountStatus;
}

export interface AdminCashoutAcquirerDetails {
  id: string;
  name: string;
  code: string;
  nominal: string | null;
}

export interface AdminCashoutLedgerEntry {
  id: string;
  transactionType: string;
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
}

export interface AdminEvaluateCashoutRequest {
  action: CashoutEvaluateAction;
  reason?: string | null;
}

export interface AdminEvaluateCashoutData {
  id: string;
  status: PayoutStatus;
  acquirerTransactionId: string | null;
  message: string;
}

export interface AdminReprocessCompletedCashoutDevData {
  id: string;
  status: PayoutStatus;
  completedAt: string | null;
  endToEndId: string | null;
  acquirerTransactionId: string | null;
  message: string;
}

export type AdminReprocessCashoutTargetStatus = 'Completed' | 'Failed' | 'Rejected';

export interface AdminReprocessCashoutRequest {
  targetStatus: AdminReprocessCashoutTargetStatus;
}

export interface AdminForceAcquirerWebhookCashoutRequest {
  acquirerType: AcquirerType;
  payloadJson: string;
}

export interface AdminForceAcquirerWebhookCashoutDevData {
  cashoutId: string;
  acquirerType: AcquirerType;
  endToEndId: string | null;
  acquirerTransactionId: string | null;
  status: string | null;
  processed: boolean;
  message: string;
}

