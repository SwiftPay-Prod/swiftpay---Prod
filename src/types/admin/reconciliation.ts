import type { PaginationParams } from '../common';
import type {
  PaymentEnvironment,
  BankReconciliationStatus,
  ReconciliationDiscrepancyType,
  ReconciliationDiscrepancySeverity,
} from '../enums';

export interface AdminMinimalReconciliation {
  id: string;
  merchantId: string;
  merchantName: string;
  environment: PaymentEnvironment;
  status: BankReconciliationStatus;
  ledgerBalance: number;
  calculatedBalance: number;
  balanceDifference: number;
  totalDiscrepancies: number;
  correctedDiscrepancies: number;
  hasDiscrepancies: boolean;
  correctionsApplied: boolean;
  requestedByUserName: string | null;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  processingCompletedAt: string | null;
}

export interface AdminReconciliationDiscrepancy {
  id: string;
  type: ReconciliationDiscrepancyType;
  severity: ReconciliationDiscrepancySeverity;
  description: string;
  difference: number;
  paymentId: string | null;
  payoutId: string | null;
  ledgerTransactionId: string | null;
  corrected: boolean;
  correctedAt: string | null;
  createdAt: string;
}

export interface AdminReconciliationDetails {
  id: string;
  merchantId: string;
  merchantName: string | null;
  environment: PaymentEnvironment;
  status: BankReconciliationStatus;
  ledgerBalance: number;
  calculatedBalance: number;
  balanceDifference: number;
  totalDiscrepancies: number;
  correctedDiscrepancies: number;
  hasDiscrepancies: boolean;
  correctionsApplied: boolean;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  discrepancies: AdminReconciliationDiscrepancy[];
  requestedByUserId: string;
  requestedByUserName: string | null;
  processingStartedAt: string | null;
  processingCompletedAt: string | null;
  correctionsAppliedAt: string | null;
  correctionsAppliedByUserId: string | null;
  correctionsAppliedByUserName: string | null;
  correctionNotes: string | null;
  totalPaymentsAmount: number;
  totalPaymentsCount: number;
  totalFeesAmount: number;
  totalPayoutsAmount: number;
  totalPayoutsCount: number;
  totalRefundsAmount: number;
  totalRefundsCount: number;
  totalAdjustmentsAmount: number;
  totalAdjustmentsCount: number;
  totalLedgerTransactionsCount: number;
}

export interface AdminStartReconciliationRequest {
  merchantId: string;
  environment: PaymentEnvironment;
  silentMode?: boolean;
}

export interface AdminListReconciliationsRequest extends PaginationParams {
  merchantId?: string;
  environment?: PaymentEnvironment;
  status?: BankReconciliationStatus;
  onlyWithProblems?: boolean;
}

export interface AdminApplyReconciliationCorrectionsData {
  id: string;
  success: boolean;
  correctionsAppliedCount: number;
  totalAmountAdjusted: number;
  newBalance: number;
  appliedAt: string;
}

export interface AdminStartAllReconciliationsRequest {
  silentMode?: boolean;
}

