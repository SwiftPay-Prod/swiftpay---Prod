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
  showSafefyBranding: boolean;
}

export interface PaymentLinkDomainMethodOptions {
  method: PaymentMethod;
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
  // BOLETO Limits
  boletoMinTransactionAmount: number;
  boletoMaxTransactionAmount: number;
  boletoEnabled: boolean;
  creditCardEnabled: boolean;
  // Payment link visualization domains (multi-option per method)
  paymentLinkDomainOptions: PaymentLinkDomainMethodOptions[];
  // Legacy fallback fields (compatibility only)
  pixPaymentLinkBaseUrl: string;
  boletoPaymentLinkBaseUrl: string;
  creditCardPaymentLinkBaseUrl: string;
  // BOLETO API Fee
  boletoApiFeeMode: FeeChargeMode;
  boletoApiFeeFixed: number;
  boletoApiFeePercentage: number;
  // BOLETO Checkout Fee
  boletoCheckoutFeeMode: FeeChargeMode;
  boletoCheckoutFeeFixed: number;
  boletoCheckoutFeePercentage: number;
  // BOLETO Payment Link Fee
  boletoPaymentLinkFeeMode: FeeChargeMode;
  boletoPaymentLinkFeeFixed: number;
  boletoPaymentLinkFeePercentage: number;
  // BOLETO Settlement Reserve
  boletoReservePercentage: number;
  boletoReserveCompensationDays: number;
  // Credit Card API Fee
  creditCardApiFeeMode: FeeChargeMode;
  creditCardApiFeeFixed: number;
  creditCardApiFeePercentage: number;
  creditCardApiInstallmentFeePercentage: number;
  // Credit Card Checkout Fee
  creditCardCheckoutFeeMode: FeeChargeMode;
  creditCardCheckoutFeeFixed: number;
  creditCardCheckoutFeePercentage: number;
  creditCardCheckoutInstallmentFeePercentage: number;
  // Credit Card Payment Link Fee
  creditCardPaymentLinkFeeMode: FeeChargeMode;
  creditCardPaymentLinkFeeFixed: number;
  creditCardPaymentLinkFeePercentage: number;
  creditCardPaymentLinkInstallmentFeePercentage: number;
  // Credit Card Settlement Reserve
  creditCardReservePercentage: number;
  creditCardReserveCompensationDays: number;
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
  // BOLETO Limits
  boletoMinTransactionAmount?: number | null;
  boletoMaxTransactionAmount?: number | null;
  boletoEnabled?: boolean | null;
  creditCardEnabled?: boolean | null;
  // Payment link visualization domains
  paymentLinkDomainOptions?: PaymentLinkDomainMethodOptions[] | null;
  // Legacy fallback fields (compatibility only)
  pixPaymentLinkBaseUrl?: string | null;
  boletoPaymentLinkBaseUrl?: string | null;
  creditCardPaymentLinkBaseUrl?: string | null;
  // BOLETO API Fee
  boletoApiFeeMode?: FeeChargeMode | null;
  boletoApiFeeFixed?: number | null;
  boletoApiFeePercentage?: number | null;
  // BOLETO Checkout Fee
  boletoCheckoutFeeMode?: FeeChargeMode | null;
  boletoCheckoutFeeFixed?: number | null;
  boletoCheckoutFeePercentage?: number | null;
  // BOLETO Payment Link Fee
  boletoPaymentLinkFeeMode?: FeeChargeMode | null;
  boletoPaymentLinkFeeFixed?: number | null;
  boletoPaymentLinkFeePercentage?: number | null;
  // BOLETO Settlement Reserve
  boletoReservePercentage?: number | null;
  boletoReserveCompensationDays?: number | null;
  // Credit Card API Fee
  creditCardApiFeeMode?: FeeChargeMode | null;
  creditCardApiFeeFixed?: number | null;
  creditCardApiFeePercentage?: number | null;
  creditCardApiInstallmentFeePercentage?: number | null;
  // Credit Card Checkout Fee
  creditCardCheckoutFeeMode?: FeeChargeMode | null;
  creditCardCheckoutFeeFixed?: number | null;
  creditCardCheckoutFeePercentage?: number | null;
  creditCardCheckoutInstallmentFeePercentage?: number | null;
  // Credit Card Payment Link Fee
  creditCardPaymentLinkFeeMode?: FeeChargeMode | null;
  creditCardPaymentLinkFeeFixed?: number | null;
  creditCardPaymentLinkFeePercentage?: number | null;
  creditCardPaymentLinkInstallmentFeePercentage?: number | null;
  // Credit Card Settlement Reserve
  creditCardReservePercentage?: number | null;
  creditCardReserveCompensationDays?: number | null;
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



