import { PixKeyType, PayoutAccountStatus, PayoutAccountActionType } from '../enums';

export interface CashoutAccountData {
	id: string;
	pixKeyType: PixKeyType;
	pixKey: string;
	holderName: string | null;
	bankName: string | null;
	status: PayoutAccountStatus;
	isDefault: boolean;
	createdAt: string;
}

export interface CashoutAccountListData {
	id: string;
	pixKeyType: PixKeyType;
	pixKey: string;
	holderName: string | null;
	bankName: string | null;
	status: PayoutAccountStatus;
	isDefault: boolean;
	createdAt: string;
}

export interface ListCashoutAccountsRequest {
	merchantId: string;
	statuses?: PayoutAccountStatus[];
}

export interface ListCashoutAccountsData {
	items: CashoutAccountListData[];
	totalItems: number;
}

export interface CreateCashoutAccountRequest {
	merchantId: string;
	pixKeyType: PixKeyType;
	pixKey: string;
	holderName: string;
	bankName?: string | null;
	isDefault?: boolean;
}

export interface VerifyCashoutAccountRequest {
	merchantId: string;
	accountId: string;
	code: string;
}

export interface ResendVerificationCodeRequest {
	merchantId: string;
	accountId: string;
}

export interface RequestCashoutAccountActionRequest {
	merchantId: string;
	accountId: string;
	actionType: PayoutAccountActionType;
}

export interface RequestCashoutAccountActionData {
	accountId: string;
	actionType: PayoutAccountActionType;
	expiresInMinutes: number;
}

export interface SetDefaultCashoutAccountRequest {
	merchantId: string;
	accountId: string;
	code: string;
}

export interface DeleteCashoutAccountRequest {
	merchantId: string;
	accountId: string;
	code: string;
}

export interface ViewCashoutAccountRequest {
	merchantId: string;
	accountId: string;
	code: string;
}

export interface ViewCashoutAccountData {
	id: string;
	pixKeyType: PixKeyType;
	pixKey: string;
	holderName: string | null;
	holderDocument: string | null;
	bankName: string | null;
	bankIspb: string | null;
	status: PayoutAccountStatus;
	isDefault: boolean;
	createdAt: string;
}

export interface CashoutAccountsFilters {
	statuses?: PayoutAccountStatus[];
}

