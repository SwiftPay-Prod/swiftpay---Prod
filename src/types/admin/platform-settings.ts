import {
  FeeChargeMode,
  WithdrawalApprovalMode,
  ReferralWithdrawalIntervalUnit,
  AutomaticCashoutFrequency,
  PaymentMethod,
} from '../enums';

export interface PaymentLinkDomainOption {
  id: string;
  name: string;
  baseUrl: string;
  isDefault: boolean;
  showSwiftPayBranding: boolean;
}

export interface PaymentLinkDomainMethodOptions {
  method: Extract<PaymentMethod, 'Pix'>;
  options: PaymentLinkDomainOption[];
}

export interface AdminPlatformSettingsData {
  id: string;
  // PIX Limits
  pixMinTransactionAmount: number;
  pixMaxTransactionAmount: number;
  pixTimeoutMinutes: number;
  pixEnabled: boolean;
  // PIX API Fee
  pixApiFeeMode: FeeChargeMode;
  pixApiFeeFixed: number;
  pixApiFeePercentage: number;
  // PIX Checkout Fee
  pixCheckoutFeeMode: FeeChargeMode;
  pixCheckoutFeeFixed: number;
  pixCheckoutFeePercentage: number;
  // PIX Payment Link Fee
  pixPaymentLinkFeeMode: FeeChargeMode;
  pixPaymentLinkFeeFixed: number;
  pixPaymentLinkFeePercentage: number;
  // PIX Settlement Reserve
  pixReservePercentage: number;
  pixReserveCompensationDays: number;
  // Payment link visualization domains (multi-option per method)
  paymentLinkDomainOptions: PaymentLinkDomainMethodOptions[];
  // Legacy fallback fields (compatibility only)
  pixPaymentLinkBaseUrl: string;
  // Withdrawal Fee
  withdrawalFeeMode: FeeChargeMode;
  withdrawalFeeFixed: number;
  withdrawalFeePercentage: number;
  minWithdrawalAmount: number;
  withdrawalEnabled: boolean;
  selfNominalSwitchEnabled: boolean;
  // Withdrawal Approval Mode
  withdrawalApprovalMode: WithdrawalApprovalMode;
  // Rate Limiting
  rateLimitPerMinute: number;
  rateLimitPerHour: number;
  rateLimitPerDay: number;
  // Referral Settings
  referralDurationMonths: number;
  referralCommissionPercentage: number;
  referralCommissionWithdrawalIntervalValue: number;
  referralCommissionWithdrawalIntervalUnit: ReferralWithdrawalIntervalUnit;
  referralCommissionMinWithdrawalAmount: number;
  referralCommissionWithdrawalFeeFixed: number;
  // Automatic Cashout
  isAutomaticCashoutEnabled: boolean;
  automaticCashoutFrequency: AutomaticCashoutFrequency;
  automaticCashoutMinAmount: number;
  automaticCashoutMaxAmount: number | null;
  automaticCashoutPayoutAccountId: string | null;
  nextAutomaticCashoutAttemptAt: string | null;
  // SEO (optional - may not exist in backend yet)
  updatedAt: string;
}

export interface AdminUpdatePlatformSettingsRequest {
  // PIX Limits
  pixMinTransactionAmount?: number | null;
  pixMaxTransactionAmount?: number | null;
  pixTimeoutMinutes?: number | null;
  pixEnabled?: boolean | null;
  // PIX API Fee
  pixApiFeeMode?: FeeChargeMode | null;
  pixApiFeeFixed?: number | null;
  pixApiFeePercentage?: number | null;
  // PIX Checkout Fee
  pixCheckoutFeeMode?: FeeChargeMode | null;
  pixCheckoutFeeFixed?: number | null;
  pixCheckoutFeePercentage?: number | null;
  // PIX Payment Link Fee
  pixPaymentLinkFeeMode?: FeeChargeMode | null;
  pixPaymentLinkFeeFixed?: number | null;
  pixPaymentLinkFeePercentage?: number | null;
  // PIX Settlement Reserve
  pixReservePercentage?: number | null;
  pixReserveCompensationDays?: number | null;
  // Payment link visualization domains
  paymentLinkDomainOptions?: PaymentLinkDomainMethodOptions[] | null;
  // Legacy fallback fields (compatibility only)
  pixPaymentLinkBaseUrl?: string | null;
  // Withdrawal Fee
  withdrawalFeeMode?: FeeChargeMode | null;
  withdrawalFeeFixed?: number | null;
  withdrawalFeePercentage?: number | null;
  minWithdrawalAmount?: number | null;
  withdrawalEnabled?: boolean | null;
  selfNominalSwitchEnabled?: boolean | null;
  // Withdrawal Approval
  withdrawalApprovalMode?: WithdrawalApprovalMode | null;
  // Rate Limiting
  rateLimitPerMinute?: number | null;
  rateLimitPerHour?: number | null;
  rateLimitPerDay?: number | null;
  // Referral Settings
  referralDurationMonths?: number | null;
  referralCommissionPercentage?: number | null;
  referralCommissionWithdrawalIntervalValue?: number | null;
  referralCommissionWithdrawalIntervalUnit?: ReferralWithdrawalIntervalUnit | null;
  referralCommissionMinWithdrawalAmount?: number | null;
  referralCommissionWithdrawalFeeFixed?: number | null;
  // Automatic Cashout
  isAutomaticCashoutEnabled?: boolean | null;
  automaticCashoutFrequency?: AutomaticCashoutFrequency | null;
  automaticCashoutMinAmount?: number | null;
  automaticCashoutMaxAmount?: number | null;
  automaticCashoutPayoutAccountId?: string | null;
}

