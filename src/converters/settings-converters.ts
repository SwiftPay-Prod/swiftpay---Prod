import type {
	AdminMerchantSettingsData,
	AdminUpdateMerchantSettingsRequest,
	MerchantSettingsFormData,
} from '@/types/admin/merchants';
import type { AdminPlatformSettingsData } from '@/types/admin/platform-settings';
import { FeeChargeMode, WithdrawalApprovalMode } from '@/types/enums';
import {
	centsToFormattedCurrency,
	formattedCurrencyToCents,
	basisPointsToPercentage,
	percentageToBasisPoints,
} from '@/utils/currency';

function nullableBooleanToFeatureFlag(
	value: boolean | null | undefined,
	isInherited?: boolean
): 'default' | 'enabled' | 'disabled' {
	if (isInherited) return 'default';
	if (value === null || value === undefined) return 'default';
	return value ? 'enabled' : 'disabled';
}

function featureFlagToNullableBoolean(value: 'default' | 'enabled' | 'disabled'): boolean | null {
	if (value === 'default') return null;
	return value === 'enabled';
}

function parseNullableInteger(value: string): number | null {
	const trimmed = value.trim();
	if (trimmed.length === 0) return null;
	const parsed = Number(trimmed);
	if (!Number.isFinite(parsed)) return null;
	return Math.floor(parsed);
}

export function merchantSettingsToFormData(
	settings: AdminMerchantSettingsData | null,
	_platformSettings?: AdminPlatformSettingsData | null
): MerchantSettingsFormData {
	return {
		pixMinTransactionAmount: centsToFormattedCurrency(settings?.pixMinTransactionAmount),
		pixMaxTransactionAmount: centsToFormattedCurrency(settings?.pixMaxTransactionAmount),
		pixEnabled: nullableBooleanToFeatureFlag(settings?.pixEnabled, settings?.isPixEnabledInherited),
		selfNominalSwitchEnabled: nullableBooleanToFeatureFlag(
			settings?.selfNominalSwitchEnabled,
			settings?.isSelfNominalSwitchEnabledInherited
		),
		pixApiFeeMode: settings?.pixApiFeeMode ?? 'default',
		pixApiFeeFixed: centsToFormattedCurrency(settings?.pixApiFeeFixed),
		pixApiFeePercentage: basisPointsToPercentage(settings?.pixApiFeePercentage),
		pixCheckoutFeeMode: settings?.pixCheckoutFeeMode ?? 'default',
		pixCheckoutFeeFixed: centsToFormattedCurrency(settings?.pixCheckoutFeeFixed),
		pixCheckoutFeePercentage: basisPointsToPercentage(settings?.pixCheckoutFeePercentage),
		pixPaymentLinkFeeMode: settings?.pixPaymentLinkFeeMode ?? 'default',
		pixPaymentLinkFeeFixed: centsToFormattedCurrency(settings?.pixPaymentLinkFeeFixed),
		pixPaymentLinkFeePercentage: basisPointsToPercentage(settings?.pixPaymentLinkFeePercentage),
		pixReservePercentage: basisPointsToPercentage(settings?.pixReservePercentage),
		pixReserveCompensationDays: settings?.pixReserveCompensationDays?.toString() ?? '',
		withdrawalFeeMode: settings?.withdrawalFeeMode ?? 'default',
		withdrawalFeeFixed: centsToFormattedCurrency(settings?.withdrawalFeeFixed),
		withdrawalFeePercentage: basisPointsToPercentage(settings?.withdrawalFeePercentage),
		minWithdrawalAmount: centsToFormattedCurrency(settings?.minWithdrawalAmount),
		withdrawalEnabled: nullableBooleanToFeatureFlag(settings?.withdrawalEnabled, settings?.isWithdrawalEnabledInherited),
		withdrawalApprovalMode: settings?.withdrawalApprovalMode ?? 'default',
		rateLimitPerMinute: settings?.rateLimitPerMinute?.toString() ?? '',
		rateLimitPerHour: settings?.rateLimitPerHour?.toString() ?? '',
		rateLimitPerDay: settings?.rateLimitPerDay?.toString() ?? '',
		paymentLinkPixOptionId: settings?.paymentLinkDomainSelection?.pixOptionId ?? '',
	};
}

export function formDataToMerchantSettingsRequest(
	formData: MerchantSettingsFormData
): Omit<AdminUpdateMerchantSettingsRequest, 'merchantId'> {
	return {
		pixMinTransactionAmount: formattedCurrencyToCents(formData.pixMinTransactionAmount),
		pixMaxTransactionAmount: formattedCurrencyToCents(formData.pixMaxTransactionAmount),
		pixEnabled: featureFlagToNullableBoolean(formData.pixEnabled),
		selfNominalSwitchEnabled: featureFlagToNullableBoolean(formData.selfNominalSwitchEnabled),
		pixApiFeeMode:
			formData.pixApiFeeMode === 'default' ? null : (formData.pixApiFeeMode as FeeChargeMode),
		pixApiFeeFixed:
			formData.pixApiFeeMode === 'default'
				? null
				: formattedCurrencyToCents(formData.pixApiFeeFixed),
		pixApiFeePercentage:
			formData.pixApiFeeMode === 'default'
				? null
				: percentageToBasisPoints(formData.pixApiFeePercentage),
		pixCheckoutFeeMode:
			formData.pixCheckoutFeeMode === 'default'
				? null
				: (formData.pixCheckoutFeeMode as FeeChargeMode),
		pixCheckoutFeeFixed:
			formData.pixCheckoutFeeMode === 'default'
				? null
				: formattedCurrencyToCents(formData.pixCheckoutFeeFixed),
		pixCheckoutFeePercentage:
			formData.pixCheckoutFeeMode === 'default'
				? null
				: percentageToBasisPoints(formData.pixCheckoutFeePercentage),
		pixPaymentLinkFeeMode:
			formData.pixPaymentLinkFeeMode === 'default'
				? null
				: (formData.pixPaymentLinkFeeMode as FeeChargeMode),
		pixPaymentLinkFeeFixed:
			formData.pixPaymentLinkFeeMode === 'default'
				? null
				: formattedCurrencyToCents(formData.pixPaymentLinkFeeFixed),
		pixPaymentLinkFeePercentage:
			formData.pixPaymentLinkFeeMode === 'default'
				? null
				: percentageToBasisPoints(formData.pixPaymentLinkFeePercentage),
		pixReservePercentage: percentageToBasisPoints(formData.pixReservePercentage),
		pixReserveCompensationDays: parseNullableInteger(formData.pixReserveCompensationDays),
		withdrawalFeeMode:
			formData.withdrawalFeeMode === 'default'
				? null
				: (formData.withdrawalFeeMode as FeeChargeMode),
		withdrawalFeeFixed:
			formData.withdrawalFeeMode === 'default'
				? null
				: formattedCurrencyToCents(formData.withdrawalFeeFixed),
		withdrawalFeePercentage:
			formData.withdrawalFeeMode === 'default'
				? null
				: percentageToBasisPoints(formData.withdrawalFeePercentage),
		minWithdrawalAmount: formattedCurrencyToCents(formData.minWithdrawalAmount),
		withdrawalEnabled: featureFlagToNullableBoolean(formData.withdrawalEnabled),
		withdrawalApprovalMode:
			formData.withdrawalApprovalMode === 'default'
				? null
				: (formData.withdrawalApprovalMode as WithdrawalApprovalMode),
		rateLimitPerMinute: formData.rateLimitPerMinute ? parseInt(formData.rateLimitPerMinute) : null,
		rateLimitPerHour: formData.rateLimitPerHour ? parseInt(formData.rateLimitPerHour) : null,
		rateLimitPerDay: formData.rateLimitPerDay ? parseInt(formData.rateLimitPerDay) : null,
		paymentLinkDomainSelection: formData.paymentLinkPixOptionId
			? {
				pixOptionId: formData.paymentLinkPixOptionId || null,
			}
			: null,
	};
}
