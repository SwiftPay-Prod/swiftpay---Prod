import type { Key } from '@heroui/react';
import type {
	AdminPlatformSettingsData,
	PaymentLinkDomainMethodOptions,
	PaymentLinkDomainOption,
} from '@/types/admin/platform-settings';
import type { AdminPlatformPayoutAccountData } from '@/types/admin/platform-payouts';
import type { ApiResponse, Paginated } from '@/types/common';
import {
	AutomaticCashoutFrequency,
	FeeChargeMode,
	ReferralWithdrawalIntervalUnit,
	WithdrawalApprovalMode,
} from '@/types/enums';

export type PlatformSettingsPromise = Promise<ApiResponse<AdminPlatformSettingsData>>;
export type PlatformPayoutAccountsPromise = Promise<ApiResponse<Paginated<AdminPlatformPayoutAccountData>>>;

export interface PlatformSettingsFormProps {
	fetchPromise: PlatformSettingsPromise;
	payoutAccountsPromise: PlatformPayoutAccountsPromise;
}

export interface FormValues {
	pixMinTransactionAmount: string;
	pixMaxTransactionAmount: string;
	pixTimeoutMinutes: string;
	pixEnabled: boolean;
	pixApiFeeMode: FeeChargeMode;
	pixApiFeeFixed: string;
	pixApiFeePercentage: string;
	pixCheckoutFeeMode: FeeChargeMode;
	pixCheckoutFeeFixed: string;
	pixCheckoutFeePercentage: string;
	pixPaymentLinkFeeMode: FeeChargeMode;
	pixPaymentLinkFeeFixed: string;
	pixPaymentLinkFeePercentage: string;
	pixReservePercentage: string;
	pixReserveCompensationDays: string;
	paymentLinkDomainOptions: PaymentLinkDomainMethodOptions[];
	withdrawalFeeMode: FeeChargeMode;
	withdrawalFeeFixed: string;
	withdrawalFeePercentage: string;
	minWithdrawalAmount: string;
	withdrawalEnabled: boolean;
	selfNominalSwitchEnabled: boolean;
	withdrawalApprovalMode: WithdrawalApprovalMode;
	rateLimitPerMinute: string;
	rateLimitPerHour: string;
	rateLimitPerDay: string;
	referralDurationMonths: string;
	referralCommissionPercentage: string;
	referralCommissionWithdrawalIntervalValue: string;
	referralCommissionWithdrawalIntervalUnit: ReferralWithdrawalIntervalUnit;
	referralCommissionMinWithdrawalAmount: string;
	referralCommissionWithdrawalFeeFixed: string;
	isAutomaticCashoutEnabled: boolean;
	automaticCashoutFrequency: AutomaticCashoutFrequency;
	automaticCashoutMinAmount: string;
	automaticCashoutMaxAmount: string;
	automaticCashoutPayoutAccountId: string;
}

export interface DomainModalState {
	isOpen: boolean;
	method: import('@/types/enums').PaymentMethod | null;
	optionId: string | null;
	draft: PaymentLinkDomainOption | null;
	pendingRemovalKey: string | null;
}

export type FormFieldValueUpdater = <K extends keyof FormValues>(field: K, value: FormValues[K]) => void;
export type FormSelectValueUpdater = <K extends keyof FormValues>(field: K, key: Key | null) => void;
