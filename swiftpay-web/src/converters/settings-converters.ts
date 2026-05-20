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
		boletoMinTransactionAmount: centsToFormattedCurrency(settings?.boletoMinTransactionAmount),
		boletoMaxTransactionAmount: centsToFormattedCurrency(settings?.boletoMaxTransactionAmount),
		boletoEnabled: nullableBooleanToFeatureFlag(settings?.boletoEnabled, settings?.isBoletoEnabledInherited),
		creditCardEnabled: nullableBooleanToFeatureFlag(settings?.creditCardEnabled, settings?.isCreditCardEnabledInherited),
		boletoApiFeeMode: settings?.boletoApiFeeMode ?? 'default',
		boletoApiFeeFixed: centsToFormattedCurrency(settings?.boletoApiFeeFixed),
		boletoApiFeePercentage: basisPointsToPercentage(settings?.boletoApiFeePercentage),
		boletoCheckoutFeeMode: settings?.boletoCheckoutFeeMode ?? 'default',
		boletoCheckoutFeeFixed: centsToFormattedCurrency(settings?.boletoCheckoutFeeFixed),
		boletoCheckoutFeePercentage: basisPointsToPercentage(settings?.boletoCheckoutFeePercentage),
		boletoPaymentLinkFeeMode: settings?.boletoPaymentLinkFeeMode ?? 'default',
		boletoPaymentLinkFeeFixed: centsToFormattedCurrency(settings?.boletoPaymentLinkFeeFixed),
		boletoPaymentLinkFeePercentage: basisPointsToPercentage(settings?.boletoPaymentLinkFeePercentage),
		boletoReservePercentage: basisPointsToPercentage(settings?.boletoReservePercentage),
		boletoReserveCompensationDays: settings?.boletoReserveCompensationDays?.toString() ?? '',
		creditCardApiFeeMode: settings?.creditCardApiFeeMode ?? 'default',
		creditCardApiFeeFixed: centsToFormattedCurrency(settings?.creditCardApiFeeFixed),
		creditCardApiFeePercentage: basisPointsToPercentage(settings?.creditCardApiFeePercentage),
		creditCardApiInstallmentFeePercentage: basisPointsToPercentage(settings?.creditCardApiInstallmentFeePercentage),
		creditCardCheckoutFeeMode: settings?.creditCardCheckoutFeeMode ?? 'default',
		creditCardCheckoutFeeFixed: centsToFormattedCurrency(settings?.creditCardCheckoutFeeFixed),
		creditCardCheckoutFeePercentage: basisPointsToPercentage(settings?.creditCardCheckoutFeePercentage),
		creditCardCheckoutInstallmentFeePercentage: basisPointsToPercentage(settings?.creditCardCheckoutInstallmentFeePercentage),
		creditCardPaymentLinkFeeMode: settings?.creditCardPaymentLinkFeeMode ?? 'default',
		creditCardPaymentLinkFeeFixed: centsToFormattedCurrency(settings?.creditCardPaymentLinkFeeFixed),
		creditCardPaymentLinkFeePercentage: basisPointsToPercentage(settings?.creditCardPaymentLinkFeePercentage),
		creditCardPaymentLinkInstallmentFeePercentage: basisPointsToPercentage(settings?.creditCardPaymentLinkInstallmentFeePercentage),
		creditCardReservePercentage: basisPointsToPercentage(settings?.creditCardReservePercentage),
		creditCardReserveCompensationDays: settings?.creditCardReserveCompensationDays?.toString() ?? '',
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
		paymentLinkBoletoOptionId: settings?.paymentLinkDomainSelection?.boletoOptionId ?? '',
		paymentLinkCreditCardOptionId: settings?.paymentLinkDomainSelection?.creditCardOptionId ?? '',
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
		boletoMinTransactionAmount: formattedCurrencyToCents(formData.boletoMinTransactionAmount),
		boletoMaxTransactionAmount: formattedCurrencyToCents(formData.boletoMaxTransactionAmount),
		boletoEnabled: featureFlagToNullableBoolean(formData.boletoEnabled),
		creditCardEnabled: featureFlagToNullableBoolean(formData.creditCardEnabled),
		boletoApiFeeMode:
			formData.boletoApiFeeMode === 'default' ? null : (formData.boletoApiFeeMode as FeeChargeMode),
		boletoApiFeeFixed:
			formData.boletoApiFeeMode === 'default'
				? null
				: formattedCurrencyToCents(formData.boletoApiFeeFixed),
		boletoApiFeePercentage:
			formData.boletoApiFeeMode === 'default'
				? null
				: percentageToBasisPoints(formData.boletoApiFeePercentage),
		boletoCheckoutFeeMode:
			formData.boletoCheckoutFeeMode === 'default'
				? null
				: (formData.boletoCheckoutFeeMode as FeeChargeMode),
		boletoCheckoutFeeFixed:
			formData.boletoCheckoutFeeMode === 'default'
				? null
				: formattedCurrencyToCents(formData.boletoCheckoutFeeFixed),
		boletoCheckoutFeePercentage:
			formData.boletoCheckoutFeeMode === 'default'
				? null
				: percentageToBasisPoints(formData.boletoCheckoutFeePercentage),
		boletoPaymentLinkFeeMode:
			formData.boletoPaymentLinkFeeMode === 'default'
				? null
				: (formData.boletoPaymentLinkFeeMode as FeeChargeMode),
		boletoPaymentLinkFeeFixed:
			formData.boletoPaymentLinkFeeMode === 'default'
				? null
				: formattedCurrencyToCents(formData.boletoPaymentLinkFeeFixed),
		boletoPaymentLinkFeePercentage:
			formData.boletoPaymentLinkFeeMode === 'default'
				? null
				: percentageToBasisPoints(formData.boletoPaymentLinkFeePercentage),
		boletoReservePercentage: percentageToBasisPoints(formData.boletoReservePercentage),
		boletoReserveCompensationDays: parseNullableInteger(formData.boletoReserveCompensationDays),
		creditCardApiFeeMode:
			formData.creditCardApiFeeMode === 'default'
				? null
				: (formData.creditCardApiFeeMode as FeeChargeMode),
		creditCardApiFeeFixed:
			formData.creditCardApiFeeMode === 'default'
				? null
				: formattedCurrencyToCents(formData.creditCardApiFeeFixed),
		creditCardApiFeePercentage:
			formData.creditCardApiFeeMode === 'default'
				? null
				: percentageToBasisPoints(formData.creditCardApiFeePercentage),
		creditCardApiInstallmentFeePercentage:
			formData.creditCardApiFeeMode === 'default'
				? null
				: percentageToBasisPoints(formData.creditCardApiInstallmentFeePercentage),
		creditCardCheckoutFeeMode:
			formData.creditCardCheckoutFeeMode === 'default'
				? null
				: (formData.creditCardCheckoutFeeMode as FeeChargeMode),
		creditCardCheckoutFeeFixed:
			formData.creditCardCheckoutFeeMode === 'default'
				? null
				: formattedCurrencyToCents(formData.creditCardCheckoutFeeFixed),
		creditCardCheckoutFeePercentage:
			formData.creditCardCheckoutFeeMode === 'default'
				? null
				: percentageToBasisPoints(formData.creditCardCheckoutFeePercentage),
		creditCardCheckoutInstallmentFeePercentage:
			formData.creditCardCheckoutFeeMode === 'default'
				? null
				: percentageToBasisPoints(formData.creditCardCheckoutInstallmentFeePercentage),
		creditCardPaymentLinkFeeMode:
			formData.creditCardPaymentLinkFeeMode === 'default'
				? null
				: (formData.creditCardPaymentLinkFeeMode as FeeChargeMode),
		creditCardPaymentLinkFeeFixed:
			formData.creditCardPaymentLinkFeeMode === 'default'
				? null
				: formattedCurrencyToCents(formData.creditCardPaymentLinkFeeFixed),
		creditCardPaymentLinkFeePercentage:
			formData.creditCardPaymentLinkFeeMode === 'default'
				? null
				: percentageToBasisPoints(formData.creditCardPaymentLinkFeePercentage),
		creditCardPaymentLinkInstallmentFeePercentage:
			formData.creditCardPaymentLinkFeeMode === 'default'
				? null
				: percentageToBasisPoints(formData.creditCardPaymentLinkInstallmentFeePercentage),
		creditCardReservePercentage: percentageToBasisPoints(formData.creditCardReservePercentage),
		creditCardReserveCompensationDays: parseNullableInteger(formData.creditCardReserveCompensationDays),
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
		paymentLinkDomainSelection:
			formData.paymentLinkPixOptionId ||
			formData.paymentLinkBoletoOptionId ||
			formData.paymentLinkCreditCardOptionId
				? {
					pixOptionId: formData.paymentLinkPixOptionId || null,
					boletoOptionId: formData.paymentLinkBoletoOptionId || null,
					creditCardOptionId: formData.paymentLinkCreditCardOptionId || null,
				}
				: null,
	};
}

