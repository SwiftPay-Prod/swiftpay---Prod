import type { ParseColor } from '@/parse';
import {
	basisPointsToPercentage,
	centsToFormattedCurrency,
	formattedCurrencyToCents,
	percentageToBasisPoints,
} from '@/utils/currency';
import type {
	AdminPlatformSettingsData,
	AdminUpdatePlatformSettingsRequest,
	PaymentLinkDomainMethodOptions,
} from '@/types/admin/platform-settings';
import { PaymentMethod } from '@/types/enums';
import type { FormValues } from './platform-settings-form.types';

export function intervalUnitLabel(unit: import('@/types/enums').ReferralWithdrawalIntervalUnit): string {
	return unit === 'Months' ? 'meses' : 'dias';
}

export function shouldShowFixedFeeInput(mode: import('@/types/enums').FeeChargeMode): boolean {
	return mode !== 'PercentageOnly';
}

export function shouldShowPercentageFeeInput(mode: import('@/types/enums').FeeChargeMode): boolean {
	return mode !== 'FixedOnly';
}

export function getFeeInputGridClass(mode: import('@/types/enums').FeeChargeMode): string {
	return shouldShowFixedFeeInput(mode) && shouldShowPercentageFeeInput(mode)
		? 'grid grid-cols-1 gap-4 2xl:grid-cols-3'
		: 'grid grid-cols-1 gap-4 2xl:grid-cols-2';
}

export function safeTrim(value: string | null | undefined): string {
	return typeof value === 'string' ? value.trim() : '';
}

export function displayCurrency(value: string | null | undefined): string {
	const trimmed = safeTrim(value);
	return trimmed.length > 0 ? trimmed : 'R$ 0,00';
}

export function displayPercentage(value: string | null | undefined): string {
	const trimmed = safeTrim(value);
	return trimmed.length > 0 ? `${trimmed}%` : '0,00%';
}

export function displayDays(value: string | null | undefined): string {
	const trimmed = safeTrim(value);
	return trimmed.length > 0 ? `${trimmed} dias` : '0 dias';
}

export function isValidHttpUrl(value: string | null | undefined): boolean {
	const trimmed = safeTrim(value);
	if (!trimmed) {
		return true;
	}

	try {
		const url = new URL(trimmed);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		return false;
	}
}

export function clonePaymentLinkDomainOptions(
	options: PaymentLinkDomainMethodOptions[] | null | undefined
): PaymentLinkDomainMethodOptions[] {
	if (!options || options.length === 0) {
		return [];
	}

	return options.map((group) => ({
		method: group.method,
		options: (group.options ?? []).map((option) => ({ ...option })),
	}));
}

export function paymentMethodLabel(method: PaymentMethod): string {
	switch (method) {
		case PaymentMethod.Pix:
			return 'PIX';
		case PaymentMethod.Boleto:
			return 'Boleto';
		case PaymentMethod.CreditCard:
			return 'Cartão';
		default:
			return method;
	}
}

export function paymentMethodColor(method: PaymentMethod): ParseColor {
	switch (method) {
		case PaymentMethod.Pix:
			return 'success';
		case PaymentMethod.Boleto:
			return 'warning';
		case PaymentMethod.CreditCard:
			return 'accent';
		default:
			return 'default';
	}
}

export function buildFallbackDomainOptionsFromLegacy(settings: AdminPlatformSettingsData): PaymentLinkDomainMethodOptions[] {
	const items: Array<{ method: PaymentMethod; baseUrl: string | null | undefined }> = [
		{ method: PaymentMethod.Pix, baseUrl: settings.pixPaymentLinkBaseUrl },
		{ method: PaymentMethod.Boleto, baseUrl: settings.boletoPaymentLinkBaseUrl },
		{ method: PaymentMethod.CreditCard, baseUrl: settings.creditCardPaymentLinkBaseUrl },
	];

	return items
		.filter((item) => safeTrim(item.baseUrl).length > 0)
		.map((item) => ({
			method: item.method,
			options: [
				{
					id: `${item.method.toLowerCase()}-default`,
					name: `${paymentMethodLabel(item.method)} padrão`,
					baseUrl: safeTrim(item.baseUrl),
					isDefault: true,
					showSwiftPayBranding: true,
				},
			],
		}));
}

export function resolveDefaultDomainOptionName(method: PaymentMethod, options: PaymentLinkDomainMethodOptions[]): string {
	const methodOptions = options.find((group) => group.method === method)?.options ?? [];
	if (methodOptions.length === 0) {
		return 'Nenhum domínio configurado';
	}

	const defaultOption = methodOptions.find((option) => option.isDefault) ?? methodOptions[0];
	return defaultOption?.name ?? 'Nenhum domínio configurado';
}

export function buildDomainOptionId(method: PaymentMethod, index: number): string {
	const timestamp = Date.now();
	return `${method.toLowerCase()}-domain-${timestamp}-${index}`;
}

export function buildDomainEditorKey(method: PaymentMethod, optionId: string): string {
	return `${method}:${optionId}`;
}

export function hasConfiguredPercentage(value: string): boolean {
	const basisPoints = percentageToBasisPoints(value);
	return basisPoints !== null && basisPoints > 0;
}

export function hasConfiguredDays(value: string): boolean {
	const days = Number(value);
	return Number.isFinite(days) && days > 0;
}

export function mapSettingsToForm(settings: AdminPlatformSettingsData): FormValues {
	const domainOptions = clonePaymentLinkDomainOptions(settings.paymentLinkDomainOptions);
	const normalizedDomainOptions =
		domainOptions.length > 0 ? domainOptions : buildFallbackDomainOptionsFromLegacy(settings);

	return {
		pixMinTransactionAmount: centsToFormattedCurrency(settings.pixMinTransactionAmount),
		pixMaxTransactionAmount: centsToFormattedCurrency(settings.pixMaxTransactionAmount),
		pixTimeoutMinutes: String(settings.pixTimeoutMinutes),
		pixEnabled: settings.pixEnabled,
		pixApiFeeMode: settings.pixApiFeeMode,
		pixApiFeeFixed: centsToFormattedCurrency(settings.pixApiFeeFixed),
		pixApiFeePercentage: basisPointsToPercentage(settings.pixApiFeePercentage),
		pixCheckoutFeeMode: settings.pixCheckoutFeeMode,
		pixCheckoutFeeFixed: centsToFormattedCurrency(settings.pixCheckoutFeeFixed),
		pixCheckoutFeePercentage: basisPointsToPercentage(settings.pixCheckoutFeePercentage),
		pixPaymentLinkFeeMode: settings.pixPaymentLinkFeeMode,
		pixPaymentLinkFeeFixed: centsToFormattedCurrency(settings.pixPaymentLinkFeeFixed),
		pixPaymentLinkFeePercentage: basisPointsToPercentage(settings.pixPaymentLinkFeePercentage),
		pixReservePercentage: basisPointsToPercentage(settings.pixReservePercentage),
		pixReserveCompensationDays: String(settings.pixReserveCompensationDays),
		boletoMinTransactionAmount: centsToFormattedCurrency(settings.boletoMinTransactionAmount),
		boletoMaxTransactionAmount: centsToFormattedCurrency(settings.boletoMaxTransactionAmount),
		boletoEnabled: settings.boletoEnabled,
		creditCardEnabled: settings.creditCardEnabled,
		paymentLinkDomainOptions: normalizedDomainOptions,
		boletoApiFeeMode: settings.boletoApiFeeMode,
		boletoApiFeeFixed: centsToFormattedCurrency(settings.boletoApiFeeFixed),
		boletoApiFeePercentage: basisPointsToPercentage(settings.boletoApiFeePercentage),
		boletoCheckoutFeeMode: settings.boletoCheckoutFeeMode,
		boletoCheckoutFeeFixed: centsToFormattedCurrency(settings.boletoCheckoutFeeFixed),
		boletoCheckoutFeePercentage: basisPointsToPercentage(settings.boletoCheckoutFeePercentage),
		boletoPaymentLinkFeeMode: settings.boletoPaymentLinkFeeMode,
		boletoPaymentLinkFeeFixed: centsToFormattedCurrency(settings.boletoPaymentLinkFeeFixed),
		boletoPaymentLinkFeePercentage: basisPointsToPercentage(settings.boletoPaymentLinkFeePercentage),
		boletoReservePercentage: basisPointsToPercentage(settings.boletoReservePercentage),
		boletoReserveCompensationDays: String(settings.boletoReserveCompensationDays),
		creditCardApiFeeMode: settings.creditCardApiFeeMode,
		creditCardApiFeeFixed: centsToFormattedCurrency(settings.creditCardApiFeeFixed),
		creditCardApiFeePercentage: basisPointsToPercentage(settings.creditCardApiFeePercentage),
		creditCardApiInstallmentFeePercentage: basisPointsToPercentage(settings.creditCardApiInstallmentFeePercentage),
		creditCardCheckoutFeeMode: settings.creditCardCheckoutFeeMode,
		creditCardCheckoutFeeFixed: centsToFormattedCurrency(settings.creditCardCheckoutFeeFixed),
		creditCardCheckoutFeePercentage: basisPointsToPercentage(settings.creditCardCheckoutFeePercentage),
		creditCardCheckoutInstallmentFeePercentage: basisPointsToPercentage(
			settings.creditCardCheckoutInstallmentFeePercentage
		),
		creditCardPaymentLinkFeeMode: settings.creditCardPaymentLinkFeeMode,
		creditCardPaymentLinkFeeFixed: centsToFormattedCurrency(settings.creditCardPaymentLinkFeeFixed),
		creditCardPaymentLinkFeePercentage: basisPointsToPercentage(settings.creditCardPaymentLinkFeePercentage),
		creditCardPaymentLinkInstallmentFeePercentage: basisPointsToPercentage(
			settings.creditCardPaymentLinkInstallmentFeePercentage
		),
		creditCardReservePercentage: basisPointsToPercentage(settings.creditCardReservePercentage),
		creditCardReserveCompensationDays: String(settings.creditCardReserveCompensationDays),
		withdrawalFeeMode: settings.withdrawalFeeMode,
		withdrawalFeeFixed: centsToFormattedCurrency(settings.withdrawalFeeFixed),
		withdrawalFeePercentage: basisPointsToPercentage(settings.withdrawalFeePercentage),
		minWithdrawalAmount: centsToFormattedCurrency(settings.minWithdrawalAmount),
		withdrawalEnabled: settings.withdrawalEnabled,
		selfNominalSwitchEnabled: settings.selfNominalSwitchEnabled,
		withdrawalApprovalMode: settings.withdrawalApprovalMode,
		rateLimitPerMinute: String(settings.rateLimitPerMinute),
		rateLimitPerHour: String(settings.rateLimitPerHour),
		rateLimitPerDay: String(settings.rateLimitPerDay),
		referralDurationMonths: String(settings.referralDurationMonths),
		referralCommissionPercentage: basisPointsToPercentage(settings.referralCommissionPercentage),
		referralCommissionWithdrawalIntervalValue: String(settings.referralCommissionWithdrawalIntervalValue),
		referralCommissionWithdrawalIntervalUnit: settings.referralCommissionWithdrawalIntervalUnit,
		referralCommissionMinWithdrawalAmount: centsToFormattedCurrency(settings.referralCommissionMinWithdrawalAmount),
		referralCommissionWithdrawalFeeFixed: centsToFormattedCurrency(settings.referralCommissionWithdrawalFeeFixed),
		isAutomaticCashoutEnabled: settings.isAutomaticCashoutEnabled,
		automaticCashoutFrequency: settings.automaticCashoutFrequency,
		automaticCashoutMinAmount: centsToFormattedCurrency(settings.automaticCashoutMinAmount),
		automaticCashoutMaxAmount: centsToFormattedCurrency(settings.automaticCashoutMaxAmount),
		automaticCashoutPayoutAccountId: settings.automaticCashoutPayoutAccountId ?? '',
	};
}

export function buildUpdatePayload(formData: FormValues): AdminUpdatePlatformSettingsRequest {
	const toCents = (value: string) => formattedCurrencyToCents(value) ?? 0;
	const toBasisPoints = (value: string) => percentageToBasisPoints(value) ?? 0;
	const toNumber = (value: string) => {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : 0;
	};

	return {
		pixMinTransactionAmount: toCents(formData.pixMinTransactionAmount),
		pixMaxTransactionAmount: toCents(formData.pixMaxTransactionAmount),
		pixTimeoutMinutes: toNumber(formData.pixTimeoutMinutes),
		pixEnabled: formData.pixEnabled,
		pixApiFeeMode: formData.pixApiFeeMode,
		pixApiFeeFixed: toCents(formData.pixApiFeeFixed),
		pixApiFeePercentage: toBasisPoints(formData.pixApiFeePercentage),
		pixCheckoutFeeMode: formData.pixCheckoutFeeMode,
		pixCheckoutFeeFixed: toCents(formData.pixCheckoutFeeFixed),
		pixCheckoutFeePercentage: toBasisPoints(formData.pixCheckoutFeePercentage),
		pixPaymentLinkFeeMode: formData.pixPaymentLinkFeeMode,
		pixPaymentLinkFeeFixed: toCents(formData.pixPaymentLinkFeeFixed),
		pixPaymentLinkFeePercentage: toBasisPoints(formData.pixPaymentLinkFeePercentage),
		pixReservePercentage: toBasisPoints(formData.pixReservePercentage),
		pixReserveCompensationDays: toNumber(formData.pixReserveCompensationDays),
		boletoMinTransactionAmount: toCents(formData.boletoMinTransactionAmount),
		boletoMaxTransactionAmount: toCents(formData.boletoMaxTransactionAmount),
		boletoEnabled: formData.boletoEnabled,
		creditCardEnabled: formData.creditCardEnabled,
		paymentLinkDomainOptions: formData.paymentLinkDomainOptions.map((group) => ({
			method: group.method,
			options: group.options
				.map((option) => ({
					id: safeTrim(option.id),
					name: safeTrim(option.name),
					baseUrl: safeTrim(option.baseUrl),
					isDefault: option.isDefault,
					showSwiftPayBranding: option.showSwiftPayBranding,
				}))
				.filter((option) => option.id && option.name && option.baseUrl),
		})),
		boletoApiFeeMode: formData.boletoApiFeeMode,
		boletoApiFeeFixed: toCents(formData.boletoApiFeeFixed),
		boletoApiFeePercentage: toBasisPoints(formData.boletoApiFeePercentage),
		boletoCheckoutFeeMode: formData.boletoCheckoutFeeMode,
		boletoCheckoutFeeFixed: toCents(formData.boletoCheckoutFeeFixed),
		boletoCheckoutFeePercentage: toBasisPoints(formData.boletoCheckoutFeePercentage),
		boletoPaymentLinkFeeMode: formData.boletoPaymentLinkFeeMode,
		boletoPaymentLinkFeeFixed: toCents(formData.boletoPaymentLinkFeeFixed),
		boletoPaymentLinkFeePercentage: toBasisPoints(formData.boletoPaymentLinkFeePercentage),
		boletoReservePercentage: toBasisPoints(formData.boletoReservePercentage),
		boletoReserveCompensationDays: toNumber(formData.boletoReserveCompensationDays),
		creditCardApiFeeMode: formData.creditCardApiFeeMode,
		creditCardApiFeeFixed: toCents(formData.creditCardApiFeeFixed),
		creditCardApiFeePercentage: toBasisPoints(formData.creditCardApiFeePercentage),
		creditCardApiInstallmentFeePercentage: toBasisPoints(formData.creditCardApiInstallmentFeePercentage),
		creditCardCheckoutFeeMode: formData.creditCardCheckoutFeeMode,
		creditCardCheckoutFeeFixed: toCents(formData.creditCardCheckoutFeeFixed),
		creditCardCheckoutFeePercentage: toBasisPoints(formData.creditCardCheckoutFeePercentage),
		creditCardCheckoutInstallmentFeePercentage: toBasisPoints(
			formData.creditCardCheckoutInstallmentFeePercentage
		),
		creditCardPaymentLinkFeeMode: formData.creditCardPaymentLinkFeeMode,
		creditCardPaymentLinkFeeFixed: toCents(formData.creditCardPaymentLinkFeeFixed),
		creditCardPaymentLinkFeePercentage: toBasisPoints(formData.creditCardPaymentLinkFeePercentage),
		creditCardPaymentLinkInstallmentFeePercentage: toBasisPoints(
			formData.creditCardPaymentLinkInstallmentFeePercentage
		),
		creditCardReservePercentage: toBasisPoints(formData.creditCardReservePercentage),
		creditCardReserveCompensationDays: toNumber(formData.creditCardReserveCompensationDays),
		withdrawalFeeMode: formData.withdrawalFeeMode,
		withdrawalFeeFixed: toCents(formData.withdrawalFeeFixed),
		withdrawalFeePercentage: toBasisPoints(formData.withdrawalFeePercentage),
		minWithdrawalAmount: toCents(formData.minWithdrawalAmount),
		withdrawalEnabled: formData.withdrawalEnabled,
		selfNominalSwitchEnabled: formData.selfNominalSwitchEnabled,
		withdrawalApprovalMode: formData.withdrawalApprovalMode,
		rateLimitPerMinute: toNumber(formData.rateLimitPerMinute),
		rateLimitPerHour: toNumber(formData.rateLimitPerHour),
		rateLimitPerDay: toNumber(formData.rateLimitPerDay),
		referralDurationMonths: toNumber(formData.referralDurationMonths),
		referralCommissionPercentage: toBasisPoints(formData.referralCommissionPercentage),
		referralCommissionWithdrawalIntervalValue: toNumber(formData.referralCommissionWithdrawalIntervalValue),
		referralCommissionWithdrawalIntervalUnit: formData.referralCommissionWithdrawalIntervalUnit,
		referralCommissionMinWithdrawalAmount: toCents(formData.referralCommissionMinWithdrawalAmount),
		referralCommissionWithdrawalFeeFixed: toCents(formData.referralCommissionWithdrawalFeeFixed),
		isAutomaticCashoutEnabled: formData.isAutomaticCashoutEnabled,
		automaticCashoutFrequency: formData.automaticCashoutFrequency,
		automaticCashoutMinAmount: formattedCurrencyToCents(formData.automaticCashoutMinAmount) ?? 0,
		automaticCashoutMaxAmount: formattedCurrencyToCents(formData.automaticCashoutMaxAmount),
		automaticCashoutPayoutAccountId: formData.automaticCashoutPayoutAccountId || null,
	};
}

export function validatePayload(payload: AdminUpdatePlatformSettingsRequest): string | null {
	const minPix = payload.pixMinTransactionAmount ?? 0;
	const maxPix = payload.pixMaxTransactionAmount ?? 0;

	if (minPix < 0 || maxPix < 0) {
		return 'Os limites do PIX nao podem ser negativos.';
	}

	if (maxPix < minPix) {
		return 'O Valor Máximo do PIX nao pode ser menor que o Valor Mínimo.';
	}

	const minBoleto = payload.boletoMinTransactionAmount ?? 0;
	const maxBoleto = payload.boletoMaxTransactionAmount ?? 0;

	if (minBoleto < 0 || maxBoleto < 0) {
		return 'Os limites do Boleto nao podem ser negativos.';
	}

	if (maxBoleto < minBoleto) {
		return 'O Valor Máximo do Boleto nao pode ser menor que o Valor Mínimo.';
	}

	const timeout = payload.pixTimeoutMinutes ?? 0;
	if (timeout < 1 || timeout > 1440) {
		return 'O timeout do PIX deve estar entre 1 e 1440 minutos.';
	}

	const percentageFields = [
		payload.pixApiFeePercentage,
		payload.pixCheckoutFeePercentage,
		payload.pixPaymentLinkFeePercentage,
		payload.pixReservePercentage,
		payload.boletoApiFeePercentage,
		payload.boletoCheckoutFeePercentage,
		payload.boletoPaymentLinkFeePercentage,
		payload.boletoReservePercentage,
		payload.creditCardApiFeePercentage,
		payload.creditCardApiInstallmentFeePercentage,
		payload.creditCardCheckoutFeePercentage,
		payload.creditCardCheckoutInstallmentFeePercentage,
		payload.creditCardPaymentLinkFeePercentage,
		payload.creditCardPaymentLinkInstallmentFeePercentage,
		payload.creditCardReservePercentage,
		payload.withdrawalFeePercentage,
	];

	if (percentageFields.some((value) => value != null && (value < 0 || value > 10000))) {
		return 'Os percentuais devem estar entre 0% e 100%.';
	}

	const reserveCompensationDaysFields = [
		payload.pixReserveCompensationDays,
		payload.boletoReserveCompensationDays,
		payload.creditCardReserveCompensationDays,
	];

	if (reserveCompensationDaysFields.some((value) => value != null && (value < 0 || value > 365))) {
		return 'Os dias de compensação da reserva devem estar entre 0 e 365.';
	}

	const fixedFields = [
		payload.pixApiFeeFixed,
		payload.pixCheckoutFeeFixed,
		payload.pixPaymentLinkFeeFixed,
		payload.boletoApiFeeFixed,
		payload.boletoCheckoutFeeFixed,
		payload.boletoPaymentLinkFeeFixed,
		payload.creditCardApiFeeFixed,
		payload.creditCardCheckoutFeeFixed,
		payload.creditCardPaymentLinkFeeFixed,
		payload.withdrawalFeeFixed,
		payload.minWithdrawalAmount,
	];

	if (fixedFields.some((value) => value != null && value < 0)) {
		return 'Os valores nao podem ser negativos.';
	}

	const rateLimits = [payload.rateLimitPerMinute, payload.rateLimitPerHour, payload.rateLimitPerDay];

	if (rateLimits.some((value) => value != null && value < 1)) {
		return 'Os limites de requisicao devem ser maiores que zero.';
	}

	const referralDuration = payload.referralDurationMonths ?? 0;
	if (referralDuration < 1 || referralDuration > 120) {
		return 'A duração da indicação deve estar entre 1 e 120 meses.';
	}

	const referralCommission = payload.referralCommissionPercentage ?? 0;
	if (referralCommission < 0 || referralCommission > 10000) {
		return 'A comissão de indicação deve estar entre 0% e 100%.';
	}

	const referralIntervalValue = payload.referralCommissionWithdrawalIntervalValue ?? 0;
	if (referralIntervalValue < 0 || referralIntervalValue > 120) {
		return 'O intervalo entre solicitações de saque da comissão deve estar entre 0 e 120.';
	}

	const referralMinWithdrawalAmount = payload.referralCommissionMinWithdrawalAmount ?? 0;
	if (referralMinWithdrawalAmount < 0) {
		return 'O valor mínimo de saque da comissão não pode ser negativo.';
	}

	const referralWithdrawalFeeFixed = payload.referralCommissionWithdrawalFeeFixed ?? 0;
	if (referralWithdrawalFeeFixed < 0) {
		return 'A taxa fixa de saque da comissão não pode ser negativa.';
	}

	const automaticCashoutMinAmount = payload.automaticCashoutMinAmount ?? 0;
	const automaticCashoutMaxAmount = payload.automaticCashoutMaxAmount;

	if (automaticCashoutMinAmount < 0) {
		return 'O valor mínimo do saque automatizado da plataforma não pode ser negativo.';
	}

	if (automaticCashoutMaxAmount != null && automaticCashoutMaxAmount < 0) {
		return 'O valor máximo do saque automatizado da plataforma não pode ser negativo.';
	}

	if (automaticCashoutMaxAmount != null && automaticCashoutMaxAmount <= automaticCashoutMinAmount) {
		return 'O valor máximo do saque automatizado da plataforma deve ser maior que o valor mínimo.';
	}

	for (const methodOptions of payload.paymentLinkDomainOptions ?? []) {
		const methodLabel = paymentMethodLabel(methodOptions.method);
		const optionIds = new Set<string>();
		let defaultCount = 0;

		for (const option of methodOptions.options ?? []) {
			if (!option.id || !option.name || !option.baseUrl) {
				return `Preencha nome e URL base em todas as opções de domínio de ${methodLabel}.`;
			}

			if (!isValidHttpUrl(option.baseUrl)) {
				return `A URL base da opção ${option.name} (${methodLabel}) deve ser válida com http:// ou https://.`;
			}

			const normalizedId = option.id.toLowerCase();
			if (optionIds.has(normalizedId)) {
				return `Existem IDs duplicados nas opções de domínio de ${methodLabel}.`;
			}

			optionIds.add(normalizedId);

			if (option.isDefault) {
				defaultCount += 1;
			}
		}

		if (defaultCount > 1) {
			return `Defina no máximo um domínio padrão para ${methodLabel}.`;
		}
	}

	if (payload.isAutomaticCashoutEnabled && !payload.automaticCashoutPayoutAccountId) {
		return 'Selecione a conta de destino para o saque automatizado da plataforma.';
	}

	return null;
}
