import type { UserStatus } from '@/types/enums';
import type { PixKeyType } from '@/types/enums';
import type { ReferralCommissionWithdrawalRequestStatus } from '@/types/enums';
import type { ReferralWithdrawalIntervalUnit } from '@/types/enums';
import type { ReferralCommissionMovementSourceType } from '@/types/enums';

export interface UserReferralReferredUser {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  referredAt: string | null;
  eligibleProfitFromPayments: number;
  eligibleProfitFromPayouts: number;
  estimatedCommissionFromPayments: number;
  estimatedCommissionFromPayouts: number;
  estimatedCommissionTotal: number;
}

export interface UserReferralsData {
  referralCode: string;
  referralLink: string;
  referralDurationMonths: number;
  referralCommissionPercentage: number;
  eligibleProfitFromPayments: number;
  eligibleProfitFromPayouts: number;
  estimatedCommissionFromPayments: number;
  estimatedCommissionFromPayouts: number;
  estimatedCommissionTotal: number;
  paidCommissionTotal: number;
  availableCommissionBalance: number;
  referralCommissionWithdrawalIntervalValue: number;
  referralCommissionWithdrawalIntervalUnit: ReferralWithdrawalIntervalUnit;
  referralCommissionMinWithdrawalAmount: number;
  referralCommissionWithdrawalFeeFixed: number;
  referralCommissionNextAllowedWithdrawalRequestAt: string | null;
  canRequestReferralCommissionWithdrawal: boolean;
  payoutPixKeyType: PixKeyType | null;
  payoutPixKey: string | null;
  withdrawalRequests: UserReferralCommissionWithdrawalRequest[];
  paymentHistory: UserReferralCommissionPaymentHistory[];
  referredUsers: UserReferralReferredUser[];
}

export interface UserReferralCommissionWithdrawalRequest {
  id: string;
  amount: number;
  feeAmount: number;
  netAmount: number;
  requestedAt: string;
  status: ReferralCommissionWithdrawalRequestStatus;
  notes: string | null;
  reviewReason: string | null;
}

export interface UserReferralCommissionPaymentHistory {
  id: string;
  amount: number;
  requestedAmount: number;
  feeAmount: number;
  netAmount: number;
  pixKeyType: PixKeyType | null;
  pixKey: string | null;
  paidByUserName: string | null;
  paidAt: string;
  notes: string | null;
  receiptFile: {
    id: string;
    originalFileName: string;
    contentType: string;
    size: number;
    url: string;
    expiresAt: string | null;
  } | null;
}

export interface UpdateUserReferralPayoutPixKeyRequest {
  verificationId: string;
  code: string;
  pixKeyType: PixKeyType;
  pixKey: string;
}

export interface UpdateUserReferralPayoutPixKeyData {
  pixKeyType: PixKeyType;
  pixKey: string;
  updatedAt: string;
}

export interface RequestUserReferralPayoutPixKeyUpdateData {
  verificationId: string;
  expiresAt: string;
  maskedEmail: string;
}

export interface CreateUserReferralCommissionWithdrawalRequestRequest {
  amount: number;
  notes?: string | null;
}

export interface CreateUserReferralCommissionWithdrawalRequestData {
  id: string;
  amount: number;
  feeAmount: number;
  netAmount: number;
  requestedAt: string;
  nextAllowedRequestAt: string;
  withdrawalIntervalValue: number;
  withdrawalIntervalUnit: ReferralWithdrawalIntervalUnit;
  minWithdrawalAmount: number;
  notes: string | null;
  status: ReferralCommissionWithdrawalRequestStatus;
}

export interface CancelUserReferralCommissionWithdrawalRequestData {
  requestId: string;
  status: ReferralCommissionWithdrawalRequestStatus;
  releasedAmount: number;
  availableCommissionBalance: number;
  pendingWithdrawalRequestsTotal: number;
}

export interface GenerateReferralLinkData {
	referralCode: string;
	referralLink: string;
}

export interface UserReferralReferredUserMovement {
  id: string;
  sourceType: ReferralCommissionMovementSourceType;
  sourceId: string;
  referralCommissionPercentage: number;
  commissionAmount: number;
  occurredAt: string;
  description: string | null;
}

export interface ReadUserReferralReferredUserMovementsRequest {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserReferralReferredUserMovementsData {
  referredUserId: string;
  referredUserName: string;
  referredUserEmail: string;
  referredUserStatus: UserStatus;
  referredAt: string | null;
  totalCommissionFromPayments: number;
  totalCommissionFromPayouts: number;
  totalCommissionAmount: number;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  movements: UserReferralReferredUserMovement[];
}
