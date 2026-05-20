'use client';

import { use } from 'react';
import type { ReactNode } from 'react';
import {
	Checkbox,
	Chip,
	FieldError,
	Form,
	Input,
	Label,
	ListBox,
	Select,
	Separator,
	Skeleton,
	TextField,
} from '@heroui/react';
import { NumericFormat } from 'react-number-format';
import { toast } from '@heroui/react';
import {
	Wallet01Icon,
	Tag01Icon,
	Analytics01Icon,
	HourglassIcon,
	CheckmarkCircle02Icon,
	CancelCircleIcon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { CurrencyCentsInput } from '@/components/ui/currency-cents-input';
import { UnsavedChangesAlert } from '@/components/ui/unsaved-changes-alert';
import { FormSaveFooter } from '@/components/ui/form-save-footer';
import { PaymentLinkDomainModal } from './components/payment-link-domain-modal';
import { PaymentLinkDomainsAccordion } from './components/payment-link-domains-accordion';
import { FeatureFlagsAccordion } from './components/feature-flags-accordion';
import { PixAccordion } from './components/pix-accordion';
import { BoletoAccordion } from './components/boleto-accordion';
import { CreditCardAccordion } from './components/credit-card-accordion';
import { WithdrawalAccordion } from './components/withdrawal-accordion';
import { RateLimitingAccordion } from './components/rate-limiting-accordion';
import { ReferralAccordion } from './components/referral-accordion';
import { usePlatformSettingsForm } from './hooks/use-platform-settings-form';
import type { AdminPlatformSettingsData, PaymentLinkDomainMethodOptions } from '@/types/admin/platform-settings';
import type { AdminPlatformPayoutAccountData } from '@/types/admin/platform-payouts';
import type { ApiResponse, Paginated } from '@/types/common';
import {
	AutomaticCashoutFrequency,
	FeeChargeMode,
	ReferralWithdrawalIntervalUnit,
	WithdrawalApprovalMode,
} from '@/types/enums';
import { feeChargeModeParse, mapParseColorToChipColor, withdrawalApprovalModeParse } from '@/parse';
import type { ParseColor } from '@/parse';
import { basisPointsToPercentage, formattedCurrencyToCents, percentageToBasisPoints } from '@/utils/currency';

type PlatformSettingsPromise = Promise<ApiResponse<AdminPlatformSettingsData>>;
type PlatformPayoutAccountsPromise = Promise<ApiResponse<Paginated<AdminPlatformPayoutAccountData>>>;

interface PlatformSettingsFormProps {
	fetchPromise: PlatformSettingsPromise;
	payoutAccountsPromise: PlatformPayoutAccountsPromise;
}

interface FormValues {
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
	boletoMinTransactionAmount: string;
	boletoMaxTransactionAmount: string;
	boletoEnabled: boolean;
	creditCardEnabled: boolean;
	paymentLinkDomainOptions: PaymentLinkDomainMethodOptions[];
	boletoApiFeeMode: FeeChargeMode;
	boletoApiFeeFixed: string;
	boletoApiFeePercentage: string;
	boletoCheckoutFeeMode: FeeChargeMode;
	boletoCheckoutFeeFixed: string;
	boletoCheckoutFeePercentage: string;
	boletoPaymentLinkFeeMode: FeeChargeMode;
	boletoPaymentLinkFeeFixed: string;
	boletoPaymentLinkFeePercentage: string;
	boletoReservePercentage: string;
	boletoReserveCompensationDays: string;
	creditCardApiFeeMode: FeeChargeMode;
	creditCardApiFeeFixed: string;
	creditCardApiFeePercentage: string;
	creditCardApiInstallmentFeePercentage: string;
	creditCardCheckoutFeeMode: FeeChargeMode;
	creditCardCheckoutFeeFixed: string;
	creditCardCheckoutFeePercentage: string;
	creditCardCheckoutInstallmentFeePercentage: string;
	creditCardPaymentLinkFeeMode: FeeChargeMode;
	creditCardPaymentLinkFeeFixed: string;
	creditCardPaymentLinkFeePercentage: string;
	creditCardPaymentLinkInstallmentFeePercentage: string;
	creditCardReservePercentage: string;
	creditCardReserveCompensationDays: string;
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

const feeChargeModeOptions: Array<{
	key: FeeChargeMode;
	label: string;
	color: ParseColor;
	icon: ReactNode;
}> = [
	{
		key: FeeChargeMode.FixedOnly,
		label: 'Valor fixo',
		color: 'accent',
		icon: <Icon icon={Tag01Icon} className="icon-sm" />,
	},
	{
		key: FeeChargeMode.PercentageOnly,
		label: 'Percentual',
		color: 'warning',
		icon: <Icon icon={Analytics01Icon} className="icon-sm" />,
	},
	{
		key: FeeChargeMode.FixedAndPercentage,
		label: 'Fixo + percentual',
		color: 'success',
		icon: <Icon icon={Wallet01Icon} className="icon-sm" />,
	},
];

const withdrawalApprovalModeOptions: Array<{
	key: WithdrawalApprovalMode;
	label: string;
	color: ParseColor;
	icon: ReactNode;
}> = [
	{
		key: WithdrawalApprovalMode.Automatic,
		label: 'Automático',
		color: 'success',
		icon: <Icon icon={Wallet01Icon} className="icon-sm" />,
	},
	{
		key: WithdrawalApprovalMode.Manual,
		label: 'Manual',
		color: 'warning',
		icon: <Icon icon={HourglassIcon} className="icon-sm" />,
	},
];

const referralIntervalUnitOptions: Array<{
	key: ReferralWithdrawalIntervalUnit;
	label: string;
	color: ParseColor;
	icon: ReactNode;
}> = [
	{
		key: ReferralWithdrawalIntervalUnit.Days,
		label: 'Dias',
		color: 'accent',
		icon: <Icon icon={HourglassIcon} className="icon-sm" />,
	},
	{
		key: ReferralWithdrawalIntervalUnit.Months,
		label: 'Meses',
		color: 'warning',
		icon: <Icon icon={HourglassIcon} className="icon-sm" />,
	},
];

const percentageNumericProps = {
	decimalSeparator: ',',
	decimalScale: 2,
	fixedDecimalScale: true,
	allowNegative: false,
};

function intervalUnitLabel(unit: ReferralWithdrawalIntervalUnit): string {
	return unit === ReferralWithdrawalIntervalUnit.Months ? 'meses' : 'dias';
}

function feeModeLabel(mode: FeeChargeMode): string {
	return feeChargeModeParse[mode]?.label ?? mode;
}

function shouldShowFixedFeeInput(mode: FeeChargeMode): boolean {
	return mode !== FeeChargeMode.PercentageOnly;
}

function shouldShowPercentageFeeInput(mode: FeeChargeMode): boolean {
	return mode !== FeeChargeMode.FixedOnly;
}

function getFeeInputGridClass(mode: FeeChargeMode): string {
	return shouldShowFixedFeeInput(mode) && shouldShowPercentageFeeInput(mode)
		? 'grid grid-cols-1 gap-4 2xl:grid-cols-3'
		: 'grid grid-cols-1 gap-4 2xl:grid-cols-2';
}

function withdrawalApprovalModeLabel(mode: WithdrawalApprovalMode): string {
	return withdrawalApprovalModeParse[mode]?.label ?? mode;
}

function safeTrim(value: string | null | undefined): string {
	return typeof value === 'string' ? value.trim() : '';
}

function displayCurrency(value: string | null | undefined): string {
	const trimmed = safeTrim(value);
	return trimmed.length > 0 ? trimmed : 'R$ 0,00';
}

function displayPercentage(value: string | null | undefined): string {
	const trimmed = safeTrim(value);
	return trimmed.length > 0 ? `${trimmed}%` : '0,00%';
}

function displayDays(value: string | null | undefined): string {
	const trimmed = safeTrim(value);
	return trimmed.length > 0 ? `${trimmed} dias` : '0 dias';
}

function PlatformSettingsFormContent({
	settings,
	platformPayoutAccounts,
}: {
	settings: AdminPlatformSettingsData;
	platformPayoutAccounts: AdminPlatformPayoutAccountData[];
}) {
	const {
		isPending,
		formError,
		lastUpdated,
		formData,
		hasChanges,
		handleFieldChange,
		handleSelectChange,
		handleSubmit,
		showPixReserveField,
		setShowPixReserveField,
		showPixReserveCompensationField,
		setShowPixReserveCompensationField,
		showBoletoReserveField,
		setShowBoletoReserveField,
		showBoletoReserveCompensationField,
		setShowBoletoReserveCompensationField,
		showCreditCardReserveField,
		setShowCreditCardReserveField,
		showCreditCardReserveCompensationField,
		setShowCreditCardReserveCompensationField,
		domainModalState,
		handleDomainDraftFieldChange,
		openCreatePaymentLinkDomainModal,
		openEditPaymentLinkDomainModal,
		closeDomainModal,
		saveDomainModal,
		setPaymentLinkDomainAsDefault,
		requestPaymentLinkDomainRemoval,
		confirmPaymentLinkDomainRemoval,
		clearPendingDomainRemoval,
	} = usePlatformSettingsForm({
		settings,
		platformPayoutAccounts,
		onSaveSuccess: ({ message }) => {
			toast('Configurações atualizadas', {
				description: message ?? 'As configurações foram salvas com sucesso.',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				variant: 'success',
			});
		},
		onSaveError: ({ message }) => {
			toast('Erro ao salvar', {
				description: message ?? 'Não foi possível salvar as configurações.',
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				variant: 'danger',
			});
		},
	});

	return (
		<Form className="flex flex-col gap-6" onSubmit={handleSubmit}>
			{formError && (
				<div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{formError}</div>
			)}

			<UnsavedChangesAlert
				hasChanges={hasChanges}
				message='Você tem alterações não salvas. Clique em "Salvar configurações" para aplicar as mudanças.'
			/>

			<div className="flex flex-col gap-4">
				<FeatureFlagsAccordion formData={formData} onFieldChange={handleFieldChange} />

				{formData.pixEnabled && (
					<PixAccordion
						summary={
							<>
								Status: {formData.pixEnabled ? 'Ativo' : 'Inativo'} | Limites:{' '}
								{displayCurrency(formData.pixMinTransactionAmount)} a{' '}
								{displayCurrency(formData.pixMaxTransactionAmount)} | Timeout: {formData.pixTimeoutMinutes || '0'} min |
								Reserva: {displayPercentage(formData.pixReservePercentage)} | Compensação:{' '}
								{displayDays(formData.pixReserveCompensationDays)} | API: {feeModeLabel(formData.pixApiFeeMode)} (
								{displayCurrency(formData.pixApiFeeFixed)} + {displayPercentage(formData.pixApiFeePercentage)}) |
								Checkout: {feeModeLabel(formData.pixCheckoutFeeMode)} ({displayCurrency(formData.pixCheckoutFeeFixed)} +{' '}
								{displayPercentage(formData.pixCheckoutFeePercentage)}) | Link:{' '}
								{feeModeLabel(formData.pixPaymentLinkFeeMode)} ({displayCurrency(formData.pixPaymentLinkFeeFixed)} +{' '}
								{displayPercentage(formData.pixPaymentLinkFeePercentage)})
							</>
						}
					>
						<div className="flex items-center gap-2 text-xs text-foreground/60">
							<Chip variant="soft" color="accent" size="sm">
								Limites
							</Chip>
							<span>Valores minimo, maximo e timeout</span>
						</div>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
							<TextField
								variant="secondary"
								name="pixMinTransactionAmount"
								validate={() => {
									const cents = formattedCurrencyToCents(formData.pixMinTransactionAmount);
									if (cents !== null && cents < 0) {
										return 'O valor nao pode ser negativo';
									}
									return null;
								}}
							>
								<Label>Valor Mínimo (R$)</Label>
								<CurrencyCentsInput
									initialValueInCents={formattedCurrencyToCents(formData.pixMinTransactionAmount) ?? undefined}
									onValueChange={(value) => handleFieldChange('pixMinTransactionAmount', value)}
								/>
								<FieldError />
							</TextField>

							<TextField
								variant="secondary"
								name="pixMaxTransactionAmount"
								validate={() => {
									const max = formattedCurrencyToCents(formData.pixMaxTransactionAmount);
									if (max !== null && max < 0) {
										return 'O valor nao pode ser negativo';
									}
									const min = formattedCurrencyToCents(formData.pixMinTransactionAmount);
									if (min !== null && max !== null && max < min) {
										return 'O Valor Máximo nao pode ser menor que o Valor Mínimo';
									}
									return null;
								}}
							>
								<Label>Valor Máximo (R$)</Label>
								<CurrencyCentsInput
									initialValueInCents={formattedCurrencyToCents(formData.pixMaxTransactionAmount) ?? undefined}
									onValueChange={(value) => handleFieldChange('pixMaxTransactionAmount', value)}
								/>
								<FieldError />
							</TextField>
							<TextField
								variant="secondary"
								name="pixTimeoutMinutes"
								value={formData.pixTimeoutMinutes}
								onChange={(value) => handleFieldChange('pixTimeoutMinutes', value)}
								validate={(value) => {
									const timeout = value ? parseInt(value, 10) : null;
									if (timeout !== null && (timeout < 1 || timeout > 1440)) {
										return 'O timeout deve estar entre 1 e 1440 minutos';
									}
									return null;
								}}
							>
								<Label>Timeout (minutos)</Label>
								<Input variant="secondary" type="number" min={1} max={1440} />
								<FieldError />
							</TextField>
						</div>

						<div className="flex flex-wrap items-center gap-4 rounded-lg border border-divider bg-content1 p-3">
							<Checkbox
								variant="secondary"
								isSelected={showPixReserveField}
								onChange={(isSelected: boolean) => {
									setShowPixReserveField(isSelected);
									if (!isSelected) {
										handleFieldChange('pixReservePercentage', basisPointsToPercentage(0));
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
								isSelected={showPixReserveCompensationField}
								onChange={(isSelected: boolean) => {
									setShowPixReserveCompensationField(isSelected);
									if (!isSelected) {
										handleFieldChange('pixReserveCompensationDays', '0');
									}
								}}
							>
								<Checkbox.Control>
									<Checkbox.Indicator />
								</Checkbox.Control>
								<Checkbox.Content>Configurar compensação</Checkbox.Content>
							</Checkbox>
						</div>

						{(showPixReserveField || showPixReserveCompensationField) && (
							<div
								className={
									showPixReserveField && showPixReserveCompensationField
										? 'grid grid-cols-1 gap-4 md:grid-cols-2'
										: 'grid grid-cols-1 gap-4'
								}
							>
								{showPixReserveField && (
									<TextField
										variant="secondary"
										name="pixReservePercentage"
										validate={() => {
											const basisPoints = percentageToBasisPoints(formData.pixReservePercentage);
											if (basisPoints !== null && (basisPoints < 0 || basisPoints > 10000)) {
												return 'O percentual deve estar entre 0% e 100%';
											}
											return null;
										}}
									>
										<Label>Reserva Financeira (%)</Label>
										<NumericFormat
											customInput={Input}
											{...percentageNumericProps}
											value={formData.pixReservePercentage}
											onValueChange={(values) => handleFieldChange('pixReservePercentage', values.formattedValue)}
										/>
										<FieldError />
									</TextField>
								)}

								{showPixReserveCompensationField && (
									<TextField
										variant="secondary"
										name="pixReserveCompensationDays"
										value={formData.pixReserveCompensationDays}
										onChange={(value) => handleFieldChange('pixReserveCompensationDays', value)}
										validate={(value) => {
											const days = value ? parseInt(value, 10) : null;
											if (days !== null && (days < 0 || days > 365)) {
												return 'Os dias devem estar entre 0 e 365';
											}
											return null;
										}}
									>
										<Label>Compensação da Reserva (dias)</Label>
										<Input variant="secondary" type="number" min={0} max={365} />
										<FieldError />
									</TextField>
								)}
							</div>
						)}
						<Separator />
						<div className="grid grid-cols-1 gap-6">
							<div className="flex flex-col gap-4 rounded-lg bg-content1">
								<div className="flex items-center gap-2 text-xs text-foreground/60">
									<Chip variant="soft" color="accent" size="sm">
										API
									</Chip>
									<span>Taxas para integracões diretas</span>
								</div>
								<div className={getFeeInputGridClass(formData.pixApiFeeMode)}>
									<Select
										variant="secondary"
										aria-label="Modo de Taxa PIX API"
										value={formData.pixApiFeeMode}
										onChange={(key) => handleSelectChange('pixApiFeeMode', key)}
									>
										<Label>Modo de Cobrança</Label>
										<Select.Trigger className="w-full">
											<Select.Value />
											<Select.Indicator className="size-4" />
										</Select.Trigger>
										<Select.Popover>
											<ListBox>
												{feeChargeModeOptions.map((option) => (
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

									{shouldShowFixedFeeInput(formData.pixApiFeeMode) && (
										<TextField
											variant="secondary"
											name="pixApiFeeFixed"
											isDisabled={formData.pixApiFeeMode === 'PercentageOnly'}
											validate={() => {
												const cents = formattedCurrencyToCents(formData.pixApiFeeFixed);
												if (cents !== null && cents < 0) {
													return 'O valor nao pode ser negativo';
												}
												return null;
											}}
										>
											<Label>Valor Fixo (R$)</Label>
											<CurrencyCentsInput
												initialValueInCents={formattedCurrencyToCents(formData.pixApiFeeFixed) ?? undefined}
												disabled={formData.pixApiFeeMode === 'PercentageOnly'}
												onValueChange={(value) => handleFieldChange('pixApiFeeFixed', value)}
											/>
											<FieldError />
										</TextField>
									)}

									{shouldShowPercentageFeeInput(formData.pixApiFeeMode) && (
										<TextField
											variant="secondary"
											name="pixApiFeePercentage"
											isDisabled={formData.pixApiFeeMode === 'FixedOnly'}
											validate={() => {
												const basisPoints = percentageToBasisPoints(formData.pixApiFeePercentage);
												if (basisPoints !== null && (basisPoints < 0 || basisPoints > 10000)) {
													return 'O percentual deve estar entre 0% e 100%';
												}
												return null;
											}}
										>
											<Label>Percentual (%)</Label>
											<NumericFormat
												customInput={Input}
												{...percentageNumericProps}
												value={formData.pixApiFeePercentage}
												disabled={formData.pixApiFeeMode === 'FixedOnly'}
												onValueChange={(values) => handleFieldChange('pixApiFeePercentage', values.formattedValue)}
											/>
											<FieldError />
										</TextField>
									)}
								</div>
							</div>
							<div className="flex flex-col gap-4 rounded-lg bg-content1">
								<div className="flex items-center gap-2 text-xs text-foreground/60">
									<Chip variant="soft" color="accent" size="sm">
										Checkout
									</Chip>
									<span>Taxas para pagamentos no checkout</span>
								</div>
								<div className={getFeeInputGridClass(formData.pixCheckoutFeeMode)}>
									<Select
										variant="secondary"
										aria-label="Modo de Taxa PIX Checkout"
										value={formData.pixCheckoutFeeMode}
										onChange={(key) => handleSelectChange('pixCheckoutFeeMode', key)}
									>
										<Label>Modo de Cobrança</Label>
										<Select.Trigger className="w-full">
											<Select.Value />
											<Select.Indicator className="size-4" />
										</Select.Trigger>
										<Select.Popover>
											<ListBox>
												{feeChargeModeOptions.map((option) => (
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

									{shouldShowFixedFeeInput(formData.pixCheckoutFeeMode) && (
										<TextField
											variant="secondary"
											name="pixCheckoutFeeFixed"
											isDisabled={formData.pixCheckoutFeeMode === 'PercentageOnly'}
											validate={() => {
												const cents = formattedCurrencyToCents(formData.pixCheckoutFeeFixed);
												if (cents !== null && cents < 0) {
													return 'O valor nao pode ser negativo';
												}
												return null;
											}}
										>
											<Label>Valor Fixo (R$)</Label>
											<CurrencyCentsInput
												initialValueInCents={formattedCurrencyToCents(formData.pixCheckoutFeeFixed) ?? undefined}
												disabled={formData.pixCheckoutFeeMode === 'PercentageOnly'}
												onValueChange={(value) => handleFieldChange('pixCheckoutFeeFixed', value)}
											/>
											<FieldError />
										</TextField>
									)}

									{shouldShowPercentageFeeInput(formData.pixCheckoutFeeMode) && (
										<TextField
											variant="secondary"
											name="pixCheckoutFeePercentage"
											isDisabled={formData.pixCheckoutFeeMode === 'FixedOnly'}
											validate={() => {
												const basisPoints = percentageToBasisPoints(formData.pixCheckoutFeePercentage);
												if (basisPoints !== null && (basisPoints < 0 || basisPoints > 10000)) {
													return 'O percentual deve estar entre 0% e 100%';
												}
												return null;
											}}
										>
											<Label>Percentual (%)</Label>
											<NumericFormat
												customInput={Input}
												{...percentageNumericProps}
												value={formData.pixCheckoutFeePercentage}
												disabled={formData.pixCheckoutFeeMode === 'FixedOnly'}
												onValueChange={(values) => handleFieldChange('pixCheckoutFeePercentage', values.formattedValue)}
											/>
											<FieldError />
										</TextField>
									)}
								</div>
							</div>
							<div className="flex flex-col gap-4 rounded-lg bg-content1">
								<div className="flex items-center gap-2 text-xs text-foreground/60">
									<Chip variant="soft" color="accent" size="sm">
										Link de Pagamento
									</Chip>
									<span>Taxas para pagamentos via link</span>
								</div>
								<div className={getFeeInputGridClass(formData.pixPaymentLinkFeeMode)}>
									<Select
										variant="secondary"
										aria-label="Modo de Taxa PIX Link de Pagamento"
										value={formData.pixPaymentLinkFeeMode}
										onChange={(key) => handleSelectChange('pixPaymentLinkFeeMode', key)}
									>
										<Label>Modo de Cobrança</Label>
										<Select.Trigger className="w-full">
											<Select.Value />
											<Select.Indicator className="size-4" />
										</Select.Trigger>
										<Select.Popover>
											<ListBox>
												{feeChargeModeOptions.map((option) => (
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

									{shouldShowFixedFeeInput(formData.pixPaymentLinkFeeMode) && (
										<TextField
											variant="secondary"
											name="pixPaymentLinkFeeFixed"
											isDisabled={formData.pixPaymentLinkFeeMode === 'PercentageOnly'}
											validate={() => {
												const cents = formattedCurrencyToCents(formData.pixPaymentLinkFeeFixed);
												if (cents !== null && cents < 0) {
													return 'O valor nao pode ser negativo';
												}
												return null;
											}}
										>
											<Label>Valor Fixo (R$)</Label>
											<CurrencyCentsInput
												initialValueInCents={formattedCurrencyToCents(formData.pixPaymentLinkFeeFixed) ?? undefined}
												disabled={formData.pixPaymentLinkFeeMode === 'PercentageOnly'}
												onValueChange={(value) => handleFieldChange('pixPaymentLinkFeeFixed', value)}
											/>
											<FieldError />
										</TextField>
									)}

									{shouldShowPercentageFeeInput(formData.pixPaymentLinkFeeMode) && (
										<TextField
											variant="secondary"
											name="pixPaymentLinkFeePercentage"
											isDisabled={formData.pixPaymentLinkFeeMode === 'FixedOnly'}
											validate={() => {
												const basisPoints = percentageToBasisPoints(formData.pixPaymentLinkFeePercentage);
												if (basisPoints !== null && (basisPoints < 0 || basisPoints > 10000)) {
													return 'O percentual deve estar entre 0% e 100%';
												}
												return null;
											}}
										>
											<Label>Percentual (%)</Label>
											<NumericFormat
												customInput={Input}
												{...percentageNumericProps}
												value={formData.pixPaymentLinkFeePercentage}
												disabled={formData.pixPaymentLinkFeeMode === 'FixedOnly'}
												onValueChange={(values) =>
													handleFieldChange('pixPaymentLinkFeePercentage', values.formattedValue)
												}
											/>
											<FieldError />
										</TextField>
									)}
								</div>
							</div>
						</div>
					</PixAccordion>
				)}

				{formData.boletoEnabled && (
					<BoletoAccordion
						summary={
							<>
								Status: {formData.boletoEnabled ? 'Ativo' : 'Inativo'} | Limites:{' '}
								{displayCurrency(formData.boletoMinTransactionAmount)} a{' '}
								{displayCurrency(formData.boletoMaxTransactionAmount)} | Reserva:{' '}
								{displayPercentage(formData.boletoReservePercentage)} | Compensação:{' '}
								{displayDays(formData.boletoReserveCompensationDays)} | API: {feeModeLabel(formData.boletoApiFeeMode)} (
								{displayCurrency(formData.boletoApiFeeFixed)} + {displayPercentage(formData.boletoApiFeePercentage)}) |
								Checkout: {feeModeLabel(formData.boletoCheckoutFeeMode)} (
								{displayCurrency(formData.boletoCheckoutFeeFixed)} +{' '}
								{displayPercentage(formData.boletoCheckoutFeePercentage)}) | Link:{' '}
								{feeModeLabel(formData.boletoPaymentLinkFeeMode)} ({displayCurrency(formData.boletoPaymentLinkFeeFixed)}{' '}
								+ {displayPercentage(formData.boletoPaymentLinkFeePercentage)})
							</>
						}
					>
						<div className="flex items-center gap-2 text-xs text-foreground/60">
							<Chip variant="soft" color="warning" size="sm">
								Limites
							</Chip>
							<span>Valores minimo e maximo de transacao</span>
						</div>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<TextField
								variant="secondary"
								name="boletoMinTransactionAmount"
								validate={() => {
									const cents = formattedCurrencyToCents(formData.boletoMinTransactionAmount);
									if (cents !== null && cents < 0) {
										return 'O valor nao pode ser negativo';
									}
									return null;
								}}
							>
								<Label>Valor Mínimo (R$)</Label>
								<CurrencyCentsInput
									initialValueInCents={formattedCurrencyToCents(formData.boletoMinTransactionAmount) ?? undefined}
									onValueChange={(value) => handleFieldChange('boletoMinTransactionAmount', value)}
								/>
								<FieldError />
							</TextField>
							<TextField
								variant="secondary"
								name="boletoMaxTransactionAmount"
								validate={() => {
									const max = formattedCurrencyToCents(formData.boletoMaxTransactionAmount);
									if (max !== null && max < 0) {
										return 'O valor nao pode ser negativo';
									}
									const min = formattedCurrencyToCents(formData.boletoMinTransactionAmount);
									if (min !== null && max !== null && max < min) {
										return 'O Valor Máximo nao pode ser menor que o Valor Mínimo';
									}
									return null;
								}}
							>
								<Label>Valor Máximo (R$)</Label>
								<CurrencyCentsInput
									initialValueInCents={formattedCurrencyToCents(formData.boletoMaxTransactionAmount) ?? undefined}
									onValueChange={(value) => handleFieldChange('boletoMaxTransactionAmount', value)}
								/>
								<FieldError />
							</TextField>
						</div>

						<div className="flex flex-wrap items-center gap-4 rounded-lg border border-divider bg-content1 p-3">
							<Checkbox
								variant="secondary"
								isSelected={showBoletoReserveField}
								onChange={(isSelected: boolean) => {
									setShowBoletoReserveField(isSelected);
									if (!isSelected) {
										handleFieldChange('boletoReservePercentage', basisPointsToPercentage(0));
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
										handleFieldChange('boletoReserveCompensationDays', '0');
									}
								}}
							>
								<Checkbox.Control>
									<Checkbox.Indicator />
								</Checkbox.Control>
								<Checkbox.Content>Configurar compensação</Checkbox.Content>
							</Checkbox>
						</div>

						{(showBoletoReserveField || showBoletoReserveCompensationField) && (
							<div
								className={
									showBoletoReserveField && showBoletoReserveCompensationField
										? 'grid grid-cols-1 gap-4 md:grid-cols-2'
										: 'grid grid-cols-1 gap-4'
								}
							>
								{showBoletoReserveField && (
									<TextField
										variant="secondary"
										name="boletoReservePercentage"
										validate={() => {
											const basisPoints = percentageToBasisPoints(formData.boletoReservePercentage);
											if (basisPoints !== null && (basisPoints < 0 || basisPoints > 10000)) {
												return 'O percentual deve estar entre 0% e 100%';
											}
											return null;
										}}
									>
										<Label>Reserva Financeira (%)</Label>
										<NumericFormat
											customInput={Input}
											{...percentageNumericProps}
											value={formData.boletoReservePercentage}
											onValueChange={(values) => handleFieldChange('boletoReservePercentage', values.formattedValue)}
										/>
										<FieldError />
									</TextField>
								)}

								{showBoletoReserveCompensationField && (
									<TextField
										variant="secondary"
										name="boletoReserveCompensationDays"
										value={formData.boletoReserveCompensationDays}
										onChange={(value) => handleFieldChange('boletoReserveCompensationDays', value)}
										validate={(value) => {
											const days = value ? parseInt(value, 10) : null;
											if (days !== null && (days < 0 || days > 365)) {
												return 'Os dias devem estar entre 0 e 365';
											}
											return null;
										}}
									>
										<Label>Compensação da Reserva (dias)</Label>
										<Input variant="secondary" type="number" min={0} max={365} />
										<FieldError />
									</TextField>
								)}
							</div>
						)}
						<Separator />
						<div className="grid grid-cols-1 gap-6">
							<div className="flex flex-col gap-4 rounded-lg bg-content1">
								<div className="flex items-center gap-2 text-xs text-foreground/60">
									<Chip variant="soft" color="warning" size="sm">
										API
									</Chip>
									<span>Taxas para integracões diretas</span>
								</div>
								<div className={getFeeInputGridClass(formData.boletoApiFeeMode)}>
									<Select
										variant="secondary"
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
												{feeChargeModeOptions.map((option) => (
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

									{shouldShowFixedFeeInput(formData.boletoApiFeeMode) && (
										<TextField
											variant="secondary"
											name="boletoApiFeeFixed"
											isDisabled={formData.boletoApiFeeMode === 'PercentageOnly'}
											validate={() => {
												const cents = formattedCurrencyToCents(formData.boletoApiFeeFixed);
												if (cents !== null && cents < 0) {
													return 'O valor nao pode ser negativo';
												}
												return null;
											}}
										>
											<Label>Valor Fixo (R$)</Label>
											<CurrencyCentsInput
												initialValueInCents={formattedCurrencyToCents(formData.boletoApiFeeFixed) ?? undefined}
												disabled={formData.boletoApiFeeMode === 'PercentageOnly'}
												onValueChange={(value) => handleFieldChange('boletoApiFeeFixed', value)}
											/>
											<FieldError />
										</TextField>
									)}

									{shouldShowPercentageFeeInput(formData.boletoApiFeeMode) && (
										<TextField
											variant="secondary"
											name="boletoApiFeePercentage"
											isDisabled={formData.boletoApiFeeMode === 'FixedOnly'}
											validate={() => {
												const basisPoints = percentageToBasisPoints(formData.boletoApiFeePercentage);
												if (basisPoints !== null && (basisPoints < 0 || basisPoints > 10000)) {
													return 'O percentual deve estar entre 0% e 100%';
												}
												return null;
											}}
										>
											<Label>Percentual (%)</Label>
											<NumericFormat
												customInput={Input}
												{...percentageNumericProps}
												value={formData.boletoApiFeePercentage}
												disabled={formData.boletoApiFeeMode === 'FixedOnly'}
												onValueChange={(values) => handleFieldChange('boletoApiFeePercentage', values.formattedValue)}
											/>
											<FieldError />
										</TextField>
									)}
								</div>
							</div>
							<div className="flex flex-col gap-4 rounded-lg bg-content1">
								<div className="flex items-center gap-2 text-xs text-foreground/60">
									<Chip variant="soft" color="warning" size="sm">
										Checkout
									</Chip>
									<span>Taxas para pagamentos no checkout</span>
								</div>
								<div className={getFeeInputGridClass(formData.boletoCheckoutFeeMode)}>
									<Select
										variant="secondary"
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
												{feeChargeModeOptions.map((option) => (
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

									{shouldShowFixedFeeInput(formData.boletoCheckoutFeeMode) && (
										<TextField
											variant="secondary"
											name="boletoCheckoutFeeFixed"
											isDisabled={formData.boletoCheckoutFeeMode === 'PercentageOnly'}
											validate={() => {
												const cents = formattedCurrencyToCents(formData.boletoCheckoutFeeFixed);
												if (cents !== null && cents < 0) {
													return 'O valor nao pode ser negativo';
												}
												return null;
											}}
										>
											<Label>Valor Fixo (R$)</Label>
											<CurrencyCentsInput
												initialValueInCents={formattedCurrencyToCents(formData.boletoCheckoutFeeFixed) ?? undefined}
												disabled={formData.boletoCheckoutFeeMode === 'PercentageOnly'}
												onValueChange={(value) => handleFieldChange('boletoCheckoutFeeFixed', value)}
											/>
											<FieldError />
										</TextField>
									)}

									{shouldShowPercentageFeeInput(formData.boletoCheckoutFeeMode) && (
										<TextField
											variant="secondary"
											name="boletoCheckoutFeePercentage"
											isDisabled={formData.boletoCheckoutFeeMode === 'FixedOnly'}
											validate={() => {
												const basisPoints = percentageToBasisPoints(formData.boletoCheckoutFeePercentage);
												if (basisPoints !== null && (basisPoints < 0 || basisPoints > 10000)) {
													return 'O percentual deve estar entre 0% e 100%';
												}
												return null;
											}}
										>
											<Label>Percentual (%)</Label>
											<NumericFormat
												customInput={Input}
												{...percentageNumericProps}
												value={formData.boletoCheckoutFeePercentage}
												disabled={formData.boletoCheckoutFeeMode === 'FixedOnly'}
												onValueChange={(values) =>
													handleFieldChange('boletoCheckoutFeePercentage', values.formattedValue)
												}
											/>
											<FieldError />
										</TextField>
									)}
								</div>
							</div>
							<div className="flex flex-col gap-4 rounded-lg bg-content1">
								<div className="flex items-center gap-2 text-xs text-foreground/60">
									<Chip variant="soft" color="warning" size="sm">
										Link de Pagamento
									</Chip>
									<span>Taxas para pagamentos via link</span>
								</div>
								<div className={getFeeInputGridClass(formData.boletoPaymentLinkFeeMode)}>
									<Select
										variant="secondary"
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
												{feeChargeModeOptions.map((option) => (
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

									{shouldShowFixedFeeInput(formData.boletoPaymentLinkFeeMode) && (
										<TextField
											variant="secondary"
											name="boletoPaymentLinkFeeFixed"
											isDisabled={formData.boletoPaymentLinkFeeMode === 'PercentageOnly'}
											validate={() => {
												const cents = formattedCurrencyToCents(formData.boletoPaymentLinkFeeFixed);
												if (cents !== null && cents < 0) {
													return 'O valor nao pode ser negativo';
												}
												return null;
											}}
										>
											<Label>Valor Fixo (R$)</Label>
											<CurrencyCentsInput
												initialValueInCents={formattedCurrencyToCents(formData.boletoPaymentLinkFeeFixed) ?? undefined}
												disabled={formData.boletoPaymentLinkFeeMode === 'PercentageOnly'}
												onValueChange={(value) => handleFieldChange('boletoPaymentLinkFeeFixed', value)}
											/>
											<FieldError />
										</TextField>
									)}

									{shouldShowPercentageFeeInput(formData.boletoPaymentLinkFeeMode) && (
										<TextField
											variant="secondary"
											name="boletoPaymentLinkFeePercentage"
											isDisabled={formData.boletoPaymentLinkFeeMode === 'FixedOnly'}
											validate={() => {
												const basisPoints = percentageToBasisPoints(formData.boletoPaymentLinkFeePercentage);
												if (basisPoints !== null && (basisPoints < 0 || basisPoints > 10000)) {
													return 'O percentual deve estar entre 0% e 100%';
												}
												return null;
											}}
										>
											<Label>Percentual (%)</Label>
											<NumericFormat
												customInput={Input}
												{...percentageNumericProps}
												value={formData.boletoPaymentLinkFeePercentage}
												disabled={formData.boletoPaymentLinkFeeMode === 'FixedOnly'}
												onValueChange={(values) =>
													handleFieldChange('boletoPaymentLinkFeePercentage', values.formattedValue)
												}
											/>
											<FieldError />
										</TextField>
									)}
								</div>
							</div>
						</div>
					</BoletoAccordion>
				)}

				{formData.creditCardEnabled && (
					<CreditCardAccordion
						summary={
							<>
								Status: Ativo | Reserva: {displayPercentage(formData.creditCardReservePercentage)} | Compensação:{' '}
								{displayDays(formData.creditCardReserveCompensationDays)} | API:{' '}
								{feeModeLabel(formData.creditCardApiFeeMode)} ({displayCurrency(formData.creditCardApiFeeFixed)} +{' '}
								{displayPercentage(formData.creditCardApiFeePercentage)}) | Checkout:{' '}
								{feeModeLabel(formData.creditCardCheckoutFeeMode)} (
								{displayCurrency(formData.creditCardCheckoutFeeFixed)} +{' '}
								{displayPercentage(formData.creditCardCheckoutFeePercentage)}) | Link:{' '}
								{feeModeLabel(formData.creditCardPaymentLinkFeeMode)} (
								{displayCurrency(formData.creditCardPaymentLinkFeeFixed)} +{' '}
								{displayPercentage(formData.creditCardPaymentLinkFeePercentage)})
							</>
						}
					>
						<div className="flex items-center gap-2 text-xs text-foreground/60">
							<Chip variant="soft" color="accent" size="sm">
								Reserva
							</Chip>
							<span>Percentual de reserva financeira para transações de cartão</span>
						</div>

						<div className="flex flex-wrap items-center gap-4 rounded-lg border border-divider bg-content1 p-3">
							<Checkbox
								variant="secondary"
								isSelected={showCreditCardReserveField}
								onChange={(isSelected: boolean) => {
									setShowCreditCardReserveField(isSelected);
									if (!isSelected) {
										handleFieldChange('creditCardReservePercentage', basisPointsToPercentage(0));
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
										handleFieldChange('creditCardReserveCompensationDays', '0');
									}
								}}
							>
								<Checkbox.Control>
									<Checkbox.Indicator />
								</Checkbox.Control>
								<Checkbox.Content>Configurar compensação</Checkbox.Content>
							</Checkbox>
						</div>

						{(showCreditCardReserveField || showCreditCardReserveCompensationField) && (
							<div
								className={
									showCreditCardReserveField && showCreditCardReserveCompensationField
										? 'grid grid-cols-1 gap-4 md:grid-cols-2'
										: 'grid grid-cols-1 gap-4'
								}
							>
								{showCreditCardReserveField && (
									<TextField
										variant="secondary"
										name="creditCardReservePercentage"
										validate={() => {
											const basisPoints = percentageToBasisPoints(formData.creditCardReservePercentage);
											if (basisPoints !== null && (basisPoints < 0 || basisPoints > 10000)) {
												return 'O percentual deve estar entre 0% e 100%';
											}
											return null;
										}}
									>
										<Label>Reserva Financeira (%)</Label>
										<NumericFormat
											customInput={Input}
											{...percentageNumericProps}
											value={formData.creditCardReservePercentage}
											onValueChange={(values) =>
												handleFieldChange('creditCardReservePercentage', values.formattedValue)
											}
										/>
										<FieldError />
									</TextField>
								)}

								{showCreditCardReserveCompensationField && (
									<TextField
										variant="secondary"
										name="creditCardReserveCompensationDays"
										value={formData.creditCardReserveCompensationDays}
										onChange={(value) => handleFieldChange('creditCardReserveCompensationDays', value)}
										validate={(value) => {
											const days = value ? parseInt(value, 10) : null;
											if (days !== null && (days < 0 || days > 365)) {
												return 'Os dias devem estar entre 0 e 365';
											}
											return null;
										}}
									>
										<Label>Compensação da Reserva (dias)</Label>
										<Input variant="secondary" type="number" min={0} max={365} />
										<FieldError />
									</TextField>
								)}
							</div>
						)}

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
								},
								{
									label: 'Checkout',
									description: 'Taxas para checkout integrado',
									mode: 'creditCardCheckoutFeeMode',
									fixed: 'creditCardCheckoutFeeFixed',
									percentage: 'creditCardCheckoutFeePercentage',
									installmentPercentage: 'creditCardCheckoutInstallmentFeePercentage',
								},
								{
									label: 'Link de Pagamento',
									description: 'Taxas para pagamentos via link',
									mode: 'creditCardPaymentLinkFeeMode',
									fixed: 'creditCardPaymentLinkFeeFixed',
									percentage: 'creditCardPaymentLinkFeePercentage',
									installmentPercentage: 'creditCardPaymentLinkInstallmentFeePercentage',
								},
							].map((section) => {
								const modeValue = formData[section.mode as keyof FormValues] as FeeChargeMode;
								const fixedValue = formData[section.fixed as keyof FormValues] as string;
								const percentageValue = formData[section.percentage as keyof FormValues] as string;
								const installmentPercentageValue = formData[
									section.installmentPercentage as keyof FormValues
								] as string;
								const showFixedFeeInput = shouldShowFixedFeeInput(modeValue);
								const showPercentageFeeInput = shouldShowPercentageFeeInput(modeValue);

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
											<Select
												variant="secondary"
												aria-label={`Modo de Taxa Cartão ${section.label}`}
												value={modeValue}
												onChange={(key) => handleSelectChange(section.mode as keyof FormValues, key)}
											>
												<Label>Modo de Cobrança</Label>
												<Select.Trigger className="w-full">
													<Select.Value />
													<Select.Indicator className="size-4" />
												</Select.Trigger>
												<Select.Popover>
													<ListBox>
														{feeChargeModeOptions.map((option) => (
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

											{showFixedFeeInput && (
												<TextField
													variant="secondary"
													name={section.fixed}
													isDisabled={modeValue === 'PercentageOnly'}
													validate={() => {
														const cents = formattedCurrencyToCents(fixedValue);
														if (cents !== null && cents < 0) {
															return 'O valor nao pode ser negativo';
														}
														return null;
													}}
												>
													<Label>Valor Fixo (R$)</Label>
													<CurrencyCentsInput
														initialValueInCents={formattedCurrencyToCents(fixedValue) ?? undefined}
														disabled={modeValue === 'PercentageOnly'}
														onValueChange={(value) => handleFieldChange(section.fixed as keyof FormValues, value)}
													/>
													<FieldError />
												</TextField>
											)}

											{showPercentageFeeInput && (
												<TextField
													variant="secondary"
													name={section.percentage}
													isDisabled={modeValue === 'FixedOnly'}
													validate={() => {
														const basisPoints = percentageToBasisPoints(percentageValue);
														if (basisPoints !== null && (basisPoints < 0 || basisPoints > 10000)) {
															return 'O percentual deve estar entre 0% e 100%';
														}
														return null;
													}}
												>
													<Label>Percentual (%)</Label>
													<NumericFormat
														customInput={Input}
														{...percentageNumericProps}
														value={percentageValue}
														disabled={modeValue === 'FixedOnly'}
														onValueChange={(values) =>
															handleFieldChange(section.percentage as keyof FormValues, values.formattedValue)
														}
													/>
													<FieldError />
												</TextField>
											)}

											<TextField
												variant="secondary"
												name={section.installmentPercentage}
												validate={() => {
													const basisPoints = percentageToBasisPoints(installmentPercentageValue);
													if (basisPoints !== null && (basisPoints < 0 || basisPoints > 10000)) {
														return 'O percentual deve estar entre 0% e 100%';
													}
													return null;
												}}
											>
												<Label>Taxa por Parcela Extra (%)</Label>
												<NumericFormat
													customInput={Input}
													{...percentageNumericProps}
													value={installmentPercentageValue}
													onValueChange={(values) =>
														handleFieldChange(section.installmentPercentage as keyof FormValues, values.formattedValue)
													}
												/>
												<FieldError />
											</TextField>
										</div>
									</div>
								);
							})}
						</div>
					</CreditCardAccordion>
				)}

				{formData.withdrawalEnabled && (
					<WithdrawalAccordion
						summary={
							<>
								Status: {formData.withdrawalEnabled ? 'Ativo' : 'Inativo'} | Mínimo:{' '}
								{displayCurrency(formData.minWithdrawalAmount)} | Aprovação:{' '}
								{withdrawalApprovalModeLabel(formData.withdrawalApprovalMode)} | Taxa:{' '}
								{feeModeLabel(formData.withdrawalFeeMode)} ({displayCurrency(formData.withdrawalFeeFixed)} +{' '}
								{displayPercentage(formData.withdrawalFeePercentage)})
							</>
						}
					>
						<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
							<TextField
								variant="secondary"
								name="minWithdrawalAmount"
								validate={() => {
									const cents = formattedCurrencyToCents(formData.minWithdrawalAmount);
									if (cents !== null && cents < 0) {
										return 'O valor nao pode ser negativo';
									}
									return null;
								}}
							>
								<Label>Valor Mínimo de Saque (R$)</Label>
								<CurrencyCentsInput
									initialValueInCents={formattedCurrencyToCents(formData.minWithdrawalAmount) ?? undefined}
									onValueChange={(value) => handleFieldChange('minWithdrawalAmount', value)}
								/>
								<FieldError />
							</TextField>

							<Select
								variant="secondary"
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
										{withdrawalApprovalModeOptions.map((option) => (
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
						</div>
						<Separator />
						<div
							className={
								shouldShowFixedFeeInput(formData.withdrawalFeeMode) &&
								shouldShowPercentageFeeInput(formData.withdrawalFeeMode)
									? 'grid grid-cols-1 gap-3 md:grid-cols-3'
									: 'grid grid-cols-1 gap-3 md:grid-cols-2'
							}
						>
							<Select
								variant="secondary"
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
										{feeChargeModeOptions.map((option) => (
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

							{shouldShowFixedFeeInput(formData.withdrawalFeeMode) && (
								<TextField
									variant="secondary"
									name="withdrawalFeeFixed"
									isDisabled={formData.withdrawalFeeMode === 'PercentageOnly'}
									validate={() => {
										const cents = formattedCurrencyToCents(formData.withdrawalFeeFixed);
										if (cents !== null && cents < 0) {
											return 'O valor nao pode ser negativo';
										}
										return null;
									}}
								>
									<Label>Valor Fixo (R$)</Label>
									<CurrencyCentsInput
										initialValueInCents={formattedCurrencyToCents(formData.withdrawalFeeFixed) ?? undefined}
										disabled={formData.withdrawalFeeMode === 'PercentageOnly'}
										onValueChange={(value) => handleFieldChange('withdrawalFeeFixed', value)}
									/>
									<FieldError />
								</TextField>
							)}

							{shouldShowPercentageFeeInput(formData.withdrawalFeeMode) && (
								<TextField
									variant="secondary"
									name="withdrawalFeePercentage"
									isDisabled={formData.withdrawalFeeMode === 'FixedOnly'}
									validate={() => {
										const basisPoints = percentageToBasisPoints(formData.withdrawalFeePercentage);
										if (basisPoints !== null && (basisPoints < 0 || basisPoints > 10000)) {
											return 'O percentual deve estar entre 0% e 100%';
										}
										return null;
									}}
								>
									<Label>Percentual (%)</Label>
									<NumericFormat
										customInput={Input}
										{...percentageNumericProps}
										value={formData.withdrawalFeePercentage}
										disabled={formData.withdrawalFeeMode === 'FixedOnly'}
										onValueChange={(values) => handleFieldChange('withdrawalFeePercentage', values.formattedValue)}
									/>
									<FieldError />
								</TextField>
							)}
						</div>
					</WithdrawalAccordion>
				)}

				<RateLimitingAccordion
					summary={`${formData.rateLimitPerMinute || '0'}/min | ${formData.rateLimitPerHour || '0'}/hora | ${formData.rateLimitPerDay || '0'}/dia`}
				>
					<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
						<TextField
							variant="secondary"
							name="rateLimitPerMinute"
							value={formData.rateLimitPerMinute}
							onChange={(value) => handleFieldChange('rateLimitPerMinute', value)}
							validate={(value) => {
								if (value && (isNaN(Number(value)) || Number(value) < 1)) {
									return 'O valor deve ser um numero positivo';
								}
								return null;
							}}
						>
							<Label>Por Minuto</Label>
							<Input variant="secondary" type="number" min={1} />
							<FieldError />
						</TextField>

						<TextField
							variant="secondary"
							name="rateLimitPerHour"
							value={formData.rateLimitPerHour}
							onChange={(value) => handleFieldChange('rateLimitPerHour', value)}
							validate={(value) => {
								if (value && (isNaN(Number(value)) || Number(value) < 1)) {
									return 'O valor deve ser um numero positivo';
								}
								return null;
							}}
						>
							<Label>Por Hora</Label>
							<Input variant="secondary" type="number" min={1} />
							<FieldError />
						</TextField>

						<TextField
							variant="secondary"
							name="rateLimitPerDay"
							value={formData.rateLimitPerDay}
							onChange={(value) => handleFieldChange('rateLimitPerDay', value)}
							validate={(value) => {
								if (value && (isNaN(Number(value)) || Number(value) < 1)) {
									return 'O valor deve ser um numero positivo';
								}
								return null;
							}}
						>
							<Label>Por Dia</Label>
							<Input variant="secondary" type="number" min={1} />
							<FieldError />
						</TextField>
					</div>
				</RateLimitingAccordion>

				<ReferralAccordion
					summary={
						<>
							Duração: {formData.referralDurationMonths || '0'} meses | Comissão:{' '}
							{displayPercentage(formData.referralCommissionPercentage)} | Intervalo:{' '}
							{formData.referralCommissionWithdrawalIntervalValue || '0'}{' '}
							{intervalUnitLabel(formData.referralCommissionWithdrawalIntervalUnit)} | Mínimo:{' '}
							{displayCurrency(formData.referralCommissionMinWithdrawalAmount)} | Taxa fixa:{' '}
							{displayCurrency(formData.referralCommissionWithdrawalFeeFixed)}
						</>
					}
				>
					<div className="grid grid-cols-1 gap-3 md:grid-cols-4">
						<TextField
							variant="secondary"
							className="w-full"
							name="referralDurationMonths"
							value={formData.referralDurationMonths}
							onChange={(value) => handleFieldChange('referralDurationMonths', value)}
							validate={(value) => {
								const months = value ? parseInt(value, 10) : null;
								if (months !== null && (months < 1 || months > 120)) {
									return 'A duração deve estar entre 1 e 120 meses';
								}
								return null;
							}}
						>
							<Label>Duração da indicação (meses)</Label>
							<Input variant="secondary" className="w-full" type="number" min={1} max={120} />
							<FieldError />
						</TextField>

						<TextField
							variant="secondary"
							className="w-full"
							name="referralCommissionWithdrawalIntervalValue"
							value={formData.referralCommissionWithdrawalIntervalValue}
							onChange={(value) => handleFieldChange('referralCommissionWithdrawalIntervalValue', value)}
							validate={(value) => {
								const intervalValue = value ? parseInt(value, 10) : null;
								if (intervalValue !== null && (intervalValue < 0 || intervalValue > 120)) {
									return 'O intervalo deve estar entre 0 e 120';
								}
								return null;
							}}
						>
							<Label>Intervalo para novo saque (valor)</Label>
							<Input variant="secondary" className="w-full" type="number" min={0} max={120} />
							<FieldError />
						</TextField>

						<Select
							variant="secondary"
							className="w-full"
							aria-label="Unidade do intervalo de saque da comissão"
							value={formData.referralCommissionWithdrawalIntervalUnit}
							onChange={(key) => handleSelectChange('referralCommissionWithdrawalIntervalUnit', key)}
						>
							<Label>Intervalo para novo saque (unidade)</Label>
							<Select.Trigger className="w-full">
								<Select.Value />
								<Select.Indicator />
							</Select.Trigger>
							<Select.Popover>
								<ListBox>
									{referralIntervalUnitOptions.map((option) => (
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

						<TextField
							variant="secondary"
							className="w-full"
							name="referralCommissionPercentage"
							validate={() => {
								const basisPoints = percentageToBasisPoints(formData.referralCommissionPercentage);
								if (basisPoints !== null && (basisPoints < 0 || basisPoints > 10000)) {
									return 'O percentual deve estar entre 0% e 100%';
								}
								return null;
							}}
						>
							<Label>Comissão sobre lucro (%)</Label>
							<NumericFormat
								customInput={Input}
								className="w-full"
								{...percentageNumericProps}
								value={formData.referralCommissionPercentage}
								onValueChange={(values) => handleFieldChange('referralCommissionPercentage', values.formattedValue)}
							/>
							<FieldError />
						</TextField>
					</div>

					<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
						<TextField
							variant="secondary"
							className="w-full"
							name="referralCommissionMinWithdrawalAmount"
							validate={() => {
								const cents = formattedCurrencyToCents(formData.referralCommissionMinWithdrawalAmount);
								if (cents !== null && cents < 0) {
									return 'O valor não pode ser negativo';
								}
								return null;
							}}
						>
							<Label>Saque mínimo da comissão (R$)</Label>
							<CurrencyCentsInput
								className="w-full"
								initialValueInCents={
									formattedCurrencyToCents(formData.referralCommissionMinWithdrawalAmount) ?? undefined
								}
								onValueChange={(value) => handleFieldChange('referralCommissionMinWithdrawalAmount', value)}
							/>
							<FieldError />
						</TextField>

						<TextField
							variant="secondary"
							className="w-full"
							name="referralCommissionWithdrawalFeeFixed"
							validate={() => {
								const cents = formattedCurrencyToCents(formData.referralCommissionWithdrawalFeeFixed);
								if (cents !== null && cents < 0) {
									return 'O valor não pode ser negativo';
								}
								return null;
							}}
						>
							<Label>Taxa fixa de saque da comissão (R$)</Label>
							<CurrencyCentsInput
								className="w-full"
								initialValueInCents={
									formattedCurrencyToCents(formData.referralCommissionWithdrawalFeeFixed) ?? undefined
								}
								onValueChange={(value) => handleFieldChange('referralCommissionWithdrawalFeeFixed', value)}
							/>
							<FieldError />
						</TextField>
					</div>
				</ReferralAccordion>

				<PaymentLinkDomainsAccordion
					paymentLinkDomainOptions={formData.paymentLinkDomainOptions}
					pendingRemovalKey={domainModalState.pendingRemovalKey}
					onAddDomain={openCreatePaymentLinkDomainModal}
					onEditDomain={openEditPaymentLinkDomainModal}
					onSetDefaultDomain={setPaymentLinkDomainAsDefault}
					onRequestDomainRemoval={requestPaymentLinkDomainRemoval}
					onConfirmDomainRemoval={confirmPaymentLinkDomainRemoval}
					onCancelDomainRemoval={clearPendingDomainRemoval}
				/>
			</div>

			<PaymentLinkDomainModal
				state={domainModalState}
				error={formError}
				onClose={closeDomainModal}
				onSave={saveDomainModal}
				onDraftChange={handleDomainDraftFieldChange}
			/>

			<FormSaveFooter
				submitLabel="Salvar configurações"
				isPending={isPending}
				isDisabled={!hasChanges}
				lastUpdated={lastUpdated}
			/>
		</Form>
	);
}

export function PlatformSettingsForm({ fetchPromise, payoutAccountsPromise }: PlatformSettingsFormProps) {
	const response = use(fetchPromise);
	const payoutAccountsResponse = use(payoutAccountsPromise);
	const platformPayoutAccounts = payoutAccountsResponse?.data?.items ?? [];

	if (response?.error) {
		return (
			<div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
				{response.error.message ?? 'Nao foi possivel carregar as configuracoes.'}
			</div>
		);
	}

	if (!response?.data) {
		return (
			<div className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
				Nenhuma configuracao encontrada.
			</div>
		);
	}

	return <PlatformSettingsFormContent settings={response.data} platformPayoutAccounts={platformPayoutAccounts} />;
}

export function PlatformSettingsSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			{[1, 2, 3, 4].map((i) => (
				<div key={i} className="rounded-lg border border-divider bg-surface">
					<div className="flex items-center gap-3 px-4 py-3">
						<Skeleton className="size-10 rounded-lg" />
						<div className="flex flex-col gap-1">
							<Skeleton className="h-5 w-32 rounded-lg" />
							<Skeleton className="h-3 w-48 rounded-lg" />
						</div>
					</div>
					<div className="border-t border-divider p-4">
						<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
							{[1, 2, 3].map((j) => (
								<div key={j} className="flex flex-col gap-2">
									<Skeleton className="h-4 w-24 rounded-lg" />
									<Skeleton className="h-10 w-full rounded-lg" />
								</div>
							))}
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
