import { AutomaticCashoutFrequency, FeeChargeMode, WithdrawalApprovalMode } from "../enums";
import type { MerchantKycOperationType } from "../enums";

// Merchant Settings Data (Admin view)
export interface MerchantSettingsData {
  id: string;
  merchantId: string;
  pixMinTransactionAmount: number | null;
  pixMaxTransactionAmount: number | null;
  pixApiFeeMode: FeeChargeMode | null;
  pixApiFeeFixed: number | null;
  pixApiFeePercentage: number | null;
  pixCheckoutFeeMode: FeeChargeMode | null;
  pixCheckoutFeeFixed: number | null;
  pixCheckoutFeePercentage: number | null;
  pixPaymentLinkFeeMode: FeeChargeMode | null;
  pixPaymentLinkFeeFixed: number | null;
  pixPaymentLinkFeePercentage: number | null;
  boletoApiFeeMode: FeeChargeMode | null;
  boletoApiFeeFixed: number | null;
  boletoApiFeePercentage: number | null;
  boletoCheckoutFeeMode: FeeChargeMode | null;
  boletoCheckoutFeeFixed: number | null;
  boletoCheckoutFeePercentage: number | null;
  boletoPaymentLinkFeeMode: FeeChargeMode | null;
  boletoPaymentLinkFeeFixed: number | null;
  boletoPaymentLinkFeePercentage: number | null;
  withdrawalFeeMode: FeeChargeMode | null;
  withdrawalFeeFixed: number | null;
  withdrawalFeePercentage: number | null;
  minWithdrawalAmount: number | null;
  withdrawalApprovalMode: WithdrawalApprovalMode | null;
  rateLimitPerMinute: number | null;
  rateLimitPerHour: number | null;
  rateLimitPerDay: number | null;
  updatedAt: string;
}

// Read Settings (Merchant view)
export interface ReadSettingsRequest {
  merchantId: string;
}

export interface ReadSettingsData {
  id: string;
  merchantId: string;
  selfNominalSwitchEnabled: boolean;
  isAutomaticCashoutEnabled: boolean;
  automaticCashoutFrequency: AutomaticCashoutFrequency;
  automaticCashoutMinAmount: number | null;
  automaticCashoutMaxAmount: number | null;
  automaticCashoutPayoutAccountId: string | null;
  nextAutomaticCashoutAttemptAt: string | null;
  updatedAt: string;
}

// Read Fees (Merchant view - effective fees with platform defaults fallback)
export interface ReadFeesData {
  // Enabled Operations
  pixEnabled: boolean;
  boletoEnabled: boolean;
  creditCardEnabled: boolean;
  pixCompensationDays: number;
  boletoCompensationDays: number;
  creditCardCompensationDays: number;
  pixReservePercentage: number;
  boletoReservePercentage: number;
  creditCardReservePercentage: number;
  
  pixMinTransactionAmount: number;
  pixMaxTransactionAmount: number;
  boletoMinTransactionAmount: number;
  boletoMaxTransactionAmount: number;
  pixApiFeeMode: FeeChargeMode;
  pixApiFeeFixed: number;
  pixApiFeePercentage: number;
  pixCheckoutFeeMode: FeeChargeMode;
  pixCheckoutFeeFixed: number;
  pixCheckoutFeePercentage: number;
  pixPaymentLinkFeeMode: FeeChargeMode;
  pixPaymentLinkFeeFixed: number;
  pixPaymentLinkFeePercentage: number;
  boletoApiFeeMode: FeeChargeMode;
  boletoApiFeeFixed: number;
  boletoApiFeePercentage: number;
  creditCardApiFeeMode: FeeChargeMode;
  creditCardApiFeeFixed: number;
  creditCardApiFeePercentage: number;
  boletoCheckoutFeeMode: FeeChargeMode;
  boletoCheckoutFeeFixed: number;
  boletoCheckoutFeePercentage: number;
  boletoPaymentLinkFeeMode: FeeChargeMode;
  boletoPaymentLinkFeeFixed: number;
  boletoPaymentLinkFeePercentage: number;
  creditCardCheckoutFeeMode: FeeChargeMode;
  creditCardCheckoutFeeFixed: number;
  creditCardCheckoutFeePercentage: number;
  creditCardPaymentLinkFeeMode: FeeChargeMode;
  creditCardPaymentLinkFeeFixed: number;
  creditCardPaymentLinkFeePercentage: number;
  withdrawalFeeMode: FeeChargeMode;
  withdrawalFeeFixed: number;
  withdrawalFeePercentage: number;
  minWithdrawalAmount: number;
  withdrawalApprovalMode: WithdrawalApprovalMode;
  rateLimitPerMinute: number;
  rateLimitPerHour: number;
  rateLimitPerDay: number;
}

export interface MerchantNominalOption {
  merchantAcquirerId: string | null;
  acquirerId: string;
  acquirerDisplayName: string;
  nominal: string;
  acquirerCreatedAt: string;
  conversionYesterday: number | null;
  conversionLast7Days: number | null;
  merchantConversionYesterday: number | null;
  merchantConversionLast7Days: number | null;
  totalTransactions: number;
  isCurrent: boolean;
  isInAbTest: boolean;
  supportsPix: boolean;
  supportsBoleto: boolean;
  supportsCreditCard: boolean;
}

export type MerchantNominalAbTestLimitType = 'Days' | 'Transactions';

export interface ReadNominalsData {
  currentMerchantAcquirerId: string;
  currentNominal: string;
  merchantOperationType: MerchantKycOperationType | null;
  hasLegacyBalanceWarning: boolean;
  legacyBalanceWarningMessage: string;
  abTest: MerchantNominalAbTestInfo | null;
  nominals: MerchantNominalOption[];
}

export interface MerchantNominalAbTestInfo {
  isActive: boolean;
  variantAMerchantAcquirerId: string;
  variantBMerchantAcquirerId: string;
  variantAWeightPercent: number;
  variantBWeightPercent: number;
  startedAt: string;
  limitType: MerchantNominalAbTestLimitType;
  maxDurationDays: number | null;
  maxTransactions: number | null;
  winnerMerchantAcquirerId: string | null;
  isAutoFinished: boolean;
}

export interface UpdateNominalAbTestRequest {
  enabled: boolean;
  variantAMerchantAcquirerId?: string;
  variantBMerchantAcquirerId?: string;
  variantAAcquirerId?: string;
  variantBAcquirerId?: string;
  variantAWeightPercent?: number;
  winnerMerchantAcquirerId?: string;
  limitType?: MerchantNominalAbTestLimitType;
  maxDurationDays?: number;
  maxTransactions?: number;
}

export interface UpdateNominalAbTestData {
  isActive: boolean;
  variantAMerchantAcquirerId: string | null;
  variantBMerchantAcquirerId: string | null;
  variantAWeightPercent: number;
  variantBWeightPercent: number;
  startedAt: string | null;
  endedAt: string | null;
  winnerMerchantAcquirerId: string | null;
  isAutoFinished: boolean;
  limitType: MerchantNominalAbTestLimitType | null;
  maxDurationDays: number | null;
  maxTransactions: number | null;
  message: string;
}

export interface MerchantNominalAbTestHistoryVariantStats {
  merchantAcquirerId: string;
  acquirerId: string;
  displayLabel: string;
  totalTransactions: number;
  approvedTransactions: number;
  approvalRate: number;
}

export interface MerchantNominalAbTestHistoryChartPoint {
  hourUtc: string;
  label: string;
  variantATotal: number;
  variantAApproved: number;
  variantAApprovalRate: number;
  variantBTotal: number;
  variantBApproved: number;
  variantBApprovalRate: number;
}

export interface MerchantNominalAbTestHistoryItem {
  id: string;
  isActive: boolean;
  startedAt: string;
  endedAt: string | null;
  isAutoFinished: boolean;
  endReason: string | null;
  winnerMerchantAcquirerId: string | null;
  limitType: MerchantNominalAbTestLimitType;
  maxDurationDays: number | null;
  maxTransactions: number | null;
  variantA: MerchantNominalAbTestHistoryVariantStats;
  variantB: MerchantNominalAbTestHistoryVariantStats;
  chart: MerchantNominalAbTestHistoryChartPoint[];
}

export interface ReadNominalAbTestHistoryData {
  items: MerchantNominalAbTestHistoryItem[];
}

export interface SwitchNominalRequest {
  merchantAcquirerId?: string;
  acquirerId?: string;
}

export interface SwitchNominalData {
  merchantAcquirerId: string;
  nominal: string;
  message: string;
}

export interface MerchantNominalHistoryItem {
  acquirerId: string;
  displayLabel: string;
  nominal: string;
  totalTransactions: number;
  timesSelected: number;
  firstTransactionAt: string | null;
  lastTransactionAt: string | null;
  lastSelectedAt: string | null;
  isCurrent: boolean;
}

export interface ReadNominalsHistoryData {
  items: MerchantNominalHistoryItem[];
}

