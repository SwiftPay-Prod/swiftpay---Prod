import type { PaginationParams } from '../common';
import { PixKeyType, ReferralCommissionWithdrawalRequestStatus, ReferralWithdrawalIntervalUnit, UserStatus } from '../enums';

export interface AdminReadListReferralsRequest extends PaginationParams {
	referrerUserId?: string | null;
	referredUserStatus?: UserStatus | null;
	search?: string | null;
}

export interface AdminReferralsSummaryData {
	totalReferredUsers: number;
	totalReferrers: number;
	totalEstimatedCommissionFromPayments: number;
	totalEstimatedCommissionFromPayouts: number;
	totalEstimatedCommission: number;
}

export interface AdminMinimalReferredUser {
	id: string;
	name: string;
	email: string;
	status: UserStatus;
	referredAt: string | null;
	referrerUserId: string;
	referrerName: string;
	referrerEmail: string;
	estimatedCommissionFromPayments: number;
	estimatedCommissionFromPayouts: number;
	estimatedCommissionTotal: number;
}

export interface AdminReferralsData {
	summary: AdminReferralsSummaryData;
	referredUsers: {
		items: AdminMinimalReferredUser[];
		totalItems: number;
		page: number;
		pageSize: number;
		totalPages: number;
	};
}

export interface AdminReadListReferralCommissionWithdrawalRequestsRequest extends PaginationParams {
	status?: ReferralCommissionWithdrawalRequestStatus | null;
	search?: string | null;
	userId?: string | null;
}

export interface AdminMinimalReferralCommissionWithdrawalRequest {
	id: string;
	referrerUserId: string;
	referrerName: string;
	referrerEmail: string;
	amount: number;
	requestedAt: string;
	status: ReferralCommissionWithdrawalRequestStatus;
	notes: string | null;
}

export interface AdminReferralCommissionWithdrawalRequestDetails {
	id: string;
	referrerUserId: string;
	referrerName: string;
	referrerEmail: string;
	referrerStatus: UserStatus;
	requestedAmount: number;
	requestedAt: string;
	status: ReferralCommissionWithdrawalRequestStatus;
	requestNotes: string | null;
	reviewReason: string | null;
	availableCommissionBalance: number;
	pendingWithdrawalRequestsTotal: number;
	referralDurationMonths: number;
	referralCommissionPercentage: number;
	referralCommissionWithdrawalIntervalValue: number;
	referralCommissionWithdrawalIntervalUnit: ReferralWithdrawalIntervalUnit;
	referralCommissionMinWithdrawalAmount: number;
	referralCommissionWithdrawalFeeFixed: number;
	payoutPixKeyType: PixKeyType | null;
	payoutPixKey: string | null;
	payment: AdminReferralCommissionWithdrawalPaymentDetails | null;
}

export interface AdminReferralCommissionWithdrawalPaymentDetails {
	id: string;
	paidAmount: number;
	requestedAmount: number;
	feeAmount: number;
	netAmount: number;
	paidAt: string;
	notes: string | null;
	ledgerTransactionId: string | null;
	paidByUserId: string;
	paidByUserName: string;
	paidByUserEmail: string;
	pixKeyType: PixKeyType | null;
	pixKey: string | null;
	receiptFile: {
		id: string;
		originalFileName: string;
		contentType: string;
		size: number;
		url: string;
		expiresAt: string | null;
	} | null;
}

export interface AdminEvaluateReferralCommissionWithdrawalRequestRequest {
	status: ReferralCommissionWithdrawalRequestStatus.Reviewed | ReferralCommissionWithdrawalRequestStatus.Cancelled;
	amount?: number | null;
	notes?: string | null;
	reason?: string | null;
	receiptFileId?: string | null;
}

export interface AdminEvaluateReferralCommissionWithdrawalRequestData {
	requestId: string;
	referrerUserId: string;
	status: ReferralCommissionWithdrawalRequestStatus;
	paymentId: string | null;
	paidAmount: number;
	releasedAmount: number;
	availableCommissionBalance: number;
	pendingWithdrawalRequestsTotal: number;
	reason: string | null;
}