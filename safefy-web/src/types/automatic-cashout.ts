import type { AutomaticCashoutStatus, PaymentEnvironment, AutomaticCashoutFrequency } from "./enums";
import type { PaginationParams } from "./common";

// Admin - Automatic Cashout Logs
export interface AdminAutomaticCashoutLogData {
  id: string;
  merchantId: string | null;
  merchantName: string | null;
  environment: PaymentEnvironment;
  amountAttempted: number;
  netAmount: number;
  status: AutomaticCashoutStatus;
  message: string | null;
  technicalDetails: string | null;
  payoutId: string | null;
  createdAt: string;
}

export interface AdminReadListAutomaticCashoutLogsRequest extends PaginationParams {
  merchantId?: string | null;
  platformOnly?: boolean | null;
  status?: AutomaticCashoutStatus | null;
  environment?: PaymentEnvironment | null;
}

// Merchant - Automatic Cashout Logs
export interface MerchantAutomaticCashoutLogData {
  id: string;
  environment: PaymentEnvironment;
  amountAttempted: number;
  netAmount: number;
  status: AutomaticCashoutStatus;
  message: string | null;
  payoutId: string | null;
  createdAt: string;
}

export interface MerchantReadListAutomaticCashoutLogsRequest extends PaginationParams {
  merchantId: string;
  status?: AutomaticCashoutStatus | null;
}

// Merchant - Update Settings Request
export interface UpdateMerchantAutoCashoutRequest {
  merchantId: string;
  isAutomaticCashoutEnabled?: boolean | null;
  automaticCashoutFrequency?: AutomaticCashoutFrequency | null;
  automaticCashoutMinAmount?: number | null;
  automaticCashoutMaxAmount?: number | null;
  automaticCashoutPayoutAccountId?: string | null;
}
