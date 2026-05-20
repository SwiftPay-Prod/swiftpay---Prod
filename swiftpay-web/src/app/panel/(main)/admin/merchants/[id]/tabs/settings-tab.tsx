'use client';

import { use, useEffect, useState, useTransition, useCallback, useMemo, Suspense } from 'react';
import Image from 'next/image';
import {
	Alert,
	AlertDialog,
	Button,
	Checkbox,
	Chip,
	Input,
	Label,
	TextField,
	FieldError,
	Form,
	Select,
	ListBox,
	Separator,
} from '@heroui/react';
import type { Key } from '@heroui/react';
import { NumericFormat } from 'react-number-format';
import { SettingsTabSkeleton } from './settings-tab-skeleton';
import { toast } from '@heroui/react';
import {
	Wallet01Icon,
	Analytics01Icon,
	Tag01Icon,
	InformationCircleIcon,
	ArrowReloadHorizontalIcon,
	Invoice03Icon,
	Money01Icon,
	CreditCardIcon,
	Link01Icon,
	CancelCircleIcon,
	CheckmarkCircle02Icon,
	Settings05Icon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { SystemAccordion } from '@/components/ui/system-accordion';
import { adminGetMerchantSettings, adminUpdateMerchantSettings } from '@/app/actions/admin/merchants';
import { adminGetWayneProtocolSettings, adminUpdateWayneProtocolSettings } from '@/app/actions/admin/wayne-protocol';
import { PlatformDefault } from './components/settings-tab/platform-default';
import {
	FeeProfitIndicator,
	calculateFee,
	formatAcquirerFeeLabel,
} from './components/settings-tab/fee-profit-indicator';
import { PixSettingsAccordion } from './components/settings-tab/pix-settings-accordion';
import { MerchantControlsAccordion } from './components/settings-tab/merchant-controls-accordion';
import { RateLimitingAccordion } from './components/settings-tab/rate-limiting-accordion';
import type {
	MerchantSettingsFormData,
	AdminMerchantAcquirerData,
	AdminMerchantSettingsData,
} from '@/types/admin/merchants';
import type {
	AdminPlatformSettingsData,
	PaymentLinkDomainMethodOptions,
} from '@/types/admin/platform-settings';
import type {
	AdminWayneProtocolSettingsData,
	AdminUpdateWayneProtocolSettingsRequest,
} from '@/types/admin/wayne-protocol';
import type { ApiResponse } from '@/types/common';
import {
	FeeChargeMode,
	PaymentEnvironment,
	PaymentMethod,
	UserRole,
	WithdrawalApprovalMode,
} from '@/types/enums';
import {
	feeChargeModeParse,
	withdrawalApprovalModeParse,
	withdrawalApprovalModeOptionsWithDefault,
	mapParseColorToChipColor,
} from '@/parse';
import { CurrencyCentsInput } from '@/components/ui/currency-cents-input';
import { formatCurrency, formattedCurrencyToCents, percentageToBasisPoints } from '@/utils/currency';
import { percentageFormatProps } from '@/utils/input-masks';
import { FormSaveFooter } from '@/components/ui/form-save-footer';
import { merchantSettingsToFormData, formDataToMerchantSettingsRequest } from '@/converters/settings-converters';

type SettingsPromise = Promise<ApiResponse<AdminMerchantSettingsData>>;
type WayneSettingsPromise = Promise<ApiResponse<AdminWayneProtocolSettingsData>>;

interface SettingsTabProps {
	fetchPromise: SettingsPromise;
	merchantId: string;
	platformSettings: AdminPlatformSettingsData;
	acquirer: AdminMerchantAcquirerData | null;
	currentUserRole: UserRole;
	wayneSettingsPromise: WayneSettingsPromise | null;
}

function formatEffectiveFee(
	merchantFeeMode: string,
	merchantFeeFixed: string,
	merchantFeePercentage: string,
	platformFeeMode: FeeChargeMode,
	platformFeeFixed: number,
	platformFeePercentage: number
): string {
	const isDefault = merchantFeeMode === 'default';
	const effectiveFeeMode = isDefault ? platformFeeMode : merchantFeeMode;
	const effectiveFeeFixed =
		isDefault || merchantFeeFixed === ''
			? platformFeeFixed
			: (formattedCurrencyToCents(merchantFeeFixed) ?? platformFeeFixed);
	const effectiveFeePercentage =
		isDefault || merchantFeePercentage === ''
			? platformFeePercentage
			: (percentageToBasisPoints(merchantFeePercentage) ?? platformFeePercentage);

	return formatAcquirerFeeLabel(effectiveFeeMode, effectiveFeeFixed, effectiveFeePercentage);
}

function formatEffectiveAmount(merchantAmount: string, platformAmount: number): string {
	if (!merchantAmount || merchantAmount === '') {
		return formatCurrency(platformAmount);
	}
	const cents = formattedCurrencyToCents(merchantAmount);
	return formatCurrency(cents ?? platformAmount);
}

function formatEffectiveRateLimit(merchantValue: string, platformValue: number): string {
	if (!merchantValue || merchantValue === '') {
		return platformValue.toString();
	}
	return merchantValue;
}

function formatEffectiveReserve(merchantReservePercentage: string, platformReservePercentage: number): string {
	if (!merchantReservePercentage || merchantReservePercentage === '') {
		return `${(platformReservePercentage / 100).toFixed(2)}%`;
	}

	return `${merchantReservePercentage}%`;
}

function formatEffectiveReserveCompensationDays(
	merchantReserveCompensationDays: string,
	platformReserveCompensationDays: number
): string {
	if (!merchantReserveCompensationDays || merchantReserveCompensationDays === '') {
		return `${platformReserveCompensationDays} dias`;
	}

	return `${merchantReserveCompensationDays} dias`;
}

function formatFeeModeLabel(mode: string, platformMode: FeeChargeMode): string {
	const effectiveMode = mode === 'default' ? platformMode : (mode as FeeChargeMode);
	return feeChargeModeParse[effectiveMode]?.label ?? effectiveMode;
}

function resolveEffectiveFeeMode(mode: string, platformMode: FeeChargeMode): FeeChargeMode {
	return mode === 'default' ? platformMode : (mode as FeeChargeMode);
}

function shouldShowFixedFeeInput(mode: FeeChargeMode): boolean {
	return mode !== FeeChargeMode.PercentageOnly;
}

function shouldShowPercentageFeeInput(mode: FeeChargeMode): boolean {
	return mode !== FeeChargeMode.FixedOnly;
}

function hasConfiguredPercentage(value: string): boolean {
	const basisPoints = percentageToBasisPoints(value);
	return basisPoints !== null && basisPoints > 0;
}

function hasConfiguredDays(value: string): boolean {
	const days = Number(value);
	return Number.isFinite(days) && days > 0;
}

function formatWithdrawalApprovalModeLabel(mode: string, platformMode: WithdrawalApprovalMode): string {
	const effectiveMode = mode === 'default' ? platformMode : (mode as WithdrawalApprovalMode);
	return withdrawalApprovalModeParse[effectiveMode]?.label ?? effectiveMode;
}

type FeatureFlagSelection = 'default' | 'enabled' | 'disabled';

const featureFlagOptions: Array<{
	key: FeatureFlagSelection;
	label: string;
	icon: React.ReactNode;
	color: 'default' | 'success' | 'danger';
}> = [
	{
		key: 'default',
		label: 'Padrão do sistema',
		icon: <Icon icon={Settings05Icon} className="icon-sm" />,
		color: 'default',
	},
	{
		key: 'enabled',
		label: 'Habilitado',
		icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
		color: 'success',
	},
	{
		key: 'disabled',
		label: 'Desabilitado',
		icon: <Icon icon={CancelCircleIcon} className="icon-sm" />,
		color: 'danger',
	},
];

function resolveFeatureFlag(selection: FeatureFlagSelection, platformValue: boolean): boolean {
	if (selection === 'default') return platformValue;
	return selection === 'enabled';
}

function featureFlagSummaryLabel(selection: FeatureFlagSelection, platformValue: boolean): string {
	if (selection === 'default') {
		return `Padrão (${platformValue ? 'Habilitado' : 'Desabilitado'})`;
	}
	return selection === 'enabled' ? 'Habilitado' : 'Desabilitado';
}

const feeChargeModeSelectOptionsWithDefault: Array<{
	key: string;
	label: string;
	icon: React.ReactNode;
	color: 'default' | 'accent' | 'warning' | 'success';
}> = [
	{ key: 'default', label: 'Padrão do sistema', icon: null, color: 'default' },
	{
		key: FeeChargeMode.FixedOnly,
		label: 'Valor fixo',
		icon: <Icon icon={Tag01Icon} className="icon-sm" />,
		color: 'accent',
	},
	{
		key: FeeChargeMode.PercentageOnly,
		label: 'Percentual',
		icon: <Icon icon={Analytics01Icon} className="icon-sm" />,
		color: 'warning',
	},
	{
		key: FeeChargeMode.FixedAndPercentage,
		label: 'Fixo + percentual',
		icon: <Icon icon={Wallet01Icon} className="icon-sm" />,
		color: 'success',
	},
];

export function SettingsTab({
	fetchPromise,
	merchantId,
	platformSettings,
	acquirer,
	currentUserRole,
	wayneSettingsPromise,
}: SettingsTabProps) {
	return (
		<Suspense fallback={<SettingsTabSkeleton />}>
			<SettingsTabContent
				fetchPromise={fetchPromise}
				merchantId={merchantId}
				platformSettings={platformSettings}
				acquirer={acquirer}
				currentUserRole={currentUserRole}
				wayneSettingsPromise={wayneSettingsPromise}
			/>
		</Suspense>
	);
}

function SettingsTabContent({
	fetchPromise,
	merchantId,
	platformSettings,
	acquirer,
	currentUserRole,
	wayneSettingsPromise,
}: SettingsTabProps) {
	const response = use(fetchPromise);
	const initialData = response?.data ?? null;
	const wayneInitialResponse = wayneSettingsPromise ? use(wayneSettingsPromise) : null;
	const initialWayneData = wayneInitialResponse?.data ?? null;

	if (response?.error) {
		return (
			<Alert status="danger">
				<Alert.Indicator />
				<Alert.Content>
					<Alert.Title>Erro ao carregar</Alert.Title>
					<Alert.Description>{response.error.message}</Alert.Description>
				</Alert.Content>
			</Alert>
		);
	}

	return (
		<SettingsTabForm
			initialData={initialData}
			initialWayneData={initialWayneData}
			merchantId={merchantId}
			platformSettings={platformSettings}
			acquirer={acquirer}
			currentUserRole={currentUserRole}
		/>
	);
}

interface SettingsTabFormProps {
	initialData: AdminMerchantSettingsData | null;
	initialWayneData: AdminWayneProtocolSettingsData | null;
	merchantId: string;
	platformSettings: AdminPlatformSettingsData;
	acquirer: AdminMerchantAcquirerData | null;
	currentUserRole: UserRole;
}

function SettingsTabForm({
	initialData,
	initialWayneData,
	merchantId,
	platformSettings,
	acquirer,
	currentUserRole: _currentUserRole,
}: SettingsTabFormProps) {
	const initialMerchantFormData = merchantSettingsToFormData(initialData, platformSettings);
	const [isPending, startTransition] = useTransition();
	const [formData, setFormData] = useState<MerchantSettingsFormData>(initialMerchantFormData);
	const [initialFormData, setInitialFormData] = useState<MerchantSettingsFormData>(initialMerchantFormData);
	const [showPixReserveField, setShowPixReserveField] = useState(() =>
		hasConfiguredPercentage(initialMerchantFormData.pixReservePercentage)
	);
	const [showPixReserveCompensationField, setShowPixReserveCompensationField] = useState(() =>
		hasConfiguredDays(initialMerchantFormData.pixReserveCompensationDays)
	);
	const [showBoletoReserveField, setShowBoletoReserveField] = useState(() =>
		hasConfiguredPercentage(initialMerchantFormData.boletoReservePercentage)
	);
	const [showBoletoReserveCompensationField, setShowBoletoReserveCompensationField] = useState(() =>
		hasConfiguredDays(initialMerchantFormData.boletoReserveCompensationDays)
	);
	const [showCreditCardReserveField, setShowCreditCardReserveField] = useState(() =>
		hasConfiguredPercentage(initialMerchantFormData.creditCardReservePercentage)
	);
	const [showCreditCardReserveCompensationField, setShowCreditCardReserveCompensationField] = useState(() =>
		hasConfiguredDays(initialMerchantFormData.creditCardReserveCompensationDays)
	);
	const [showLossConfirmation, setShowLossConfirmation] = useState(false);
	const [lastUpdated, setLastUpdated] = useState(initialData?.updatedAt ?? null);
	const [isWaynePending, startWayneTransition] = useTransition();
	const canManageWayne = initialWayneData !== null;
	const defaultWayneSettings: AdminWayneProtocolSettingsData = {
		environment: PaymentEnvironment.Production,
		isEnabled: false,
		cycleVolume: 100,
		samplingRatePercent: 0,
	};

	function getMethodDomainOptions(
		allOptions: PaymentLinkDomainMethodOptions[],
		method: PaymentMethod
	) {
		return allOptions.find((item) => item.method === method)?.options ?? [];
	}

	function resolveDomainOptionName(
		allOptions: PaymentLinkDomainMethodOptions[],
		method: PaymentMethod,
		optionId: string
	): string {
		if (!optionId) {
			return 'Padrão da plataforma';
		}

		const option = getMethodDomainOptions(allOptions, method).find((item) => item.id === optionId);
		return option?.name ?? 'Padrão da plataforma';
	}
	const [wayneSettings, setWayneSettings] = useState<AdminWayneProtocolSettingsData>(
		initialWayneData ?? defaultWayneSettings
	);
	const [initialWayneSettings, setInitialWayneSettings] = useState<AdminWayneProtocolSettingsData>(
		initialWayneData ?? defaultWayneSettings
	);
	const [isHydratingSettings, setIsHydratingSettings] = useState(false);

	const hasChanges = useMemo(() => {
		return JSON.stringify(formData) !== JSON.stringify(initialFormData);
	}, [formData, initialFormData]);

	const hasErrors = useMemo(() => {
		const pixMin = formattedCurrencyToCents(formData.pixMinTransactionAmount);
		const pixMax = formattedCurrencyToCents(formData.pixMaxTransactionAmount);
		const pixApiFeeFixed = formattedCurrencyToCents(formData.pixApiFeeFixed);
		const pixApiFeePercentage = percentageToBasisPoints(formData.pixApiFeePercentage);
		const pixCheckoutFeeFixed = formattedCurrencyToCents(formData.pixCheckoutFeeFixed);
		const pixCheckoutFeePercentage = percentageToBasisPoints(formData.pixCheckoutFeePercentage);
		const pixPaymentLinkFeeFixed = formattedCurrencyToCents(formData.pixPaymentLinkFeeFixed);
		const pixPaymentLinkFeePercentage = percentageToBasisPoints(formData.pixPaymentLinkFeePercentage);
		const pixReservePercentage = percentageToBasisPoints(formData.pixReservePercentage);
		const pixReserveCompensationDays =
			formData.pixReserveCompensationDays !== '' ? Number(formData.pixReserveCompensationDays) : null;
		const boletoApiFeeFixed = formattedCurrencyToCents(formData.boletoApiFeeFixed);
		const boletoApiFeePercentage = percentageToBasisPoints(formData.boletoApiFeePercentage);
		const boletoCheckoutFeeFixed = formattedCurrencyToCents(formData.boletoCheckoutFeeFixed);
		const boletoCheckoutFeePercentage = percentageToBasisPoints(formData.boletoCheckoutFeePercentage);
		const boletoPaymentLinkFeeFixed = formattedCurrencyToCents(formData.boletoPaymentLinkFeeFixed);
		const boletoPaymentLinkFeePercentage = percentageToBasisPoints(formData.boletoPaymentLinkFeePercentage);
		const boletoReservePercentage = percentageToBasisPoints(formData.boletoReservePercentage);
		const boletoReserveCompensationDays =
			formData.boletoReserveCompensationDays !== '' ? Number(formData.boletoReserveCompensationDays) : null;
		const creditCardApiFeeFixed = formattedCurrencyToCents(formData.creditCardApiFeeFixed);
		const creditCardApiFeePercentage = percentageToBasisPoints(formData.creditCardApiFeePercentage);
		const creditCardApiInstallmentFeePercentage = percentageToBasisPoints(formData.creditCardApiInstallmentFeePercentage);
		const creditCardCheckoutFeeFixed = formattedCurrencyToCents(formData.creditCardCheckoutFeeFixed);
		const creditCardCheckoutFeePercentage = percentageToBasisPoints(formData.creditCardCheckoutFeePercentage);
		const creditCardCheckoutInstallmentFeePercentage = percentageToBasisPoints(formData.creditCardCheckoutInstallmentFeePercentage);
		const creditCardPaymentLinkFeeFixed = formattedCurrencyToCents(formData.creditCardPaymentLinkFeeFixed);
		const creditCardPaymentLinkFeePercentage = percentageToBasisPoints(formData.creditCardPaymentLinkFeePercentage);
		const creditCardPaymentLinkInstallmentFeePercentage = percentageToBasisPoints(formData.creditCardPaymentLinkInstallmentFeePercentage);
		const creditCardReservePercentage = percentageToBasisPoints(formData.creditCardReservePercentage);
		const creditCardReserveCompensationDays =
			formData.creditCardReserveCompensationDays !== '' ? Number(formData.creditCardReserveCompensationDays) : null;
		const minWithdrawal = formattedCurrencyToCents(formData.minWithdrawalAmount);
		const withdrawalFeeFixed = formattedCurrencyToCents(formData.withdrawalFeeFixed);
		const withdrawalFeePercentage = percentageToBasisPoints(formData.withdrawalFeePercentage);
		const rateLimitMinute = formData.rateLimitPerMinute ? Number(formData.rateLimitPerMinute) : null;
		const rateLimitHour = formData.rateLimitPerHour ? Number(formData.rateLimitPerHour) : null;
		const rateLimitDay = formData.rateLimitPerDay ? Number(formData.rateLimitPerDay) : null;
		if (pixMin !== null && pixMin < 0) return true;
		if (pixMax !== null && pixMax < 0) return true;
		if (pixMin !== null && pixMax !== null && pixMax < pixMin) return true;
		if (pixApiFeeFixed !== null && pixApiFeeFixed < 0) return true;
		if (pixApiFeePercentage !== null && (pixApiFeePercentage < 0 || pixApiFeePercentage > 10000)) return true;
		if (pixCheckoutFeeFixed !== null && pixCheckoutFeeFixed < 0) return true;
		if (pixCheckoutFeePercentage !== null && (pixCheckoutFeePercentage < 0 || pixCheckoutFeePercentage > 10000))
			return true;
		if (pixPaymentLinkFeeFixed !== null && pixPaymentLinkFeeFixed < 0) return true;
		if (
			pixPaymentLinkFeePercentage !== null &&
			(pixPaymentLinkFeePercentage < 0 || pixPaymentLinkFeePercentage > 10000)
		)
			return true;
		if (pixReservePercentage !== null && (pixReservePercentage < 0 || pixReservePercentage > 10000)) return true;
		if (
			pixReserveCompensationDays !== null &&
			(!Number.isInteger(pixReserveCompensationDays) || pixReserveCompensationDays < 0 || pixReserveCompensationDays > 365)
		)
			return true;
		if (boletoApiFeeFixed !== null && boletoApiFeeFixed < 0) return true;
		if (boletoApiFeePercentage !== null && (boletoApiFeePercentage < 0 || boletoApiFeePercentage > 10000)) return true;
		if (boletoCheckoutFeeFixed !== null && boletoCheckoutFeeFixed < 0) return true;
		if (
			boletoCheckoutFeePercentage !== null &&
			(boletoCheckoutFeePercentage < 0 || boletoCheckoutFeePercentage > 10000)
		)
			return true;
		if (boletoPaymentLinkFeeFixed !== null && boletoPaymentLinkFeeFixed < 0) return true;
		if (
			boletoPaymentLinkFeePercentage !== null &&
			(boletoPaymentLinkFeePercentage < 0 || boletoPaymentLinkFeePercentage > 10000)
		)
			return true;
		if (boletoReservePercentage !== null && (boletoReservePercentage < 0 || boletoReservePercentage > 10000))
			return true;
		if (
			boletoReserveCompensationDays !== null &&
			(!Number.isInteger(boletoReserveCompensationDays) ||
				boletoReserveCompensationDays < 0 ||
				boletoReserveCompensationDays > 365)
		)
			return true;
		if (creditCardApiFeeFixed !== null && creditCardApiFeeFixed < 0) return true;
		if (creditCardApiFeePercentage !== null && (creditCardApiFeePercentage < 0 || creditCardApiFeePercentage > 10000))
			return true;
		if (
			creditCardApiInstallmentFeePercentage !== null &&
			(creditCardApiInstallmentFeePercentage < 0 || creditCardApiInstallmentFeePercentage > 10000)
		)
			return true;
		if (creditCardCheckoutFeeFixed !== null && creditCardCheckoutFeeFixed < 0) return true;
		if (creditCardCheckoutFeePercentage !== null && (creditCardCheckoutFeePercentage < 0 || creditCardCheckoutFeePercentage > 10000))
			return true;
		if (
			creditCardCheckoutInstallmentFeePercentage !== null &&
			(creditCardCheckoutInstallmentFeePercentage < 0 || creditCardCheckoutInstallmentFeePercentage > 10000)
		)
			return true;
		if (creditCardPaymentLinkFeeFixed !== null && creditCardPaymentLinkFeeFixed < 0) return true;
		if (
			creditCardPaymentLinkFeePercentage !== null &&
			(creditCardPaymentLinkFeePercentage < 0 || creditCardPaymentLinkFeePercentage > 10000)
		)
			return true;
		if (
			creditCardPaymentLinkInstallmentFeePercentage !== null &&
			(creditCardPaymentLinkInstallmentFeePercentage < 0 || creditCardPaymentLinkInstallmentFeePercentage > 10000)
		)
			return true;
		if (creditCardReservePercentage !== null && (creditCardReservePercentage < 0 || creditCardReservePercentage > 10000))
			return true;
		if (
			creditCardReserveCompensationDays !== null &&
			(!Number.isInteger(creditCardReserveCompensationDays) ||
				creditCardReserveCompensationDays < 0 ||
				creditCardReserveCompensationDays > 365)
		)
			return true;
		if (minWithdrawal !== null && minWithdrawal < 0) return true;
		if (withdrawalFeeFixed !== null && withdrawalFeeFixed < 0) return true;
		if (withdrawalFeePercentage !== null && (withdrawalFeePercentage < 0 || withdrawalFeePercentage > 10000))
			return true;
		if (rateLimitMinute !== null && (isNaN(rateLimitMinute) || rateLimitMinute < 0)) return true;
		if (rateLimitHour !== null && (isNaN(rateLimitHour) || rateLimitHour < 0)) return true;
		if (rateLimitDay !== null && (isNaN(rateLimitDay) || rateLimitDay < 0)) return true;

		return false;
	}, [formData]);

	const hasWayneChanges = useMemo(
		() => JSON.stringify(wayneSettings) !== JSON.stringify(initialWayneSettings),
		[wayneSettings, initialWayneSettings]
	);

	const hasWayneErrors = useMemo(() => {
		if (wayneSettings.cycleVolume < 1 || wayneSettings.cycleVolume > 100000) return true;
		if (wayneSettings.samplingRatePercent < 0 || wayneSettings.samplingRatePercent > 100) return true;
		return false;
	}, [wayneSettings]);

	const hasAnyChanges = hasChanges || (canManageWayne && hasWayneChanges);
	const hasAnyErrors = hasErrors || (canManageWayne && hasWayneErrors);
	const isPixEnabled = resolveFeatureFlag(formData.pixEnabled, platformSettings.pixEnabled);
	const isBoletoEnabled = resolveFeatureFlag(formData.boletoEnabled, platformSettings.boletoEnabled);
	const isWithdrawalEnabled = resolveFeatureFlag(formData.withdrawalEnabled, platformSettings.withdrawalEnabled);

	const lossDetails = useMemo(() => {
		if (!acquirer) return null;

		const isPixEffectivelyEnabled = resolveFeatureFlag(formData.pixEnabled, platformSettings.pixEnabled);
		const isBoletoEffectivelyEnabled = resolveFeatureFlag(formData.boletoEnabled, platformSettings.boletoEnabled);
		const isWithdrawalEffectivelyEnabled = resolveFeatureFlag(
			formData.withdrawalEnabled,
			platformSettings.withdrawalEnabled
		);

		const sampleAmount = 10000;
		const losses: { type: string; loss: number }[] = [];

		const getEffectiveFee = (
			mode: string,
			fixed: string,
			percentage: string,
			platformMode: FeeChargeMode,
			platformFixed: number,
			platformPercentage: number
		) => {
			const effectiveMode = mode === 'default' ? platformMode : mode;
			const effectiveFixed =
				fixed === '' || mode === 'default' ? platformFixed : (formattedCurrencyToCents(fixed) ?? platformFixed);
			const effectivePercentage =
				percentage === '' || mode === 'default'
					? platformPercentage
					: (percentageToBasisPoints(percentage) ?? platformPercentage);
			return calculateFee(sampleAmount, effectiveMode, effectiveFixed, effectivePercentage);
		};

		if (isPixEffectivelyEnabled) {
			const pixApiFee = getEffectiveFee(
				formData.pixApiFeeMode,
				formData.pixApiFeeFixed,
				formData.pixApiFeePercentage,
				platformSettings.pixApiFeeMode as FeeChargeMode,
				platformSettings.pixApiFeeFixed,
				platformSettings.pixApiFeePercentage
			);
			const pixApiAcquirerFee = calculateFee(
				sampleAmount,
				acquirer.pixInFeeMode,
				acquirer.pixInFeeFixed,
				acquirer.pixInFeePercentage
			);
			if (pixApiFee < pixApiAcquirerFee) {
				losses.push({ type: 'PIX API', loss: pixApiAcquirerFee - pixApiFee });
			}

			const pixCheckoutFee = getEffectiveFee(
				formData.pixCheckoutFeeMode,
				formData.pixCheckoutFeeFixed,
				formData.pixCheckoutFeePercentage,
				platformSettings.pixCheckoutFeeMode as FeeChargeMode,
				platformSettings.pixCheckoutFeeFixed,
				platformSettings.pixCheckoutFeePercentage
			);
			if (pixCheckoutFee < pixApiAcquirerFee) {
				losses.push({ type: 'PIX Checkout', loss: pixApiAcquirerFee - pixCheckoutFee });
			}

			const pixPaymentLinkFee = getEffectiveFee(
				formData.pixPaymentLinkFeeMode,
				formData.pixPaymentLinkFeeFixed,
				formData.pixPaymentLinkFeePercentage,
				platformSettings.pixPaymentLinkFeeMode as FeeChargeMode,
				platformSettings.pixPaymentLinkFeeFixed,
				platformSettings.pixPaymentLinkFeePercentage
			);
			if (pixPaymentLinkFee < pixApiAcquirerFee) {
				losses.push({ type: 'PIX Link de Pagamento', loss: pixApiAcquirerFee - pixPaymentLinkFee });
			}
		}

		if (isBoletoEffectivelyEnabled) {
			const boletoApiFee = getEffectiveFee(
				formData.boletoApiFeeMode,
				formData.boletoApiFeeFixed,
				formData.boletoApiFeePercentage,
				platformSettings.boletoApiFeeMode as FeeChargeMode,
				platformSettings.boletoApiFeeFixed,
				platformSettings.boletoApiFeePercentage
			);
			const boletoAcquirerFee = calculateFee(
				sampleAmount,
				acquirer.boletoInFeeMode,
				acquirer.boletoInFeeFixed,
				acquirer.boletoInFeePercentage
			);
			if (boletoApiFee < boletoAcquirerFee) {
				losses.push({ type: 'BOLETO API', loss: boletoAcquirerFee - boletoApiFee });
			}

			const boletoCheckoutFee = getEffectiveFee(
				formData.boletoCheckoutFeeMode,
				formData.boletoCheckoutFeeFixed,
				formData.boletoCheckoutFeePercentage,
				platformSettings.boletoCheckoutFeeMode as FeeChargeMode,
				platformSettings.boletoCheckoutFeeFixed,
				platformSettings.boletoCheckoutFeePercentage
			);
			if (boletoCheckoutFee < boletoAcquirerFee) {
				losses.push({ type: 'BOLETO Checkout', loss: boletoAcquirerFee - boletoCheckoutFee });
			}

			const boletoPaymentLinkFee = getEffectiveFee(
				formData.boletoPaymentLinkFeeMode,
				formData.boletoPaymentLinkFeeFixed,
				formData.boletoPaymentLinkFeePercentage,
				platformSettings.boletoPaymentLinkFeeMode as FeeChargeMode,
				platformSettings.boletoPaymentLinkFeeFixed,
				platformSettings.boletoPaymentLinkFeePercentage
			);
			if (boletoPaymentLinkFee < boletoAcquirerFee) {
				losses.push({ type: 'BOLETO Link de Pagamento', loss: boletoAcquirerFee - boletoPaymentLinkFee });
			}
		}

		const isCreditCardEffectivelyEnabled = resolveFeatureFlag(formData.creditCardEnabled, platformSettings.creditCardEnabled);
		if (isCreditCardEffectivelyEnabled) {
			const creditCardApiFee = getEffectiveFee(
				formData.creditCardApiFeeMode,
				formData.creditCardApiFeeFixed,
				formData.creditCardApiFeePercentage,
				platformSettings.creditCardApiFeeMode as FeeChargeMode,
				platformSettings.creditCardApiFeeFixed,
				platformSettings.creditCardApiFeePercentage
			);
			const creditCardAcquirerFee = calculateFee(
				sampleAmount,
				acquirer.creditCardInFeeMode,
				acquirer.creditCardInFeeFixed,
				acquirer.creditCardInFeePercentage
			);
			if (creditCardApiFee < creditCardAcquirerFee) {
				losses.push({ type: 'CARTÃO API', loss: creditCardAcquirerFee - creditCardApiFee });
			}

			const creditCardCheckoutFee = getEffectiveFee(
				formData.creditCardCheckoutFeeMode,
				formData.creditCardCheckoutFeeFixed,
				formData.creditCardCheckoutFeePercentage,
				platformSettings.creditCardCheckoutFeeMode as FeeChargeMode,
				platformSettings.creditCardCheckoutFeeFixed,
				platformSettings.creditCardCheckoutFeePercentage
			);
			if (creditCardCheckoutFee < creditCardAcquirerFee) {
				losses.push({ type: 'CARTÃO Checkout', loss: creditCardAcquirerFee - creditCardCheckoutFee });
			}

			const creditCardPaymentLinkFee = getEffectiveFee(
				formData.creditCardPaymentLinkFeeMode,
				formData.creditCardPaymentLinkFeeFixed,
				formData.creditCardPaymentLinkFeePercentage,
				platformSettings.creditCardPaymentLinkFeeMode as FeeChargeMode,
				platformSettings.creditCardPaymentLinkFeeFixed,
				platformSettings.creditCardPaymentLinkFeePercentage
			);
			if (creditCardPaymentLinkFee < creditCardAcquirerFee) {
				losses.push({ type: 'CARTÃO Link de Pagamento', loss: creditCardAcquirerFee - creditCardPaymentLinkFee });
			}
		}

		if (isWithdrawalEffectivelyEnabled) {
			const withdrawalFee = getEffectiveFee(
				formData.withdrawalFeeMode,
				formData.withdrawalFeeFixed,
				formData.withdrawalFeePercentage,
				platformSettings.withdrawalFeeMode as FeeChargeMode,
				platformSettings.withdrawalFeeFixed,
				platformSettings.withdrawalFeePercentage
			);
			const withdrawalAcquirerFee = calculateFee(
				sampleAmount,
				acquirer.payoutFeeMode,
				acquirer.payoutFeeFixed,
				acquirer.payoutFeePercentage
			);
			if (withdrawalFee < withdrawalAcquirerFee) {
				losses.push({ type: 'Saque', loss: withdrawalAcquirerFee - withdrawalFee });
			}
		}

		return losses.length > 0 ? losses : null;
	}, [formData, acquirer, platformSettings]);

	const handleBeforeUnload = useCallback(
		(e: BeforeUnloadEvent) => {
			if (hasAnyChanges) {
				e.preventDefault();
				e.returnValue = '';
			}
		},
		[hasAnyChanges]
	);

	useEffect(() => {
		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	}, [handleBeforeUnload]);

	useEffect(() => {
		let isMounted = true;

		async function hydrateLatestSettings() {
			setIsHydratingSettings(true);
			const latest = await adminGetMerchantSettings(merchantId);
			if (!isMounted) return;

			if (!latest.error && latest.data) {
				const hydrated = merchantSettingsToFormData(latest.data, platformSettings);
				setFormData(hydrated);
				setInitialFormData(hydrated);
				setShowPixReserveField(hasConfiguredPercentage(hydrated.pixReservePercentage));
				setShowPixReserveCompensationField(hasConfiguredDays(hydrated.pixReserveCompensationDays));
				setShowBoletoReserveField(hasConfiguredPercentage(hydrated.boletoReservePercentage));
				setShowBoletoReserveCompensationField(hasConfiguredDays(hydrated.boletoReserveCompensationDays));
				setShowCreditCardReserveField(hasConfiguredPercentage(hydrated.creditCardReservePercentage));
				setShowCreditCardReserveCompensationField(
					hasConfiguredDays(hydrated.creditCardReserveCompensationDays)
				);
				setLastUpdated(latest.data.updatedAt);
			}

			setIsHydratingSettings(false);
		}

		hydrateLatestSettings();

		return () => {
			isMounted = false;
		};
	}, [merchantId, platformSettings]);

	function handleFieldChange<K extends keyof MerchantSettingsFormData>(field: K, value: MerchantSettingsFormData[K]) {
		setFormData((prev) => ({ ...prev, [field]: value }));
	}

	function handleSelectChange<K extends keyof MerchantSettingsFormData>(field: K, key: Key | null) {
		handleFieldChange(field, (key === null ? 'default' : String(key)) as MerchantSettingsFormData[K]);
	}

	function handleResetField<K extends keyof MerchantSettingsFormData>(field: K) {
		handleFieldChange(field, '' as MerchantSettingsFormData[K]);
	}

	function performSubmit() {
		startTransition(async () => {
			let merchantSaved = false;
			let wayneSaved = false;

			if (hasChanges) {
				const request = formDataToMerchantSettingsRequest(formData);
				const response = await adminUpdateMerchantSettings(merchantId, request);
				if (response.error) {
					toast('Erro ao salvar', {
						description: response.error.message ?? 'Erro ao salvar configurações',
						variant: 'danger',
						indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					});
					return;
				}

				let nextSettings = response.data;

				if (!nextSettings) {
					const refreshedSettings = await adminGetMerchantSettings(merchantId);
					nextSettings = refreshedSettings.data;
				}

				if (nextSettings) {
					const data = merchantSettingsToFormData(nextSettings, platformSettings);
					setFormData(data);
					setInitialFormData(data);
					setShowPixReserveField(hasConfiguredPercentage(data.pixReservePercentage));
					setShowPixReserveCompensationField(hasConfiguredDays(data.pixReserveCompensationDays));
					setShowBoletoReserveField(hasConfiguredPercentage(data.boletoReservePercentage));
					setShowBoletoReserveCompensationField(hasConfiguredDays(data.boletoReserveCompensationDays));
					setShowCreditCardReserveField(hasConfiguredPercentage(data.creditCardReservePercentage));
					setShowCreditCardReserveCompensationField(
						hasConfiguredDays(data.creditCardReserveCompensationDays)
					);
					setLastUpdated(nextSettings.updatedAt);
				} else {
					// Keep the currently edited values as source of truth if API does not return payload.
					setInitialFormData(formData);
				}
				merchantSaved = true;
			}

			if (canManageWayne && hasWayneChanges) {
				const wayneRequest: AdminUpdateWayneProtocolSettingsRequest = {
					environment: wayneSettings.environment,
					isEnabled: wayneSettings.isEnabled,
					cycleVolume: wayneSettings.cycleVolume,
					samplingRatePercent: wayneSettings.samplingRatePercent,
				};

				const wayneResponse = await adminUpdateWayneProtocolSettings(wayneRequest);
				if (wayneResponse.error || !wayneResponse.data) {
					toast('Erro ao salvar Wayne', {
						description: wayneResponse.error?.message ?? 'Não foi possível salvar configurações do protocolo Wayne.',
						variant: 'danger',
						indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					});
					return;
				}

				setWayneSettings(wayneResponse.data);
				setInitialWayneSettings(wayneResponse.data);
				wayneSaved = true;
			}

			if (merchantSaved && wayneSaved) {
				toast('Configurações salvas', {
					description: 'As configurações gerais e o Protocolo Wayne foram atualizados com sucesso.',
					variant: 'success',
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				});
			} else if (merchantSaved) {
				toast('Configurações salvas', {
					description: 'As configurações foram atualizadas com sucesso.',
					variant: 'success',
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				});
			} else if (wayneSaved) {
				toast('Protocolo Wayne atualizado', {
					description: 'Configurações internas do Wayne foram salvas com sucesso.',
					variant: 'success',
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				});
			}

			// Keep local state as source of truth after save to avoid visual rollback of selects.
		});
	}

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (hasAnyErrors) return;
		if (hasChanges && lossDetails && lossDetails.length > 0) {
			setShowLossConfirmation(true);
			return;
		}
		performSubmit();
	}

	function handleWayneEnvironmentChange(environment: PaymentEnvironment) {
		setWayneSettings((prev) => ({ ...prev, environment }));

		startWayneTransition(async () => {
			const response = await adminGetWayneProtocolSettings(environment);
			if (response.error || !response.data) {
				toast('Erro ao carregar Wayne', {
					description: response.error?.message ?? 'Não foi possível carregar configurações do protocolo Wayne.',
					variant: 'danger',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				});
				return;
			}

			setWayneSettings(response.data);
			setInitialWayneSettings(response.data);
		});
	}

	function handleConfirmLoss() {
		setShowLossConfirmation(false);
		performSubmit();
	}

	const effectiveBoletoApiFeeMode = resolveEffectiveFeeMode(
		formData.boletoApiFeeMode,
		platformSettings.boletoApiFeeMode as FeeChargeMode
	);
	const showBoletoApiFixedFeeInput = shouldShowFixedFeeInput(effectiveBoletoApiFeeMode);
	const showBoletoApiPercentageFeeInput = shouldShowPercentageFeeInput(effectiveBoletoApiFeeMode);
	const effectiveBoletoCheckoutFeeMode = resolveEffectiveFeeMode(
		formData.boletoCheckoutFeeMode,
		platformSettings.boletoCheckoutFeeMode as FeeChargeMode
	);
	const showBoletoCheckoutFixedFeeInput = shouldShowFixedFeeInput(effectiveBoletoCheckoutFeeMode);
	const showBoletoCheckoutPercentageFeeInput = shouldShowPercentageFeeInput(effectiveBoletoCheckoutFeeMode);
	const effectiveBoletoPaymentLinkFeeMode = resolveEffectiveFeeMode(
		formData.boletoPaymentLinkFeeMode,
		platformSettings.boletoPaymentLinkFeeMode as FeeChargeMode
	);
	const showBoletoPaymentLinkFixedFeeInput = shouldShowFixedFeeInput(effectiveBoletoPaymentLinkFeeMode);
	const showBoletoPaymentLinkPercentageFeeInput = shouldShowPercentageFeeInput(effectiveBoletoPaymentLinkFeeMode);
	const effectiveWithdrawalFeeMode = resolveEffectiveFeeMode(
		formData.withdrawalFeeMode,
		platformSettings.withdrawalFeeMode as FeeChargeMode
	);
	const showWithdrawalFixedFeeInput = shouldShowFixedFeeInput(effectiveWithdrawalFeeMode);
	const showWithdrawalPercentageFeeInput = shouldShowPercentageFeeInput(effectiveWithdrawalFeeMode);
	const paymentLinkDomainOptions = platformSettings.paymentLinkDomainOptions ?? [];
	const pixDomainOptions = getMethodDomainOptions(paymentLinkDomainOptions, PaymentMethod.Pix);
	const boletoDomainOptions = getMethodDomainOptions(paymentLinkDomainOptions, PaymentMethod.Boleto);
	const creditCardDomainOptions = getMethodDomainOptions(paymentLinkDomainOptions, PaymentMethod.CreditCard);

	return (
		<>
			<AlertDialog.Backdrop isOpen={showLossConfirmation} onOpenChange={setShowLossConfirmation}>
				<AlertDialog.Container>
					<AlertDialog.Dialog className="sm:max-w-125">
						<AlertDialog.CloseTrigger />
						<AlertDialog.Header>
							<AlertDialog.Icon status="danger" />
							<AlertDialog.Heading>Configuração com prejuízo</AlertDialog.Heading>
						</AlertDialog.Header>
						<AlertDialog.Body>
							<p className="mb-4">
								As taxas configuradas resultarão em prejuízo para a plataforma nas seguintes operações:
							</p>
							<div className="flex flex-col gap-2">
								{lossDetails?.map((item, index) => (
									<div
										key={index}
										className="flex items-center justify-between rounded-md border border-danger-soft bg-danger-soft p-2.5 text-sm text-danger"
									>
										<span className="font-medium">{item.type}</span>
										<span>Prejuízo: {formatCurrency(item.loss)} por transação</span>
									</div>
								))}
							</div>
							<p className="mt-4 text-sm text-muted">
								Tem certeza que deseja salvar esta configuração? A plataforma terá prejuízo em cada transação deste
								organização.
							</p>
						</AlertDialog.Body>
						<AlertDialog.Footer>
							<Button slot="close" variant="tertiary">
								Cancelar
							</Button>
							<Button variant="danger" onPress={handleConfirmLoss}>
								Salvar mesmo assim
							</Button>
						</AlertDialog.Footer>
					</AlertDialog.Dialog>
				</AlertDialog.Container>
			</AlertDialog.Backdrop>

			<Form className="flex flex-col gap-6" onSubmit={handleSubmit}>
				<div className="flex flex-col gap-4">
					{canManageWayne && (
						<SystemAccordion
							id="wayne"
							title="Protocolo Wayne"
							iconNode={<Image src="/icons/bat.png" alt="Bat icon" width={24} height={24} className="size-6" />}
							color="slate"
							defaultExpanded={false}
							summary={`${wayneSettings.environment} · Ciclo ${wayneSettings.cycleVolume} · Amostragem ${wayneSettings.samplingRatePercent}% · ${wayneSettings.isEnabled ? 'Ativado' : 'Desativado'}`}
						>
							<div className="flex flex-col gap-3">
								<p className="text-sm text-muted">
									Controla amostragem X/Y por ambiente para recuperação operacional com retenção integral de taxa.
								</p>

								<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
									<Select
										variant="secondary"
										aria-label="Ambiente do Wayne"
										value={wayneSettings.environment}
										onChange={(key) => {
											if (!key) return;
											handleWayneEnvironmentChange(key as PaymentEnvironment);
										}}
									>
										<Label>Ambiente</Label>
										<Select.Trigger className="w-full">
											<Select.Value />
											<Select.Indicator className="size-4" />
										</Select.Trigger>
										<Select.Popover>
											<ListBox>
												<ListBox.Item
													key={PaymentEnvironment.Production}
													id={PaymentEnvironment.Production}
													textValue="Production"
												>
													<Chip variant="soft" color="danger">
														Production
													</Chip>
													<ListBox.ItemIndicator />
												</ListBox.Item>
												<ListBox.Item
													key={PaymentEnvironment.Sandbox}
													id={PaymentEnvironment.Sandbox}
													textValue="Sandbox"
												>
													<Chip variant="soft" color="accent">
														Sandbox
													</Chip>
													<ListBox.ItemIndicator />
												</ListBox.Item>
											</ListBox>
										</Select.Popover>
									</Select>

									<Select
										variant="secondary"
										aria-label="Status do Wayne"
										value={wayneSettings.isEnabled ? 'enabled' : 'disabled'}
										onChange={(key) => {
											if (!key) return;
											setWayneSettings((prev) => ({ ...prev, isEnabled: key === 'enabled' }));
										}}
									>
										<Label>Status</Label>
										<Select.Trigger className="w-full">
											<Select.Value />
											<Select.Indicator className="size-4" />
										</Select.Trigger>
										<Select.Popover>
											<ListBox>
												<ListBox.Item key="enabled" id="enabled" textValue="Ativado">
													<Chip variant="soft" color="success">
														Ativado
													</Chip>
													<ListBox.ItemIndicator />
												</ListBox.Item>
												<ListBox.Item key="disabled" id="disabled" textValue="Desativado">
													<Chip variant="soft" color="default">
														Desativado
													</Chip>
													<ListBox.ItemIndicator />
												</ListBox.Item>
											</ListBox>
										</Select.Popover>
									</Select>

									<TextField
										variant="secondary"
										name="wayneCycleVolume"
										value={String(wayneSettings.cycleVolume)}
										validate={() =>
											wayneSettings.cycleVolume < 1 || wayneSettings.cycleVolume > 100000
												? 'Volume do ciclo deve estar entre 1 e 100000'
												: null
										}
									>
										<Label>Volume do Ciclo (X)</Label>
										<Input
											type="number"
											min={1}
											max={100000}
											value={String(wayneSettings.cycleVolume)}
											onChange={(e) =>
												setWayneSettings((prev) => ({
													...prev,
													cycleVolume: Number(e.target.value || 0),
												}))
											}
										/>
										<FieldError />
									</TextField>

									<TextField
										variant="secondary"
										name="wayneSamplingRatePercent"
										value={String(wayneSettings.samplingRatePercent)}
										validate={() =>
											wayneSettings.samplingRatePercent < 0 || wayneSettings.samplingRatePercent > 100
												? 'Taxa de amostragem deve estar entre 0 e 100'
												: null
										}
									>
										<Label>Taxa de Amostragem (%) (Y)</Label>
										<Input
											type="number"
											min={0}
											max={100}
											value={String(wayneSettings.samplingRatePercent)}
											onChange={(e) =>
												setWayneSettings((prev) => ({
													...prev,
													samplingRatePercent: Number(e.target.value || 0),
												}))
											}
										/>
										<FieldError />
									</TextField>
								</div>
								<div className="flex items-center gap-2 text-xs text-muted">
									<Icon icon={InformationCircleIcon} className="icon-xs shrink-0" />
									<span>X define o tamanho do ciclo e Y o percentual amostrado por ciclo.</span>
								</div>
								<div className="flex items-center gap-2 text-xs text-muted">
									<Icon icon={InformationCircleIcon} className="icon-xs shrink-0" />
									<span>
										Transações Wayne liquidam apenas na plataforma e não confirmam pagamento para a organização.
									</span>
								</div>
							</div>
						</SystemAccordion>
					)}

					{hasChanges && (
						<Alert status="warning">
							<Alert.Indicator />
							<Alert.Content>
								<Alert.Title>Alterações não salvas</Alert.Title>
								<Alert.Description>
									Você tem alterações não salvas. Clique em &quot;Salvar configurações&quot; para aplicar as mudanças.
								</Alert.Description>
							</Alert.Content>
						</Alert>
					)}

					<MerchantControlsAccordion
						formData={formData}
						platformSettings={platformSettings}
						featureFlagOptions={featureFlagOptions}
						onSelectChange={(field, key) => handleSelectChange(field, key)}
						summary={
							<>
								PIX {featureFlagSummaryLabel(formData.pixEnabled, platformSettings.pixEnabled)} | Boleto{' '}
								{featureFlagSummaryLabel(formData.boletoEnabled, platformSettings.boletoEnabled)} | Cartão{' '}
								{featureFlagSummaryLabel(formData.creditCardEnabled, platformSettings.creditCardEnabled)} | Saque{' '}
								{featureFlagSummaryLabel(formData.withdrawalEnabled, platformSettings.withdrawalEnabled)} | Troca
								nominal{' '}
								{featureFlagSummaryLabel(formData.selfNominalSwitchEnabled, platformSettings.selfNominalSwitchEnabled)}
							</>
						}
					/>

					<SystemAccordion
						id="transaction-visualization-domains"
						icon={Link01Icon}
						title="Domínio de Visualização da Transação"
						color="muted"
						defaultExpanded={false}
						summary={
							<>
								PIX: {resolveDomainOptionName(paymentLinkDomainOptions, PaymentMethod.Pix, formData.paymentLinkPixOptionId)}
								 {' | '}Boleto:{' '}
								{resolveDomainOptionName(paymentLinkDomainOptions, PaymentMethod.Boleto, formData.paymentLinkBoletoOptionId)}
								 {' | '}Cartão:{' '}
								{resolveDomainOptionName(paymentLinkDomainOptions, PaymentMethod.CreditCard, formData.paymentLinkCreditCardOptionId)}
							</>
						}
					>
						<p className="text-xs text-muted">
							Selecione qual domínio a organização deve usar para gerar o link de visualização de cada método.
						</p>
						<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
							<Select
								variant="secondary"
								aria-label="Domínio de visualização PIX"
								value={formData.paymentLinkPixOptionId || 'default'}
								onChange={(key) =>
									handleFieldChange('paymentLinkPixOptionId', key === 'default' ? '' : String(key))
								}
							>
								<Label>PIX</Label>
								<Select.Trigger className="w-full">
									<Select.Value />
									<Select.Indicator className="size-4" />
								</Select.Trigger>
								<Select.Popover>
									<ListBox>
										<ListBox.Item id="default" key="default" textValue="Padrão da plataforma">
											<Chip variant="soft" color="default">Padrão da plataforma</Chip>
											<ListBox.ItemIndicator />
										</ListBox.Item>
										{pixDomainOptions.map((option) => (
											<ListBox.Item id={option.id} key={option.id} textValue={option.name}>
												<Chip variant="soft" color={option.isDefault ? 'success' : 'accent'}>
													{option.name}
												</Chip>
												<ListBox.ItemIndicator />
											</ListBox.Item>
										))}
									</ListBox>
								</Select.Popover>
							</Select>

							<Select
								variant="secondary"
								aria-label="Domínio de visualização Boleto"
								value={formData.paymentLinkBoletoOptionId || 'default'}
								onChange={(key) =>
									handleFieldChange('paymentLinkBoletoOptionId', key === 'default' ? '' : String(key))
								}
							>
								<Label>Boleto</Label>
								<Select.Trigger className="w-full">
									<Select.Value />
									<Select.Indicator className="size-4" />
								</Select.Trigger>
								<Select.Popover>
									<ListBox>
										<ListBox.Item id="default" key="default" textValue="Padrão da plataforma">
											<Chip variant="soft" color="default">Padrão da plataforma</Chip>
											<ListBox.ItemIndicator />
										</ListBox.Item>
										{boletoDomainOptions.map((option) => (
											<ListBox.Item id={option.id} key={option.id} textValue={option.name}>
												<Chip variant="soft" color={option.isDefault ? 'success' : 'warning'}>
													{option.name}
												</Chip>
												<ListBox.ItemIndicator />
											</ListBox.Item>
										))}
									</ListBox>
								</Select.Popover>
							</Select>

							<Select
								variant="secondary"
								aria-label="Domínio de visualização Cartão"
								value={formData.paymentLinkCreditCardOptionId || 'default'}
								onChange={(key) =>
									handleFieldChange('paymentLinkCreditCardOptionId', key === 'default' ? '' : String(key))
								}
							>
								<Label>Cartão</Label>
								<Select.Trigger className="w-full">
									<Select.Value />
									<Select.Indicator className="size-4" />
								</Select.Trigger>
								<Select.Popover>
									<ListBox>
										<ListBox.Item id="default" key="default" textValue="Padrão da plataforma">
											<Chip variant="soft" color="default">Padrão da plataforma</Chip>
											<ListBox.ItemIndicator />
										</ListBox.Item>
										{creditCardDomainOptions.map((option) => (
											<ListBox.Item id={option.id} key={option.id} textValue={option.name}>
												<Chip variant="soft" color={option.isDefault ? 'success' : 'accent'}>
													{option.name}
												</Chip>
												<ListBox.ItemIndicator />
											</ListBox.Item>
										))}
									</ListBox>
								</Select.Popover>
							</Select>
						</div>
					</SystemAccordion>

					{isPixEnabled && (
						<PixSettingsAccordion
							formData={formData}
							platformSettings={platformSettings}
							acquirer={acquirer}
							showReserveField={showPixReserveField}
							showReserveCompensationField={showPixReserveCompensationField}
							onToggleReserveField={(isSelected) => {
								setShowPixReserveField(isSelected);
								if (!isSelected) {
									handleResetField('pixReservePercentage');
								}
							}}
							onToggleReserveCompensationField={(isSelected) => {
								setShowPixReserveCompensationField(isSelected);
								if (!isSelected) {
									handleResetField('pixReserveCompensationDays');
								}
							}}
							feeChargeModeSelectOptionsWithDefault={feeChargeModeSelectOptionsWithDefault}
							onFieldChange={(field, value) => handleFieldChange(field, value)}
							onSelectChange={(field, key) => handleSelectChange(field, key)}
							onResetField={(field) => handleResetField(field)}
							formatEffectiveAmount={formatEffectiveAmount}
							formatFeeModeLabel={formatFeeModeLabel}
							formatEffectiveFee={formatEffectiveFee}
							formatEffectiveReserve={formatEffectiveReserve}
							formatEffectiveReserveCompensationDays={formatEffectiveReserveCompensationDays}
						/>
					)}
					{isBoletoEnabled && (
						<SystemAccordion
							id="boleto"
							icon={Invoice03Icon}
							title="Boleto"
							color="amber"
							defaultExpanded={false}
							summary={
								<>
									Min{' '}
									{formatEffectiveAmount(
										formData.boletoMinTransactionAmount,
										platformSettings.boletoMinTransactionAmount
									)}
									{' | '}Máx{' '}
									{formatEffectiveAmount(
										formData.boletoMaxTransactionAmount,
										platformSettings.boletoMaxTransactionAmount
									)}
									{' | '}Reserva{' '}
									{formatEffectiveReserve(
										formData.boletoReservePercentage,
										platformSettings.boletoReservePercentage
									)}
									{' | '}Compensação{' '}
									{formatEffectiveReserveCompensationDays(
										formData.boletoReserveCompensationDays,
										platformSettings.boletoReserveCompensationDays
									)}
									{' | '}API (
									{formatFeeModeLabel(formData.boletoApiFeeMode, platformSettings.boletoApiFeeMode as FeeChargeMode)}){' '}
									{formatEffectiveFee(
										formData.boletoApiFeeMode,
										formData.boletoApiFeeFixed,
										formData.boletoApiFeePercentage,
										platformSettings.boletoApiFeeMode as FeeChargeMode,
										platformSettings.boletoApiFeeFixed,
										platformSettings.boletoApiFeePercentage
									)}
									{' | '}Checkout (
									{formatFeeModeLabel(
										formData.boletoCheckoutFeeMode,
										platformSettings.boletoCheckoutFeeMode as FeeChargeMode
									)}
									){' '}
									{formatEffectiveFee(
										formData.boletoCheckoutFeeMode,
										formData.boletoCheckoutFeeFixed,
										formData.boletoCheckoutFeePercentage,
										platformSettings.boletoCheckoutFeeMode as FeeChargeMode,
										platformSettings.boletoCheckoutFeeFixed,
										platformSettings.boletoCheckoutFeePercentage
									)}
									{' | '}Link (
									{formatFeeModeLabel(
										formData.boletoPaymentLinkFeeMode,
										platformSettings.boletoPaymentLinkFeeMode as FeeChargeMode
									)}
									){' '}
									{formatEffectiveFee(
										formData.boletoPaymentLinkFeeMode,
										formData.boletoPaymentLinkFeeFixed,
										formData.boletoPaymentLinkFeePercentage,
										platformSettings.boletoPaymentLinkFeeMode as FeeChargeMode,
										platformSettings.boletoPaymentLinkFeeFixed,
										platformSettings.boletoPaymentLinkFeePercentage
									)}
								</>
							}
						>
							<div className="flex items-center gap-2 text-xs text-foreground/60">
								<Chip variant="soft" color="warning" size="sm">
									Limites
								</Chip>
								<span>Valores mínimo e máximo de transação</span>
							</div>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
								<div className="flex flex-col gap-2">
									<TextField
										variant="secondary"
										name="boletoMinTransactionAmount"
										validate={() => {
											const cents = formattedCurrencyToCents(formData.boletoMinTransactionAmount);
											if (cents !== null && cents < 0) {
												return 'O valor não pode ser negativo';
											}
											return null;
										}}
									>
										<Label>Valor Mínimo (R$)</Label>
										<div className="flex items-center gap-2">
											<CurrencyCentsInput
												initialValueInCents={formattedCurrencyToCents(formData.boletoMinTransactionAmount) ?? undefined}
												placeholder="Usar padrão do sistema"
												className="flex-1"
												onValueChange={(value) => handleFieldChange('boletoMinTransactionAmount', value)}
											/>
											{formData.boletoMinTransactionAmount && (
												<Button
													isIconOnly
													variant="ghost"
													size="sm"
													onPress={() => handleResetField('boletoMinTransactionAmount')}
												>
													<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
												</Button>
											)}
										</div>
										<FieldError />
									</TextField>
									<PlatformDefault label="Padrão" value={formatCurrency(platformSettings.boletoMinTransactionAmount)} />
								</div>

								<div className="flex flex-col gap-2">
									<TextField
										variant="secondary"
										name="boletoMaxTransactionAmount"
										validate={() => {
											const max = formattedCurrencyToCents(formData.boletoMaxTransactionAmount);
											if (max !== null && max < 0) {
												return 'O valor não pode ser negativo';
											}
											const min = formattedCurrencyToCents(formData.boletoMinTransactionAmount);
											if (min !== null && max !== null && max < min) {
												return 'O valor máximo não pode ser menor que o valor mínimo';
											}
											return null;
										}}
									>
										<Label>Valor Máximo (R$)</Label>
										<div className="flex items-center gap-2">
											<CurrencyCentsInput
												initialValueInCents={formattedCurrencyToCents(formData.boletoMaxTransactionAmount) ?? undefined}
												placeholder="Usar padrão do sistema"
												className="flex-1"
												onValueChange={(value) => handleFieldChange('boletoMaxTransactionAmount', value)}
											/>
											{formData.boletoMaxTransactionAmount && (
												<Button
													isIconOnly
													variant="ghost"
													size="sm"
													onPress={() => handleResetField('boletoMaxTransactionAmount')}
												>
													<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
												</Button>
											)}
										</div>
										<FieldError />
									</TextField>
									<PlatformDefault label="Padrão" value={formatCurrency(platformSettings.boletoMaxTransactionAmount)} />
								</div>

										<div className="col-span-full flex flex-wrap items-center gap-4 rounded-lg border border-divider bg-content1 p-3">
											<Checkbox
												variant="secondary"
												isSelected={showBoletoReserveField}
												onChange={(isSelected: boolean) => {
													setShowBoletoReserveField(isSelected);
													if (!isSelected) {
														handleResetField('boletoReservePercentage');
													}
												}}
											>
												<Checkbox.Control>
													<Checkbox.Indicator />
												</Checkbox.Control>
												<Checkbox.Content>Configurar reserva</Checkbox.Content>
											</Checkbox>

											<Checkbox
												variant="secondary"
												isSelected={showBoletoReserveCompensationField}
												onChange={(isSelected: boolean) => {
													setShowBoletoReserveCompensationField(isSelected);
													if (!isSelected) {
														handleResetField('boletoReserveCompensationDays');
													}
												}}
											>
												<Checkbox.Control>
													<Checkbox.Indicator />
												</Checkbox.Control>
												<Checkbox.Content>Configurar compensação</Checkbox.Content>
											</Checkbox>
										</div>

										{showBoletoReserveField && (
											<div className="flex flex-col gap-2">
												<TextField
													variant="secondary"
													name="boletoReservePercentage"
													value={formData.boletoReservePercentage ?? ''}
													validate={() => {
														const basisPoints = percentageToBasisPoints(formData.boletoReservePercentage);
														if (basisPoints !== null && (basisPoints < 0 || basisPoints > 10000)) {
															return 'O percentual deve estar entre 0% e 100%';
														}
														return null;
													}}
												>
													<Label>Reserva Financeira (%)</Label>
													<div className="flex items-center gap-2">
														<NumericFormat
															customInput={Input}
															{...percentageFormatProps}
															value={formData.boletoReservePercentage}
															placeholder="Usar padrão"
															className="flex-1"
															onValueChange={(values) =>
																handleFieldChange('boletoReservePercentage', values.formattedValue)
															}
														/>
														{formData.boletoReservePercentage && (
															<Button
																isIconOnly
																variant="ghost"
																size="sm"
																onPress={() => handleResetField('boletoReservePercentage')}
															>
																<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
															</Button>
														)}
													</div>
													<FieldError />
												</TextField>
												<PlatformDefault
													label="Padrão"
													value={`${(platformSettings.boletoReservePercentage / 100).toFixed(2)}%`}
												/>
											</div>
										)}

										{showBoletoReserveCompensationField && (
											<div className="flex flex-col gap-2">
												<TextField
													variant="secondary"
													name="boletoReserveCompensationDays"
													value={formData.boletoReserveCompensationDays ?? ''}
													validate={() => {
														const days = formData.boletoReserveCompensationDays
															? Number(formData.boletoReserveCompensationDays)
															: null;
														if (days !== null && (!Number.isInteger(days) || days < 0 || days > 365)) {
															return 'Os dias devem estar entre 0 e 365';
														}
														return null;
													}}
												>
													<Label>Compensação da Reserva (dias)</Label>
													<div className="flex items-center gap-2">
														<Input
															variant="secondary"
															type="number"
															min={0}
															max={365}
															placeholder="Usar padrão"
															className="flex-1"
															value={formData.boletoReserveCompensationDays}
															onChange={(e) => handleFieldChange('boletoReserveCompensationDays', e.target.value)}
														/>
														{formData.boletoReserveCompensationDays && (
															<Button
																isIconOnly
																variant="ghost"
																size="sm"
																onPress={() => handleResetField('boletoReserveCompensationDays')}
															>
																<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
															</Button>
														)}
													</div>
													<FieldError />
												</TextField>
												<PlatformDefault
													label="Padrão"
													value={`${platformSettings.boletoReserveCompensationDays} dias`}
												/>
											</div>
										)}
							</div>

							<Separator />

							<div className="grid grid-cols-1 gap-6">
								<div className="flex flex-col gap-4 rounded-lg bg-content1">
									<div className="flex items-center gap-2 text-xs text-foreground/60">
										<Chip variant="soft" color="warning" size="sm">
											API
										</Chip>
										<span>Taxas para integrações diretas</span>
									</div>
									<div
										className={
											showBoletoApiFixedFeeInput && showBoletoApiPercentageFeeInput
												? 'grid grid-cols-1 gap-4 2xl:grid-cols-3'
												: 'grid grid-cols-1 gap-4 2xl:grid-cols-2'
										}
									>
										<div className="flex flex-col gap-2">
											<Select
												variant="secondary"
												placeholder="Usar padrão do sistema"
												aria-label="Modo de Taxa BOLETO API"
												value={formData.boletoApiFeeMode}
												onChange={(key) => handleSelectChange('boletoApiFeeMode', key)}
											>
												<Label>Modo de Cobrança</Label>
												<Select.Trigger className="w-full">
													<Select.Value />
													<Select.Indicator className="size-4" />
												</Select.Trigger>
												<Select.Popover>
													<ListBox>
														{feeChargeModeSelectOptionsWithDefault.map((option) => (
															<ListBox.Item key={option.key} id={option.key} textValue={option.label}>
																<Chip variant="soft" color={mapParseColorToChipColor(option.color)} className="gap-1">
																	{option.icon}
																	{option.label}
																</Chip>
																<ListBox.ItemIndicator />
															</ListBox.Item>
														))}
													</ListBox>
												</Select.Popover>
											</Select>
											<PlatformDefault
												label="Padrão"
												value={feeChargeModeParse[platformSettings.boletoApiFeeMode as FeeChargeMode]?.label ?? '—'}
											/>
										</div>

										{showBoletoApiFixedFeeInput && (
											<div className="flex flex-col gap-2">
												<TextField
													variant="secondary"
													name="boletoApiFeeFixed"
													value={formData.boletoApiFeeFixed ?? ''}
													isDisabled={
														formData.boletoApiFeeMode === 'default' || effectiveBoletoApiFeeMode === FeeChargeMode.PercentageOnly
													}
													validate={() => {
														const cents = formattedCurrencyToCents(formData.boletoApiFeeFixed);
														if (cents !== null && cents < 0) {
															return 'O valor não pode ser negativo';
														}
														return null;
													}}
												>
													<Label>Valor Fixo (R$)</Label>
													<div className="flex items-center gap-2">
														<CurrencyCentsInput
															initialValueInCents={formattedCurrencyToCents(formData.boletoApiFeeFixed) ?? undefined}
															placeholder="Usar padrão"
															className="flex-1"
															disabled={
																formData.boletoApiFeeMode === 'default' ||
																effectiveBoletoApiFeeMode === FeeChargeMode.PercentageOnly
															}
															onValueChange={(value) => handleFieldChange('boletoApiFeeFixed', value)}
														/>
														{formData.boletoApiFeeFixed && (
															<Button
																isIconOnly
																variant="ghost"
																size="sm"
																onPress={() => handleResetField('boletoApiFeeFixed')}
															>
																<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
															</Button>
														)}
													</div>
													<FieldError />
												</TextField>
												<PlatformDefault label="Padrão" value={formatCurrency(platformSettings.boletoApiFeeFixed)} />
											</div>
										)}

										{showBoletoApiPercentageFeeInput && (
											<div className="flex flex-col gap-2">
												<TextField
													variant="secondary"
													name="boletoApiFeePercentage"
													value={formData.boletoApiFeePercentage ?? ''}
													isDisabled={
														formData.boletoApiFeeMode === 'default' || effectiveBoletoApiFeeMode === FeeChargeMode.FixedOnly
													}
													validate={() => {
														const basisPoints = percentageToBasisPoints(formData.boletoApiFeePercentage);
														if (basisPoints !== null && (basisPoints < 0 || basisPoints > 10000)) {
															return 'O percentual deve estar entre 0% e 100%';
														}
														return null;
													}}
												>
													<Label>Percentual (%)</Label>
													<div className="flex items-center gap-2">
														<NumericFormat
															customInput={Input}
															{...percentageFormatProps}
															value={formData.boletoApiFeePercentage}
															placeholder="Usar padrão"
															className="flex-1"
															disabled={
																formData.boletoApiFeeMode === 'default' ||
																effectiveBoletoApiFeeMode === FeeChargeMode.FixedOnly
															}
															onValueChange={(values) =>
																handleFieldChange('boletoApiFeePercentage', values.formattedValue)
															}
														/>
														{formData.boletoApiFeePercentage && (
															<Button
																isIconOnly
																variant="ghost"
																size="sm"
																onPress={() => handleResetField('boletoApiFeePercentage')}
															>
																<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
															</Button>
														)}
													</div>
													<FieldError />
												</TextField>
												<PlatformDefault
													label="Padrão"
													value={`${(platformSettings.boletoApiFeePercentage / 100).toFixed(2)}%`}
												/>
											</div>
										)}
									</div>

									{acquirer && (
										<FeeProfitIndicator
											merchantFeeMode={formData.boletoApiFeeMode}
											merchantFeeFixed={formData.boletoApiFeeFixed}
											merchantFeePercentage={formData.boletoApiFeePercentage}
											acquirerFeeMode={acquirer.boletoInFeeMode}
											acquirerFeeFixed={acquirer.boletoInFeeFixed}
											acquirerFeePercentage={acquirer.boletoInFeePercentage}
											platformFeeMode={platformSettings.boletoApiFeeMode as FeeChargeMode}
											platformFeeFixed={platformSettings.boletoApiFeeFixed}
											platformFeePercentage={platformSettings.boletoApiFeePercentage}
										/>
									)}
								</div>

								<div className="flex flex-col gap-4 rounded-lg bg-content1">
									<div className="flex items-center gap-2 text-xs text-foreground/60">
										<Chip variant="soft" color="warning" size="sm">
											Checkout
										</Chip>
										<span>Taxas para checkout integrado</span>
									</div>
									<div
										className={
											showBoletoCheckoutFixedFeeInput && showBoletoCheckoutPercentageFeeInput
												? 'grid grid-cols-1 gap-4 2xl:grid-cols-3'
												: 'grid grid-cols-1 gap-4 2xl:grid-cols-2'
										}
									>
										<div className="flex flex-col gap-2">
											<Select
												variant="secondary"
												placeholder="Usar padrão do sistema"
												aria-label="Modo de Taxa BOLETO Checkout"
												value={formData.boletoCheckoutFeeMode}
												onChange={(key) => handleSelectChange('boletoCheckoutFeeMode', key)}
											>
												<Label>Modo de Cobrança</Label>
												<Select.Trigger className="w-full">
													<Select.Value />
													<Select.Indicator className="size-4" />
												</Select.Trigger>
												<Select.Popover>
													<ListBox>
														{feeChargeModeSelectOptionsWithDefault.map((option) => (
															<ListBox.Item key={option.key} id={option.key} textValue={option.label}>
																<Chip variant="soft" color={mapParseColorToChipColor(option.color)} className="gap-1">
																	{option.icon}
																	{option.label}
																</Chip>
																<ListBox.ItemIndicator />
															</ListBox.Item>
														))}
													</ListBox>
												</Select.Popover>
											</Select>
											<PlatformDefault
												label="Padrão"
												value={
													feeChargeModeParse[platformSettings.boletoCheckoutFeeMode as FeeChargeMode]?.label ?? '—'
												}
											/>
										</div>

										{showBoletoCheckoutFixedFeeInput && (
											<div className="flex flex-col gap-2">
												<TextField
													variant="secondary"
													name="boletoCheckoutFeeFixed"
													value={formData.boletoCheckoutFeeFixed ?? ''}
													isDisabled={
														formData.boletoCheckoutFeeMode === 'default' ||
														effectiveBoletoCheckoutFeeMode === FeeChargeMode.PercentageOnly
													}
													validate={() => {
														const cents = formattedCurrencyToCents(formData.boletoCheckoutFeeFixed);
														if (cents !== null && cents < 0) {
															return 'O valor não pode ser negativo';
														}
														return null;
													}}
												>
													<Label>Valor Fixo (R$)</Label>
													<div className="flex items-center gap-2">
														<CurrencyCentsInput
															initialValueInCents={formattedCurrencyToCents(formData.boletoCheckoutFeeFixed) ?? undefined}
															placeholder="Usar padrão"
															className="flex-1"
															disabled={
																formData.boletoCheckoutFeeMode === 'default' ||
																effectiveBoletoCheckoutFeeMode === FeeChargeMode.PercentageOnly
															}
															onValueChange={(value) => handleFieldChange('boletoCheckoutFeeFixed', value)}
														/>
														{formData.boletoCheckoutFeeFixed && (
															<Button
																isIconOnly
																variant="ghost"
																size="sm"
																onPress={() => handleResetField('boletoCheckoutFeeFixed')}
															>
																<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
															</Button>
														)}
													</div>
													<FieldError />
												</TextField>
												<PlatformDefault label="Padrão" value={formatCurrency(platformSettings.boletoCheckoutFeeFixed)} />
											</div>
										)}

										{showBoletoCheckoutPercentageFeeInput && (
											<div className="flex flex-col gap-2">
												<TextField
													variant="secondary"
													name="boletoCheckoutFeePercentage"
													value={formData.boletoCheckoutFeePercentage ?? ''}
													isDisabled={
														formData.boletoCheckoutFeeMode === 'default' ||
														effectiveBoletoCheckoutFeeMode === FeeChargeMode.FixedOnly
													}
													validate={() => {
														const basisPoints = percentageToBasisPoints(formData.boletoCheckoutFeePercentage);
														if (basisPoints !== null && (basisPoints < 0 || basisPoints > 10000)) {
															return 'O percentual deve estar entre 0% e 100%';
														}
														return null;
													}}
												>
													<Label>Percentual (%)</Label>
													<div className="flex items-center gap-2">
														<NumericFormat
															customInput={Input}
															{...percentageFormatProps}
															value={formData.boletoCheckoutFeePercentage}
															placeholder="Usar padrão"
															className="flex-1"
															disabled={
																formData.boletoCheckoutFeeMode === 'default' ||
																effectiveBoletoCheckoutFeeMode === FeeChargeMode.FixedOnly
															}
															onValueChange={(values) =>
																handleFieldChange('boletoCheckoutFeePercentage', values.formattedValue)
															}
														/>
														{formData.boletoCheckoutFeePercentage && (
															<Button
																isIconOnly
																variant="ghost"
																size="sm"
																onPress={() => handleResetField('boletoCheckoutFeePercentage')}
															>
																<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
															</Button>
														)}
													</div>
													<FieldError />
												</TextField>
												<PlatformDefault
													label="Padrão"
													value={`${(platformSettings.boletoCheckoutFeePercentage / 100).toFixed(2)}%`}
												/>
											</div>
										)}
									</div>

									{acquirer && (
										<FeeProfitIndicator
											merchantFeeMode={formData.boletoCheckoutFeeMode}
											merchantFeeFixed={formData.boletoCheckoutFeeFixed}
											merchantFeePercentage={formData.boletoCheckoutFeePercentage}
											acquirerFeeMode={acquirer.boletoInFeeMode}
											acquirerFeeFixed={acquirer.boletoInFeeFixed}
											acquirerFeePercentage={acquirer.boletoInFeePercentage}
											platformFeeMode={platformSettings.boletoCheckoutFeeMode as FeeChargeMode}
											platformFeeFixed={platformSettings.boletoCheckoutFeeFixed}
											platformFeePercentage={platformSettings.boletoCheckoutFeePercentage}
										/>
									)}
								</div>

								<div className="flex flex-col gap-4 rounded-lg bg-content1">
									<div className="flex items-center gap-2 text-xs text-foreground/60">
										<Chip variant="soft" color="warning" size="sm">
											Link de Pagamento
										</Chip>
										<span>Taxas para link de pagamento</span>
									</div>
									<div
										className={
											showBoletoPaymentLinkFixedFeeInput && showBoletoPaymentLinkPercentageFeeInput
												? 'grid grid-cols-1 gap-4 2xl:grid-cols-3'
												: 'grid grid-cols-1 gap-4 2xl:grid-cols-2'
										}
									>
										<div className="flex flex-col gap-2">
											<Select
												variant="secondary"
												placeholder="Usar padrão do sistema"
												aria-label="Modo de Taxa BOLETO Link de Pagamento"
												value={formData.boletoPaymentLinkFeeMode}
												onChange={(key) => handleSelectChange('boletoPaymentLinkFeeMode', key)}
											>
												<Label>Modo de Cobrança</Label>
												<Select.Trigger className="w-full">
													<Select.Value />
													<Select.Indicator className="size-4" />
												</Select.Trigger>
												<Select.Popover>
													<ListBox>
														{feeChargeModeSelectOptionsWithDefault.map((option) => (
															<ListBox.Item key={option.key} id={option.key} textValue={option.label}>
																<Chip variant="soft" color={mapParseColorToChipColor(option.color)} className="gap-1">
																	{option.icon}
																	{option.label}
																</Chip>
																<ListBox.ItemIndicator />
															</ListBox.Item>
														))}
													</ListBox>
												</Select.Popover>
											</Select>
											<PlatformDefault
												label="Padrão"
												value={
													feeChargeModeParse[platformSettings.boletoPaymentLinkFeeMode as FeeChargeMode]?.label ?? '—'
												}
											/>
										</div>

										{showBoletoPaymentLinkFixedFeeInput && (
											<div className="flex flex-col gap-2">
												<TextField
													variant="secondary"
													name="boletoPaymentLinkFeeFixed"
													value={formData.boletoPaymentLinkFeeFixed ?? ''}
													isDisabled={
														formData.boletoPaymentLinkFeeMode === 'default' ||
														effectiveBoletoPaymentLinkFeeMode === FeeChargeMode.PercentageOnly
													}
													validate={() => {
														const cents = formattedCurrencyToCents(formData.boletoPaymentLinkFeeFixed);
														if (cents !== null && cents < 0) {
															return 'O valor não pode ser negativo';
														}
														return null;
													}}
												>
													<Label>Valor Fixo (R$)</Label>
													<div className="flex items-center gap-2">
														<CurrencyCentsInput
															initialValueInCents={
																formattedCurrencyToCents(formData.boletoPaymentLinkFeeFixed) ?? undefined
															}
															placeholder="Usar padrão"
															className="flex-1"
															disabled={
																formData.boletoPaymentLinkFeeMode === 'default' ||
																effectiveBoletoPaymentLinkFeeMode === FeeChargeMode.PercentageOnly
															}
															onValueChange={(value) => handleFieldChange('boletoPaymentLinkFeeFixed', value)}
														/>
														{formData.boletoPaymentLinkFeeFixed && (
															<Button
																isIconOnly
																variant="ghost"
																size="sm"
																onPress={() => handleResetField('boletoPaymentLinkFeeFixed')}
															>
																<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
															</Button>
														)}
													</div>
													<FieldError />
												</TextField>
												<PlatformDefault
													label="Padrão"
													value={formatCurrency(platformSettings.boletoPaymentLinkFeeFixed)}
												/>
											</div>
										)}

										{showBoletoPaymentLinkPercentageFeeInput && (
											<div className="flex flex-col gap-2">
												<TextField
													variant="secondary"
													name="boletoPaymentLinkFeePercentage"
													value={formData.boletoPaymentLinkFeePercentage ?? ''}
													isDisabled={
														formData.boletoPaymentLinkFeeMode === 'default' ||
														effectiveBoletoPaymentLinkFeeMode === FeeChargeMode.FixedOnly
													}
													validate={() => {
														const basisPoints = percentageToBasisPoints(formData.boletoPaymentLinkFeePercentage);
														if (basisPoints !== null && (basisPoints < 0 || basisPoints > 10000)) {
															return 'O percentual deve estar entre 0% e 100%';
														}
														return null;
													}}
												>
													<Label>Percentual (%)</Label>
													<div className="flex items-center gap-2">
														<NumericFormat
															customInput={Input}
															{...percentageFormatProps}
															value={formData.boletoPaymentLinkFeePercentage}
															placeholder="Usar padrão"
															className="flex-1"
															disabled={
																formData.boletoPaymentLinkFeeMode === 'default' ||
																effectiveBoletoPaymentLinkFeeMode === FeeChargeMode.FixedOnly
															}
															onValueChange={(values) =>
																handleFieldChange('boletoPaymentLinkFeePercentage', values.formattedValue)
															}
														/>
														{formData.boletoPaymentLinkFeePercentage && (
															<Button
																isIconOnly
																variant="ghost"
																size="sm"
																onPress={() => handleResetField('boletoPaymentLinkFeePercentage')}
															>
																<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
															</Button>
														)}
													</div>
													<FieldError />
												</TextField>
												<PlatformDefault
													label="Padrão"
													value={`${(platformSettings.boletoPaymentLinkFeePercentage / 100).toFixed(2)}%`}
												/>
											</div>
										)}
									</div>

									{acquirer && (
										<FeeProfitIndicator
											merchantFeeMode={formData.boletoPaymentLinkFeeMode}
											merchantFeeFixed={formData.boletoPaymentLinkFeeFixed}
											merchantFeePercentage={formData.boletoPaymentLinkFeePercentage}
											acquirerFeeMode={acquirer.boletoInFeeMode}
											acquirerFeeFixed={acquirer.boletoInFeeFixed}
											acquirerFeePercentage={acquirer.boletoInFeePercentage}
											platformFeeMode={platformSettings.boletoPaymentLinkFeeMode as FeeChargeMode}
											platformFeeFixed={platformSettings.boletoPaymentLinkFeeFixed}
											platformFeePercentage={platformSettings.boletoPaymentLinkFeePercentage}
										/>
									)}
								</div>
							</div>
						</SystemAccordion>
					)}

					{resolveFeatureFlag(formData.creditCardEnabled, platformSettings.creditCardEnabled) && (
						<SystemAccordion
							id="credit-card"
							icon={CreditCardIcon}
							title="Cartão de Crédito"
							color="sky"
							defaultExpanded={false}
							summary={
								<>
									Status{' '}
									{featureFlagSummaryLabel(formData.creditCardEnabled, platformSettings.creditCardEnabled)}
									{' | '}Reserva{' '}
									{formatEffectiveReserve(
										formData.creditCardReservePercentage,
										platformSettings.creditCardReservePercentage
									)}
									{' | '}Compensação{' '}
									{formatEffectiveReserveCompensationDays(
										formData.creditCardReserveCompensationDays,
										platformSettings.creditCardReserveCompensationDays
									)}
									{' | '}API (
									{formatFeeModeLabel(formData.creditCardApiFeeMode, platformSettings.creditCardApiFeeMode as FeeChargeMode)}){' '}
									{formatEffectiveFee(
										formData.creditCardApiFeeMode,
										formData.creditCardApiFeeFixed,
										formData.creditCardApiFeePercentage,
										platformSettings.creditCardApiFeeMode as FeeChargeMode,
										platformSettings.creditCardApiFeeFixed,
										platformSettings.creditCardApiFeePercentage
									)}
									{' | '}Checkout (
									{formatFeeModeLabel(
										formData.creditCardCheckoutFeeMode,
										platformSettings.creditCardCheckoutFeeMode as FeeChargeMode
									)}){' '}
									{formatEffectiveFee(
										formData.creditCardCheckoutFeeMode,
										formData.creditCardCheckoutFeeFixed,
										formData.creditCardCheckoutFeePercentage,
										platformSettings.creditCardCheckoutFeeMode as FeeChargeMode,
										platformSettings.creditCardCheckoutFeeFixed,
										platformSettings.creditCardCheckoutFeePercentage
									)}
									{' | '}Link (
									{formatFeeModeLabel(
										formData.creditCardPaymentLinkFeeMode,
										platformSettings.creditCardPaymentLinkFeeMode as FeeChargeMode
									)}){' '}
									{formatEffectiveFee(
										formData.creditCardPaymentLinkFeeMode,
										formData.creditCardPaymentLinkFeeFixed,
										formData.creditCardPaymentLinkFeePercentage,
										platformSettings.creditCardPaymentLinkFeeMode as FeeChargeMode,
										platformSettings.creditCardPaymentLinkFeeFixed,
										platformSettings.creditCardPaymentLinkFeePercentage
									)}
								</>
							}
						>
							<div className="flex flex-wrap items-center gap-4 rounded-lg border border-divider bg-content1 p-3">
								<Checkbox
									variant="secondary"
									isSelected={showCreditCardReserveField}
									onChange={(isSelected: boolean) => {
										setShowCreditCardReserveField(isSelected);
										if (!isSelected) {
											handleResetField('creditCardReservePercentage');
										}
									}}
								>
									<Checkbox.Control>
										<Checkbox.Indicator />
									</Checkbox.Control>
									<Checkbox.Content>Configurar reserva</Checkbox.Content>
								</Checkbox>

								<Checkbox
									variant="secondary"
									isSelected={showCreditCardReserveCompensationField}
									onChange={(isSelected: boolean) => {
										setShowCreditCardReserveCompensationField(isSelected);
										if (!isSelected) {
											handleResetField('creditCardReserveCompensationDays');
										}
									}}
								>
									<Checkbox.Control>
										<Checkbox.Indicator />
									</Checkbox.Control>
									<Checkbox.Content>Configurar compensação</Checkbox.Content>
								</Checkbox>
							</div>

							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								{showCreditCardReserveField && (
									<div className="flex flex-col gap-2">
										<TextField
											variant="secondary"
											name="creditCardReservePercentage"
											value={formData.creditCardReservePercentage ?? ''}
											validate={() => {
												const basisPoints = percentageToBasisPoints(formData.creditCardReservePercentage);
												if (basisPoints !== null && (basisPoints < 0 || basisPoints > 10000)) {
													return 'O percentual deve estar entre 0% e 100%';
												}
												return null;
											}}
										>
											<Label>Reserva Financeira (%)</Label>
											<div className="flex items-center gap-2">
												<NumericFormat
													customInput={Input}
													{...percentageFormatProps}
													value={formData.creditCardReservePercentage}
													placeholder="Usar padrão"
													className="flex-1"
													onValueChange={(values) =>
														handleFieldChange('creditCardReservePercentage', values.formattedValue)
													}
												/>
												{formData.creditCardReservePercentage && (
													<Button
														isIconOnly
														variant="ghost"
														size="sm"
														onPress={() => handleResetField('creditCardReservePercentage')}
													>
														<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
													</Button>
												)}
											</div>
											<FieldError />
										</TextField>
										<PlatformDefault
											label="Padrão"
											value={`${(platformSettings.creditCardReservePercentage / 100).toFixed(2)}%`}
										/>
									</div>
								)}

								{showCreditCardReserveCompensationField && (
									<div className="flex flex-col gap-2">
										<TextField
											variant="secondary"
											name="creditCardReserveCompensationDays"
											value={formData.creditCardReserveCompensationDays ?? ''}
											validate={() => {
												const days = formData.creditCardReserveCompensationDays
													? Number(formData.creditCardReserveCompensationDays)
													: null;
												if (days !== null && (!Number.isInteger(days) || days < 0 || days > 365)) {
													return 'Os dias devem estar entre 0 e 365';
												}
												return null;
											}}
										>
											<Label>Compensação da Reserva (dias)</Label>
											<div className="flex items-center gap-2">
												<Input
													variant="secondary"
													type="number"
													min={0}
													max={365}
													placeholder="Usar padrão"
													className="flex-1"
													value={formData.creditCardReserveCompensationDays}
													onChange={(e) => handleFieldChange('creditCardReserveCompensationDays', e.target.value)}
												/>
												{formData.creditCardReserveCompensationDays && (
													<Button
														isIconOnly
														variant="ghost"
														size="sm"
														onPress={() => handleResetField('creditCardReserveCompensationDays')}
													>
														<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
													</Button>
												)}
											</div>
											<FieldError />
										</TextField>
										<PlatformDefault
											label="Padrão"
											value={`${platformSettings.creditCardReserveCompensationDays} dias`}
										/>
									</div>
								)}
							</div>

							<Separator />

							<div className="grid grid-cols-1 gap-6">
								{[
									{
										label: 'API',
										description: 'Taxas para integrações diretas',
										mode: 'creditCardApiFeeMode',
										fixed: 'creditCardApiFeeFixed',
										percentage: 'creditCardApiFeePercentage',
										installmentPercentage: 'creditCardApiInstallmentFeePercentage',
										platformMode: platformSettings.creditCardApiFeeMode as FeeChargeMode,
										platformFixed: platformSettings.creditCardApiFeeFixed,
										platformPercentage: platformSettings.creditCardApiFeePercentage,
										platformInstallmentPercentage: platformSettings.creditCardApiInstallmentFeePercentage,
									},
									{
										label: 'Checkout',
										description: 'Taxas para checkout integrado',
										mode: 'creditCardCheckoutFeeMode',
										fixed: 'creditCardCheckoutFeeFixed',
										percentage: 'creditCardCheckoutFeePercentage',
										installmentPercentage: 'creditCardCheckoutInstallmentFeePercentage',
										platformMode: platformSettings.creditCardCheckoutFeeMode as FeeChargeMode,
										platformFixed: platformSettings.creditCardCheckoutFeeFixed,
										platformPercentage: platformSettings.creditCardCheckoutFeePercentage,
										platformInstallmentPercentage: platformSettings.creditCardCheckoutInstallmentFeePercentage,
									},
									{
										label: 'Link de Pagamento',
										description: 'Taxas para link de pagamento',
										mode: 'creditCardPaymentLinkFeeMode',
										fixed: 'creditCardPaymentLinkFeeFixed',
										percentage: 'creditCardPaymentLinkFeePercentage',
										installmentPercentage: 'creditCardPaymentLinkInstallmentFeePercentage',
										platformMode: platformSettings.creditCardPaymentLinkFeeMode as FeeChargeMode,
										platformFixed: platformSettings.creditCardPaymentLinkFeeFixed,
										platformPercentage: platformSettings.creditCardPaymentLinkFeePercentage,
										platformInstallmentPercentage: platformSettings.creditCardPaymentLinkInstallmentFeePercentage,
									},
								].map((section) => {
									const modeValue = formData[section.mode as keyof MerchantSettingsFormData] as string;
									const fixedValue = formData[section.fixed as keyof MerchantSettingsFormData] as string;
									const percentageValue = formData[section.percentage as keyof MerchantSettingsFormData] as string;
									const installmentPercentageValue =
										formData[section.installmentPercentage as keyof MerchantSettingsFormData] as string;
									const effectiveMode = resolveEffectiveFeeMode(modeValue, section.platformMode);
									const showFixedFeeInput = shouldShowFixedFeeInput(effectiveMode);
									const showPercentageFeeInput = shouldShowPercentageFeeInput(effectiveMode);

									return (
										<div key={section.label} className="flex flex-col gap-4 rounded-lg bg-content1">
											<div className="flex items-center gap-2 text-xs text-foreground/60">
												<Chip variant="soft" color="accent" size="sm">
													{section.label}
												</Chip>
												<span>{section.description}</span>
											</div>
											<div
												className={
													showFixedFeeInput && showPercentageFeeInput
														? 'grid grid-cols-1 gap-4 2xl:grid-cols-4'
														: 'grid grid-cols-1 gap-4 2xl:grid-cols-3'
												}
											>
												<div className="flex flex-col gap-2">
													<Select
														variant="secondary"
														placeholder="Usar padrão do sistema"
														aria-label={`Modo de Taxa CARTÃO ${section.label}`}
														value={modeValue}
														onChange={(key) => handleSelectChange(section.mode as keyof MerchantSettingsFormData, key)}
													>
														<Label>Modo de Cobrança</Label>
														<Select.Trigger className="w-full">
															<Select.Value />
															<Select.Indicator className="size-4" />
														</Select.Trigger>
														<Select.Popover>
															<ListBox>
																{feeChargeModeSelectOptionsWithDefault.map((option) => (
																	<ListBox.Item key={option.key} id={option.key} textValue={option.label}>
																		<Chip variant="soft" color={mapParseColorToChipColor(option.color)} className="gap-1">
																			{option.icon}
																			{option.label}
																		</Chip>
																		<ListBox.ItemIndicator />
																	</ListBox.Item>
																))}
															</ListBox>
														</Select.Popover>
													</Select>
													<PlatformDefault label="Padrão" value={feeChargeModeParse[section.platformMode]?.label ?? '-'} />
												</div>

												{showFixedFeeInput && (
													<div className="flex flex-col gap-2">
														<TextField
															variant="secondary"
															name={section.fixed}
															value={fixedValue ?? ''}
															isDisabled={modeValue === 'default' || effectiveMode === FeeChargeMode.PercentageOnly}
															validate={() => {
																const cents = formattedCurrencyToCents(fixedValue);
																if (cents !== null && cents < 0) {
																	return 'O valor não pode ser negativo';
																}
																return null;
															}}
														>
															<Label>Valor Fixo (R$)</Label>
															<div className="flex items-center gap-2">
																<CurrencyCentsInput
																	initialValueInCents={formattedCurrencyToCents(fixedValue) ?? undefined}
																	placeholder="Usar padrão"
																	className="flex-1"
																	disabled={modeValue === 'default' || effectiveMode === FeeChargeMode.PercentageOnly}
																	onValueChange={(value) =>
																		handleFieldChange(section.fixed as keyof MerchantSettingsFormData, value)
																	}
																/>
																{fixedValue && (
																	<Button
																		isIconOnly
																		variant="ghost"
																		size="sm"
																		onPress={() => handleResetField(section.fixed as keyof MerchantSettingsFormData)}
																	>
																		<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
																	</Button>
																)}
															</div>
															<FieldError />
														</TextField>
														<PlatformDefault label="Padrão" value={formatCurrency(section.platformFixed)} />
													</div>
												)}

												{showPercentageFeeInput && (
													<div className="flex flex-col gap-2">
														<TextField
															variant="secondary"
															name={section.percentage}
															value={percentageValue ?? ''}
															isDisabled={modeValue === 'default' || effectiveMode === FeeChargeMode.FixedOnly}
															validate={() => {
																const basisPoints = percentageToBasisPoints(percentageValue);
																if (basisPoints !== null && (basisPoints < 0 || basisPoints > 10000)) {
																	return 'O percentual deve estar entre 0% e 100%';
																}
																return null;
															}}
														>
															<Label>Percentual (%)</Label>
															<div className="flex items-center gap-2">
																<NumericFormat
																	customInput={Input}
																	{...percentageFormatProps}
																	value={percentageValue}
																	placeholder="Usar padrão"
																	className="flex-1"
																	disabled={modeValue === 'default' || effectiveMode === FeeChargeMode.FixedOnly}
																	onValueChange={(values) =>
																		handleFieldChange(section.percentage as keyof MerchantSettingsFormData, values.formattedValue)
																	}
																/>
																{percentageValue && (
																	<Button
																		isIconOnly
																		variant="ghost"
																		size="sm"
																		onPress={() => handleResetField(section.percentage as keyof MerchantSettingsFormData)}
																	>
																		<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
																	</Button>
																)}
															</div>
															<FieldError />
														</TextField>
														<PlatformDefault label="Padrão" value={`${(section.platformPercentage / 100).toFixed(2)}%`} />
													</div>
												)}

												<div className="flex flex-col gap-2">
													<TextField
														variant="secondary"
														name={section.installmentPercentage}
														value={installmentPercentageValue ?? ''}
														isDisabled={modeValue === 'default'}
														validate={() => {
															const basisPoints = percentageToBasisPoints(installmentPercentageValue);
															if (basisPoints !== null && (basisPoints < 0 || basisPoints > 10000)) {
																return 'O percentual deve estar entre 0% e 100%';
															}
															return null;
														}}
													>
														<Label>Taxa por Parcela Extra (%)</Label>
														<div className="flex items-center gap-2">
															<NumericFormat
																customInput={Input}
																{...percentageFormatProps}
																value={installmentPercentageValue}
																placeholder="Usar padrão"
																className="flex-1"
																disabled={modeValue === 'default'}
																onValueChange={(values) =>
																	handleFieldChange(
																		section.installmentPercentage as keyof MerchantSettingsFormData,
																		values.formattedValue
																	)
																}
															/>
															{installmentPercentageValue && (
																<Button
																	isIconOnly
																	variant="ghost"
																	size="sm"
																	onPress={() =>
																		handleResetField(section.installmentPercentage as keyof MerchantSettingsFormData)
																	}
																>
																	<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
																</Button>
															)}
														</div>
														<FieldError />
													</TextField>
													<PlatformDefault label="Padrão" value={`${(section.platformInstallmentPercentage / 100).toFixed(2)}%`} />
												</div>
											</div>

											{acquirer && (
												<FeeProfitIndicator
													merchantFeeMode={modeValue}
													merchantFeeFixed={fixedValue}
													merchantFeePercentage={percentageValue}
													acquirerFeeMode={acquirer.creditCardInFeeMode}
													acquirerFeeFixed={acquirer.creditCardInFeeFixed}
													acquirerFeePercentage={acquirer.creditCardInFeePercentage}
													platformFeeMode={section.platformMode}
													platformFeeFixed={section.platformFixed}
													platformFeePercentage={section.platformPercentage}
												/>
											)}
										</div>
									);
								})}
							</div>
						</SystemAccordion>
					)}

					{isWithdrawalEnabled && (
						<SystemAccordion
							id="saques"
							icon={Money01Icon}
							title="Saques"
							color="violet"
							defaultExpanded={false}
							summary={
								<>
									Min {formatEffectiveAmount(formData.minWithdrawalAmount, platformSettings.minWithdrawalAmount)}
									{' | '}Aprovação{' '}
									{formatWithdrawalApprovalModeLabel(
										formData.withdrawalApprovalMode,
										platformSettings.withdrawalApprovalMode as WithdrawalApprovalMode
									)}
									{' | '}Taxa (
									{formatFeeModeLabel(formData.withdrawalFeeMode, platformSettings.withdrawalFeeMode as FeeChargeMode)}){' '}
									{formatEffectiveFee(
										formData.withdrawalFeeMode,
										formData.withdrawalFeeFixed,
										formData.withdrawalFeePercentage,
										platformSettings.withdrawalFeeMode as FeeChargeMode,
										platformSettings.withdrawalFeeFixed,
										platformSettings.withdrawalFeePercentage
									)}
								</>
							}
						>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div className="flex flex-col gap-2">
									<TextField
										variant="secondary"
										name="minWithdrawalAmount"
										validate={() => {
											const cents = formattedCurrencyToCents(formData.minWithdrawalAmount);
											if (cents !== null && cents < 0) {
												return 'O valor não pode ser negativo';
											}
											return null;
										}}
									>
										<Label>Valor Mínimo de Saque (R$)</Label>
										<div className="flex items-center gap-2">
											<CurrencyCentsInput
												initialValueInCents={formattedCurrencyToCents(formData.minWithdrawalAmount) ?? undefined}
												placeholder="Usar padrão do sistema"
												className="flex-1"
												onValueChange={(value) => handleFieldChange('minWithdrawalAmount', value)}
											/>
											{formData.minWithdrawalAmount && (
												<Button
													isIconOnly
													variant="ghost"
													size="sm"
													onPress={() => handleResetField('minWithdrawalAmount')}
												>
													<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
												</Button>
											)}
										</div>
										<FieldError />
									</TextField>
									<PlatformDefault label="Padrão" value={formatCurrency(platformSettings.minWithdrawalAmount)} />
								</div>

								<div className="flex flex-col gap-2">
									<Select
										variant="secondary"
										placeholder="Usar padrão do sistema"
										aria-label="Modo de Aprovação de Saque"
										value={formData.withdrawalApprovalMode}
										onChange={(key) => handleSelectChange('withdrawalApprovalMode', key)}
									>
										<Label>Modo de Aprovação</Label>
										<Select.Trigger className="w-full">
											<Select.Value />
											<Select.Indicator className="size-4" />
										</Select.Trigger>
										<Select.Popover>
											<ListBox>
												{withdrawalApprovalModeOptionsWithDefault.map((option) => (
													<ListBox.Item key={option.key} id={option.key} textValue={option.label}>
														<Chip variant="soft" color={mapParseColorToChipColor(option.color)} className="gap-1">
															{option.icon}
															{option.label}
														</Chip>
														<ListBox.ItemIndicator />
													</ListBox.Item>
												))}
											</ListBox>
										</Select.Popover>
									</Select>
									<PlatformDefault
										label="Padrão"
										value={
											withdrawalApprovalModeParse[platformSettings.withdrawalApprovalMode as WithdrawalApprovalMode]
												?.label ?? '—'
										}
									/>
								</div>
							</div>

							<Separator />

							<div
								className={
									showWithdrawalFixedFeeInput && showWithdrawalPercentageFeeInput
										? 'grid grid-cols-1 gap-4 md:grid-cols-3'
										: 'grid grid-cols-1 gap-4 md:grid-cols-2'
								}
							>
								<div className="flex flex-col gap-2">
									<Select
										variant="secondary"
										placeholder="Usar padrão do sistema"
										aria-label="Modo de Taxa de Saque"
										value={formData.withdrawalFeeMode}
										onChange={(key) => handleSelectChange('withdrawalFeeMode', key)}
									>
										<Label>Modo de Cobrança</Label>
										<Select.Trigger className="w-full">
											<Select.Value />
											<Select.Indicator className="size-4" />
										</Select.Trigger>
										<Select.Popover>
											<ListBox>
												{feeChargeModeSelectOptionsWithDefault.map((option) => (
													<ListBox.Item key={option.key} id={option.key} textValue={option.label}>
														<Chip variant="soft" color={mapParseColorToChipColor(option.color)} className="gap-1">
															{option.icon}
															{option.label}
														</Chip>
														<ListBox.ItemIndicator />
													</ListBox.Item>
												))}
											</ListBox>
										</Select.Popover>
									</Select>
									<PlatformDefault
										label="Padrão"
										value={feeChargeModeParse[platformSettings.withdrawalFeeMode as FeeChargeMode]?.label ?? '—'}
									/>
								</div>

								{showWithdrawalFixedFeeInput && (
									<div className="flex flex-col gap-2">
										<TextField
											variant="secondary"
											name="withdrawalFeeFixed"
											value={formData.withdrawalFeeFixed ?? ''}
											isDisabled={
												formData.withdrawalFeeMode === 'default' ||
												effectiveWithdrawalFeeMode === FeeChargeMode.PercentageOnly
											}
											validate={() => {
												const cents = formattedCurrencyToCents(formData.withdrawalFeeFixed);
												if (cents !== null && cents < 0) {
													return 'O valor não pode ser negativo';
												}
												return null;
											}}
										>
											<Label>Valor Fixo (R$)</Label>
											<div className="flex items-center gap-2">
												<CurrencyCentsInput
													initialValueInCents={formattedCurrencyToCents(formData.withdrawalFeeFixed) ?? undefined}
													placeholder="Usar padrão"
													className="flex-1"
													disabled={
														formData.withdrawalFeeMode === 'default' ||
														effectiveWithdrawalFeeMode === FeeChargeMode.PercentageOnly
													}
													onValueChange={(value) => handleFieldChange('withdrawalFeeFixed', value)}
												/>
												{formData.withdrawalFeeFixed && (
													<Button
														isIconOnly
														variant="ghost"
														size="sm"
														onPress={() => handleResetField('withdrawalFeeFixed')}
													>
														<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
													</Button>
												)}
											</div>
											<FieldError />
										</TextField>
										<PlatformDefault label="Padrão" value={formatCurrency(platformSettings.withdrawalFeeFixed)} />
									</div>
								)}

								{showWithdrawalPercentageFeeInput && (
									<div className="flex flex-col gap-2">
										<TextField
											variant="secondary"
											name="withdrawalFeePercentage"
											value={formData.withdrawalFeePercentage ?? ''}
											isDisabled={
												formData.withdrawalFeeMode === 'default' ||
												effectiveWithdrawalFeeMode === FeeChargeMode.FixedOnly
											}
											validate={() => {
												const basisPoints = percentageToBasisPoints(formData.withdrawalFeePercentage);
												if (basisPoints !== null && (basisPoints < 0 || basisPoints > 10000)) {
													return 'O percentual deve estar entre 0% e 100%';
												}
												return null;
											}}
										>
											<Label>Percentual (%)</Label>
											<div className="flex items-center gap-2">
												<NumericFormat
													customInput={Input}
													{...percentageFormatProps}
													value={formData.withdrawalFeePercentage}
													placeholder="Usar padrão"
													className="flex-1"
													disabled={
														formData.withdrawalFeeMode === 'default' ||
														effectiveWithdrawalFeeMode === FeeChargeMode.FixedOnly
													}
													onValueChange={(values) =>
														handleFieldChange('withdrawalFeePercentage', values.formattedValue)
													}
												/>
												{formData.withdrawalFeePercentage && (
													<Button
														isIconOnly
														variant="ghost"
														size="sm"
														onPress={() => handleResetField('withdrawalFeePercentage')}
													>
														<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
													</Button>
												)}
											</div>
											<FieldError />
										</TextField>
										<PlatformDefault
											label="Padrão"
											value={`${(platformSettings.withdrawalFeePercentage / 100).toFixed(2)}%`}
										/>
									</div>
								)}
							</div>

							{acquirer && (
								<FeeProfitIndicator
									merchantFeeMode={formData.withdrawalFeeMode}
									merchantFeeFixed={formData.withdrawalFeeFixed}
									merchantFeePercentage={formData.withdrawalFeePercentage}
									acquirerFeeMode={acquirer.payoutFeeMode}
									acquirerFeeFixed={acquirer.payoutFeeFixed}
									acquirerFeePercentage={acquirer.payoutFeePercentage}
									platformFeeMode={platformSettings.withdrawalFeeMode as FeeChargeMode}
									platformFeeFixed={platformSettings.withdrawalFeeFixed}
									platformFeePercentage={platformSettings.withdrawalFeePercentage}
								/>
							)}
						</SystemAccordion>
					)}

					<RateLimitingAccordion
						formData={formData}
						platformSettings={platformSettings}
						onFieldChange={(field, value) => handleFieldChange(field, value)}
						onResetField={(field) => handleResetField(field)}
						formatEffectiveRateLimit={formatEffectiveRateLimit}
					/>
				</div>

				<FormSaveFooter
					submitLabel="Salvar configurações"
					isPending={isPending || isWaynePending || isHydratingSettings}
					isDisabled={!hasAnyChanges || hasAnyErrors}
					lastUpdated={lastUpdated}
				/>
			</Form>
		</>
	);
}
