import {
  MerchantStatus,
  MerchantKycStatus,
  MerchantKycPendingItemType,
  MerchantKycEvaluationStatus,
  MerchantOnboardingStep,
  MerchantKycDocumentType,
  MerchantIdentityDocumentType,
  MerchantKycOperationType,
  MerchantKycPendingItemStatus,
  MerchantKycPendingField,
  UserStatus,
  LedgerEntryType,
  AccountType,
  FeeChargeMode,
  MerchantAcquirerChangeAction,
  MerchantSettingsChangeCategory,
  ApprovalRateLevel,
  ProviderCategory,
} from "../enums";
import type { PaginationParams } from "../common";
import type { FileData } from "../merchant/crud";

// Admin Minimal Merchant (para listagem admin)
export interface AdminMinimalMerchant {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  name: string | null;
  document: string | null;
  email: string | null;
  status: MerchantStatus;
  kycStatus: MerchantKycStatus;
  onboardingStep: MerchantOnboardingStep;
  acquirerId: string | null;
  acquirerName: string | null;
  acquirerCode: string | null;
  acquirerNominal: string | null;
  acquirerLogoUrl: string | null;
  acquirerProviderCategory?: ProviderCategory | null;
  isNominalAbTestActive: boolean;
  acquirerOperationTypes: string[];
  lifetimeVolume: number;
  totalFeesPaid: number;
  availableBalance: number;
  pixApiFeeMode: FeeChargeMode | null;
  pixApiFeeFixed: number | null;
  pixApiFeePercentage: number | null;
  createdAt: string;
  kycSubmittedAt: string | null;
}

// Admin Merchant User Data
export interface AdminMerchantUserData {
  id: string;
  name: string | null;
  email: string | null;
  status: UserStatus;
  createdAt: string;
}

// Admin Merchant Address Data
export interface AdminMerchantAddressData {
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
}

// Admin Merchant KYC Data
export interface AdminMerchantKycData {
  legalName: string | null;
  documentType: MerchantKycDocumentType | null;
  documentNumber: string | null;
  identityDocumentType: MerchantIdentityDocumentType | null;
  identityDocumentNumber: string | null;
  operationType: MerchantKycOperationType | null;
  businessDescription: string | null;
  website: string | null;
  monthlyRevenue?: number | null;
  averageTicket?: number | null;
  usesPix?: boolean | null;
  rejectionReason: string | null;
  adminNotes: string | null;
  proofOfAddress: FileData | null;
  documentFront: FileData | null;
  documentBack: FileData | null;
  selfie: FileData | null;
  cnpjCard?: FileData | null;
  companyContract?: FileData | null;
}

// Admin Merchant Acquirer Data
export interface AdminMerchantAcquirerData {
  id: string;
  name: string;
  displayName: string | null;
  code: string;
  nominal: string | null;
  logoUrl: string | null;
  isActive: boolean;
  assignedAt: string;
  pixInFeeMode: string;
  pixInFeeFixed: number;
  pixInFeePercentage: number;
  payoutFeeMode: string;
  payoutFeeFixed: number;
  payoutFeePercentage: number;
}

// Admin Merchant KYC Pending Item Data
export interface AdminMerchantKycPendingItemData {
  id: string;
  type: MerchantKycPendingItemType;
  fieldKey: MerchantKycPendingField | null;
  title: string;
  description: string | null;
  status: MerchantKycPendingItemStatus;
  response: string | null;
  respondedAt: string | null;
  evaluatedAt: string | null;
  adminNotes: string | null;
  createdAt: string;
}

// Admin Merchant Details (Full)
export interface AdminMerchantDetails {
  id: string;
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
  whatsApp?: string | null;
  status: MerchantStatus;
  kycStatus: MerchantKycStatus;
  onboardingStep: MerchantOnboardingStep;
  user: AdminMerchantUserData;
  address: AdminMerchantAddressData | null;
  kyc: AdminMerchantKycData | null;
  acquirer: AdminMerchantAcquirerData | null;
  kycPendingItems: AdminMerchantKycPendingItemData[];
  createdAt: string;
  onboardingCompletedAt: string | null;
  kycSubmittedAt: string | null;
  kycApprovedAt: string | null;
  suspendedReason: string | null;
  inactiveReason: string | null;
}

export interface ReadListMerchantsRequest extends PaginationParams {
  status?: MerchantStatus | null;
  kycStatus?: MerchantKycStatus | null;
  search?: string | null;
  userId?: string | null;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AdminReadMerchantRequest {
  merchantId: string;
}

export interface AdminUpdateMerchantRequest {
  merchantId: string;
  status?: MerchantStatus | null;
  kycStatus?: MerchantKycStatus | null;
}

export interface AdminApproveKycRequest {
  merchantId: string;
}

export interface AdminRejectKycRequest {
  merchantId: string;
  reason?: string | null;
}

export interface EvaluatePendingItemRequest {
  type: MerchantKycPendingItemType;
  fieldKey: MerchantKycPendingField | null;
  title: string;
  description?: string | null;
}

export interface EvaluateMerchantKycRequest {
  merchantId: string;
  status: MerchantKycEvaluationStatus;
  reason?: string | null;
  pendingItems?: EvaluatePendingItemRequest[] | null;
}

// Evaluate KYC Pending Item
export enum KycPendingItemEvaluationStatus {
  Approved = "Approved",
  Rejected = "Rejected",
}

export interface EvaluateKycPendingItemRequest {
  merchantId: string;
  itemId: string;
  status: KycPendingItemEvaluationStatus;
  notes?: string | null;
}

export interface EvaluateKycPendingItemData {
  id: string;
  status: string;
  adminNotes: string | null;
  evaluatedAt: string | null;
}

// Admin Merchant Dashboard
export interface AdminMerchantKpiData {
  totalVolume: number;
  totalFees: number;
  approvalRate: number;
  approvalRateLevel?: ApprovalRateLevel;
  chargebackCount: number;
  chargebackRate: number;
  failedTransactions: number;
  failedRate: number;
  totalTransactions: number;
  completedTransactions: number;
  volumeToday: number;
  volumeThisWeek: number;
  volumeThisMonth: number;
}

export interface AdminMerchantBalanceData {
  currency: string;
  available: number;
  pending: number;
  reserved: number;
  total: number;
}

export interface AdminMerchantDashboardCacheInfo {
  lastUpdatedAt: string;
  nextUpdateAt: string;
  cacheDurationMinutes: number;
}

export interface AdminMerchantDailyVolumeData {
  date: string;
  volume: number;
  fees: number;
  transactionCount: number;
}

export interface AdminMerchantDashboardData {
  kpis: AdminMerchantKpiData;
  balance: AdminMerchantBalanceData;
  volumeChart: AdminMerchantDailyVolumeData[];
  cacheInfo: AdminMerchantDashboardCacheInfo;
}

// Admin Merchant Settings
export interface AdminMerchantSettingsData {
  id: string;
  merchantId: string;
  pixMinTransactionAmount: number | null;
  pixMaxTransactionAmount: number | null;
  pixEnabled: boolean | null;
  isPixEnabledInherited: boolean;
  pixApiFeeMode: string | null;
  pixApiFeeFixed: number | null;
  pixApiFeePercentage: number | null;
  pixCheckoutFeeMode: string | null;
  pixCheckoutFeeFixed: number | null;
  pixCheckoutFeePercentage: number | null;
  pixPaymentLinkFeeMode: string | null;
  pixPaymentLinkFeeFixed: number | null;
  pixPaymentLinkFeePercentage: number | null;
  pixReservePercentage: number | null;
  pixReserveCompensationDays: number | null;
  withdrawalFeeMode: string | null;
  withdrawalFeeFixed: number | null;
  withdrawalFeePercentage: number | null;
  minWithdrawalAmount: number | null;
  withdrawalEnabled: boolean | null;
  isWithdrawalEnabledInherited: boolean;
  withdrawalApprovalMode: string | null;
  rateLimitPerMinute: number | null;
  rateLimitPerHour: number | null;
  rateLimitPerDay: number | null;
  paymentLinkDomainSelection: MerchantPaymentLinkDomainSelection | null;
  isPaymentLinkDomainSelectionInherited: boolean;
  isAutomaticCashoutEnabled: boolean | null;
  automaticCashoutFrequency: string | null;
  automaticCashoutMinAmount: number | null;
  automaticCashoutMaxAmount: number | null;
  automaticCashoutPayoutAccountId: string | null;
  nextAutomaticCashoutAttemptAt: string | null;
  selfNominalSwitchEnabled: boolean;
  isSelfNominalSwitchEnabledInherited: boolean;
  isAutomaticCashoutEnabledSandbox: boolean;
  automaticCashoutFrequencySandbox: string;
  automaticCashoutMinAmountSandbox: number | null;
  automaticCashoutMaxAmountSandbox: number | null;
  automaticCashoutPayoutAccountIdSandbox: string | null;
  nextAutomaticCashoutAttemptAtSandbox: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MerchantSettingsFormData {
  pixMinTransactionAmount: string;
  pixMaxTransactionAmount: string;
  pixEnabled: 'default' | 'enabled' | 'disabled';
  selfNominalSwitchEnabled: 'default' | 'enabled' | 'disabled';
  pixApiFeeMode: string;
  pixApiFeeFixed: string;
  pixApiFeePercentage: string;
  pixCheckoutFeeMode: string;
  pixCheckoutFeeFixed: string;
  pixCheckoutFeePercentage: string;
  pixPaymentLinkFeeMode: string;
  pixPaymentLinkFeeFixed: string;
  pixPaymentLinkFeePercentage: string;
  pixReservePercentage: string;
  pixReserveCompensationDays: string;
  withdrawalFeeMode: string;
  withdrawalFeeFixed: string;
  withdrawalFeePercentage: string;
  minWithdrawalAmount: string;
  withdrawalEnabled: 'default' | 'enabled' | 'disabled';
  withdrawalApprovalMode: string;
  rateLimitPerMinute: string;
  rateLimitPerHour: string;
  rateLimitPerDay: string;
  paymentLinkPixOptionId: string;
}

export interface MerchantPaymentLinkDomainSelection {
  pixOptionId: string | null;
}

export interface AdminUpdateMerchantSettingsRequest {
  merchantId: string;
  pixMinTransactionAmount?: number | null;
  pixMaxTransactionAmount?: number | null;
  pixEnabled?: boolean | null;
  selfNominalSwitchEnabled?: boolean | null;
  pixApiFeeMode?: string | null;
  pixApiFeeFixed?: number | null;
  pixApiFeePercentage?: number | null;
  pixCheckoutFeeMode?: string | null;
  pixCheckoutFeeFixed?: number | null;
  pixCheckoutFeePercentage?: number | null;
  pixPaymentLinkFeeMode?: string | null;
  pixPaymentLinkFeeFixed?: number | null;
  pixPaymentLinkFeePercentage?: number | null;
  pixReservePercentage?: number | null;
  pixReserveCompensationDays?: number | null;
  withdrawalFeeMode?: string | null;
  withdrawalFeeFixed?: number | null;
  withdrawalFeePercentage?: number | null;
  minWithdrawalAmount?: number | null;
  withdrawalEnabled?: boolean | null;
  withdrawalApprovalMode?: string | null;
  rateLimitPerMinute?: number | null;
  rateLimitPerHour?: number | null;
  rateLimitPerDay?: number | null;
  paymentLinkDomainSelection?: MerchantPaymentLinkDomainSelection | null;
}

// Admin Payment Ledger
export interface AdminLedgerAccountData {
  id: string;
  type: AccountType;
}

export interface AdminLedgerEntryData {
  id: string;
  transactionId: string;
  type: LedgerEntryType;
  amount: number;
  timestamp: string;
  description: string;
  account: AdminLedgerAccountData;
}

export interface AdminPaymentLedgerData {
  paymentId: string;
  amount: number;
  platformFee: number;
  acquirerFee: number;
  netAmount: number;
  profit: number;
  entries: AdminLedgerEntryData[];
}

// Merchant Acquirer History
export interface AcquirerHistoryItem {
  id: string;
  action: MerchantAcquirerChangeAction;
  previousAcquirerId: string | null;
  previousAcquirerName: string | null;
  newAcquirerId: string | null;
  newAcquirerName: string | null;
  reason: string | null;
  isLegacyRecord: boolean;
  changedByUserId: string | null;
  changedByUserName: string | null;
  createdAt: string;
}

export interface ReadMerchantAcquirerHistoryRequest extends PaginationParams {
  merchantId: string;
}

// Merchant Settings History
export interface SettingsHistoryItem {
  id: string;
  category: MerchantSettingsChangeCategory;
  previousValuesJson: string | null;
  newValuesJson: string | null;
  changedFields: string | null;
  description: string | null;
  reason: string | null;
  isLegacyRecord: boolean;
  changedByUserId: string | null;
  changedByUserName: string | null;
  createdAt: string;
}

export interface ReadMerchantSettingsHistoryRequest extends PaginationParams {
  merchantId: string;
  category?: MerchantSettingsChangeCategory | null;
}

export interface AdminMerchantAcquirerBucket {
  merchantAcquirerId: string | null;
  acquirerName: string;
  acquirerDisplayName: string | null;
  acquirerCode: string | null;
  acquirerNominal: string | null;
  acquirerLogoUrl: string | null;
  isActive: boolean;
  available: number;
  pending: number;
  blocked: number;
  payoutsOut: number;
  totalIn: number;
}

export interface AdminMerchantBalanceTotals {
  lifetimeVolume: number;
  lifetimePayouts: number;
  lifetimeRefunds: number;
  lifetimeFeesPaid: number;
}

export interface AdminMerchantBalancesData {
  acquirers: AdminMerchantAcquirerBucket[];
  totals: AdminMerchantBalanceTotals;
}

