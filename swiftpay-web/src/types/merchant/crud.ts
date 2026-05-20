import {
  MerchantStatus,
  MerchantKycStatus,
  MerchantOnboardingStep,
  MerchantKycDocumentType,
  MerchantIdentityDocumentType,
  MerchantKycOperationType,
  FeeChargeMode,
} from "../enums";

// Address Data
export interface AddressData {
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
}

// File Data
export interface FileData {
  id: string;
  originalFileName: string;
  contentType: string;
  size: number;
  url: string;
  expiresAt: string | null;
}

// Merchant KYC Data
export interface MerchantKycData {
  legalName: string | null;
  documentType: MerchantKycDocumentType | null;
  documentNumber: string | null;
  identityDocumentType: MerchantIdentityDocumentType | null;
  identityDocumentNumber: string | null;
  operationType: MerchantKycOperationType | null;
  businessDescription: string | null;
  website: string | null;
  monthlyRevenue: number | null;
  averageTicket: number | null;
  usesPix: boolean;
  usesBoleto: boolean;
  usesCreditCard: boolean;
  proofOfAddress: FileData | null;
  documentFront: FileData | null;
  documentBack: FileData | null;
  selfie: FileData | null;
  cnpjCard: FileData | null;
  companyContract: FileData | null;
  rejectionReason: string | null;
  adminNotes: string | null;
}

// Merchant KYC Pending Item Data
export interface MerchantKycPendingItemData {
  id: string;
  type: string;
  fieldKey: string | null;
  title: string;
  description: string | null;
  status: string;
  response: string | null;
  respondedAt: string | null;
  evaluatedAt: string | null;
  adminNotes: string | null;
  createdAt: string;
}

// Merchant Fees Data
export interface MerchantFeesData {
  pixApiFeeMode: FeeChargeMode;
  pixApiFeeFixed: number;
  pixApiFeePercentage: number;
  pixCheckoutFeeMode: FeeChargeMode;
  pixCheckoutFeeFixed: number;
  pixCheckoutFeePercentage: number;
  withdrawalFeeMode: FeeChargeMode;
  withdrawalFeeFixed: number;
  withdrawalFeePercentage: number;
  minWithdrawalAmount: number;
}

// Merchant Data (Full)
export interface MerchantData {
  id: string;
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
  whatsApp: string | null;
  status: MerchantStatus;
  kycStatus: MerchantKycStatus;
  onboardingStep: MerchantOnboardingStep;
  suspendedReason: string | null;
  inactiveReason: string | null;
  address: AddressData | null;
  kyc: MerchantKycData | null;
  kycPendingItems: MerchantKycPendingItemData[];
  fees: MerchantFeesData | null;
  createdAt: string;
  onboardingCompletedAt: string | null;
}

// Minimal Merchant (para listagem do usuário)
export interface MinimalMerchant {
  id: string;
  name: string | null;
  email: string | null;
  document: string | null;
  status: MerchantStatus;
  kycStatus: MerchantKycStatus;
  onboardingStep: MerchantOnboardingStep;
  createdAt: string;
  onboardingCompletedAt: string | null;
  availableBalance: number | null;
  fees: MerchantFeesData | null;
}

// Create Merchant
export interface CreateMerchantRequest {
  name?: string | null;
}

// Read Merchant
export interface ReadMerchantRequest {
  id: string;
}

// Update Merchant
export interface UpdateMerchantRequest {
  id: string;
  name?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  whatsApp?: string | null;
  address?: string | null;
  addressNumber?: string | null;
  addressComplement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  legalName?: string | null;
  documentType?: MerchantKycDocumentType | null;
  documentNumber?: string | null;
  identityDocumentType?: MerchantIdentityDocumentType | null;
  identityDocumentNumber?: string | null;
  operationType?: MerchantKycOperationType | null;
  businessDescription?: string | null;
  website?: string | null;
  monthlyRevenue?: number | null;
  averageTicket?: number | null;
  usesPix?: boolean | null;
  usesBoleto?: boolean | null;
  usesCreditCard?: boolean | null;
  proofOfAddressFileId?: string | null;
  documentFrontFileId?: string | null;
  documentBackFileId?: string | null;
  selfieFileId?: string | null;
  cnpjCardFileId?: string | null;
  companyContractFileId?: string | null;
}

// Submit Onboarding
export interface SubmitOnboardingRequest {
  id: string;
}

// Request Delete Merchant
export interface RequestDeleteMerchantRequest {
  merchantId: string;
}

export interface RequestDeleteMerchantResponse {
  message: string | null;
  error: { message: string | null } | null;
}

// Confirm Delete Merchant
export interface ConfirmDeleteMerchantRequest {
  merchantId: string;
  code: string;
}

export interface ConfirmDeleteMerchantResponse {
  message: string | null;
  error: { message: string | null } | null;
}

