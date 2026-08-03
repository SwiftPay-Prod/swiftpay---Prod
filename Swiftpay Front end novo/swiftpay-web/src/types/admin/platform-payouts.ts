import type { PixKeyType, PaymentEnvironment, PlatformPayoutStatus, PlatformPayoutItemStatus, FeeChargeMode } from '../enums';
import type { PaginationParams } from '../common';

export interface AdminPlatformPayoutAccountData {
	id: string;
	pixKeyType: string;
	pixKey: string;
	holderName: string | null;
	holderDocument: string | null;
	bankName: string | null;
	bankIspb: string | null;
	isActive: boolean;
	deactivatedAt: string | null;
	createdByUserId: string;
	createdByUserName: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface AdminCreatePlatformPayoutAccountRequest {
	pixKeyType: PixKeyType;
	pixKey: string;
	holderName: string;
	holderDocument: string;
	bankName?: string | null;
	bankIspb?: string | null;
}

export interface AdminUpdatePlatformPayoutAccountRequest {
	pixKeyType?: PixKeyType | null;
	pixKey?: string | null;
	holderName?: string | null;
	holderDocument?: string | null;
	bankName?: string | null;
	bankIspb?: string | null;
}

export type AdminListPlatformPayoutAccountsRequest = PaginationParams;

export interface AdminPlatformPayoutAccountInfo {
	id: string;
	pixKeyType: string;
	pixKey: string;
	holderName: string;
	bankName: string | null;
}

export interface AdminPlatformPayoutItemData {
	id: string;
	acquirerId: string;
	acquirerName: string;
	acquirerCode: string;
	acquirerLogoUrl: string | null;
	amount: number;
	acquirerFee: number;
	netAmount: number;
	status: PlatformPayoutItemStatus;
	acquirerTransactionId: string | null;
	pixEndToEndId: string | null;
	failureReason: string | null;
	processedAt: string | null;
	completedAt: string | null;
}

export interface AdminPlatformPayoutData {
	id: string;
	platformPayoutAccountId: string;
	environment: PaymentEnvironment;
	totalAmount: number;
	totalFee: number;
	totalNetAmount: number;
	status: PlatformPayoutStatus;
	notes: string | null;
	requestedByUserId: string;
	requestedByUserName: string | null;
	requestedAt: string;
	completedAt: string | null;
	payoutAccount: AdminPlatformPayoutAccountInfo | null;
	items: AdminPlatformPayoutItemData[];
	createdAt: string;
}

export interface AdminListPlatformPayoutsRequest extends PaginationParams {
	status?: PlatformPayoutStatus | null;
}

export interface AdminPreviewPlatformPayoutAcquirerItem {
	acquirerId: string;
	amount: number;
}

export interface AdminPreviewPlatformPayoutRequest {
	totalAmount?: number | null;
	acquirerItems?: AdminPreviewPlatformPayoutAcquirerItem[] | null;
	includeAllAcquirers?: boolean | null;
}

export interface AdminPreviewPlatformPayoutItemData {
	acquirerId: string;
	acquirerName: string;
	acquirerCode: string;
	acquirerLogoUrl: string | null;
	availableBalance: number;
	amount: number;
	acquirerFee: number;
	netAmount: number;
	payoutFeeMode: FeeChargeMode;
	payoutFeeFixed: number;
	payoutFeePercentage: number;
}

export interface AdminPreviewPlatformPayoutData {
	totalAvailableAmount: number;
	totalAmount: number;
	totalFee: number;
	totalNetAmount: number;
	items: AdminPreviewPlatformPayoutItemData[];
}

export interface AdminCreatePlatformPayoutRequest {
	platformPayoutAccountId?: string | null;
	totalAmount?: number | null;
	acquirerItems?: AdminPreviewPlatformPayoutAcquirerItem[] | null;
	notes?: string | null;
}

