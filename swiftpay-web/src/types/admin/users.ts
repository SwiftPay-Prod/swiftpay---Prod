import { PixKeyType, ReferralWithdrawalIntervalUnit, UserRole, UserStatus } from "../enums";
import type { PaginationParams } from "../common";

export interface AdminMinimalUser {
  id: string;
  name: string | null;
  email: string;
  whatsApp: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  merchantCount: number;
  referredUsersCount: number;
  availableCommissionBalance: number;
  wasReferred: boolean;
  referredAt: string | null;
  generatedReferralCommission: number;
  createdAt: string;
  lastLoginAt: string | null;
  rankingSuspendedUntil?: string | null;
  rankingSuspensionReason?: string | null;
}

export interface AdminReadListUsersRequest extends PaginationParams {
  role?: UserRole | null;
  status?: UserStatus | null;
  wasReferred?: boolean | null;
  search?: string | null;
  sortBy?: 'createdAt' | 'referredUsersCount' | 'availableCommissionBalance' | 'generatedReferralCommission';
  sortOrder?: 'asc' | 'desc';
}

export interface AdminReadUserRequest {
  userId: string;
}

export interface AdminUserMerchant {
  id: string;
  name: string;
  document: string;
  totalRevenue: number;
}

export interface AdminUserDetails {
  id: string;
  name: string | null;
  email: string;
  whatsApp: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  isLockedOut: boolean;
  failedLoginAttempts: number;
  inactiveReason: string | null;
  suspendedReason: string | null;
  lastLoginAt: string | null;
  lastLoginIpAddress: string | null;
  lastLoginUserAgent: string | null;
  lastLoginLocation: string | null;
  lockedOutAt: string | null;
  passwordChangedAt: string | null;
  referredByUserId: string | null;
  referredByUserName: string | null;
  referredByUserEmail: string | null;
  referredAt: string | null;
  referralDurationMonths: number | null;
  referralCommissionPercentage: number | null;
  referralCommissionWithdrawalIntervalValue: number | null;
  referralCommissionWithdrawalIntervalUnit: ReferralWithdrawalIntervalUnit | null;
  referralCommissionMinWithdrawalAmount: number | null;
  referralCommissionWithdrawalFeeFixed: number | null;
  referralPayoutPixKeyType: PixKeyType | null;
  referralPayoutPixKey: string | null;
  referralCommission: AdminUserReferralCommissionSummary;
  onboarding: AdminUserOnboarding;
  hasWayneProtocolAccess: boolean;
  createdAt: string;
  updatedAt: string;
  merchants: AdminUserMerchant[];
}

export interface AdminUserOnboarding {
	completed: boolean;
	completedAt: string | null;
	discovery: string[];
	discoveryOther: string | null;
	channels: string[];
	channelsOther: string | null;
	goals: string[];
}

export interface AdminUserReferralCommissionSummary {
  estimatedCommissionTotal: number;
  paidCommissionTotal: number;
  availableCommissionBalance: number;
  paymentHistory: AdminUserReferralCommissionPaymentHistory[];
}

export interface AdminUserReferralCommissionPaymentHistory {
  id: string;
  amount: number;
  paidAt: string;
  paidByUserId: string;
  paidByUserName: string | null;
  notes: string | null;
  pixKeyType: PixKeyType | null;
  pixKey: string | null;
}

export interface AdminUpdateUserReferralSettingsRequest {
  referralDurationMonths?: number | null;
  referralCommissionPercentage?: number | null;
  referralCommissionWithdrawalIntervalValue?: number | null;
  referralCommissionWithdrawalIntervalUnit?: ReferralWithdrawalIntervalUnit | null;
  referralCommissionMinWithdrawalAmount?: number | null;
  referralCommissionWithdrawalFeeFixed?: number | null;
}

export interface AdminUpdateUserReferralSettingsData {
  userId: string;
  referralDurationMonths: number | null;
  referralCommissionPercentage: number | null;
  referralCommissionWithdrawalIntervalValue: number | null;
  referralCommissionWithdrawalIntervalUnit: ReferralWithdrawalIntervalUnit | null;
  referralCommissionMinWithdrawalAmount: number | null;
  referralCommissionWithdrawalFeeFixed: number | null;
}

export interface AdminUpdateUserRequest {
  userId: string;
  name?: string | null;
  role?: UserRole | null;
  status?: UserStatus | null;
}

export interface AdminActivateUserRequest {
  userId: string;
}

export interface AdminSuspendUserRequest {
  userId: string;
  reason: string;
}

export interface AdminInactivateUserRequest {
  userId: string;
  reason: string;
}

export interface AdminDeactivateUserRequest {
  userId: string;
}

export interface AdminUpdateUserRoleRequest {
  userId: string;
  role: UserRole;
}

export interface AdminUpdateUserRoleData {
  userId: string;
  role: UserRole;
  roleDisplayName: string;
}

export interface AdminCreateReferralCommissionPaymentRequest {
  amount: number;
  notes?: string | null;
}

export interface AdminReferralCommissionPaymentData {
  id: string;
  referrerUserId: string;
  amount: number;
  availableCommissionBalance: number;
  paidAt: string;
  notes: string | null;
  pixKeyType: PixKeyType | null;
  pixKey: string | null;
}

export interface AdminAssignUserReferrerRequest {
  referrerUserId: string;
  processHistoricalCommission: boolean;
}

export interface AdminAssignUserReferrerData {
  userId: string;
  referrerUserId: string;
  referredAt: string;
  processHistoricalCommission: boolean;
  isProcessingAsync: boolean;
  processedPaymentsCount: number;
  processedPayoutsCount: number;
}

export interface AdminPreviewAssignUserReferrerData {
  userId: string;
  referrerUserId: string;
  referredAt: string;
  referralWindowEndAt: string;
  referralCommissionPercentage: number;
  eligiblePaymentsCount: number;
  eligiblePayoutsCount: number;
  eligibleProfitFromPayments: number;
  eligibleProfitFromPayouts: number;
  estimatedCommissionFromPayments: number;
  estimatedCommissionFromPayouts: number;
  estimatedCommissionTotal: number;
}

export interface AdminSuspendFromRankingRequest {
  durationValue: number;
  durationUnit: 'Hours' | 'Days';
  reason: string;
}

