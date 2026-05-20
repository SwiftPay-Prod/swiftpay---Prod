import { PaymentEnvironment, PayoutStatus, PixKeyType, SimulateCashoutAction } from '../enums';
import type { PaginationParams } from '../common';

export interface CashoutAccountSummary {
	id: string;
	pixKeyType: PixKeyType;
	pixKey: string;
}

export interface CashoutAccountDetail {
	id: string;
	pixKeyType: PixKeyType;
	pixKey: string;
	holderName: string | null;
	bankName: string | null;
}

export interface CashoutListItem {
	id: string;
	amount: number;
	feeAmount: number;
	netAmount: number;
	status: PayoutStatus;
	pixEndToEndId: string | null;
	failureReason: string | null;
	payoutAccount: CashoutAccountSummary | null;
	inlinePixKeyType?: string | null;
	inlinePixKey?: string | null;
	requestedAt: string;
	processedAt: string | null;
	completedAt: string | null;
}

export interface ListCashoutsRequest extends PaginationParams {
	merchantId: string;
	status?: PayoutStatus | null;
	search?: string | null;
	payoutAccountId?: string | null;
	startDate?: string | null;
	endDate?: string | null;
}

export interface CashoutDetailData {
	id: string;
	amount: number;
	feeAmount: number;
	netAmount: number;
	status: PayoutStatus;
	pixEndToEndId: string | null;
	failureReason: string | null;
	payoutAccount: CashoutAccountDetail;
	evaluation: CashoutEvaluationDetail | null;
	requestedAt: string;
	processedAt: string | null;
	completedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface CashoutEvaluationDetail {
	evaluatedAt: string;
}

export interface CreateCashoutRequest {
	merchantId: string;
	amount: number;
	payoutAccountId?: string | null;
	merchantAcquirerId?: string | null;
	consolidateAllAcquirers?: boolean;
}

export interface CreateCashoutData {
	id: string;
	amount: number;
	platformFee: number;
	netAmount: number;
	pixKey: string;
	pixKeyType: string;
	status: PayoutStatus;
	requiresApproval: boolean;
}

export interface CancelCashoutRequest {
	merchantId: string;
	cashoutId: string;
}

export interface CashoutsFilters {
	status?: PayoutStatus | null;
	environment?: PaymentEnvironment | null;
	search?: string | null;
	payoutAccountId?: string | null;
	startDate?: string | null;
	endDate?: string | null;
	page?: number;
	pageSize?: number;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
}

export interface SimulateCashoutRequest {
	cashoutId: string;
	action: SimulateCashoutAction;
}

export interface SimulateCashoutPixData {
	endToEndId: string | null;
	acquirerTransactionId: string | null;
}

export interface SimulateCashoutData {
	id: string;
	status: PayoutStatus;
	pix: SimulateCashoutPixData;
}

export interface PreviewCashoutRequest {
	amount: number;
	availableBalance: number;
	merchantAcquirerId?: string | null;
	consolidateAllAcquirers?: boolean;
}

export interface PreviewCashoutData {
	amount: number;
	fee: number;
	netAmount: number;
	maxWithdrawableAmount: number;
	withdrawNowAvailable: number;
	requiresFullWithdrawalNow: boolean;
	hasSufficientBalance: boolean;
	isConsolidated: boolean;
	operationCount: number;
}

