import { AcquirerType, AcquirerOperationType, FeeChargeMode, WebhookAuthMode, MerchantStatus, MerchantKycDocumentType, PayoutFeeHandling, PaymentFeeSplitHandling, ApprovalRateLevel, ProviderCategory, ExternalSubmerchantStatus } from "../enums";
import type { PaginationParams } from "../common";
import type { DashboardPeriod } from "../merchant/dashboard";

export { WebhookAuthMode, ProviderCategory, ExternalSubmerchantStatus };

// Credential Field Schema (dynamic credentials system)
export interface CredentialFieldSchema {
  key: string;
  label: string;
  type: 'text' | 'password';
  required: boolean;
  placeholder: string | null;
  description: string | null;
}

export interface AcquirerAccessAccount {
  login: string;
  password: string;
  description: string | null;
}

export interface AdminAcquirerData {
  id: string;
  name: string;
  displayName: string | null;
  code: string;
  description: string | null;
  nominal: string | null;
  logoUrl: string | null;
  type: AcquirerType;
  providerCategory: ProviderCategory;
  operationTypes: AcquirerOperationType[];
  isActive: boolean;
  hideFromMerchantNominalSelection: boolean;
  clonedFromId: string | null;

  // Enabled Operations
  pixEnabled: boolean;
  boletoEnabled: boolean;
  creditCardEnabled: boolean;

  // API Configuration (masked for security)
  apiBaseUrl: string | null;
  apiBaseUrlProduction: string | null;
  apiBaseUrlSandbox: string | null;
  authType: string | null;
  webhookToken: string | null;

  // Dynamic Credentials System
  credentialSchema: CredentialFieldSchema[] | null;
  hasDefaultCredentials: boolean;
  hasDefaultCredentialsSandbox: boolean;
  defaultCredentials: Record<string, string> | null;
  defaultCredentialsSandbox: Record<string, string> | null;

  // Features
  supportsPix: boolean;
  supportsCreditCard: boolean;
  supportsBoleto: boolean;
  supportsWithdrawal: boolean;

  // Webhook Configuration
  webhookAuthMode: WebhookAuthMode;
  hasWebhookToken: boolean;
  hasWebhookAllowedIps: boolean;
  webhookAllowedIps: string | null;
  webhookPath: string | null;
  webhookUrl: string | null;
  isWebhookConfigured: boolean;

  // Documentation
  documentationUrl: string | null;
  webhookDocumentationUrl: string | null;

  // Access accounts in acquirer panel/site
  accessAccounts: AcquirerAccessAccount[];

  // Settlement compensation configuration
  pixHasCompensation: boolean;
  pixCompensationDays: number;
  boletoHasCompensation: boolean;
  boletoCompensationDays: number;
  creditCardHasCompensation: boolean;
  creditCardCompensationDays: number;

  // PIX In Fees (Acquirer charges)
  pixInFeeMode: FeeChargeMode | null;
  pixInFeeFixed: number | null;
  pixInFeePercentage: number | null;

  // BOLETO In Fees (Acquirer charges)
  boletoInFeeMode: FeeChargeMode | null;
  boletoInFeeFixed: number | null;
  boletoInFeePercentage: number | null;

  // Credit Card In Fees (Acquirer charges)
  creditCardInFeeMode: FeeChargeMode | null;
  creditCardInFeeFixed: number | null;
  creditCardInFeePercentage: number | null;

  // Payout Fees (Acquirer charges)
  payoutFeeMode: FeeChargeMode | null;
  payoutFeeFixed: number | null;
  payoutFeePercentage: number | null;
  payoutFeeHandling: PayoutFeeHandling;

  // Fee Split Handling (Auto split by acquirer)
  pixFeeSplitHandling: PaymentFeeSplitHandling;
  boletoFeeSplitHandling: PaymentFeeSplitHandling;
  creditCardFeeSplitHandling: PaymentFeeSplitHandling;

  // Transaction Limits
  minPixAmount: number;
  maxPixAmount: number;
  minBoletoAmount: number;
  maxBoletoAmount: number;
  minCreditCardAmount: number;
  maxCreditCardAmount: number;
  minPayoutAmount: number;
  maxPayoutAmount: number;

  // Additional Info
  totalMerchants: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAcquirerPixNominalHistoryItem {
  id: string;
  merchantName: string | null;
  previousNominal: string | null;
  newNominal: string;
  source: 'Manual' | 'Automatic';
  changedByUserId: string | null;
  changedByUserName: string | null;
  detectedFromPaymentId: string | null;
  createdAt: string;
}

export interface AdminReadListAcquirersRequest extends PaginationParams {
  isActive?: boolean | null;
  providerCategory?: ProviderCategory | null;
  search?: string | null;
}

export interface AdminReadAcquirerRequest {
  acquirerId: string;
}

export interface AdminUpdateAcquirerRequest {
  acquirerId: string;
  isActive?: boolean | null;
  hideFromMerchantNominalSelection?: boolean | null;
  displayName?: string | null;
  logoUrl?: string | null;
  operationTypes?: AcquirerOperationType[] | null;
  webhookAuthMode?: WebhookAuthMode | null;
  webhookToken?: string | null;
  webhookAllowedIps?: string | null;
  apiBaseUrlProduction?: string | null;
  apiBaseUrlSandbox?: string | null;

  // Dynamic Credentials System
  defaultCredentials?: Record<string, string> | null;
  defaultCredentialsSandbox?: Record<string, string> | null;

  // Access accounts in acquirer panel/site
  accessAccounts?: AcquirerAccessAccount[] | null;

  // Funcionalidades (o que a adquirente suporta tecnicamente)
  supportsPix?: boolean | null;
  supportsBoleto?: boolean | null;
  supportsCreditCard?: boolean | null;
  supportsWithdrawal?: boolean | null;

  // Operações Habilitadas
  pixEnabled?: boolean | null;
  boletoEnabled?: boolean | null;
  creditCardEnabled?: boolean | null;

  // Settlement compensation configuration
  pixHasCompensation?: boolean | null;
  pixCompensationDays?: number | null;
  boletoHasCompensation?: boolean | null;
  boletoCompensationDays?: number | null;
  creditCardHasCompensation?: boolean | null;
  creditCardCompensationDays?: number | null;
  
  // PIX In Fees
  pixInFeeMode?: FeeChargeMode | null;
  pixInFeeFixed?: number | null;
  pixInFeePercentage?: number | null;

  // BOLETO In Fees
  boletoInFeeMode?: FeeChargeMode | null;
  boletoInFeeFixed?: number | null;
  boletoInFeePercentage?: number | null;

  // Credit Card In Fees
  creditCardInFeeMode?: FeeChargeMode | null;
  creditCardInFeeFixed?: number | null;
  creditCardInFeePercentage?: number | null;
  
  // Payout Fees
  payoutFeeMode?: FeeChargeMode | null;
  payoutFeeFixed?: number | null;
  payoutFeePercentage?: number | null;
  payoutFeeHandling?: PayoutFeeHandling | null;

  // Fee Split Handling
  pixFeeSplitHandling?: PaymentFeeSplitHandling | null;
  boletoFeeSplitHandling?: PaymentFeeSplitHandling | null;
  creditCardFeeSplitHandling?: PaymentFeeSplitHandling | null;

  // Transaction Limits
  minPixAmount?: number | null;
  maxPixAmount?: number | null;
  minBoletoAmount?: number | null;
  maxBoletoAmount?: number | null;
  minCreditCardAmount?: number | null;
  maxCreditCardAmount?: number | null;
  minPayoutAmount?: number | null;
  maxPayoutAmount?: number | null;
  
  // Sync option
  syncToMerchantAcquirers?: boolean;
}

export interface AdminUpdateAcquirerData {
  id: string;
  name: string;
  displayName: string | null;
  code: string;
  isActive: boolean;
  hideFromMerchantNominalSelection: boolean;
  operationTypes: AcquirerOperationType[];
  webhookAuthMode: WebhookAuthMode;
  hasWebhookToken: boolean;
  hasWebhookAllowedIps: boolean;
  accessAccounts: AcquirerAccessAccount[];
  supportsPix: boolean;
  supportsBoleto: boolean;
  supportsCreditCard: boolean;
  supportsWithdrawal: boolean;
  pixEnabled: boolean;
  boletoEnabled: boolean;
  creditCardEnabled: boolean;
  pixHasCompensation: boolean;
  pixCompensationDays: number;
  boletoHasCompensation: boolean;
  boletoCompensationDays: number;
  creditCardHasCompensation: boolean;
  creditCardCompensationDays: number;
}

export interface AdminCreateAcquirerAccessAccountRequest {
  acquirerId: string;
  login: string;
  password: string;
  description?: string | null;
}

export interface AdminCreateAcquirerAccessAccountData {
  acquirerId: string;
  accessAccounts: AcquirerAccessAccount[];
}

export interface AdminDeleteAcquirerAccessAccountRequest {
  acquirerId: string;
  accountIndex: number;
}

export interface AdminDeleteAcquirerAccessAccountData {
  acquirerId: string;
  accessAccounts: AcquirerAccessAccount[];
}

// Set Merchant Acquirer
export interface AdminSetMerchantAcquirerRequest {
  merchantId: string;
  acquirerId: string;
  apiKey?: string | null;
  apiSecret?: string | null;
  clientId?: string | null;
  clientSecret?: string | null;
  credentials?: Record<string, string> | null;
  setAsDefault?: boolean;
  reason?: string | null;
}

export interface AdminSetMerchantAcquirerData {
  merchantAcquirerId: string;
  message: string;
}

// Create Acquirer
export interface AdminCreateAcquirerRequest {
  acquirerType: AcquirerType;
  displayName: string;
  description?: string | null;
  accessAccounts?: AcquirerAccessAccount[] | null;
  pixEnabled?: boolean | null;
  boletoEnabled?: boolean | null;
  creditCardEnabled?: boolean | null;
}

export interface AdminCreateAcquirerData {
  id: string;
  name: string;
  code: string;
  displayName: string | null;
  description: string | null;
  type: string;
  operationTypes: string[];
  isActive: boolean;
  supportsPix: boolean;
  supportsBoleto: boolean;
  supportsCreditCard: boolean;
  pixEnabled: boolean;
  boletoEnabled: boolean;
  creditCardEnabled: boolean;
  accessAccounts: AcquirerAccessAccount[];
  createdAt: string;
}

// Acquirer Stats
export interface AdminReadAcquirerStatsRequest {
  acquirerId: string;
  period?: DashboardPeriod;
  startDate?: string;
  endDate?: string;
}

export interface AdminAcquirerChartItem {
  date: string;
  value: number;
}

export interface AdminAcquirerKpis {
  totalMerchants: number;
  totalTransactions: number;
  completedTransactions: number;
  failedTransactions: number;
  expiredTransactions: number;
  approvalRate: number;
  approvalRateLevel?: ApprovalRateLevel;
  failureRate: number;
  totalVolume: number;
  volumeToday: number;
  volumeThisWeek: number;
  volumeThisMonth: number;
  totalAcquirerFees: number;
  totalPlatformFees: number;
  totalProfit: number;
  totalPayouts: number;
  totalPayoutVolume: number;
  totalPayoutAcquirerFees: number;
  totalPayoutPlatformFees: number;
  totalPayoutProfit: number;
  // Growth rates
  volumeGrowth: number | null;
  transactionsGrowth: number | null;
  approvalRateGrowth: number | null;
  failedRateGrowth: number | null;
  profitGrowth: number | null;
  growthComparisonLabel: string | null;
}

export interface AdminAcquirerStatsCacheInfo {
  calculatedAt: string;
  expiresAt: string;
  isFromCache: boolean;
  isProcessing: boolean;
  cacheDurationMinutes: number;
}

export interface AdminAcquirerPeriodInfo {
  period: string;
  startDate: string;
  endDate: string;
  label: string;
}

export interface AdminAcquirerStatsData {
  kpis: AdminAcquirerKpis;
  volumeChart: AdminAcquirerChartItem[];
  profitChart: AdminAcquirerChartItem[];
  cacheInfo: AdminAcquirerStatsCacheInfo;
  periodInfo: AdminAcquirerPeriodInfo;
}

// Acquirer Merchants
export interface AcquirerMerchantData {
  merchantAcquirerId: string;
  id: string;
  name: string | null;
  legalName: string | null;
  documentNumber: string | null;
  documentType: MerchantKycDocumentType | null;
  status: MerchantStatus;
  isActive: boolean;
  isDefault: boolean;
  usesSubaccount: boolean;
  externalSubmerchantId: string | null;
  externalSubmerchantStatus: ExternalSubmerchantStatus | null;
  externalOnboardingSubmittedAt: string | null;
  externalOnboardingCompletedAt: string | null;
  externalOnboardingRejectionReason: string | null;
  createdAt: string;
}

export interface AdminReadAcquirerMerchantsRequest extends PaginationParams {
  acquirerId: string;
  search?: string | null;
  externalSubmerchantStatus?: ExternalSubmerchantStatus | null;
  hasExternalSubmerchant?: boolean | null;
}

// Submerchant (IP KYC)
export interface AdminSubmitMerchantSubmerchantRequest {
  acquirerId: string;
  merchantId: string;
  bankAccount?: {
    bankCode: string;
    branchNumber: string;
    accountNumber: string;
    accountType: string;
  } | null;
}

export interface AdminSubmitMerchantSubmerchantData {
  merchantAcquirerId: string;
  externalSubmerchantId: string;
  status: ExternalSubmerchantStatus;
  rejectionReason?: string | null;
}

export interface AdminRefreshSubmerchantStatusData {
  merchantAcquirerId: string;
  externalSubmerchantId: string | null;
  status: ExternalSubmerchantStatus;
  legalName: string | null;
  documentType: string | null;
  documentNumber: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  rejectionReason: string | null;
}

// Required Fields Config
export interface AcquirerFieldRequirement {
  name: string;
  label: string;
  type: string;
  required: boolean;
  description: string | null;
  source: string | null;
  example: string | null;
}

export interface AcquirerAuthConfig {
  method: string;
  description: string;
  fields: AcquirerFieldRequirement[];
}

export interface AcquirerOperationConfig {
  supported: boolean;
  description: string;
  endpoint: string;
  amountFormat: string;
  fields: AcquirerFieldRequirement[];
}

export interface AcquirerRequiredFieldsConfig {
  auth: AcquirerAuthConfig;
  pix: AcquirerOperationConfig | null;
  boleto: AcquirerOperationConfig | null;
  creditCard: AcquirerOperationConfig | null;
  withdrawal: AcquirerOperationConfig | null;
}

