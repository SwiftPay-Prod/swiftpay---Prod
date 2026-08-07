'use client';

import { useState, useTransition, type ReactNode } from 'react';
import {
	Button,
	Input,
	Select,
	TextArea,
	Switch,
	Label,
	ListBox,
	Separator,
	Chip,
	TextField,
	FieldError,
	AlertDialog,
	Accordion,
} from '@heroui/react';
import { NumericFormat } from 'react-number-format';
import { Icon } from '@/components/ui/icon';
import { ImageUploader } from '@/components/ui/image-uploader';
import {
	ServerStack01Icon as Server,
	Shield01Icon as Shield,
	Tag01Icon as Tag,
	CheckmarkCircle02Icon,
	CancelCircleIcon,
	ArrowDown01Icon,
	WebhookIcon,
	InformationCircleIcon,
	QrCodeIcon,
	BarCodeIcon,
	CreditCardIcon,
	Analytics01Icon,
	Wallet01Icon,
} from '@hugeicons/core-free-icons';
import type { AdminAcquirerData, WebhookAuthMode, CredentialFieldSchema } from '@/types/admin/acquirers';
import {
	FeeChargeMode,
	UserRole,
	AcquirerOperationType,
	UploadFolder,
	PayoutFeeHandling,
	PaymentFeeSplitHandling,
} from '@/types/enums';
import {
	webhookAuthModeParse,
	feeChargeModeParse,
	acquirerOperationTypeParse,
	mapParseColorToChipColor,
	payoutFeeHandlingParse,
	paymentFeeSplitHandlingParse,
	providerCategoryParse,
} from '@/parse';
import { adminResetAcquirerCredentialSchema, adminUpdateAcquirer } from '@/app/actions/admin/acquirers';
import { toast } from '@heroui/react';
import {
	centsToFormattedCurrency,
	formattedCurrencyToCents,
	basisPointsToPercentage,
	percentageToBasisPoints,
} from '@/utils/currency';
import { percentageFormatProps } from '@/utils/input-masks';
import { CurrencyCentsInput } from '@/components/ui/currency-cents-input';
import { AsyncButton } from '@/components/ui/async-button';
import { SystemAccordion } from '@/components/ui/system-accordion';

interface ConfigTabProps {
	acquirer: AdminAcquirerData;
	currentUserRole: UserRole;
	onRefresh: () => void;
}

function ConfiguredChip({ isConfigured }: { isConfigured: boolean }) {
	return (
		<Chip variant="soft" size="sm" color={isConfigured ? 'success' : 'default'}>
			{isConfigured ? 'Configurado' : 'Não configurado'}
		</Chip>
	);
}

function buildFeeSummary(data: {
	pixPercentage?: string;
	pixFixed?: string;
	pixMode?: string;
	boletoPercentage?: string;
	boletoFixed?: string;
	boletoMode?: string;
	creditCardPercentage?: string;
	creditCardFixed?: string;
	creditCardMode?: string;
	payoutPercentage?: string;
	payoutFixed?: string;
	payoutMode?: string;
}) {
	const parts: string[] = [];

	const appendMethodSummary = ({
		prefix,
		percentage,
		fixed,
		mode,
	}: {
		prefix: string;
		percentage?: string;
		fixed?: string;
		mode?: string;
	}) => {
		const hasFee =
			(percentage && percentage !== '0' && percentage !== '0,00') ||
			(fixed && fixed !== '0' && fixed !== '0,00' && mode !== 'PercentageOnly');

		if (!hasFee) return;

		const tokens: string[] = [];
		if (percentage && percentage !== '0' && percentage !== '0,00' && mode !== 'FixedOnly') {
			tokens.push(`${percentage}%`);
		}
		if (fixed && fixed !== '0' && fixed !== '0,00' && mode !== 'PercentageOnly') {
			tokens.push(fixed);
		}

		parts.push(`${prefix}: ${tokens.join(' + ')}`);
	};

	appendMethodSummary({ prefix: 'PIX', percentage: data.pixPercentage, fixed: data.pixFixed, mode: data.pixMode });
	appendMethodSummary({ prefix: 'Boleto', percentage: data.boletoPercentage, fixed: data.boletoFixed, mode: data.boletoMode });
	appendMethodSummary({ prefix: 'Cartão', percentage: data.creditCardPercentage, fixed: data.creditCardFixed, mode: data.creditCardMode });
	appendMethodSummary({ prefix: 'Saque', percentage: data.payoutPercentage, fixed: data.payoutFixed, mode: data.payoutMode });

	return parts.length > 0 ? parts.join(' | ') : 'Nenhuma taxa configurada';
}

function buildCompensationSummary(hasCompensation: boolean, days: number) {
	if (!hasCompensation) {
		return 'Liquidação sem compensação em dias';
	}

	return `Compensa em D+${Math.max(1, days)}`;
}

function shouldShowFixedFeeInput(mode: FeeChargeMode): boolean {
	return mode !== FeeChargeMode.PercentageOnly;
}

function shouldShowPercentageFeeInput(mode: FeeChargeMode): boolean {
	return mode !== FeeChargeMode.FixedOnly;
}

function getFeeInputGridClass(showFixedInput: boolean, showPercentageInput: boolean): string {
	return showFixedInput && showPercentageInput
		? 'grid grid-cols-1 gap-3 md:grid-cols-3'
		: 'grid grid-cols-1 gap-3 md:grid-cols-2';
}

const feeChargeModeSelectOptions: Array<{
	key: FeeChargeMode;
	label: string;
	color: 'accent' | 'warning' | 'success';
	icon: ReactNode;
}> = [
	{
		key: FeeChargeMode.FixedOnly,
		label: 'Valor fixo',
		color: 'accent',
		icon: <Icon icon={Tag} className="icon-sm" />,
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

function getFeeChargeModeSelectOption(mode: FeeChargeMode) {
	return feeChargeModeSelectOptions.find((option) => option.key === mode) ?? feeChargeModeSelectOptions[0]!;
}

interface CredentialEnvironmentSectionProps {
	id: string;
	title: string;
	icon: React.ReactNode;
	iconBgClassName: string;
	summaryText: string;
	apiUrl: string | null | undefined;
	schema: CredentialFieldSchema[] | null | undefined;
	hasCredentials: boolean | null | undefined;
}


function CredentialEnvironmentSection({
	id,
	title,
	icon,
	iconBgClassName,
	summaryText,
	apiUrl,
	schema,
	hasCredentials,
}: CredentialEnvironmentSectionProps) {
	const isConfigured = Boolean(hasCredentials);

	return (
		<Accordion defaultExpandedKeys={[]}>
			<Accordion.Item id={id} className="rounded-xl border border-divider bg-surface">
				<Accordion.Heading>
					<Accordion.Trigger className="flex w-full items-center justify-between px-4 py-3">
						<div className="flex items-center gap-3">
							<div className={`flex size-10 items-center justify-center rounded-lg ${iconBgClassName}`}>
								{icon}
							</div>
							<div className="flex flex-col items-start">
								<span className="font-medium">{title}</span>
								<span className="text-xs text-muted">{summaryText}</span>
							</div>
						</div>
						<Accordion.Indicator>
							<Icon icon={ArrowDown01Icon} className="icon-sm text-muted transition-transform duration-200" />
						</Accordion.Indicator>
					</Accordion.Trigger>
				</Accordion.Heading>
				<Accordion.Panel>
					<Accordion.Body className="flex flex-col gap-4 px-4 pb-4">
						<div>
							<label className="text-sm text-muted">URL Base da API</label>
							<p className="font-medium">{apiUrl || '—'}</p>
						</div>
						{schema && schema.length > 0 ? (
							<div className="grid gap-4 md:grid-cols-2">
								{schema.map((field) => (
									<div key={field.key}>
										<label className="text-sm text-muted">{field.label}</label>
										<p className={`font-medium font-mono ${isConfigured ? 'visual-blur' : ''}`}>
											{isConfigured ? 'Configurado' : '—'}
										</p>
									</div>
								))}
							</div>
						) : (
							<p className="text-sm text-muted">Esta processadora não possui schema de credenciais configurado.</p>
						)}
					</Accordion.Body>
				</Accordion.Panel>
			</Accordion.Item>
		</Accordion>
	);
}

interface DynamicCredentialFieldsProps {
	schema: CredentialFieldSchema[];
	values: Record<string, string>;
	onChange: (name: string, value: string) => void;
	hasCredentials: boolean;
}

function DynamicCredentialFields({ schema, values, onChange, hasCredentials }: DynamicCredentialFieldsProps) {
	return (
		<div className="grid gap-4 md:grid-cols-2">
			{schema.map((field, index) => (
				<div key={field.key || `field-${index}`} className="flex flex-col gap-2">
					<div className="flex items-center gap-2">
						<Label htmlFor={field.key}>{field.label}</Label>
						<Chip variant="soft" size="sm" color={values[field.key] || hasCredentials ? 'success' : 'default'}>
							{values[field.key] || hasCredentials ? 'Configurado' : 'Não configurado'}
						</Chip>
					</div>
					<Input variant="secondary"
						id={field.key}
						type={field.type}
						value={values[field.key] || ''}
						onChange={(e) => onChange(field.key, e.target.value)}
						placeholder={field.placeholder || field.label}
						autoComplete="new-password"
					/>
					{field.description && <span className="text-xs text-foreground/60">{field.description}</span>}
				</div>
			))}
		</div>
	);
}

export function ConfigTab({ acquirer, currentUserRole, onRefresh }: ConfigTabProps) {
	const [isPending, startTransition] = useTransition();
	const [isResetSchemaPending, startResetSchemaTransition] = useTransition();
	const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
	const [isResetSchemaDialogOpen, setIsResetSchemaDialogOpen] = useState(false);
	const isGod = currentUserRole === UserRole.God;
	const canEdit = isGod || currentUserRole === UserRole.Admin;

	const getInitialFormData = () => ({
		isActive: acquirer.isActive,
		hideFromMerchantNominalSelection: acquirer.hideFromMerchantNominalSelection,
		operationTypes: acquirer.operationTypes as AcquirerOperationType[],
		displayName: acquirer.displayName || '',
		nominal: acquirer.nominal || '',
		logoUrl: acquirer.logoUrl || '',
		supportsPix: acquirer.supportsPix,
		supportsBoleto: acquirer.supportsBoleto,
		supportsCreditCard: acquirer.supportsCreditCard,
		supportsWithdrawal: acquirer.supportsWithdrawal,
		pixEnabled: acquirer.pixEnabled,
		boletoEnabled: acquirer.boletoEnabled,
		creditCardEnabled: acquirer.creditCardEnabled,
		pixHasCompensation: acquirer.pixHasCompensation,
		pixCompensationDays: acquirer.pixCompensationDays,
		boletoHasCompensation: acquirer.boletoHasCompensation,
		boletoCompensationDays: acquirer.boletoCompensationDays,
		creditCardHasCompensation: acquirer.creditCardHasCompensation,
		creditCardCompensationDays: acquirer.creditCardCompensationDays,
		webhookAuthMode: acquirer.webhookAuthMode,
		webhookToken: acquirer.webhookToken || '',
		webhookAllowedIps: acquirer.webhookAllowedIps || '',
		apiBaseUrlProduction: acquirer.apiBaseUrlProduction || '',
		apiBaseUrlSandbox: acquirer.apiBaseUrlSandbox || '',
		// Dynamic credentials
		defaultCredentials: acquirer.defaultCredentials || {},
		defaultCredentialsSandbox: acquirer.defaultCredentialsSandbox || {},
		pixInFeeMode: acquirer.pixInFeeMode || 'PercentageOnly',
		pixInFeeFixed: centsToFormattedCurrency(acquirer.pixInFeeFixed),
		pixInFeePercentage: basisPointsToPercentage(acquirer.pixInFeePercentage),
		boletoInFeeMode: acquirer.boletoInFeeMode || 'PercentageOnly',
		boletoInFeeFixed: centsToFormattedCurrency(acquirer.boletoInFeeFixed),
		boletoInFeePercentage: basisPointsToPercentage(acquirer.boletoInFeePercentage),
		creditCardInFeeMode: acquirer.creditCardInFeeMode || 'PercentageOnly',
		creditCardInFeeFixed: centsToFormattedCurrency(acquirer.creditCardInFeeFixed),
		creditCardInFeePercentage: basisPointsToPercentage(acquirer.creditCardInFeePercentage),
		payoutFeeMode: acquirer.payoutFeeMode || 'FixedOnly',
		payoutFeeFixed: centsToFormattedCurrency(acquirer.payoutFeeFixed),
		payoutFeePercentage: basisPointsToPercentage(acquirer.payoutFeePercentage),
		payoutFeeHandling: acquirer.payoutFeeHandling || 'FeeDeductedFromTransfer',
		pixFeeSplitHandling: acquirer.pixFeeSplitHandling || 'None',
		boletoFeeSplitHandling: acquirer.boletoFeeSplitHandling || 'None',
		creditCardFeeSplitHandling: acquirer.creditCardFeeSplitHandling || 'None',
		minPixAmount: centsToFormattedCurrency(acquirer.minPixAmount),
		maxPixAmount: centsToFormattedCurrency(acquirer.maxPixAmount),
		minBoletoAmount: centsToFormattedCurrency(acquirer.minBoletoAmount),
		maxBoletoAmount: centsToFormattedCurrency(acquirer.maxBoletoAmount),
		minCreditCardAmount: centsToFormattedCurrency(acquirer.minCreditCardAmount),
		maxCreditCardAmount: centsToFormattedCurrency(acquirer.maxCreditCardAmount),
		minPayoutAmount: centsToFormattedCurrency(acquirer.minPayoutAmount),
		maxPayoutAmount: centsToFormattedCurrency(acquirer.maxPayoutAmount),
		syncToMerchantAcquirers: false,
	});

	const [formData, setFormData] = useState(getInitialFormData);
	const [credentialSchema, setCredentialSchema] = useState<CredentialFieldSchema[]>(acquirer.credentialSchema ?? []);
	const [hasDefaultCredentialsOverride, setHasDefaultCredentialsOverride] = useState<boolean | null>(null);
	const [hasDefaultCredentialsSandboxOverride, setHasDefaultCredentialsSandboxOverride] = useState<boolean | null>(null);
	const effectiveHasDefaultCredentials = hasDefaultCredentialsOverride ?? acquirer.hasDefaultCredentials;
	const effectiveHasDefaultCredentialsSandbox =
		hasDefaultCredentialsSandboxOverride ?? acquirer.hasDefaultCredentialsSandbox;

	const handleUpdate = () => {
		startTransition(async () => {
			const sanitizedDefaultCredentials = Object.fromEntries(
				Object.entries(formData.defaultCredentials)
					.filter(([key, value]) => key && key !== 'undefined' && value.trim().length > 0)
					.map(([key, value]) => [key, value.trim()])
			);

			const sanitizedDefaultCredentialsSandbox = Object.fromEntries(
				Object.entries(formData.defaultCredentialsSandbox)
					.filter(([key, value]) => key && key !== 'undefined' && value.trim().length > 0)
					.map(([key, value]) => [key, value.trim()])
			);

			const dataToSend: Record<string, unknown> = {
				isActive: formData.isActive,
				hideFromMerchantNominalSelection: formData.hideFromMerchantNominalSelection,
				operationTypes: formData.operationTypes,
				displayName: formData.displayName.trim() || null,
				nominal: formData.nominal.trim() || null,
				logoUrl: formData.logoUrl.trim() || null,
				supportsPix: formData.supportsPix,
				supportsBoleto: formData.supportsBoleto,
				supportsCreditCard: formData.supportsCreditCard,
				supportsWithdrawal: formData.supportsWithdrawal,
				pixEnabled: formData.pixEnabled,
				boletoEnabled: formData.boletoEnabled,
				creditCardEnabled: formData.creditCardEnabled,
				pixHasCompensation: formData.pixHasCompensation,
				pixCompensationDays: formData.pixHasCompensation ? formData.pixCompensationDays : 0,
				boletoHasCompensation: formData.boletoHasCompensation,
				boletoCompensationDays: formData.boletoHasCompensation ? formData.boletoCompensationDays : 0,
				creditCardHasCompensation: formData.creditCardHasCompensation,
				creditCardCompensationDays: formData.creditCardHasCompensation ? formData.creditCardCompensationDays : 0,
				webhookAuthMode: formData.webhookAuthMode,
				webhookToken: formData.webhookToken.trim() || null,
				webhookAllowedIps: formData.webhookAllowedIps.trim() || null,
				apiBaseUrlProduction: formData.apiBaseUrlProduction.trim() || null,
				apiBaseUrlSandbox: formData.apiBaseUrlSandbox.trim() || null,
				// Dynamic credentials
				defaultCredentials: Object.keys(sanitizedDefaultCredentials).length > 0 ? sanitizedDefaultCredentials : null,
				defaultCredentialsSandbox:
					Object.keys(sanitizedDefaultCredentialsSandbox).length > 0 ? sanitizedDefaultCredentialsSandbox : null,
				pixInFeeMode: formData.pixInFeeMode,
				pixInFeeFixed: formattedCurrencyToCents(formData.pixInFeeFixed) ?? 0,
				pixInFeePercentage: percentageToBasisPoints(formData.pixInFeePercentage) ?? 0,
				boletoInFeeMode: formData.boletoInFeeMode,
				boletoInFeeFixed: formattedCurrencyToCents(formData.boletoInFeeFixed) ?? 0,
				boletoInFeePercentage: percentageToBasisPoints(formData.boletoInFeePercentage) ?? 0,
				creditCardInFeeMode: formData.creditCardInFeeMode,
				creditCardInFeeFixed: formattedCurrencyToCents(formData.creditCardInFeeFixed) ?? 0,
				creditCardInFeePercentage: percentageToBasisPoints(formData.creditCardInFeePercentage) ?? 0,
				payoutFeeMode: formData.payoutFeeMode,
				payoutFeeFixed: formattedCurrencyToCents(formData.payoutFeeFixed) ?? 0,
				payoutFeePercentage: percentageToBasisPoints(formData.payoutFeePercentage) ?? 0,
				payoutFeeHandling: formData.payoutFeeHandling,
				pixFeeSplitHandling: formData.pixFeeSplitHandling,
				boletoFeeSplitHandling: formData.boletoFeeSplitHandling,
				creditCardFeeSplitHandling: formData.creditCardFeeSplitHandling,
				minPixAmount: formattedCurrencyToCents(formData.minPixAmount) ?? 100,
				maxPixAmount: formattedCurrencyToCents(formData.maxPixAmount) ?? 0,
				minBoletoAmount: formattedCurrencyToCents(formData.minBoletoAmount) ?? 500,
				maxBoletoAmount: formattedCurrencyToCents(formData.maxBoletoAmount) ?? 0,
				minCreditCardAmount: formattedCurrencyToCents(formData.minCreditCardAmount) ?? 100,
				maxCreditCardAmount: formattedCurrencyToCents(formData.maxCreditCardAmount) ?? 0,
				minPayoutAmount: formattedCurrencyToCents(formData.minPayoutAmount) ?? 100,
				maxPayoutAmount: formattedCurrencyToCents(formData.maxPayoutAmount) ?? 0,
				syncToMerchantAcquirers: formData.syncToMerchantAcquirers,
			};

			const response = await adminUpdateAcquirer(acquirer.id, dataToSend);

			if (response?.error) {
				toast('Erro ao atualizar processadora', {
					description: response.error.message || 'Tente novamente mais tarde.',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
				return;
			}

			toast('Processadora atualizada', {
				description: 'As configurações foram salvas com sucesso.',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				variant: 'success',
			});
			setFormData((prev) => ({
				...prev,
				defaultCredentials: sanitizedDefaultCredentials,
				defaultCredentialsSandbox: sanitizedDefaultCredentialsSandbox,
			}));
			setHasDefaultCredentialsOverride(Object.keys(sanitizedDefaultCredentials).length > 0);
			setHasDefaultCredentialsSandboxOverride(Object.keys(sanitizedDefaultCredentialsSandbox).length > 0);
			onRefresh();
		});
	};

	function handleResetSchema() {
		startResetSchemaTransition(async () => {
			const response = await adminResetAcquirerCredentialSchema(acquirer.id);

			if (response?.error) {
				toast('Erro ao resetar schema', {
					description: response.error.message || 'Tente novamente mais tarde.',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
				return;
			}

			const updatedAcquirer = response?.data;
			setCredentialSchema(updatedAcquirer?.credentialSchema ?? []);
			setFormData((prev) => ({
				...prev,
				defaultCredentials: updatedAcquirer?.defaultCredentials ?? {},
				defaultCredentialsSandbox: updatedAcquirer?.defaultCredentialsSandbox ?? {},
			}));
			setHasDefaultCredentialsOverride(updatedAcquirer?.hasDefaultCredentials ?? false);
			setHasDefaultCredentialsSandboxOverride(updatedAcquirer?.hasDefaultCredentialsSandbox ?? false);

			toast('Schema resetado', {
				description: response?.message ?? 'O schema de credenciais foi resetado com sucesso.',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				variant: 'success',
			});
			setIsResetSchemaDialogOpen(false);
			onRefresh();
		});
	}

	const webhookAuthParse = webhookAuthModeParse[acquirer.webhookAuthMode];
	const isPixEnabled = formData.pixEnabled;
	const isBoletoEnabled = formData.boletoEnabled;
	const isCreditCardEnabled = formData.creditCardEnabled;
	const hasAnyEnabledPaymentMethod = isPixEnabled || isBoletoEnabled || isCreditCardEnabled;
	const isWithdrawalEnabled = formData.supportsWithdrawal;
	const pixInFeeModeOption = getFeeChargeModeSelectOption(formData.pixInFeeMode as FeeChargeMode);
	const boletoInFeeModeOption = getFeeChargeModeSelectOption(formData.boletoInFeeMode as FeeChargeMode);
	const creditCardInFeeModeOption = getFeeChargeModeSelectOption(formData.creditCardInFeeMode as FeeChargeMode);
	const payoutFeeModeOption = getFeeChargeModeSelectOption(formData.payoutFeeMode as FeeChargeMode);
	const showPixFixedFeeInput = shouldShowFixedFeeInput(formData.pixInFeeMode as FeeChargeMode);
	const showPixPercentageFeeInput = shouldShowPercentageFeeInput(formData.pixInFeeMode as FeeChargeMode);
	const showBoletoFixedFeeInput = shouldShowFixedFeeInput(formData.boletoInFeeMode as FeeChargeMode);
	const showBoletoPercentageFeeInput = shouldShowPercentageFeeInput(formData.boletoInFeeMode as FeeChargeMode);
	const showCreditCardFixedFeeInput = shouldShowFixedFeeInput(formData.creditCardInFeeMode as FeeChargeMode);
	const showCreditCardPercentageFeeInput = shouldShowPercentageFeeInput(formData.creditCardInFeeMode as FeeChargeMode);
	const showPayoutFixedFeeInput = shouldShowFixedFeeInput(formData.payoutFeeMode as FeeChargeMode);
	const showPayoutPercentageFeeInput = shouldShowPercentageFeeInput(formData.payoutFeeMode as FeeChargeMode);

	if (!canEdit) {
		return (
			<div className="flex flex-col gap-4">
				{acquirer.providerCategory === 'PaymentInstitution' && (
					<div className="flex items-start gap-3 rounded-xl border border-secondary/30 bg-secondary-soft p-4">
						<Icon icon={InformationCircleIcon} className="icon-md text-secondary shrink-0 mt-0.5" />
						<div className="flex flex-col gap-1">
							<span className="text-sm font-medium text-secondary">
								{providerCategoryParse.PaymentInstitution.label}
							</span>
							<p className="text-xs text-secondary/80">
								Esta processadora opera como Instituição de Pagamento (IP). Organizações vinculadas precisam passar por
								cadastro de submerchant (KYC) antes de processar transações.
							</p>
						</div>
					</div>
				)}
				<Accordion defaultExpandedKeys={[]}>
					<Accordion.Item id="status-webhook" className="rounded-xl border border-divider bg-surface">
						<Accordion.Heading>
							<Accordion.Trigger className="flex w-full items-center justify-between px-4 py-3">
								<div className="flex items-center gap-3">
									<div className="flex size-10 items-center justify-center rounded-lg bg-success-soft">
										<Icon icon={Shield} className="icon-md text-success" />
									</div>
									<div className="flex flex-col items-start">
										<span className="font-medium">Status e Webhook</span>
										<span className="text-xs text-success">
											{acquirer.isActive ? 'Ativo' : 'Inativo'} | Auth: {webhookAuthParse.label}
										</span>
									</div>
								</div>
								<Accordion.Indicator>
									<Icon icon={ArrowDown01Icon} className="icon-sm text-muted transition-transform duration-200" />
								</Accordion.Indicator>
							</Accordion.Trigger>
						</Accordion.Heading>
						<Accordion.Panel>
							<Accordion.Body className="flex flex-col gap-4 px-4 pb-4">
								<div className="flex items-center gap-2">
									<label className="text-sm text-muted">Status:</label>
									<Chip variant="soft" color={acquirer.isActive ? 'success' : 'default'} size="sm">
										{acquirer.isActive ? 'Ativo' : 'Inativo'}
									</Chip>
								</div>
								<div className="flex items-center gap-2">
									<label className="text-sm text-muted">Tipos de Operação:</label>
									<div className="flex gap-1">
										{acquirer.operationTypes && acquirer.operationTypes.length > 0 ? (
											acquirer.operationTypes.map((type) => {
												const parsed = acquirerOperationTypeParse[type as AcquirerOperationType];
												return parsed ? (
													<Chip key={type} variant="soft" size="sm" className={`gap-1 ${parsed.className}`}>
														{parsed.icon}
														{parsed.label}
													</Chip>
												) : null;
											})
										) : (
											<span className="text-sm text-muted">—</span>
										)}
									</div>
								</div>
								<div className="flex items-center gap-2">
									<label className="text-sm text-muted">Autoatendimento da organização:</label>
									<Chip variant="soft" color={acquirer.hideFromMerchantNominalSelection ? 'warning' : 'success'} size="sm">
										{acquirer.hideFromMerchantNominalSelection ? 'Nominal oculta' : 'Nominal visível'}
									</Chip>
								</div>
								<Separator />
								<div>
									<label className="text-sm text-muted">Modo de Autenticação</label>
									<div className="mt-1">
										<Chip
											variant="soft"
											color={mapParseColorToChipColor(webhookAuthParse.color)}
											size="sm"
											className="gap-1"
										>
											{webhookAuthParse.icon}
											{webhookAuthParse.label}
										</Chip>
									</div>
								</div>
								<div>
									<label className="text-sm text-muted">Token do Webhook</label>
									<p className="font-medium font-mono">{acquirer.hasWebhookToken ? 'Configurado' : '—'}</p>
								</div>
								<div>
									<label className="text-sm text-muted">IPs Permitidos</label>
									<p className="font-medium">{acquirer.hasWebhookAllowedIps ? 'Configurado' : 'Não configurado'}</p>
								</div>
							</Accordion.Body>
						</Accordion.Panel>
					</Accordion.Item>
				</Accordion>

				{(acquirer.pixEnabled || acquirer.boletoEnabled || acquirer.creditCardEnabled) && (
					<div className="flex flex-col gap-3">
						{acquirer.pixEnabled && (
							<SystemAccordion
								id="pix-compensation-read"
								icon={QrCodeIcon}
								title="PIX"
								color="emerald"
								summary={buildCompensationSummary(acquirer.pixHasCompensation, acquirer.pixCompensationDays)}
							>
								<div className="flex flex-col gap-4">
									<div className="grid gap-4 md:grid-cols-2">
										<div>
											<label className="text-sm text-muted">Compensação em dias</label>
											<p className="font-medium">{acquirer.pixHasCompensation ? 'Ativa' : 'Inativa'}</p>
										</div>
										<div>
											<label className="text-sm text-muted">Prazo</label>
											<p className="font-medium">
												{acquirer.pixHasCompensation ? `${acquirer.pixCompensationDays} dia(s)` : 'Liquidação imediata'}
											</p>
										</div>
									</div>
									<Separator />
									<div className="grid gap-4 md:grid-cols-3">
										<div>
											<label className="text-sm text-muted">Modo da taxa</label>
											<p className="font-medium">{acquirer.pixInFeeMode ? feeChargeModeParse[acquirer.pixInFeeMode].label : '—'}</p>
										</div>
										<div>
											<label className="text-sm text-muted">Taxa fixa</label>
											<p className="font-medium">{centsToFormattedCurrency(acquirer.pixInFeeFixed)}</p>
										</div>
										<div>
											<label className="text-sm text-muted">Taxa percentual</label>
											<p className="font-medium">{basisPointsToPercentage(acquirer.pixInFeePercentage)}%</p>
										</div>
									</div>
									<div className="grid gap-4 md:grid-cols-2">
										<div>
											<label className="text-sm text-muted">Limite mínimo</label>
											<p className="font-medium">{centsToFormattedCurrency(acquirer.minPixAmount)}</p>
										</div>
										<div>
											<label className="text-sm text-muted">Limite máximo</label>
											<p className="font-medium">
												{acquirer.maxPixAmount > 0 ? centsToFormattedCurrency(acquirer.maxPixAmount) : 'Sem limite'}
											</p>
										</div>
									</div>
									<div>
										<label className="text-sm text-muted">Split automático de taxa</label>
										<p className="font-medium">{paymentFeeSplitHandlingParse[acquirer.pixFeeSplitHandling].label}</p>
									</div>
								</div>
							</SystemAccordion>
						)}

						{acquirer.boletoEnabled && (
							<SystemAccordion
								id="boleto-compensation-read"
								icon={BarCodeIcon}
								title="Boleto"
								color="warning"
								summary={buildCompensationSummary(acquirer.boletoHasCompensation, acquirer.boletoCompensationDays)}
							>
								<div className="flex flex-col gap-4">
									<div className="grid gap-4 md:grid-cols-2">
										<div>
											<label className="text-sm text-muted">Compensação em dias</label>
											<p className="font-medium">{acquirer.boletoHasCompensation ? 'Ativa' : 'Inativa'}</p>
										</div>
										<div>
											<label className="text-sm text-muted">Prazo</label>
											<p className="font-medium">
												{acquirer.boletoHasCompensation ? `${acquirer.boletoCompensationDays} dia(s)` : 'Liquidação imediata'}
											</p>
										</div>
									</div>
									<Separator />
									<div className="grid gap-4 md:grid-cols-3">
										<div>
											<label className="text-sm text-muted">Modo da taxa</label>
											<p className="font-medium">{acquirer.boletoInFeeMode ? feeChargeModeParse[acquirer.boletoInFeeMode].label : '—'}</p>
										</div>
										<div>
											<label className="text-sm text-muted">Taxa fixa</label>
											<p className="font-medium">{centsToFormattedCurrency(acquirer.boletoInFeeFixed)}</p>
										</div>
										<div>
											<label className="text-sm text-muted">Taxa percentual</label>
											<p className="font-medium">{basisPointsToPercentage(acquirer.boletoInFeePercentage)}%</p>
										</div>
									</div>
									<div className="grid gap-4 md:grid-cols-2">
										<div>
											<label className="text-sm text-muted">Limite mínimo</label>
											<p className="font-medium">{centsToFormattedCurrency(acquirer.minBoletoAmount)}</p>
										</div>
										<div>
											<label className="text-sm text-muted">Limite máximo</label>
											<p className="font-medium">
												{acquirer.maxBoletoAmount > 0 ? centsToFormattedCurrency(acquirer.maxBoletoAmount) : 'Sem limite'}
											</p>
										</div>
									</div>
									<div>
										<label className="text-sm text-muted">Split automático de taxa</label>
										<p className="font-medium">{paymentFeeSplitHandlingParse[acquirer.boletoFeeSplitHandling].label}</p>
									</div>
								</div>
							</SystemAccordion>
						)}

						{acquirer.creditCardEnabled && (
							<SystemAccordion
								id="credit-card-compensation-read"
								icon={CreditCardIcon}
								title="Cartão"
								color="accent"
								summary={buildCompensationSummary(acquirer.creditCardHasCompensation, acquirer.creditCardCompensationDays)}
							>
								<div className="flex flex-col gap-4">
									<div className="grid gap-4 md:grid-cols-2">
										<div>
											<label className="text-sm text-muted">Compensação em dias</label>
											<p className="font-medium">{acquirer.creditCardHasCompensation ? 'Ativa' : 'Inativa'}</p>
										</div>
										<div>
											<label className="text-sm text-muted">Prazo</label>
											<p className="font-medium">
												{acquirer.creditCardHasCompensation
													? `${acquirer.creditCardCompensationDays} dia(s)`
													: 'Liquidação imediata'}
											</p>
										</div>
									</div>
									<Separator />
									<div className="grid gap-4 md:grid-cols-2">
										<div>
											<label className="text-sm text-muted">Modo da taxa</label>
											<p className="font-medium">{acquirer.creditCardInFeeMode ? feeChargeModeParse[acquirer.creditCardInFeeMode].label : '—'}</p>
										</div>
										<div>
											<label className="text-sm text-muted">Taxa fixa</label>
											<p className="font-medium">{centsToFormattedCurrency(acquirer.creditCardInFeeFixed)}</p>
										</div>
										<div>
											<label className="text-sm text-muted">Taxa percentual</label>
											<p className="font-medium">{basisPointsToPercentage(acquirer.creditCardInFeePercentage)}%</p>
										</div>
									</div>
									<div className="grid gap-4 md:grid-cols-2">
										<div>
											<label className="text-sm text-muted">Limite mínimo</label>
											<p className="font-medium">{centsToFormattedCurrency(acquirer.minCreditCardAmount)}</p>
										</div>
										<div>
											<label className="text-sm text-muted">Limite máximo</label>
											<p className="font-medium">
												{acquirer.maxCreditCardAmount > 0
													? centsToFormattedCurrency(acquirer.maxCreditCardAmount)
													: 'Sem limite'}
											</p>
										</div>
									</div>
									<div>
										<label className="text-sm text-muted">Split automático de taxa</label>
										<p className="font-medium">{paymentFeeSplitHandlingParse[acquirer.creditCardFeeSplitHandling].label}</p>
									</div>
								</div>
							</SystemAccordion>
						)}
					</div>
				)}

				<CredentialEnvironmentSection
					id="creds-production"
					title="Credenciais de Produção"
					icon={<Icon icon={Server} className="icon-md text-secondary" />}
					iconBgClassName="bg-secondary-soft"
					summaryText={effectiveHasDefaultCredentials ? 'Configurado' : 'Não configurado'}
					apiUrl={acquirer.apiBaseUrlProduction}
					schema={acquirer.credentialSchema}
					hasCredentials={acquirer.hasDefaultCredentials}
				/>

				<CredentialEnvironmentSection
					id="creds-sandbox"
					title="Credenciais de Sandbox"
					icon={<Icon icon={Server} className="icon-md text-warning" />}
					iconBgClassName="bg-warning-soft"
					summaryText={acquirer.hasDefaultCredentialsSandbox ? 'Configurado' : 'Não configurado'}
					apiUrl={acquirer.apiBaseUrlSandbox}
					schema={acquirer.credentialSchema}
					hasCredentials={acquirer.hasDefaultCredentialsSandbox}
				/>

				<Accordion defaultExpandedKeys={[]}>
					<Accordion.Item id="fees" className="rounded-xl border border-divider bg-surface">
						<Accordion.Heading>
							<Accordion.Trigger className="flex w-full items-center justify-between px-4 py-3">
								<div className="flex items-center gap-3">
									<div className="flex size-10 items-center justify-center rounded-lg bg-warning-soft">
										<Icon icon={Tag} className="icon-md text-warning" />
									</div>
									<div className="flex flex-col items-start">
										<span className="font-medium">Configuração de Saque (Payout)</span>
										<span className="text-xs text-warning">Taxas e limites de saque da processadora</span>
									</div>
								</div>
								<Accordion.Indicator>
									<Icon icon={ArrowDown01Icon} className="icon-sm text-muted transition-transform duration-200" />
								</Accordion.Indicator>
							</Accordion.Trigger>
						</Accordion.Heading>
						<Accordion.Panel>
							<Accordion.Body className="flex flex-col gap-6 px-4 pb-4">
								<div>
									<h3 className="text-sm font-semibold mb-4">Taxa de Saque (Payout)</h3>
									<div className="grid gap-4 md:grid-cols-3">
										<div>
											<label className="text-sm text-muted">Modo de Cobrança</label>
											<p className="font-medium">
												{acquirer.payoutFeeMode ? feeChargeModeParse[acquirer.payoutFeeMode].label : '—'}
											</p>
										</div>
										<div>
											<label className="text-sm text-muted">Taxa Fixa</label>
											<p className="font-medium">
												{acquirer.payoutFeeFixed != null ? centsToFormattedCurrency(acquirer.payoutFeeFixed) : '—'}
											</p>
										</div>
										<div>
											<label className="text-sm text-muted">Taxa Percentual</label>
											<p className="font-medium">
												{acquirer.payoutFeePercentage != null
													? `${basisPointsToPercentage(acquirer.payoutFeePercentage)}%`
													: '—'}
											</p>
										</div>
									</div>
								</div>

								<Separator />

								<div>
									<div className="flex items-center gap-2 text-xs text-foreground/60 mb-3">
										<Chip variant="soft" color="success" size="sm">
											Saque
										</Chip>
										<span>Limites para saques (payout)</span>
									</div>
									{acquirer.supportsWithdrawal ? (
										<div className="grid gap-4 md:grid-cols-2">
											<div>
												<label className="text-sm text-muted">Valor Mínimo</label>
												<p className="font-medium">{centsToFormattedCurrency(acquirer.minPayoutAmount)}</p>
											</div>
											<div>
												<label className="text-sm text-muted">Valor Máximo</label>
												<p className="font-medium">
													{acquirer.maxPayoutAmount > 0
														? centsToFormattedCurrency(acquirer.maxPayoutAmount)
														: 'Sem limite'}
												</p>
											</div>
										</div>
									) : (
										<p className="text-xs text-muted">Saque (payout) não suportado para esta processadora.</p>
									)}
								</div>
							</Accordion.Body>
						</Accordion.Panel>
					</Accordion.Item>
				</Accordion>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			{acquirer.providerCategory === 'PaymentInstitution' && (
				<div className="flex items-start gap-3 rounded-xl border border-secondary/30 bg-secondary-soft p-4">
					<Icon icon={InformationCircleIcon} className="icon-md text-secondary shrink-0 mt-0.5" />
					<div className="flex flex-col gap-1">
						<span className="text-sm font-medium text-secondary">
							{providerCategoryParse.PaymentInstitution.label}
						</span>
						<p className="text-xs text-secondary/80">
							Esta processadora opera como Instituição de Pagamento (IP). Organizações vinculadas precisam passar por
							cadastro de submerchant (KYC) antes de processar transações.
						</p>
					</div>
				</div>
			)}
			<Accordion defaultExpandedKeys={[]}>
				<Accordion.Item id="status-edit" className="rounded-xl border border-divider bg-surface">
					<Accordion.Heading>
						<Accordion.Trigger className="flex w-full items-center justify-between px-4 py-3">
							<div className="flex items-center gap-3">
								<div className="flex size-10 items-center justify-center rounded-lg bg-success-soft">
									<Icon icon={Shield} className="icon-md text-success" />
								</div>
								<div className="flex flex-col items-start">
									<span className="font-medium">Status e Capacidades</span>
									<span className="text-xs text-success">
										{formData.isActive ? 'Ativo' : 'Inativo'} |{' '}
										{formData.operationTypes.map((t) => acquirerOperationTypeParse[t].label).join(', ')}
									</span>
								</div>
							</div>
							<Accordion.Indicator>
								<Icon icon={ArrowDown01Icon} className="icon-sm text-muted transition-transform duration-200" />
							</Accordion.Indicator>
						</Accordion.Trigger>
					</Accordion.Heading>
					<Accordion.Panel>
						<Accordion.Body className="flex flex-col gap-4 p-4">
							<Switch
								isSelected={formData.isActive}
								onChange={(isSelected) => setFormData((prev) => ({ ...prev, isActive: isSelected }))}
							>
								<Switch.Control>
									<Switch.Thumb />
								</Switch.Control>
								<Label className="text-sm">Status Ativo</Label>
							</Switch>

							<Switch
								isSelected={formData.hideFromMerchantNominalSelection}
								onChange={(isSelected) =>
									setFormData((prev) => ({ ...prev, hideFromMerchantNominalSelection: isSelected }))
								}
							>
								<Switch.Control>
									<Switch.Thumb />
								</Switch.Control>
								<Label className="text-sm">Ocultar nominal no autoatendimento da organização</Label>
							</Switch>

							<TextField variant="secondary">
								<Label>Nome de Exibição</Label>
								<Input variant="secondary"
									value={formData.displayName}
									onChange={(e) => setFormData((prev) => ({ ...prev, displayName: e.target.value }))}
									placeholder={`Ex: ${acquirer.name} Black`}
								/>
								<p className="text-xs text-foreground/60 mt-1">
									Nome alternativo para identificar esta processadora. Se vazio, será usado o nome padrão.
								</p>
							</TextField>

							<ImageUploader
								isAdmin
								folder={UploadFolder.Acquirers}
								label="Logo"
								description="PNG transparente recomendado"
								maxFiles={1}
								value={formData.logoUrl ? [formData.logoUrl] : []}
								onChange={(urls) => setFormData((prev) => ({ ...prev, logoUrl: urls[0] || '' }))}
								itemWidth="w-32"
								itemHeight="h-32"
								objectFit="contain"
							/>

							<TextField variant="secondary">
								<Label>Nominal</Label>
								<Input variant="secondary"
									value={formData.nominal}
									onChange={(e) => setFormData((prev) => ({ ...prev, nominal: e.target.value }))}
									placeholder="Ex: 10250"
								/>
								<p className="text-xs text-foreground/60 mt-1">
									Identificador nominal desta processadora. Texto livre para identificação interna.
								</p>
							</TextField>

							<div>
								<Label className="mb-2 block">Tipos de Operação</Label>
								<p className="text-xs text-foreground/60 mb-3">
									Selecione um ou mais tipos de operação suportados por esta processadora
								</p>
								<div className="flex gap-2">
									{Object.entries(acquirerOperationTypeParse).map(([key, value]) => {
										const isSelected = formData.operationTypes.includes(key as AcquirerOperationType);
										return (
											<button
												key={key}
												type="button"
												onClick={() => {
													setFormData((prev) => {
														const currentTypes = prev.operationTypes;
														if (currentTypes.includes(key as AcquirerOperationType)) {
															if (currentTypes.length === 1) return prev;
															return { ...prev, operationTypes: currentTypes.filter((t) => t !== key) };
														}
														return { ...prev, operationTypes: [...currentTypes, key as AcquirerOperationType] };
													});
												}}
												className={`flex items-center gap-2 rounded-lg border-2 px-4 py-2.5 transition-all cursor-pointer ${
													isSelected ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50'
												}`}
											>
												<Chip variant="soft" size="sm" className={`gap-1 ${value.className}`}>
													{value.icon}
													{value.label}
												</Chip>
											</button>
										);
									})}
								</div>
							</div>

							<div>
								<Label className="mb-2 block">Funcionalidades</Label>
								<p className="text-xs text-foreground/60 mb-3">
									Quais funcionalidades esta processadora suporta e estão habilitadas
								</p>
								<div className="flex flex-col gap-3">
									<Switch
										isSelected={formData.supportsPix}
										onChange={(isSelected) =>
											setFormData((prev) => ({
												...prev,
												supportsPix: isSelected,
												pixEnabled: isSelected,
											}))
										}
									>
										<Switch.Control>
											<Switch.Thumb />
										</Switch.Control>
										<Label className="text-sm">PIX</Label>
									</Switch>
									<Switch
										isSelected={formData.supportsBoleto}
										onChange={(isSelected) =>
											setFormData((prev) => ({
												...prev,
												supportsBoleto: isSelected,
												boletoEnabled: isSelected,
											}))
										}
									>
										<Switch.Control>
											<Switch.Thumb />
										</Switch.Control>
										<Label className="text-sm">Boleto</Label>
									</Switch>
									<Switch
										isSelected={formData.supportsCreditCard}
										onChange={(isSelected) =>
											setFormData((prev) => ({
												...prev,
												supportsCreditCard: isSelected,
												creditCardEnabled: isSelected,
											}))
										}
									>
										<Switch.Control>
											<Switch.Thumb />
										</Switch.Control>
										<Label className="text-sm">Cartão de Crédito</Label>
									</Switch>
									<Switch
										isSelected={formData.supportsWithdrawal}
										onChange={(isSelected) => setFormData((prev) => ({ ...prev, supportsWithdrawal: isSelected }))}
									>
										<Switch.Control>
											<Switch.Thumb />
										</Switch.Control>
										<Label className="text-sm">Saque (PIX Out)</Label>
									</Switch>
								</div>
							</div>
						</Accordion.Body>
					</Accordion.Panel>
				</Accordion.Item>
			</Accordion>

			{hasAnyEnabledPaymentMethod && (
				<div className="flex flex-col gap-3">
					{isPixEnabled && (
						<SystemAccordion
							id="pix-compensation-edit"
							icon={QrCodeIcon}
							title="PIX"
							color="emerald"
							summary={buildCompensationSummary(formData.pixHasCompensation, formData.pixCompensationDays)}
						>
							<div className="flex flex-col gap-4">
								<div className="flex items-center justify-between rounded-lg border border-border bg-content1 p-2.5">
									<div className="flex flex-col gap-0.5">
										<span className="text-sm font-medium text-white">Compensação em dias</span>
										<span className="text-xs text-muted">Liquidação D+X no PIX</span>
									</div>
									<Switch
										isSelected={formData.pixHasCompensation}
										onChange={(isSelected) =>
											setFormData((prev) => ({
												...prev,
												pixHasCompensation: isSelected,
												pixCompensationDays: isSelected ? Math.max(1, prev.pixCompensationDays || 1) : 0,
											}))
										}
									>
										<Switch.Control>
											<Switch.Thumb />
										</Switch.Control>
									</Switch>
								</div>
								{formData.pixHasCompensation && (
									<div className="flex flex-col gap-2 md:max-w-48">
										<Label htmlFor="pixCompensationDays">Dias</Label>
										<Input
											variant="secondary"
											id="pixCompensationDays"
											type="number"
											min={1}
											value={String(formData.pixCompensationDays || 1)}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													pixCompensationDays: Math.max(1, Number(e.target.value || 1)),
												}))
											}
											placeholder="1"
										/>
									</div>
								)}
								<Separator />
								<div className={getFeeInputGridClass(showPixFixedFeeInput, showPixPercentageFeeInput)}>
									<Select
										variant="secondary"
										value={formData.pixInFeeMode}
										onChange={(key) => setFormData((prev) => ({ ...prev, pixInFeeMode: key as FeeChargeMode }))}
									>
										<Label>Modo da taxa Pix</Label>
										<Select.Trigger>
											<Select.Value>
												<Chip
													variant="soft"
													color={pixInFeeModeOption.color}
													className="gap-1"
												>
													{pixInFeeModeOption.icon}
													{pixInFeeModeOption.label}
												</Chip>
											</Select.Value>
											<Select.Indicator />
										</Select.Trigger>
										<Select.Popover>
											<ListBox>
												{feeChargeModeSelectOptions.map((option) => (
													<ListBox.Item key={option.key} id={option.key} textValue={option.label}>
														<Chip variant="soft" color={option.color} className="gap-1">
															{option.icon}
															{option.label}
														</Chip>
														<ListBox.ItemIndicator />
													</ListBox.Item>
												))}
											</ListBox>
										</Select.Popover>
									</Select>
									{showPixFixedFeeInput && (
										<TextField variant="secondary" name="pixInFeeFixed" isDisabled={formData.pixInFeeMode === 'PercentageOnly'}>
											<Label>Taxa fixa (R$)</Label>
											<CurrencyCentsInput
												variant="secondary"
												initialValueInCents={acquirer.pixInFeeFixed ?? undefined}
												placeholder="0,00"
												disabled={formData.pixInFeeMode === 'PercentageOnly'}
												onValueChange={(v) => setFormData((prev) => ({ ...prev, pixInFeeFixed: v }))}
											/>
										</TextField>
									)}
									{showPixPercentageFeeInput && (
										<TextField variant="secondary" name="pixInFeePercentage" isDisabled={formData.pixInFeeMode === 'FixedOnly'}>
											<Label>Taxa percentual (%)</Label>
											<NumericFormat
												customInput={Input}
												{...percentageFormatProps}
												value={formData.pixInFeePercentage}
												onValueChange={(values) => setFormData((prev) => ({ ...prev, pixInFeePercentage: values.value }))}
												placeholder="0,00"
												disabled={formData.pixInFeeMode === 'FixedOnly'}
											/>
										</TextField>
									)}
								</div>
								<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
									<TextField variant="secondary" name="minPixAmount">
										<Label>Limite mínimo (R$)</Label>
										<CurrencyCentsInput
											variant="secondary"
											initialValueInCents={acquirer.minPixAmount ?? undefined}
											placeholder="0,00"
											onValueChange={(v) => setFormData((prev) => ({ ...prev, minPixAmount: v }))}
										/>
									</TextField>
									<TextField variant="secondary" name="maxPixAmount">
										<Label>Limite máximo (R$)</Label>
										<CurrencyCentsInput
											variant="secondary"
											initialValueInCents={acquirer.maxPixAmount ?? undefined}
											placeholder="0,00"
											onValueChange={(v) => setFormData((prev) => ({ ...prev, maxPixAmount: v }))}
										/>
									</TextField>
								</div>
								<Select
									variant="secondary"
									value={formData.pixFeeSplitHandling}
									onChange={(key) => setFormData((prev) => ({ ...prev, pixFeeSplitHandling: key as PaymentFeeSplitHandling }))}
								>
									<Label>Split automático da taxa PIX</Label>
									<Select.Trigger>
										<Select.Value>{paymentFeeSplitHandlingParse[formData.pixFeeSplitHandling as PaymentFeeSplitHandling]?.label}</Select.Value>
										<Select.Indicator />
									</Select.Trigger>
									<Select.Popover>
										<ListBox>
											{Object.entries(paymentFeeSplitHandlingParse).map(([key, value]) => (
												<ListBox.Item key={key} id={key} textValue={value.label}>
													<Chip variant="soft" color={mapParseColorToChipColor(value.color)} className="gap-1">
														{value.label}
													</Chip>
													<ListBox.ItemIndicator />
												</ListBox.Item>
											))}
										</ListBox>
									</Select.Popover>
								</Select>
							</div>
						</SystemAccordion>
					)}

					{isBoletoEnabled && (
						<SystemAccordion
							id="boleto-compensation-edit"
							icon={BarCodeIcon}
							title="Boleto"
							color="warning"
							summary={buildCompensationSummary(formData.boletoHasCompensation, formData.boletoCompensationDays)}
						>
							<div className="flex flex-col gap-4">
								<div className="flex items-center justify-between rounded-lg border border-border bg-content1 p-2.5">
									<div className="flex flex-col gap-0.5">
										<span className="text-sm font-medium text-white">Compensação em dias</span>
										<span className="text-xs text-muted">Liquidação D+X no boleto</span>
									</div>
									<Switch
										isSelected={formData.boletoHasCompensation}
										onChange={(isSelected) =>
											setFormData((prev) => ({
												...prev,
												boletoHasCompensation: isSelected,
												boletoCompensationDays: isSelected ? Math.max(1, prev.boletoCompensationDays || 1) : 0,
											}))
										}
									>
										<Switch.Control>
											<Switch.Thumb />
										</Switch.Control>
									</Switch>
								</div>
								{formData.boletoHasCompensation && (
									<div className="flex flex-col gap-2 md:max-w-48">
										<Label htmlFor="boletoCompensationDays">Dias</Label>
										<Input
											variant="secondary"
											id="boletoCompensationDays"
											type="number"
											min={1}
											value={String(formData.boletoCompensationDays || 1)}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													boletoCompensationDays: Math.max(1, Number(e.target.value || 1)),
												}))
											}
											placeholder="1"
										/>
									</div>
								)}
								<Separator />
								<div className={getFeeInputGridClass(showBoletoFixedFeeInput, showBoletoPercentageFeeInput)}>
									<Select
										variant="secondary"
										value={formData.boletoInFeeMode}
										onChange={(key) => setFormData((prev) => ({ ...prev, boletoInFeeMode: key as FeeChargeMode }))}
									>
										<Label>Modo da taxa Boleto</Label>
										<Select.Trigger>
											<Select.Value>
												<Chip
													variant="soft"
													color={boletoInFeeModeOption.color}
													className="gap-1"
												>
													{boletoInFeeModeOption.icon}
													{boletoInFeeModeOption.label}
												</Chip>
											</Select.Value>
											<Select.Indicator />
										</Select.Trigger>
										<Select.Popover>
											<ListBox>
												{feeChargeModeSelectOptions.map((option) => (
													<ListBox.Item key={option.key} id={option.key} textValue={option.label}>
														<Chip variant="soft" color={option.color} className="gap-1">
															{option.icon}
															{option.label}
														</Chip>
														<ListBox.ItemIndicator />
													</ListBox.Item>
												))}
											</ListBox>
										</Select.Popover>
									</Select>
									{showBoletoFixedFeeInput && (
										<TextField variant="secondary" name="boletoInFeeFixed" isDisabled={formData.boletoInFeeMode === 'PercentageOnly'}>
											<Label>Taxa fixa (R$)</Label>
											<CurrencyCentsInput
												variant="secondary"
												initialValueInCents={acquirer.boletoInFeeFixed ?? undefined}
												placeholder="0,00"
												disabled={formData.boletoInFeeMode === 'PercentageOnly'}
												onValueChange={(v) => setFormData((prev) => ({ ...prev, boletoInFeeFixed: v }))}
											/>
										</TextField>
									)}
									{showBoletoPercentageFeeInput && (
										<TextField variant="secondary" name="boletoInFeePercentage" isDisabled={formData.boletoInFeeMode === 'FixedOnly'}>
											<Label>Taxa percentual (%)</Label>
											<NumericFormat
												customInput={Input}
												{...percentageFormatProps}
												value={formData.boletoInFeePercentage}
												onValueChange={(values) => setFormData((prev) => ({ ...prev, boletoInFeePercentage: values.value }))}
												placeholder="0,00"
												disabled={formData.boletoInFeeMode === 'FixedOnly'}
											/>
										</TextField>
									)}
								</div>
								<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
									<TextField variant="secondary" name="minBoletoAmount">
										<Label>Limite mínimo (R$)</Label>
										<CurrencyCentsInput
											variant="secondary"
											initialValueInCents={acquirer.minBoletoAmount ?? undefined}
											placeholder="0,00"
											onValueChange={(v) => setFormData((prev) => ({ ...prev, minBoletoAmount: v }))}
										/>
									</TextField>
									<TextField variant="secondary" name="maxBoletoAmount">
										<Label>Limite máximo (R$)</Label>
										<CurrencyCentsInput
											variant="secondary"
											initialValueInCents={acquirer.maxBoletoAmount ?? undefined}
											placeholder="0,00"
											onValueChange={(v) => setFormData((prev) => ({ ...prev, maxBoletoAmount: v }))}
										/>
									</TextField>
								</div>
								<Select
									variant="secondary"
									value={formData.boletoFeeSplitHandling}
									onChange={(key) => setFormData((prev) => ({ ...prev, boletoFeeSplitHandling: key as PaymentFeeSplitHandling }))}
								>
									<Label>Split automático da taxa Boleto</Label>
									<Select.Trigger>
										<Select.Value>{paymentFeeSplitHandlingParse[formData.boletoFeeSplitHandling as PaymentFeeSplitHandling]?.label}</Select.Value>
										<Select.Indicator />
									</Select.Trigger>
									<Select.Popover>
										<ListBox>
											{Object.entries(paymentFeeSplitHandlingParse).map(([key, value]) => (
												<ListBox.Item key={key} id={key} textValue={value.label}>
													<Chip variant="soft" color={mapParseColorToChipColor(value.color)} className="gap-1">
														{value.label}
													</Chip>
													<ListBox.ItemIndicator />
												</ListBox.Item>
											))}
										</ListBox>
									</Select.Popover>
								</Select>
							</div>
						</SystemAccordion>
					)}

					{isCreditCardEnabled && (
						<SystemAccordion
							id="credit-card-compensation-edit"
							icon={CreditCardIcon}
							title="Cartão"
							color="accent"
							summary={buildCompensationSummary(formData.creditCardHasCompensation, formData.creditCardCompensationDays)}
						>
							<div className="flex flex-col gap-4">
								<div className="flex items-center justify-between rounded-lg border border-border bg-content1 p-2.5">
									<div className="flex flex-col gap-0.5">
										<span className="text-sm font-medium text-white">Compensação em dias</span>
										<span className="text-xs text-muted">Liquidação D+X no cartão</span>
									</div>
									<Switch
										isSelected={formData.creditCardHasCompensation}
										onChange={(isSelected) =>
											setFormData((prev) => ({
												...prev,
												creditCardHasCompensation: isSelected,
												creditCardCompensationDays: isSelected
													? Math.max(1, prev.creditCardCompensationDays || 1)
													: 0,
											}))
										}
									>
										<Switch.Control>
											<Switch.Thumb />
										</Switch.Control>
									</Switch>
								</div>
								{formData.creditCardHasCompensation && (
									<div className="flex flex-col gap-2 md:max-w-48">
										<Label htmlFor="creditCardCompensationDays">Dias</Label>
										<Input
											variant="secondary"
											id="creditCardCompensationDays"
											type="number"
											min={1}
											value={String(formData.creditCardCompensationDays || 1)}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													creditCardCompensationDays: Math.max(1, Number(e.target.value || 1)),
												}))
											}
											placeholder="1"
										/>
									</div>
								)}
								<Separator />
								<div className={getFeeInputGridClass(showCreditCardFixedFeeInput, showCreditCardPercentageFeeInput)}>
									<Select
										variant="secondary"
										value={formData.creditCardInFeeMode}
										onChange={(key) => setFormData((prev) => ({ ...prev, creditCardInFeeMode: key as FeeChargeMode }))}
									>
										<Label>Modo da taxa Cartão</Label>
										<Select.Trigger>
											<Select.Value>
												<Chip
													variant="soft"
													color={creditCardInFeeModeOption.color}
													className="gap-1"
												>
													{creditCardInFeeModeOption.icon}
													{creditCardInFeeModeOption.label}
												</Chip>
											</Select.Value>
											<Select.Indicator />
										</Select.Trigger>
										<Select.Popover>
											<ListBox>
												{feeChargeModeSelectOptions.map((option) => (
													<ListBox.Item key={option.key} id={option.key} textValue={option.label}>
														<Chip variant="soft" color={option.color} className="gap-1">
															{option.icon}
															{option.label}
														</Chip>
														<ListBox.ItemIndicator />
													</ListBox.Item>
												))}
											</ListBox>
										</Select.Popover>
									</Select>
									{showCreditCardFixedFeeInput && (
										<TextField variant="secondary" name="creditCardInFeeFixed" isDisabled={formData.creditCardInFeeMode === 'PercentageOnly'}>
											<Label>Taxa fixa (R$)</Label>
											<CurrencyCentsInput
												variant="secondary"
												initialValueInCents={acquirer.creditCardInFeeFixed ?? undefined}
												placeholder="0,00"
												disabled={formData.creditCardInFeeMode === 'PercentageOnly'}
												onValueChange={(v) => setFormData((prev) => ({ ...prev, creditCardInFeeFixed: v }))}
											/>
										</TextField>
									)}
									{showCreditCardPercentageFeeInput && (
										<TextField variant="secondary" name="creditCardInFeePercentage" isDisabled={formData.creditCardInFeeMode === 'FixedOnly'}>
											<Label>Taxa percentual (%)</Label>
											<NumericFormat
												customInput={Input}
												{...percentageFormatProps}
												value={formData.creditCardInFeePercentage}
												onValueChange={(values) => setFormData((prev) => ({ ...prev, creditCardInFeePercentage: values.value }))}
												placeholder="0,00"
												disabled={formData.creditCardInFeeMode === 'FixedOnly'}
											/>
										</TextField>
									)}
								</div>
								<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
									<TextField variant="secondary" name="minCreditCardAmount">
										<Label>Limite mínimo (R$)</Label>
										<CurrencyCentsInput
											variant="secondary"
											initialValueInCents={acquirer.minCreditCardAmount ?? undefined}
											placeholder="0,00"
											onValueChange={(v) => setFormData((prev) => ({ ...prev, minCreditCardAmount: v }))}
										/>
									</TextField>
									<TextField variant="secondary" name="maxCreditCardAmount">
										<Label>Limite máximo (R$)</Label>
										<CurrencyCentsInput
											variant="secondary"
											initialValueInCents={acquirer.maxCreditCardAmount ?? undefined}
											placeholder="0,00"
											onValueChange={(v) => setFormData((prev) => ({ ...prev, maxCreditCardAmount: v }))}
										/>
									</TextField>
								</div>
								<Select
									variant="secondary"
									value={formData.creditCardFeeSplitHandling}
									onChange={(key) =>
										setFormData((prev) => ({ ...prev, creditCardFeeSplitHandling: key as PaymentFeeSplitHandling }))
									}
								>
									<Label>Split automático da taxa Cartão</Label>
									<Select.Trigger>
										<Select.Value>
											{paymentFeeSplitHandlingParse[formData.creditCardFeeSplitHandling as PaymentFeeSplitHandling]?.label}
										</Select.Value>
										<Select.Indicator />
									</Select.Trigger>
									<Select.Popover>
										<ListBox>
											{Object.entries(paymentFeeSplitHandlingParse).map(([key, value]) => (
												<ListBox.Item key={key} id={key} textValue={value.label}>
													<Chip variant="soft" color={mapParseColorToChipColor(value.color)} className="gap-1">
														{value.label}
													</Chip>
													<ListBox.ItemIndicator />
												</ListBox.Item>
											))}
										</ListBox>
									</Select.Popover>
								</Select>
							</div>
						</SystemAccordion>
					)}
				</div>
			)}

			<Accordion defaultExpandedKeys={[]}>
				<Accordion.Item id="fees-edit" className="rounded-xl border border-divider bg-surface">
					<Accordion.Heading>
						<Accordion.Trigger className="flex w-full items-center justify-between px-4 py-3">
							<div className="flex items-center gap-3">
								<div className="flex size-10 items-center justify-center rounded-lg bg-warning-soft">
									<Icon icon={Tag} className="icon-md text-warning" />
								</div>
								<div className="flex flex-col items-start">
									<span className="font-medium">Configuração de Saque</span>
									<span className="text-xs text-warning">
										{buildFeeSummary({
											creditCardPercentage: formData.creditCardInFeePercentage,
											creditCardFixed: formData.creditCardInFeeFixed,
											creditCardMode: formData.creditCardInFeeMode,
											payoutPercentage: formData.payoutFeePercentage,
											payoutFixed: formData.payoutFeeFixed,
											payoutMode: formData.payoutFeeMode,
										})}
									</span>
								</div>
							</div>
							<Accordion.Indicator>
								<Icon icon={ArrowDown01Icon} className="icon-sm text-muted transition-transform duration-200" />
							</Accordion.Indicator>
						</Accordion.Trigger>
					</Accordion.Heading>
					<Accordion.Panel>
						<Accordion.Body className="flex flex-col gap-4 p-4">
							<div>
								<div className="flex items-center gap-2 text-xs text-foreground/60 mb-4">
									<Chip variant="soft" color="success" size="sm">
										Payout
									</Chip>
									<span>Taxa de saque/transferência</span>
								</div>
								<div className={getFeeInputGridClass(showPayoutFixedFeeInput, showPayoutPercentageFeeInput)}>
									<Select
										variant="secondary"
										value={formData.payoutFeeMode}
										onChange={(key) => setFormData((prev) => ({ ...prev, payoutFeeMode: key as FeeChargeMode }))}
									>
										<Label>Modo de Cobrança</Label>
										<Select.Trigger>
											<Select.Value>
												<Chip
													variant="soft"
													color={payoutFeeModeOption.color}
													className="gap-1"
												>
													{payoutFeeModeOption.icon}
													{payoutFeeModeOption.label}
												</Chip>
											</Select.Value>
											<Select.Indicator />
										</Select.Trigger>
										<Select.Popover>
											<ListBox>
												{feeChargeModeSelectOptions.map((option) => (
													<ListBox.Item key={option.key} id={option.key} textValue={option.label}>
														<Chip variant="soft" color={option.color} className="gap-1">
															{option.icon}
															{option.label}
														</Chip>
														<ListBox.ItemIndicator />
													</ListBox.Item>
												))}
											</ListBox>
										</Select.Popover>
									</Select>
									{showPayoutFixedFeeInput && (
										<TextField
											variant="secondary"
											name="payoutFeeFixed"
											isDisabled={formData.payoutFeeMode === 'PercentageOnly'}
											validate={() => {
												const cents = formattedCurrencyToCents(formData.payoutFeeFixed);
												if (cents !== null && cents < 0) {
													return 'O valor não pode ser negativo';
												}
												return null;
											}}
										>
											<Label>Valor Fixo (R$)</Label>
											<CurrencyCentsInput
												variant="secondary"
												initialValueInCents={acquirer.payoutFeeFixed ?? undefined}
												placeholder="0,00"
												disabled={formData.payoutFeeMode === 'PercentageOnly'}
												onValueChange={(v) => setFormData((prev) => ({ ...prev, payoutFeeFixed: v }))}
											/>
											<FieldError />
										</TextField>
									)}
									{showPayoutPercentageFeeInput && (
										<TextField
											variant="secondary"
											name="payoutFeePercentage"
											value={formData.payoutFeePercentage ?? ''}
											isDisabled={formData.payoutFeeMode === 'FixedOnly'}
											validate={() => {
												const basisPoints = percentageToBasisPoints(formData.payoutFeePercentage);
												if (basisPoints !== null && (basisPoints < 0 || basisPoints > 10000)) {
													return 'O percentual deve estar entre 0% e 100%';
												}
												return null;
											}}
										>
											<Label>Percentual (%)</Label>
											<NumericFormat
												customInput={Input}
												{...percentageFormatProps}
												value={formData.payoutFeePercentage}
												onValueChange={(values) =>
													setFormData((prev) => ({ ...prev, payoutFeePercentage: values.value }))
												}
												placeholder="0,00"
												disabled={formData.payoutFeeMode === 'FixedOnly'}
											/>
											<FieldError />
										</TextField>
									)}
								</div>

								<div className="mt-4">
									<Select
										variant="secondary"
										value={formData.payoutFeeHandling}
										onChange={(key) =>
											setFormData((prev) => ({ ...prev, payoutFeeHandling: key as PayoutFeeHandling }))
										}
									>
										<Label>Tratamento da Taxa de Saque</Label>
										<Select.Trigger>
											<Select.Value>
												{payoutFeeHandlingParse[formData.payoutFeeHandling as PayoutFeeHandling]?.label}
											</Select.Value>
											<Select.Indicator />
										</Select.Trigger>
										<Select.Popover>
											<ListBox>
												{Object.entries(payoutFeeHandlingParse).map(([key, value]) => (
													<ListBox.Item key={key} id={key} textValue={value.label}>
														<Chip variant="soft" color={mapParseColorToChipColor(value.color)} className="gap-1">
															{value.label}
														</Chip>
														<p className="text-xs text-muted mt-1">{value.description}</p>
														<ListBox.ItemIndicator />
													</ListBox.Item>
												))}
											</ListBox>
										</Select.Popover>
									</Select>
									<p className="text-xs text-muted mt-2">
										Define como a processadora cobra a taxa no saque. <strong>Taxa no Valor Transferido</strong>: enviar
										valor + taxa para destinatário receber valor. <strong>Taxa no Débito</strong>: enviar valor e
										debitar valor + taxa da conta.
									</p>
								</div>
							</div>

							<Separator />

							<div className="flex flex-col gap-4">
								<p className="text-xs text-muted">
									Valores mínimos e máximos para saques. Use 0 para indicar sem limite máximo.
								</p>
								{isWithdrawalEnabled ? (
									<div>
										<div className="flex items-center gap-2 text-xs text-foreground/60 mb-3">
											<Chip variant="soft" color="success" size="sm">
												Saque
											</Chip>
											<span>Limites para saques (payout)</span>
										</div>
										<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
											<TextField variant="secondary" name="minPayoutAmount">
												<Label>Valor Mínimo (R$)</Label>
												<CurrencyCentsInput
													variant="secondary"
													initialValueInCents={acquirer.minPayoutAmount ?? undefined}
													placeholder="0,00"
													onValueChange={(v) => setFormData((prev) => ({ ...prev, minPayoutAmount: v }))}
												/>
												<FieldError />
											</TextField>
											<TextField variant="secondary" name="maxPayoutAmount">
												<Label>Valor Máximo (R$)</Label>
												<CurrencyCentsInput
													variant="secondary"
													initialValueInCents={acquirer.maxPayoutAmount ?? undefined}
													placeholder="0,00"
													onValueChange={(v) => setFormData((prev) => ({ ...prev, maxPayoutAmount: v }))}
												/>
												<FieldError />
											</TextField>
										</div>
									</div>
								) : (
									<p className="text-xs text-muted">Saque (payout) não suportado para esta processadora.</p>
								)}
							</div>
						</Accordion.Body>
					</Accordion.Panel>
				</Accordion.Item>
			</Accordion>

			{isGod && (
				<Accordion defaultExpandedKeys={[]}>
					<Accordion.Item id="webhook-auth-edit" className="rounded-xl border border-divider bg-surface">
						<Accordion.Heading>
							<Accordion.Trigger className="flex w-full items-center justify-between px-4 py-3">
								<div className="flex items-center gap-3">
									<div className="flex size-10 items-center justify-center rounded-lg bg-danger-soft">
										<Icon icon={WebhookIcon} className="icon-md text-danger" />
									</div>
									<div className="flex flex-col items-start">
										<span className="font-medium">Autenticação de Webhook</span>
										<span className="text-xs text-danger">
											{webhookAuthModeParse[formData.webhookAuthMode].label} |{' '}
											{acquirer.hasWebhookToken ? 'Token configurado' : 'Token não configurado'}
										</span>
									</div>
								</div>
								<Accordion.Indicator>
									<Icon icon={ArrowDown01Icon} className="icon-sm text-muted transition-transform duration-200" />
								</Accordion.Indicator>
							</Accordion.Trigger>
						</Accordion.Heading>
						<Accordion.Panel>
							<Accordion.Body className="flex flex-col gap-4 p-4">
								<Select
									variant="secondary"
									value={formData.webhookAuthMode}
									onChange={(key) => setFormData((prev) => ({ ...prev, webhookAuthMode: key as WebhookAuthMode }))}
								>
									<Label>Modo de Autenticação do Webhook</Label>
									<Select.Trigger>
										<Select.Value>
											<Chip
												variant="soft"
												color={mapParseColorToChipColor(webhookAuthModeParse[formData.webhookAuthMode].color)}
												className="gap-1"
											>
												{webhookAuthModeParse[formData.webhookAuthMode].icon}
												{webhookAuthModeParse[formData.webhookAuthMode].label}
											</Chip>
										</Select.Value>
										<Select.Indicator />
									</Select.Trigger>
									<Select.Popover>
										<ListBox>
											{Object.entries(webhookAuthModeParse).map(([key, value]) => (
												<ListBox.Item key={key} id={key} textValue={value.label}>
													<Chip variant="soft" color={mapParseColorToChipColor(value.color)} className="gap-1">
														{value.icon}
														{value.label}
													</Chip>
													<ListBox.ItemIndicator />
												</ListBox.Item>
											))}
										</ListBox>
									</Select.Popover>
								</Select>

								<div className="flex flex-col gap-2">
									<div className="flex items-center gap-2">
										<Label htmlFor="webhookToken">Token do Webhook</Label>
										<ConfiguredChip isConfigured={acquirer.hasWebhookToken} />
									</div>
									<Input variant="secondary"
										id="webhookToken"
										value={formData.webhookToken}
										onChange={(e) => setFormData((prev) => ({ ...prev, webhookToken: e.target.value }))}
										placeholder="Token secreto para autenticação"
										autoComplete="new-password"
									/>
									<span className="text-xs text-foreground/60">Deixe em branco para remover a configuração</span>
								</div>

								<div className="flex flex-col gap-2">
									<Label htmlFor="webhookAllowedIps">IPs Permitidos</Label>
									<TextArea variant="secondary"
										id="webhookAllowedIps"
										value={formData.webhookAllowedIps}
										onChange={(e) => setFormData((prev) => ({ ...prev, webhookAllowedIps: e.target.value }))}
										placeholder="192.168.1.1, 10.0.0.0/24"
										rows={2}
									/>
									<span className="text-xs text-foreground/60">Separe múltiplos IPs com vírgula. Suporta CIDR</span>
								</div>
							</Accordion.Body>
						</Accordion.Panel>
					</Accordion.Item>
				</Accordion>
			)}

			{isGod && (
				<Accordion defaultExpandedKeys={[]}>
					<Accordion.Item id="creds-production-edit" className="rounded-xl border border-divider bg-surface">
						<Accordion.Heading>
							<Accordion.Trigger className="flex w-full items-center justify-between px-4 py-3">
								<div className="flex items-center gap-3">
									<div className="flex size-10 items-center justify-center rounded-lg bg-secondary-soft">
										<Icon icon={Server} className="icon-md text-secondary" />
									</div>
									<div className="flex flex-col items-start">
										<span className="font-medium">Credenciais de Produção</span>
										<span className="text-xs text-secondary">
											{acquirer.hasDefaultCredentials ? 'Configurado' : 'Não configurado'}
										</span>
									</div>
								</div>
								<Accordion.Indicator>
									<Icon icon={ArrowDown01Icon} className="icon-sm text-muted transition-transform duration-200" />
								</Accordion.Indicator>
							</Accordion.Trigger>
						</Accordion.Heading>
						<Accordion.Panel>
							<Accordion.Body className="flex flex-col gap-4 p-4">
								<div className="flex flex-col gap-2">
									<Label htmlFor="apiBaseUrlProduction">URL Base da API</Label>
									<Input variant="secondary"
										id="apiBaseUrlProduction"
										value={formData.apiBaseUrlProduction}
										onChange={(e) => setFormData((prev) => ({ ...prev, apiBaseUrlProduction: e.target.value }))}
										placeholder="https://api.processadora.com"
									/>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-xs text-muted">Schema de credenciais</span>
									<Button variant="tertiary" onPress={() => setIsResetSchemaDialogOpen(true)}>
										Resetar schema
									</Button>
								</div>

								{/* Dynamic credentials based on schema */}
										{credentialSchema && credentialSchema.length > 0 ? (
									<DynamicCredentialFields
												schema={credentialSchema}
										values={formData.defaultCredentials}
										onChange={(name, value) =>
											setFormData((prev) => {
												const next = { ...prev.defaultCredentials };
												if (value.trim().length === 0) {
													delete next[name];
												} else {
													next[name] = value;
												}
												return {
													...prev,
													defaultCredentials: next,
												};
											})
										}
												hasCredentials={effectiveHasDefaultCredentials}
									/>
								) : (
									<p className="text-sm text-muted">Esta processadora não possui schema de credenciais configurado.</p>
								)}
								<span className="text-xs text-foreground/60">Deixe em branco para remover a configuração</span>
							</Accordion.Body>
						</Accordion.Panel>
					</Accordion.Item>
				</Accordion>
			)}

			{isGod && (
				<Accordion defaultExpandedKeys={[]}>
					<Accordion.Item id="creds-sandbox-edit" className="rounded-xl border border-divider bg-surface">
						<Accordion.Heading>
							<Accordion.Trigger className="flex w-full items-center justify-between px-4 py-3">
								<div className="flex items-center gap-3">
									<div className="flex size-10 items-center justify-center rounded-lg bg-warning-soft">
										<Icon icon={Server} className="icon-md text-warning" />
									</div>
									<div className="flex flex-col items-start">
										<span className="font-medium">Credenciais de Sandbox</span>
										<span className="text-xs text-warning">
											{effectiveHasDefaultCredentialsSandbox ? 'Configurado' : 'Não configurado'}
										</span>
									</div>
								</div>
								<Accordion.Indicator>
									<Icon icon={ArrowDown01Icon} className="icon-sm text-muted transition-transform duration-200" />
								</Accordion.Indicator>
							</Accordion.Trigger>
						</Accordion.Heading>
						<Accordion.Panel>
							<Accordion.Body className="flex flex-col gap-4 p-4">
								<div className="flex flex-col gap-2">
									<Label htmlFor="apiBaseUrlSandbox">URL Base da API</Label>
									<Input variant="secondary"
										id="apiBaseUrlSandbox"
										value={formData.apiBaseUrlSandbox}
										onChange={(e) => setFormData((prev) => ({ ...prev, apiBaseUrlSandbox: e.target.value }))}
										placeholder="https://sandbox.processadora.com"
									/>
								</div>

								{/* Dynamic credentials based on schema */}
									{credentialSchema && credentialSchema.length > 0 ? (
									<DynamicCredentialFields
											schema={credentialSchema}
										values={formData.defaultCredentialsSandbox}
										onChange={(name, value) =>
											setFormData((prev) => {
												const next = { ...prev.defaultCredentialsSandbox };
												if (value.trim().length === 0) {
													delete next[name];
												} else {
													next[name] = value;
												}
												return {
													...prev,
													defaultCredentialsSandbox: next,
												};
											})
										}
											hasCredentials={effectiveHasDefaultCredentialsSandbox}
									/>
								) : (
									<p className="text-sm text-muted">Esta processadora não possui schema de credenciais configurado.</p>
								)}
								<span className="text-xs text-foreground/60">Deixe em branco para remover a configuração</span>
							</Accordion.Body>
						</Accordion.Panel>
					</Accordion.Item>
				</Accordion>
			)}

			<AlertDialog.Backdrop
				isOpen={isSyncDialogOpen}
				onOpenChange={(isOpen) => {
					if (!isOpen) {
						setFormData((prev) => ({ ...prev, syncToMerchantAcquirers: false }));
					}
					setIsSyncDialogOpen(isOpen);
				}}
			>
				<AlertDialog.Container>
					<AlertDialog.Dialog className="sm:max-w-md">
						<AlertDialog.CloseTrigger />
						<AlertDialog.Header>
							<AlertDialog.Icon status="warning" />
							<AlertDialog.Heading>Sincronizar com organizações?</AlertDialog.Heading>
						</AlertDialog.Header>
						<AlertDialog.Body>
							<Switch
								isSelected={formData.syncToMerchantAcquirers}
								onChange={(isSelected) =>
									setFormData((prev) => ({ ...prev, syncToMerchantAcquirers: isSelected }))
								}
							>
								<Switch.Control>
									<Switch.Thumb />
								</Switch.Control>
								<Label className="text-sm">Sincronizar com organizações existentes</Label>
							</Switch>
							<p className="mt-2 text-sm text-warning">
								Quando ativado, as alterações de taxas e credenciais serão aplicadas a todas as organizações que usam esta
								processadora.
							</p>
						</AlertDialog.Body>
						<AlertDialog.Footer>
							<Button
								variant="tertiary"
								onPress={() => {
									setFormData((prev) => ({ ...prev, syncToMerchantAcquirers: false }));
									setIsSyncDialogOpen(false);
								}}
							>
								Cancelar
							</Button>
							<Button
								variant="primary"
								onPress={() => {
									setIsSyncDialogOpen(false);
									handleUpdate();
								}}
							>
								Salvar alteracoes
							</Button>
						</AlertDialog.Footer>
					</AlertDialog.Dialog>
				</AlertDialog.Container>
			</AlertDialog.Backdrop>

			<AlertDialog.Backdrop isOpen={isResetSchemaDialogOpen} onOpenChange={setIsResetSchemaDialogOpen}>
				<AlertDialog.Container>
					<AlertDialog.Dialog className="sm:max-w-md">
						<AlertDialog.CloseTrigger />
						<AlertDialog.Header>
							<AlertDialog.Icon status="warning" />
							<AlertDialog.Heading>Resetar schema de credenciais?</AlertDialog.Heading>
						</AlertDialog.Header>
						<AlertDialog.Body>
							<p>
								Isso vai restaurar o schema padrao de credenciais baseado no tipo da processadora.
							</p>
							<p className="mt-2 text-sm text-warning">
								O schema atual sera substituido e o formulario de credenciais sera atualizado.
							</p>
						</AlertDialog.Body>
						<AlertDialog.Footer>
							<Button variant="tertiary" onPress={() => setIsResetSchemaDialogOpen(false)}>
								Cancelar
							</Button>
							<Button variant="primary" onPress={handleResetSchema} isDisabled={isResetSchemaPending}>
								Confirmar
							</Button>
						</AlertDialog.Footer>
					</AlertDialog.Dialog>
				</AlertDialog.Container>
			</AlertDialog.Backdrop>

			<div className="flex justify-end gap-4">
				<AsyncButton variant="primary" onPress={() => setIsSyncDialogOpen(true)} isPending={isPending}>
					Confirmar Alterações
				</AsyncButton>
			</div>
		</div>
	);
}
