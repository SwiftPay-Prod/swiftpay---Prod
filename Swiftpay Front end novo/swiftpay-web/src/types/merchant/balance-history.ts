import type {
  BankReconciliationStatus,
  PaymentEnvironment,
} from '../enums';
import type { PaginationParams } from '../common';

export interface MinimalBalanceHistory {
  id: string;
  status: BankReconciliationStatus;
  environment: PaymentEnvironment;
  previousBalance: number;
  newBalance: number;
  balanceChange: number;
  hasCorrections: boolean;
  totalCorrections: number;
  processedAt: string;
  correctionsAppliedAt: string | null;
}

export interface BalanceHistoryDetails {
  id: string;
  status: BankReconciliationStatus;
  environment: PaymentEnvironment;
  balance: BalanceSummary;
  transactions: TransactionSummary;
  corrections: BalanceCorrection[];
  processedAt: string;
  correctionsAppliedAt: string | null;
}

export interface BalanceSummary {
  previousBalance: number;
  newBalance: number;
  balanceChange: number;
  isPositiveChange: boolean;
}

export interface TransactionSummary {
  totalPayments: number;
  totalPaymentsAmount: number;
  totalPayouts: number;
  totalPayoutsAmount: number;
  totalRefunds: number;
  totalRefundsAmount: number;
  totalFees: number;
  totalTransactionsAnalyzed: number;
}

export interface BalanceCorrection {
  id: string;
  type: string;
  typeLabel: string;
  severity: string;
  severityLabel: string;
  description: string;
  suggestedAction: string | null;
  expectedAmount: number;
  actualAmount: number;
  difference: number;
  wasCorrected: boolean;
  correctedAt: string | null;
  correctionDescription: string | null;
}

export interface ListBalanceHistoryRequest extends PaginationParams {
  environment?: PaymentEnvironment;
  status?: BankReconciliationStatus;
}

