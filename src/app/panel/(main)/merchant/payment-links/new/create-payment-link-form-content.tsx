'use client';

import { createElement, useEffect, useDeferredValue, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';
import {
	Button,
	Calendar,
	Chip,
	Checkbox,
	cn,
	DateField,
	DatePicker,
	Input,
	Label,
	ListBox,
	Select,
	Skeleton,
	Switch,
	Tag,
	TagGroup,
	TextField,
	toast,
} from '@heroui/react';
import type { TimeValue } from '@heroui/react';
import { parseDateTime, type DateValue } from '@internationalized/date';
import {
	AlertCircleIcon,
	ArrowLeft01Icon,
	ArrowRight01Icon,
	CheckmarkCircle02Icon,
	Clock01Icon,
	InformationCircleIcon,
	Link01Icon,
	Mail01Icon,
	ComputerDesk01Icon,
	Moon01Icon,
	SmartPhone01Icon,
	Sun01Icon,
	UserIcon,
	ViewIcon,
	Wallet01Icon,
	Tick01Icon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { AsyncButton } from '@/components/ui/async-button';
import { ImageUploader } from '@/components/ui/image-uploader';
import { FormPageHeader } from '@/components/ui/form-page-header';
import { UnsavedChangesAlert } from '@/components/ui/unsaved-changes-alert';
import { SectionAccordion } from '@/components/ui/system-accordion';
import { CurrencyCentsInput } from '@/components/ui/currency-cents-input';
import {
	useCreatePaymentLinkForm,
	type BillingFormState,
	type PaymentLinkFormData,
	type SettingsFormState,
	type VisualFormState,
	type ProductFormState,
} from './use-create-payment-link-form';
import { Controller, type Control } from 'react-hook-form';
import { mapParseColorToChipColor, paymentMethodParse, paymentStatusParse } from '@/parse';
import { createMerchantPaymentLink, updateMerchantPaymentLink } from '@/app/actions/merchant/payment-links';
import { previewPayment } from '@/app/actions/merchant/payments';
import { formatCurrency } from '@/utils/currency';
import { Routes } from '@/router/routes';
import { FeeChargeMode, PaymentMethod, PaymentStatus, UploadFolder } from '@/types/enums';
import type { PreviewPaymentData } from '@/types/merchant/payments';
import type { ExpirationPreset } from './constants';
import type { ReadFeesData } from '@/types/merchant/settings';
import type { ApiResponse } from '@/types/common';
import {
	EXPIRATION_PRESET_OPTIONS,
	EXPIRATION_DAYS_MAP,
	PAYMENT_METHOD_HINTS,
	WIZARD_STEPS,
	TOTAL_STEPS,
} from './constants';
import { WizardStepper } from '@/components/ui/wizard-stepper';

interface CreatePaymentLinkPageProps {
	merchantId: string;
	feesData: ApiResponse<ReadFeesData> | undefined;
	paymentLinkId?: string;
	mode?: 'view' | 'edit';
	canEdit?: boolean;
	linkStatus?: PaymentStatus;
	isExpiredLink?: boolean;
	initialBillingValues?: Partial<BillingFormState>;
	initialSettingsValues?: Partial<SettingsFormState>;
	initialVisualValues?: Partial<VisualFormState>;
	initialProductValues?: Partial<ProductFormState>;
	initialEnabledMethods?: PaymentMethod[];
}

export function CreatePaymentLinkFormContent({
	merchantId,
	feesData,
	paymentLinkId,
	mode = 'edit',
	canEdit = true,
	linkStatus,
	isExpiredLink = false,
	initialBillingValues,
	initialSettingsValues,
	initialVisualValues,
	initialProductValues,
	initialEnabledMethods,
}: CreatePaymentLinkPageProps) {
	const availableMethods = [
		feesData?.data?.pixEnabled ? PaymentMethod.Pix : null,
	].filter((m): m is PaymentMethod => m !== null);
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [isLoadingPreview, startLoadingPreview] = useTransition();
	const isViewMode = paymentLinkId !== undefined && mode === 'view';
	const isReadOnly = paymentLinkId !== undefined && !canEdit;
    const reviewStepNumber = TOTAL_STEPS;

	const initialMethods = initialEnabledMethods;
		const initialStep = paymentLinkId
		? reviewStepNumber - 1
		: initialMethods
			? TOTAL_STEPS
			: undefined;

	const {
		currentStep,
		form,
		amountCents,
		effectiveMinAmount,
		effectiveMaxAmount,
		isAmountOutOfRange,
		enabledMethods,
		billing,
		settings,
		visual,
		product,
		hasUnsavedChanges,
		submitError,
		stepError,
		setSubmitError,
		goToNextStep,
		goToPreviousStep,
		goToStep,
		getAllValidationErrors,
		toggleMethods,
		setBillingField,
		setSettingsField,
		setVisualField,
		setProductField,
		toggleBuyerField,
		resetToSavedData,
	} = useCreatePaymentLinkForm({
		totalSteps: TOTAL_STEPS,
		initialMethods,
		initialStep,
		availableMethods,
		initialBilling: initialBillingValues,
		initialSettings: initialSettingsValues,
		initialVisual: initialVisualValues,
		initialProduct: initialProductValues,
		fees: feesData?.data,
	});
	const visibleStepNumbers = paymentLinkId
		? Array.from({ length: reviewStepNumber - 1 }, (_, index) => index + 1)
		: Array.from({ length: TOTAL_STEPS }, (_, index) => index + 1);
	const visibleWizardSteps = paymentLinkId ? WIZARD_STEPS.slice(0, reviewStepNumber - 1) : WIZARD_STEPS;
	const wizardStepsWithState = visibleWizardSteps.map((step, index) => {
		const stepNumber = visibleStepNumbers[index];

		if (!step.isRequired) {
			return step;
		}

		if (stepNumber === 1) {
			return {
				...step,
				isCompleted: enabledMethods.length > 0,
			};
		}

		if (stepNumber === 5) {
			return {
				...step,
				isCompleted: amountCents > 0 && !isAmountOutOfRange,
			};
		}

		return step;
	});
	const currentStepIndex = Math.max(0, visibleStepNumbers.indexOf(currentStep));
	const isLastVisibleStep = currentStepIndex === visibleWizardSteps.length - 1;
	const [previewByMethod, setPreviewByMethod] = useState<Partial<Record<PaymentMethod, PreviewPaymentData | null>>>({});

	const validationErrors = getAllValidationErrors();
	const deferredAmountCents = useDeferredValue(amountCents);
	const selectedPreviewMethods = enabledMethods;
	const selectedPreviewMethodsHash = selectedPreviewMethods.join('|');
	const shouldRequestPreview = deferredAmountCents > 0 && selectedPreviewMethodsHash.length > 0 && !isAmountOutOfRange;
	const previewByMethodToDisplay = shouldRequestPreview ? previewByMethod : {};
	const displayStatus = isExpiredLink && linkStatus === PaymentStatus.Pending ? PaymentStatus.Expired : linkStatus;
	const statusParse = displayStatus ? paymentStatusParse[displayStatus] : null;
	const shouldShowUnsavedAlert = paymentLinkId !== undefined && !isReadOnly && !isViewMode;

	useEffect(() => {
		if (paymentLinkId && currentStep === reviewStepNumber) {
			goToStep(reviewStepNumber - 1);
		}
	}, [currentStep, goToStep, paymentLinkId, reviewStepNumber]);

	function toggleMethodsWithModeGuard(keys: 'all' | Set<React.Key>) {
		if (isViewMode || isReadOnly) {
			return;
		}

		toggleMethods(keys);
	}

	function setBillingFieldWithModeGuard<K extends keyof BillingFormState>(key: K, value: BillingFormState[K]) {
		if (isViewMode || isReadOnly) {
			return;
		}

		setBillingField(key, value);
	}

	function setSettingsFieldWithModeGuard<K extends keyof SettingsFormState>(key: K, value: SettingsFormState[K]) {
		if (isViewMode || isReadOnly) {
			return;
		}

		setSettingsField(key, value);
	}

	function setVisualFieldWithModeGuard<K extends keyof VisualFormState>(key: K, value: VisualFormState[K]) {
		if (isViewMode || isReadOnly) {
			return;
		}

		setVisualField(key, value);
	}

	function setProductFieldWithModeGuard<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) {
		if (isViewMode || isReadOnly) {
			return;
		}

		setProductField(key, value);
	}

	function toggleBuyerFieldWithModeGuard(field: SettingsFormState['requiredBuyerFields'][number], checked: boolean) {
		if (isViewMode || isReadOnly) {
			return;
		}

		toggleBuyerField(field, checked);
	}

	useEffect(() => {
		const methodsToPreview = selectedPreviewMethodsHash
			? (selectedPreviewMethodsHash.split('|') as PaymentMethod[])
			: [];

		if (!shouldRequestPreview || methodsToPreview.length === 0) {
			return;
		}

		let cancelled = false;

		startLoadingPreview(async () => {
			const entries = await Promise.allSettled(
				methodsToPreview.map(async (method) => {
					try {
						const response = await previewPayment(merchantId, {
							amount: deferredAmountCents,
							method,
							feeContext: 'PaymentLink',
						});

						return [method, response?.data ?? null] as const;
					} catch {
						return [method, null] as const;
					}
				})
			);

			if (!cancelled) {
				const mappedEntries = entries.map((entry, index) => {
					if (entry.status === 'fulfilled') {
						return entry.value;
					}

					return [methodsToPreview[index], null] as const;
				});

				setPreviewByMethod(Object.fromEntries(mappedEntries));
			}
		});

		return () => {
			cancelled = true;
		};
	}, [deferredAmountCents, merchantId, selectedPreviewMethodsHash, shouldRequestPreview]);

	function handleSubmit() {
		if (isViewMode || (paymentLinkId && !canEdit)) {
			return;
		}

		if (amountCents > 0 && isAmountOutOfRange) {
			setSubmitError(
				amountCents < effectiveMinAmount
					? `Valor mínimo permitido: ${formatCurrency(effectiveMinAmount)}.`
					: `Valor máximo permitido: ${formatCurrency(effectiveMaxAmount)}.`
			);
			return;
		}

		setSubmitError(null);
		startTransition(async () => {
			const callbackUrl = (settings.callbackUrl ?? '').trim();
			const redirectUrl = (billing.redirectUrl ?? '').trim();

			const response = paymentLinkId
				? await updateMerchantPaymentLink(merchantId, paymentLinkId, {
						enabledMethods,
						amount: amountCents,
						description: product.description.trim() || null,
						callbackUrl: callbackUrl || null,
						pixExpirationMinutes: settings.pixExpirationMinutes
							? parseInt(settings.pixExpirationMinutes, 10) || null
							: null,
						redirectUrl: redirectUrl || null,
						requiredBuyerFields: settings.requiredBuyerFields.length > 0 ? settings.requiredBuyerFields : null,
						showFees: settings.showFees,
						passFeeToCustomer: settings.passFeeToCustomer,
						expiresAt: settings.canExpire
							? (computeExpiresAt(settings.expirationPreset, settings.customExpiresAt) ?? null)
							: null,
						primaryColor: null,
						secondaryColor: null,
						logoUrl: visual.logoUrl.trim() || null,
						colorMode: null,
						themeMode: visual.themeMode,
						productName: product.name.trim() || null,
						productImageUrl: product.imageUrl.trim() || null,
					})
				: await createMerchantPaymentLink(merchantId, {
						enabledMethods,
						amount: amountCents,
						description: product.description.trim() || undefined,
						callbackUrl: callbackUrl || undefined,
						pixExpirationMinutes: settings.pixExpirationMinutes
							? parseInt(settings.pixExpirationMinutes, 10) || undefined
							: undefined,
						redirectUrl: redirectUrl || undefined,
						requiredBuyerFields: settings.requiredBuyerFields.length > 0 ? settings.requiredBuyerFields : undefined,
						showFees: settings.showFees,
						passFeeToCustomer: settings.passFeeToCustomer,
						expiresAt: settings.canExpire
							? computeExpiresAt(settings.expirationPreset, settings.customExpiresAt)
							: undefined,
						primaryColor: undefined,
						secondaryColor: undefined,
						logoUrl: visual.logoUrl.trim() || undefined,
						colorMode: undefined,
						themeMode: visual.themeMode,
						productName: product.name.trim() || undefined,
						productImageUrl: product.imageUrl.trim() || undefined,
					});

			if (response?.error || !response?.data) {
				setSubmitError(
					response?.error?.message ??
						(paymentLinkId
							? 'Não foi possível atualizar o link de pagamento.'
							: 'Não foi possível criar o link de pagamento.')
				);
				return;
			}

			const savedFormData: PaymentLinkFormData = {
				enabledMethods,
				billing: {
					amountFormatted: billing.amountFormatted,
					redirectUrl: billing.redirectUrl,
				},
				product: {
					name: product.name,
					description: product.description,
					imageUrl: product.imageUrl,
				},
				settings: {
					callbackUrl: settings.callbackUrl,
					pixExpirationMinutes: settings.pixExpirationMinutes,
					canExpire: settings.canExpire,
					expirationPreset: settings.expirationPreset,
					customExpiresAt: settings.customExpiresAt,
					requiredBuyerFields: settings.requiredBuyerFields,
					showFees: settings.showFees,
					passFeeToCustomer: settings.passFeeToCustomer,
				},
				visual: {
					themeMode: visual.themeMode,
					logoUrl: visual.logoUrl,
				},
			};

			resetToSavedData(savedFormData);

			toast(paymentLinkId ? 'Link atualizado com sucesso!' : 'Link criado com sucesso!', {
				description: paymentLinkId ? 'As alterações foram salvas.' : 'O link de pagamento está pronto para uso.',
				variant: 'success',
				indicator: createElement(Icon, { icon: CheckmarkCircle02Icon, className: 'icon-sm' }),
			});

			if (!paymentLinkId && response.data.paymentLinkUrl) {
				const isCopied = await navigator.clipboard
					.writeText(response.data.paymentLinkUrl)
					.then(() => true)
					.catch(() => false);

				if (isCopied) {
					toast('Link copiado!', {
						description: 'O link foi copiado para a área de transferência.',
						variant: 'success',
						indicator: createElement(Icon, {
							icon: CheckmarkCircle02Icon,
							className: 'icon-sm',
						}),
					});
				}
			}

			if (!paymentLinkId) {
				router.push(Routes.panel.merchant.paymentLinks);
			}
		});
	}

	return (
		<div className="mx-auto max-w-7xl px-4 pb-16">
			<FormPageHeader
				icon={<Icon icon={Link01Icon} className="icon-md text-accent" />}
				title={
					paymentLinkId
						? isViewMode
							? 'Visualizar Link de Pagamento'
							: 'Editar Link de Pagamento'
						: 'Novo Link de Pagamento'
				}
				description={
					paymentLinkId
						? isViewMode
							? canEdit
								? 'Visualize os dados e habilite a edição quando quiser.'
								: 'Este link está em modo somente leitura.'
							: 'Atualize seu link passo a passo'
						: 'Configure seu link passo a passo'
				}
				meta={
					paymentLinkId ? (
						<div className="flex flex-wrap items-center gap-2">
							{isReadOnly && (
								<Chip variant="soft" color="warning" size="sm" className="gap-1">
									<Icon icon={ViewIcon} className="icon-xs" />
									Somente visualização
								</Chip>
							)}
							{statusParse && (
								<Chip variant="soft" color={mapParseColorToChipColor(statusParse.color)} size="sm" className="gap-1">
									{statusParse.icon}
									{statusParse.label}
								</Chip>
							)}
						</div>
					) : null
				}
				onBack={() => router.push(Routes.panel.merchant.paymentLinks)}
			/>

			{shouldShowUnsavedAlert && (
				<div className="mt-4">
					<UnsavedChangesAlert
						hasChanges={hasUnsavedChanges}
						message="Existem alterações não salvas neste link. Clique em salvar para aplicar as mudanças."
						onSave={handleSubmit}
						isSaving={isPending}
					/>
				</div>
			)}

			{stepError && (
				<div className="mt-4">
					<StepError message={stepError} />
				</div>
			)}

			<div className="mt-8 flex flex-col gap-4">
				<WizardStepper
					steps={wizardStepsWithState}
					currentStep={currentStepIndex}
					mode={paymentLinkId ? 'editor' : 'wizard'}
					isDisabled={isPending || isReadOnly}
					onStepClick={(idx) => goToStep(visibleStepNumbers[idx] ?? 1)}
					onBack={paymentLinkId ? goToPreviousStep : undefined}
					onNext={
						paymentLinkId
							? currentStep < reviewStepNumber - 1
								? () => goToStep(currentStep + 1)
								: undefined
							: undefined
					}
					submitSlot={null}
				/>

				<div className={cn('mt-2', isReadOnly && 'pointer-events-none opacity-80')}>
					{currentStep === 1 && (
						<Step1Methods
							enabledMethods={enabledMethods}
							availableMethods={availableMethods}
							onMethodToggle={toggleMethodsWithModeGuard}
						/>
					)}

					{currentStep === 2 && (
						<Step3Settings
							enabledMethods={enabledMethods}
							callbackUrl={settings.callbackUrl ?? ''}
							pixExpirationMinutes={settings.pixExpirationMinutes}
							canExpire={settings.canExpire}
							expirationPreset={settings.expirationPreset}
							customExpiresAt={settings.customExpiresAt}
							requiredBuyerFields={settings.requiredBuyerFields}
							showFees={settings.showFees}
							onCallbackUrlChange={(value) => setSettingsFieldWithModeGuard('callbackUrl', value)}
							onPixExpirationChange={(value) => setSettingsFieldWithModeGuard('pixExpirationMinutes', value)}
							onCanExpireChange={(value) => setSettingsFieldWithModeGuard('canExpire', value)}
							onExpirationPresetChange={(value) => setSettingsFieldWithModeGuard('expirationPreset', value)}
							onCustomExpiresAtChange={(value) => setSettingsFieldWithModeGuard('customExpiresAt', value)}
							onBuyerFieldToggle={toggleBuyerFieldWithModeGuard}
							onShowFeesChange={(value) => setSettingsFieldWithModeGuard('showFees', value)}
						/>
					)}

					{currentStep === 3 && (
						<Step5Product
							name={product.name}
							description={product.description}
							imageUrl={product.imageUrl}
							merchantId={merchantId}
							onNameChange={(value) => setProductFieldWithModeGuard('name', value)}
							onDescriptionChange={(value) => setProductFieldWithModeGuard('description', value)}
							onImageUrlChange={(value) => setProductFieldWithModeGuard('imageUrl', value)}
						/>
					)}

					{currentStep === 4 && (
						<Step4Visual merchantId={merchantId} visual={visual} setVisualField={setVisualFieldWithModeGuard} />
					)}

					{currentStep === 5 && (
						<Step2Billing
							control={form.control}
							amountCents={amountCents}
							redirectUrl={billing.redirectUrl ?? ''}
							fees={feesData?.data}
							enabledMethods={enabledMethods}
							passFeeToCustomer={settings.passFeeToCustomer}
							onRedirectUrlChange={(value) => setBillingFieldWithModeGuard('redirectUrl', value)}
							onPassFeeToCustomerChange={(value) => setSettingsFieldWithModeGuard('passFeeToCustomer', value)}
						/>
					)}

					{!paymentLinkId && currentStep === 6 && (
						<Step4Review
							enabledMethods={enabledMethods}
							amountCents={amountCents}
							description={product.description}
							productName={product.name}
							productImageUrl={product.imageUrl}
							redirectUrl={billing.redirectUrl ?? ''}
							callbackUrl={settings.callbackUrl ?? ''}
							canExpire={settings.canExpire}
							expirationPreset={settings.expirationPreset}
							customExpiresAt={settings.customExpiresAt}
							pixExpirationMinutes={settings.pixExpirationMinutes}
							requiredBuyerFields={settings.requiredBuyerFields}
							showFees={settings.showFees}
							passFeeToCustomer={settings.passFeeToCustomer}
							previewByMethod={previewByMethodToDisplay}
							fees={feesData?.data}
							isLoadingPreview={isLoadingPreview}
							selectedPreviewMethods={selectedPreviewMethods}
							isAmountOutOfRange={isAmountOutOfRange}
							validationErrors={validationErrors}
							submitError={submitError}
							themeMode={visual.themeMode}
							logoUrl={visual.logoUrl}
						/>
					)}
				</div>

				{!paymentLinkId && (
					<div className="rounded-xl border border-border bg-surface p-4">
						<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
							<Button
								variant="secondary"
								onPress={currentStep === 1 ? () => router.push(Routes.panel.merchant.paymentLinks) : goToPreviousStep}
								isDisabled={isPending || isReadOnly}
								className="sm:mr-auto"
							>
								<Icon icon={ArrowLeft01Icon} className="icon-sm" />
								Voltar
							</Button>

							{!isLastVisibleStep ? (
								<Button
									variant="primary"
									onPress={goToNextStep}
									isDisabled={isPending || isReadOnly}
									className="w-full sm:w-auto"
								>
									Próximo
									<Icon icon={ArrowRight01Icon} className="icon-sm" />
								</Button>
							) : (
								<AsyncButton
									variant="primary"
									onPress={handleSubmit}
									isPending={isPending}
									isDisabled={amountCents <= 0 || enabledMethods.length === 0 || isAmountOutOfRange || isReadOnly}
									className="w-full sm:w-auto"
								>
									<Icon icon={Tick01Icon} className="icon-sm" />
									Criar link de pagamento
								</AsyncButton>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

// ─── Step 1: Métodos ────────────────────────────────────────────────────────

interface Step1MethodsProps {
	enabledMethods: PaymentMethod[];
	availableMethods: PaymentMethod[];
	onMethodToggle: (keys: 'all' | Set<React.Key>) => void;
}

function Step1Methods({ enabledMethods, availableMethods, onMethodToggle }: Step1MethodsProps) {
	return (
		<div className="flex flex-col gap-6">
			<TagGroup
				aria-label="Métodos de pagamento"
				selectionMode="multiple"
				selectedKeys={new Set(enabledMethods)}
				onSelectionChange={onMethodToggle}
			>
				<TagGroup.List className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					{availableMethods.map((method) => {
						const option = paymentMethodParse[method];
						const isSelected = enabledMethods.includes(method);

						return (
							<Tag
								key={method}
								id={method}
								textValue={option.label}
								className={cn(
									'h-auto w-full cursor-pointer rounded-xl border bg-surface p-4 transition-all',
									isSelected ? 'border-accent bg-accent-soft' : 'border-border hover:border-accent/40'
								)}
							>
								<div className="flex items-start gap-3">
									<div
										className={cn(
											'flex size-10 shrink-0 items-center justify-center rounded-lg',
											isSelected ? 'bg-accent text-accent-foreground' : 'bg-surface-deep text-muted'
										)}
									>
										{option.icon ? <span className="[&_svg]:size-5">{option.icon}</span> : null}
									</div>

									<div className="flex min-w-0 flex-1 flex-col gap-1">
										<p className="text-sm font-semibold text-foreground">{option.label}</p>
										<p className="text-xs text-muted">{PAYMENT_METHOD_HINTS[method]}</p>
									</div>

									{isSelected && (
										<div className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
											Ativo
										</div>
									)}
								</div>
							</Tag>
						);
					})}
				</TagGroup.List>
			</TagGroup>
		</div>
	);
}

// ─── Step 2: Cobrança ────────────────────────────────────────────────────────

interface Step2BillingProps {
	control: Control<PaymentLinkFormData>;
	amountCents: number;
	redirectUrl: string;
	fees: ReadFeesData | null | undefined;
	enabledMethods: PaymentMethod[];
	passFeeToCustomer: boolean;
	onRedirectUrlChange: (v: string) => void;
	onPassFeeToCustomerChange: (v: boolean) => void;
}

function Step2Billing({
	control,
	amountCents,
	redirectUrl,
	fees,
	enabledMethods,
	passFeeToCustomer,
	onRedirectUrlChange,
	onPassFeeToCustomerChange,
}: Step2BillingProps) {
	const hasPix = enabledMethods.includes(PaymentMethod.Pix);
	const enabledMins = [
		hasPix ? (fees?.pixMinTransactionAmount ?? 100) : null,
	].filter((v): v is number => v !== null);
	const enabledMaxes = [
		hasPix ? (fees?.pixMaxTransactionAmount ?? 100000000) : null,
	].filter((v): v is number => v !== null);
	const minAmount = enabledMins.length > 0 ? Math.max(...enabledMins) : 100;
	const maxAmount = enabledMaxes.length > 0 ? Math.min(...enabledMaxes) : 100000000;
	const hasMaxLimit = maxAmount < 100000000;
	const isBelowMin = amountCents > 0 && amountCents < minAmount;
	const isAboveMax = amountCents > 0 && hasMaxLimit && amountCents > maxAmount;
	const isAmountOutOfRange = isBelowMin || isAboveMax;

	return (
		<div className="flex flex-col gap-4">
			<SectionAccordion
				id="billing-main"
				icon={Wallet01Icon}
				title="Cobrança"
				summary={amountCents > 0 ? `Valor atual: ${formatCurrency(amountCents)}` : 'Defina o valor da cobrança'}
				color="accent"
				defaultExpanded={true}
				itemClassName="rounded-xl border border-accent-soft-hover bg-surface"
				triggerClassName="flex w-full items-center justify-between rounded-t-xl bg-surface-deep px-4 py-3"
				summaryClassName="text-xs text-muted"
				iconContainerClassName="flex size-10 items-center justify-center rounded-lg bg-accent-soft"
				iconClassName="icon-md text-accent"
				bodyClassName="p-4 sm:p-6"
			>
				<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-1">
							<TextField
								variant="secondary"
								isRequired
								aria-label="Valor da cobrança"
								isInvalid={isAmountOutOfRange}
								className="[&_input]:text-center [&_input]:text-4xl [&_input]:font-semibold [&_input]:tracking-tight"
							>
								<Label>Valor da cobrança</Label>
								<Controller
									name="billing.amountFormatted"
									control={control}
									render={({ field }) => (
										<CurrencyCentsInput
											variant="secondary"
											placeholder="R$ 0,00"
											initialValueInCents={amountCents > 0 ? amountCents : undefined}
											onValueChange={field.onChange}
										/>
									)}
								/>
							</TextField>
							{isAmountOutOfRange ? (
								<p className="text-xs text-danger">
									{isBelowMin
										? `Valor mínimo: ${formatCurrency(minAmount)}`
										: `Valor máximo: ${formatCurrency(maxAmount)}`}
								</p>
							) : (
								<p className="text-xs text-muted">
									Mín: {formatCurrency(minAmount)} • Máx: {hasMaxLimit ? formatCurrency(maxAmount) : 'Sem limite'}
								</p>
							)}
						</div>

						<div className="flex items-center justify-between gap-3">
							<div className="flex flex-col gap-1">
								<p className="text-sm font-medium">Repassar taxa ao cliente</p>
								<p className="text-xs text-muted">A taxa de processamento será adicionada ao valor cobrado</p>
							</div>
							<Switch isSelected={passFeeToCustomer} onChange={onPassFeeToCustomerChange}>
								<Switch.Control>
									<Switch.Thumb />
								</Switch.Control>
							</Switch>
						</div>

						<TextField variant="secondary" aria-label="URL de redirecionamento">
							<Label>
								URL de redirecionamento após pagamento{' '}
								<span className="text-xs font-normal text-muted">(opcional)</span>
							</Label>
							<Input
								variant="secondary"
								placeholder="https://seu-site.com/obrigado"
								type="url"
								value={redirectUrl}
								onChange={(e) => onRedirectUrlChange(e.target.value)}
							/>
						</TextField>
				</div>
			</SectionAccordion>
		</div>
	);
}

// ─── Produto ─────────────────────────────────────────────────────────────────

interface Step5ProductProps {
	name: string;
	description: string;
	imageUrl: string;
	merchantId: string;
	onNameChange: (v: string) => void;
	onDescriptionChange: (v: string) => void;
	onImageUrlChange: (v: string) => void;
}

function Step5Product({
	name,
	description,
	imageUrl,
	merchantId,
	onNameChange,
	onDescriptionChange,
	onImageUrlChange,
}: Step5ProductProps) {
	return (
		<div className="flex flex-col gap-4">
			<SectionAccordion
				id="product-main"
				icon={Link01Icon}
				title="Produto"
				summary={name.trim() ? name : 'Sem nome definido'}
				color="secondary"
				defaultExpanded={true}
				itemClassName="rounded-xl border border-secondary/30 bg-surface"
				triggerClassName="flex w-full items-center justify-between rounded-t-xl bg-surface-deep px-4 py-3"
				summaryClassName="text-xs text-muted"
				iconContainerClassName="flex size-10 items-center justify-center rounded-lg bg-secondary/10"
				iconClassName="icon-md text-secondary"
				bodyClassName="p-4 sm:p-6"
			>
				<div className="flex flex-col gap-4">
						<ImageUploader
							merchantId={merchantId}
							folder={UploadFolder.Products}
							label="Foto do produto"
							description="PNG ou JPG"
							maxFiles={1}
							value={imageUrl ? [imageUrl] : []}
							onChange={(urls) => onImageUrlChange(urls[0] ?? '')}
						/>
						<TextField variant="secondary" aria-label="Nome do produto">
							<Label>
								Nome do produto <span className="text-xs font-normal text-muted">(opcional)</span>
							</Label>
							<Input
								variant="secondary"
								placeholder="Ex: Plano Premium"
								value={name}
								onChange={(e) => onNameChange(e.target.value)}
							/>
						</TextField>
						<TextField variant="secondary" aria-label="Descrição do produto">
							<Label>
								Descrição <span className="text-xs font-normal text-muted">(opcional)</span>
							</Label>
							<Input
								variant="secondary"
								placeholder="Ex: Cobrança mensal do serviço"
								value={description}
								onChange={(e) => onDescriptionChange(e.target.value)}
							/>
						</TextField>
				</div>
			</SectionAccordion>
		</div>
	);
}

// ─── Step 3: Configurações ────────────────────────────────────────────────────

interface Step3SettingsProps {
	enabledMethods: PaymentMethod[];
	callbackUrl: string;
	pixExpirationMinutes: string;
	canExpire: boolean;
	expirationPreset: ExpirationPreset;
	customExpiresAt: string;
	requiredBuyerFields: SettingsFormState['requiredBuyerFields'];
	showFees: boolean;
	onCallbackUrlChange: (v: string) => void;
	onPixExpirationChange: (v: string) => void;
	onCanExpireChange: (v: boolean) => void;
	onExpirationPresetChange: (v: ExpirationPreset) => void;
	onCustomExpiresAtChange: (v: string) => void;
	onBuyerFieldToggle: (field: SettingsFormState['requiredBuyerFields'][number], checked: boolean) => void;
	onShowFeesChange: (v: boolean) => void;
}

function SettingsAccordionTitle({
	label,
	statusLabel,
	statusTone,
	labelTone,
}: {
	label: string;
	statusLabel: string;
	statusTone: 'success' | 'muted' | 'warning' | 'danger' | 'accent' | 'secondary';
	labelTone?: 'accent' | 'secondary' | 'warning' | 'muted' | 'success';
}) {
	const toneClass =
		labelTone === 'accent'
			? 'text-accent'
			: labelTone === 'secondary'
				? 'text-secondary'
				: labelTone === 'warning'
					? 'text-warning'
					: labelTone === 'success'
						? 'text-success'
						: 'text-muted';

	const statusToneClass =
		statusTone === 'success'
			? 'border-success-soft-hover bg-success-soft text-success'
			: statusTone === 'warning'
				? 'border-warning-soft-hover bg-warning-soft text-warning'
				: statusTone === 'danger'
					? 'border-danger-soft-hover bg-danger-soft text-danger'
					: statusTone === 'accent'
						? 'border-accent-soft-hover bg-accent-soft text-accent'
						: statusTone === 'secondary'
							? 'border-secondary/30 bg-secondary/10 text-secondary'
							: 'border-border bg-surface-deep text-muted';

	return (
		<span className="flex items-center gap-2">
			<span className={cn('font-medium', toneClass)}>{label}</span>
			<span className={cn('rounded-full border px-2 py-0.5 text-xs font-semibold leading-none', statusToneClass)}>
				{statusLabel}
			</span>
		</span>
	);
}

function Step3Settings({
	enabledMethods,
	callbackUrl,
	pixExpirationMinutes,
	canExpire,
	expirationPreset,
	customExpiresAt,
	requiredBuyerFields,
	showFees,
	onCallbackUrlChange,
	onPixExpirationChange,
	onCanExpireChange,
	onExpirationPresetChange,
	onCustomExpiresAtChange,
	onBuyerFieldToggle,
	onShowFeesChange,
}: Step3SettingsProps) {
	const hasPix = enabledMethods.includes(PaymentMethod.Pix);
	const isCustomExpirationPending = canExpire && expirationPreset === 'custom' && !customExpiresAt.trim();
	const isPixConfigActive = pixExpirationMinutes.trim().length > 0;
	const isExpirationConfigActive = canExpire;
	const isBuyerConfigActive = requiredBuyerFields.length > 0;
	const isWebhookConfigActive = callbackUrl.trim().length > 0;
	const isFeesConfigActive = showFees;

	const pixStatusLabel = isPixConfigActive ? 'Personalizada' : 'Padrão';
	const pixStatusTone = isPixConfigActive ? 'success' : 'muted';

	const expirationStatusLabel = isCustomExpirationPending
		? 'Data pendente'
		: isExpirationConfigActive
			? 'Ativada'
			: 'Desativada';
	const expirationStatusTone = isCustomExpirationPending ? 'danger' : isExpirationConfigActive ? 'warning' : 'muted';

	const buyerStatusLabel = isBuyerConfigActive ? `${requiredBuyerFields.length} obrigatório(s)` : 'Nenhum obrigatório';
	const buyerStatusTone = isBuyerConfigActive ? 'accent' : 'muted';

	const webhookStatusLabel = isWebhookConfigActive ? 'Configurado' : 'Não configurado';
	const webhookStatusTone = isWebhookConfigActive ? 'success' : 'muted';

	const feesStatusLabel = isFeesConfigActive ? 'Exibindo taxas' : 'Ocultando taxas';
	const feesStatusTone = isFeesConfigActive ? 'warning' : 'muted';

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4">
				{hasPix && (
					<SectionAccordion
						id="settings-pix"
						icon={Wallet01Icon}
						title={
							<SettingsAccordionTitle
								label="PIX"
								statusLabel={pixStatusLabel}
								statusTone={pixStatusTone}
								labelTone="success"
							/>
						}
						summary={pixExpirationMinutes.trim() ? `Expira em ${pixExpirationMinutes} min` : 'Usa expiração padrão'}
						itemClassName="rounded-xl border border-success-soft-hover bg-surface"
						triggerClassName="flex w-full items-center justify-between rounded-t-xl bg-surface-deep px-4 py-3"
						summaryClassName="text-xs text-muted"
						iconContainerClassName="flex size-10 items-center justify-center rounded-lg bg-success/10"
						iconClassName="icon-md text-success"
						defaultExpanded={false}
						bodyClassName="p-4"
					>
						<TextField variant="secondary" aria-label="Expiração do PIX">
							<Label>
								Expiração do PIX (minutos) <span className="text-xs font-normal text-muted">(opcional)</span>
							</Label>
							<Input
								variant="secondary"
								placeholder="Ex: 30"
								type="number"
								min={5}
								max={1440}
								value={pixExpirationMinutes}
								onChange={(e) => onPixExpirationChange(e.target.value)}
							/>
						</TextField>
					</SectionAccordion>
				)}

				

				<SectionAccordion
					id="settings-expiration"
					icon={Clock01Icon}
					title={
						<SettingsAccordionTitle
							label="Expiração do link"
							statusLabel={expirationStatusLabel}
							statusTone={expirationStatusTone}
							labelTone="warning"
						/>
					}
					summary={
						canExpire
							? isCustomExpirationPending
								? 'Pendente: data e hora obrigatórias'
								: 'Expiração ativa'
							: 'Sem expiração'
					}
					itemClassName={cn(
						'rounded-xl border bg-surface',
						isCustomExpirationPending ? 'border-danger-soft-hover bg-danger-soft' : 'border-warning-soft-hover'
					)}
					triggerClassName={cn(
						'flex w-full items-center justify-between rounded-t-xl px-4 py-3',
						isCustomExpirationPending ? 'bg-danger-soft' : 'bg-surface-deep'
					)}
					summaryClassName={cn('text-xs', isCustomExpirationPending ? 'text-danger' : 'text-muted')}
					iconContainerClassName="flex size-10 items-center justify-center rounded-lg bg-warning-soft"
					iconClassName="icon-md text-warning"
					defaultExpanded={false}
					bodyClassName="p-4"
				>
					<div className="flex items-center justify-between gap-3">
						<p className="text-sm text-muted">Defina uma data limite para o link de pagamento deixar de funcionar</p>
						<Switch isSelected={canExpire} onChange={onCanExpireChange}>
							<Switch.Control>
								<Switch.Thumb />
							</Switch.Control>
						</Switch>
					</div>

					{canExpire && (
						<div className="mt-4 flex flex-col gap-3">
							<Select
								variant="secondary"
								aria-label="Prazo de expiração"
								value={expirationPreset}
								onChange={(key) => {
									if (key) onExpirationPresetChange(key as ExpirationPreset);
								}}
								placeholder="Selecione o prazo"
							>
								<Select.Trigger>
									<Select.Value />
									<Select.Indicator />
								</Select.Trigger>
								<Select.Popover>
									<ListBox>
										{EXPIRATION_PRESET_OPTIONS.map((opt) => (
											<ListBox.Item key={opt.key} id={opt.key} textValue={opt.label}>
												{opt.label}
												<ListBox.ItemIndicator />
											</ListBox.Item>
										))}
									</ListBox>
								</Select.Popover>
							</Select>

							{expirationPreset === 'custom' && (
								<DatePicker
									name="customExpiresAt"
									className="w-full"
									granularity="minute"
									hourCycle={24}
									hideTimeZone
									shouldForceLeadingZeros
									value={parseCustomExpiresAt(customExpiresAt)}
									minValue={getMinDateTimeValue()}
									onChange={(value: DateValue | null) => onCustomExpiresAtChange(serializeDateTimeValue(value))}
								>
									<Label>Data e hora de expiração</Label>
									<DateField.Group fullWidth variant="secondary">
										<DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
										<DateField.Suffix>
											<DatePicker.Trigger>
												<DatePicker.TriggerIndicator />
											</DatePicker.Trigger>
										</DateField.Suffix>
									</DateField.Group>
									<DatePicker.Popover>
										<Calendar aria-label="Data e hora de expiração">
											<Calendar.Header>
												<Calendar.YearPickerTrigger>
													<Calendar.YearPickerTriggerHeading />
													<Calendar.YearPickerTriggerIndicator />
												</Calendar.YearPickerTrigger>
												<Calendar.NavButton slot="previous" />
												<Calendar.NavButton slot="next" />
											</Calendar.Header>
											<Calendar.Grid>
												<Calendar.GridHeader>
													{(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
												</Calendar.GridHeader>
												<Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
											</Calendar.Grid>
											<Calendar.YearPickerGrid>
												<Calendar.YearPickerGridBody>
													{({ year }) => <Calendar.YearPickerCell year={year} />}
												</Calendar.YearPickerGridBody>
											</Calendar.YearPickerGrid>
										</Calendar>
									</DatePicker.Popover>
								</DatePicker>
							)}
						</div>
					)}
				</SectionAccordion>

				<SectionAccordion
					id="settings-buyer"
					icon={UserIcon}
					title={
						<SettingsAccordionTitle
							label="Dados do comprador"
							statusLabel={buyerStatusLabel}
							statusTone={buyerStatusTone}
							labelTone="accent"
						/>
					}
					summary={
						requiredBuyerFields.length > 0
							? `${requiredBuyerFields.length} campo(s) obrigatório(s)`
							: 'Nenhum campo obrigatório'
					}
					itemClassName="rounded-xl border border-accent-soft-hover bg-surface"
					triggerClassName="flex w-full items-center justify-between rounded-t-xl bg-surface-deep px-4 py-3"
					summaryClassName="text-xs text-muted"
					iconContainerClassName="flex size-10 items-center justify-center rounded-lg bg-accent-soft"
					iconClassName="icon-md text-accent"
					defaultExpanded={false}
					bodyClassName="p-4"
				>
					<p className="mb-3 text-sm text-muted">
						Selecione quais informações o comprador deve preencher antes de pagar
					</p>
					<div className="flex flex-col gap-3">
						<BuyerFieldCheckbox
							field="Name"
							label="Nome completo"
							icon={<Icon icon={UserIcon} className="icon-sm text-muted" />}
							isSelected={requiredBuyerFields.includes('Name')}
							onToggle={onBuyerFieldToggle}
						/>
						<BuyerFieldCheckbox
							field="Email"
							label="E-mail"
							icon={<Icon icon={Mail01Icon} className="icon-sm text-muted" />}
							isSelected={requiredBuyerFields.includes('Email')}
							onToggle={onBuyerFieldToggle}
						/>
						<BuyerFieldCheckbox
							field="Phone"
							label="Telefone"
							icon={<Icon icon={SmartPhone01Icon} className="icon-sm text-muted" />}
							isSelected={requiredBuyerFields.includes('Phone')}
							onToggle={onBuyerFieldToggle}
						/>
					</div>
				</SectionAccordion>

				<SectionAccordion
					id="settings-webhook"
					icon={Mail01Icon}
					title={
						<SettingsAccordionTitle
							label="Webhook"
							statusLabel={webhookStatusLabel}
							statusTone={webhookStatusTone}
							labelTone="muted"
						/>
					}
					summary={callbackUrl.trim() ? 'URL de callback configurada' : 'Sem callback'}
					itemClassName="rounded-xl border border-border bg-surface"
					triggerClassName="flex w-full items-center justify-between rounded-t-xl bg-surface-deep px-4 py-3"
					summaryClassName="text-xs text-muted"
					iconContainerClassName="flex size-10 items-center justify-center rounded-lg bg-surface-deep"
					iconClassName="icon-md text-muted"
					defaultExpanded={false}
					bodyClassName="p-4"
				>
					<TextField variant="secondary" aria-label="URL de Callback">
						<Label>
							URL de Callback <span className="text-xs font-normal text-muted">(opcional)</span>
						</Label>
						<Input
							variant="secondary"
							placeholder="https://seu-site.com/webhook"
							type="url"
							value={callbackUrl}
							onChange={(e) => onCallbackUrlChange(e.target.value)}
						/>
					</TextField>
				</SectionAccordion>

				<SectionAccordion
					id="settings-fees"
					icon={InformationCircleIcon}
					title={
						<SettingsAccordionTitle
							label="Exibição de taxas"
							statusLabel={feesStatusLabel}
							statusTone={feesStatusTone}
							labelTone="warning"
						/>
					}
					summary={showFees ? 'Taxas visíveis para o comprador' : 'Taxas ocultas para o comprador'}
					itemClassName="rounded-xl border border-warning-soft-hover bg-surface"
					triggerClassName="flex w-full items-center justify-between rounded-t-xl bg-surface-deep px-4 py-3"
					summaryClassName="text-xs text-muted"
					iconContainerClassName="flex size-10 items-center justify-center rounded-lg bg-warning-soft"
					iconClassName="icon-md text-warning"
					defaultExpanded={false}
					bodyClassName="p-4"
				>
					<div className="flex items-center justify-between gap-3">
						<div>
							<p className="text-sm font-medium">Exibir taxas para o comprador</p>
							<p className="text-xs text-muted">O comprador verá o valor da taxa antes de pagar</p>
						</div>
						<Switch isSelected={showFees} onChange={onShowFeesChange}>
							<Switch.Control>
								<Switch.Thumb />
							</Switch.Control>
						</Switch>
					</div>
				</SectionAccordion>
			</div>
		</div>
	);
}

// ─── Step 4: Visual ──────────────────────────────────────────────────────────

interface Step4VisualProps {
	merchantId: string;
	visual: VisualFormState;
	setVisualField: (field: keyof VisualFormState, value: VisualFormState[keyof VisualFormState]) => void;
}

function Step4Visual({ merchantId, visual, setVisualField }: Step4VisualProps) {
	const themes = [
		{
			id: 'Light' as const,
			label: 'Claro',
			icon: Sun01Icon,
			outerBg: 'bg-[#e8eaed]',
			cardBg: 'bg-white',
			barHigh: 'bg-gray-300',
			barLow: 'bg-gray-200',
		},
		{
			id: 'Dark' as const,
			label: 'Escuro',
			icon: Moon01Icon,
			outerBg: 'bg-[#0f1117]',
			cardBg: 'bg-[#1c2131]',
			barHigh: 'bg-white/25',
			barLow: 'bg-white/10',
		},
		{
			id: 'Auto' as const,
			label: 'Automático',
			icon: ComputerDesk01Icon,
			outerBg: null,
			cardBg: null,
			barHigh: null,
			barLow: null,
		},
	];

	return (
		<div className="flex flex-col gap-4">
			<ImageUploader
				merchantId={merchantId}
				folder={UploadFolder.PaymentLinks}
				label="Logo do link de pagamento"
				description="Opcional. PNG ou JPG"
				maxFiles={1}
				value={visual.logoUrl ? [visual.logoUrl] : []}
				onChange={(urls) => setVisualField('logoUrl', urls[0] ?? '')}
			/>
			<p className="text-sm text-muted">Escolha a aparência exibida aos compradores no checkout.</p>
			<div className="grid grid-cols-3 gap-3">
				{themes.map(({ id, label, icon: IconComponent, outerBg, cardBg, barHigh, barLow }) => {
					const isSelected = visual.themeMode === id;
					return (
						<button
							key={id}
							type="button"
							onClick={() => setVisualField('themeMode', id)}
							className={cn(
								'relative flex flex-col overflow-hidden rounded-xl border text-left transition-all focus-visible:outline-none',
								isSelected
									? 'border-accent ring-2 ring-accent ring-offset-2 ring-offset-background'
									: 'border-border bg-surface hover:border-accent/50'
							)}
						>
							<div className={cn('flex p-3', outerBg ?? 'bg-linear-to-r from-[#e8eaed] to-[#0f1117]')}>
								{id === 'Auto' ? (
									<div className="relative h-16 w-full overflow-hidden rounded-lg">
										<div className="absolute inset-y-0 left-0 flex w-1/2 flex-col gap-1.5 rounded-l-lg bg-white p-2">
											<div className="h-1.5 w-8 rounded-full bg-gray-300" />
											<div className="h-1 w-5 rounded-full bg-gray-200" />
											<div className="flex-1" />
											<div className="h-2 w-full rounded bg-accent" />
										</div>
										<div className="absolute inset-y-0 right-0 flex w-1/2 flex-col gap-1.5 rounded-r-lg bg-[#1c2131] p-2">
											<div className="h-1.5 w-8 rounded-full bg-white/25" />
											<div className="h-1 w-5 rounded-full bg-white/10" />
											<div className="flex-1" />
											<div className="h-2 w-full rounded bg-accent" />
										</div>
										<div className="absolute inset-y-0 left-1/2 w-px -translate-x-px bg-white/50" />
									</div>
								) : (
									<div className={cn('flex h-16 w-full flex-col gap-1.5 rounded-lg p-2', cardBg)}>
										<div className={cn('h-1.5 w-10 rounded-full', barHigh)} />
										<div className={cn('h-1 w-7 rounded-full', barLow)} />
										<div className="flex-1" />
										<div className="h-2.5 w-full rounded bg-accent" />
										<div className={cn('h-1.5 w-full rounded-full', barLow)} />
									</div>
								)}
							</div>
							<div
								className={cn(
									'flex items-center gap-2.5 border-t border-border px-3 py-2.5',
									isSelected ? 'bg-accent/5' : 'bg-surface'
								)}
							>
								<div
									className={cn(
										'flex size-6 shrink-0 items-center justify-center rounded-full',
										isSelected ? 'bg-accent-soft text-accent' : 'bg-muted/10 text-muted'
									)}
								>
									<Icon icon={IconComponent} className="size-3" />
								</div>
								<span className={cn('text-sm font-semibold', isSelected ? 'text-accent' : 'text-foreground')}>
									{label}
								</span>
								{isSelected && <Icon icon={CheckmarkCircle02Icon} className="ml-auto shrink-0 size-4 text-accent" />}
							</div>
						</button>
					);
				})}
			</div>
			{visual.themeMode === 'Auto' && (
				<p className="text-xs text-muted">
					No modo automático, um botão de alternância entre claro e escuro ficará disponível no checkout.
				</p>
			)}
		</div>
	);
}

// ─── Step 5: Revisão ─────────────────────────────────────────────────────────

function calculatePaymentFee(amount: number, mode: FeeChargeMode, fixedFee: number, percentageBps: number): number {
	const fixedPart = mode === FeeChargeMode.FixedOnly || mode === FeeChargeMode.FixedAndPercentage ? fixedFee : 0;
	const percentagePart =
		mode === FeeChargeMode.PercentageOnly || mode === FeeChargeMode.FixedAndPercentage
			? Math.ceil((amount * percentageBps) / 10000)
			: 0;

	return fixedPart + percentagePart;
}

function getFallbackPaymentPreview(
	method: PaymentMethod,
	amountCents: number,
	fees?: ReadFeesData | null
): PreviewPaymentData | null {
	if (!fees || amountCents <= 0) {
		return null;
	}

	if (method === PaymentMethod.Pix) {
		const fee = calculatePaymentFee(
			amountCents,
			fees.pixPaymentLinkFeeMode,
			fees.pixPaymentLinkFeeFixed,
			fees.pixPaymentLinkFeePercentage
		);

		return {
			amount: amountCents,
			fee,
			netAmount: amountCents - fee,
		};
	}

	

	

	return null;
}

interface Step4ReviewProps {
	enabledMethods: PaymentMethod[];
	amountCents: number;
	description: string;
	productName: string;
	productImageUrl: string;
	redirectUrl: string;
	callbackUrl: string;
	canExpire: boolean;
	expirationPreset: ExpirationPreset;
	customExpiresAt: string;
	pixExpirationMinutes: string;
	requiredBuyerFields: string[];
	showFees: boolean;
	passFeeToCustomer: boolean;
	previewByMethod: Partial<Record<PaymentMethod, PreviewPaymentData | null>>;
	fees?: ReadFeesData | null;
	isLoadingPreview: boolean;
	selectedPreviewMethods: PaymentMethod[];
	isAmountOutOfRange: boolean;
	validationErrors: string[];
	submitError: string | null;
	themeMode: string;
	logoUrl: string;
}

function Step4Review({
	enabledMethods,
	amountCents,
	description,
	productName,
	productImageUrl,
	redirectUrl,
	callbackUrl,
	canExpire,
	expirationPreset,
	customExpiresAt,
	pixExpirationMinutes,
	requiredBuyerFields,
	showFees,
	passFeeToCustomer,
	previewByMethod,
	fees,
	isLoadingPreview,
	selectedPreviewMethods,
	isAmountOutOfRange,
	validationErrors,
	submitError,
	themeMode,
	logoUrl,
}: Step4ReviewProps) {
	const expirationLabel = canExpire
		? expirationPreset === 'custom'
			? customExpiresAt
				? new Date(customExpiresAt).toLocaleString('pt-BR')
				: 'Data personalizada não definida'
			: (EXPIRATION_PRESET_OPTIONS.find((o) => o.key === expirationPreset)?.label ?? '–')
		: 'Sem expiração';

	const buyerFieldLabels: Record<string, string> = {
		Name: 'Nome completo',
		Email: 'E-mail',
		Phone: 'Telefone',
	};

	const buyerFieldsLabel =
		requiredBuyerFields.length > 0
			? requiredBuyerFields.map((field) => buyerFieldLabels[field] ?? field).join(', ')
			: 'Nenhum';

	return (
		<div className="flex flex-col gap-2.5">
			{(validationErrors.length > 0 || submitError) && (
				<div className="flex flex-col gap-1.5 rounded-xl border border-danger-soft-hover bg-danger-soft p-3">
					<div className="flex items-center gap-2">
						<Icon icon={AlertCircleIcon} className="shrink-0 icon-sm text-danger" />
						<p className="text-xs font-semibold uppercase tracking-wide text-danger">Corrija antes de salvar</p>
					</div>
					{validationErrors.map((error) => (
						<p key={error} className="ml-5 text-xs text-danger">
							• {error}
						</p>
					))}
					{submitError && <p className="ml-5 text-xs text-danger">• {submitError}</p>}
				</div>
			)}

			<SectionAccordion
				id="review-overview"
				icon={InformationCircleIcon}
				title="Revisão final"
				summary={formatCurrency(amountCents)}
				color="success"
				defaultExpanded={true}
				itemClassName="rounded-xl border border-success-soft-hover bg-surface"
				triggerClassName="flex w-full items-center justify-between rounded-t-xl bg-surface-deep px-4 py-3"
				summaryClassName="text-xs text-muted"
				iconContainerClassName="flex size-10 items-center justify-center rounded-lg bg-success/10"
				iconClassName="icon-md text-success"
				bodyClassName="p-3"
			>
				<div className="flex flex-col gap-3">
					<div>
						<p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-accent">Resumo da cobrança</p>
						<ReviewRow label="Valor do produto/serviço">{formatCurrency(amountCents)}</ReviewRow>
						<ReviewRow label="Expiração">{expirationLabel}</ReviewRow>
						<ReviewRow label="Métodos">
							<span className="inline-flex max-w-56 flex-wrap justify-end gap-1">
								{enabledMethods.map((method) => (
									<span
										key={method}
										className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent"
									>
										{paymentMethodParse[method]?.label ?? method}
									</span>
								))}
							</span>
						</ReviewRow>
						<ReviewRow label="Repassar taxa ao cliente">
							<span
								className={cn(
									'rounded-full px-2 py-0.5 text-xs font-semibold',
									passFeeToCustomer ? 'bg-warning-soft text-warning' : 'bg-surface-deep text-muted'
								)}
							>
								{passFeeToCustomer ? 'Sim' : 'Não'}
							</span>
						</ReviewRow>
						<ReviewRow label="Taxas para o comprador">
							<span
								className={cn(
									'rounded-full px-2 py-0.5 text-xs font-semibold',
									showFees ? 'bg-success-soft text-success' : 'bg-surface-deep text-muted'
								)}
							>
								{showFees ? 'Exibir' : 'Ocultar'}
							</span>
						</ReviewRow>
						<ReviewRow label="Dados obrigatórios">{buyerFieldsLabel}</ReviewRow>
						{redirectUrl && (
							<ReviewRow label="Redirecionamento">
								<span className="break-all text-xs">{redirectUrl}</span>
							</ReviewRow>
						)}
						{callbackUrl && (
							<ReviewRow label="Webhook">
								<span className="break-all text-xs">{callbackUrl}</span>
							</ReviewRow>
						)}
					</div>

					<div className="border-t border-border pt-3">
						<p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-secondary">Produto e visual</p>
						{productName || description || productImageUrl ? (
							<div className="flex items-start gap-3">
								{productImageUrl ? (
									<NextImage
										src={productImageUrl}
										alt={productName || 'Imagem do produto'}
										width={64}
										height={64}
										className="size-16 rounded-lg border border-border object-cover"
									/>
								) : (
									<div className="flex size-16 items-center justify-center rounded-lg border border-dashed border-border bg-surface-deep text-xs text-muted">
										Sem foto
									</div>
								)}
								<div className="min-w-0 flex-1">
									<p className="text-xs font-semibold text-foreground">{productName || 'Sem nome'}</p>
									<p className="mt-0.5 text-xs text-muted">{description || 'Sem descrição'}</p>
								</div>
							</div>
						) : (
							<p className="text-xs text-muted">Nenhuma informação de produto foi definida.</p>
						)}

						<div className="mt-2 border-t border-border pt-2">
							<ReviewRow label="Tema">
								{themeMode === 'Auto' ? 'Automático' : themeMode === 'Light' ? 'Claro' : 'Escuro'}
							</ReviewRow>
							<ReviewRow label="Logo">{logoUrl ? 'Personalizada' : 'Padrão SwiftPay'}</ReviewRow>
							{enabledMethods.length > 0 && (
								<p className="mb-1 mt-2 text-xs font-semibold uppercase tracking-wider text-warning">Detalhes por método</p>
							)}
							{enabledMethods.includes(PaymentMethod.Pix) && (
								<ReviewRow label="Expiração PIX">
									{pixExpirationMinutes ? `${pixExpirationMinutes} minutos` : 'Padrão da plataforma'}
								</ReviewRow>
							)}
						</div>
					</div>

					{amountCents > 0 && (
						<div className="pt-3">
							<p className="mb-2 text-xs font-semibold uppercase tracking-wider text-success">Prévia financeira</p>

							{isLoadingPreview ? (
								<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
									<Skeleton className="h-24 w-full rounded-xl" />
									<Skeleton className="h-24 w-full rounded-xl" />
								</div>
							) : (
								<div className="grid grid-cols-1 gap-2">
									{selectedPreviewMethods.map((method) => {
										const methodData = paymentMethodParse[method];
										const preview = previewByMethod[method] ?? getFallbackPaymentPreview(method, amountCents, fees);

										if (!preview) {
											return (
												<div key={method} className="rounded-xl border border-border bg-card p-3 text-sm text-muted">
													{isAmountOutOfRange
														? `A prévia de ${methodData.label} será exibida quando o valor estiver dentro do limite permitido.`
														: `Não foi possível carregar a prévia para ${methodData.label}.`}
												</div>
											);
										}

										const customerPays = passFeeToCustomer ? preview.amount + preview.fee : preview.amount;
										const merchantReceives = passFeeToCustomer ? preview.amount : preview.netAmount;

										return (
											<div key={method} className="rounded-xl bg-card">
												<div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-foreground">
													{methodData.icon}
													{methodData.label}
												</div>
												<div className="space-y-1 text-xs">
													<div className="flex items-center justify-between">
														<span className="text-muted">Valor base</span>
														<span className="font-medium text-foreground">{formatCurrency(preview.amount)}</span>
													</div>
													<div className="flex items-center justify-between">
														<span className="text-muted">Taxa</span>
														<span className="font-medium text-danger">{formatCurrency(preview.fee)}</span>
													</div>
													<div className="flex items-center justify-between border-t border-border pt-2">
														<span className="font-medium">Cliente paga</span>
														<span className="text-sm font-bold text-accent">{formatCurrency(customerPays)}</span>
													</div>
													<div className="flex items-center justify-between">
														<span className="font-medium">Você recebe</span>
														<span className="text-sm font-bold text-success">{formatCurrency(merchantReceives)}</span>
													</div>
												</div>
											</div>
										);
									})}
								</div>
							)}

							<div className="mt-2 flex items-start gap-2 rounded-lg bg-warning-soft p-2.5">
								<Icon icon={InformationCircleIcon} className="mt-0.5 shrink-0 icon-sm text-warning" />
								<p className="text-xs text-muted">
									{passFeeToCustomer
										? 'Com repasse ativo, o cliente paga valor base + taxa e você recebe o valor base da cobrança.'
										: 'Com repasse desativado, a taxa é descontada da cobrança e você recebe o valor líquido.'}
								</p>
							</div>
						</div>
					)}
				</div>
			</SectionAccordion>
		</div>
	);
}

// ─── Shared sub-components ───────────────────────────────────────────────────

function StepError({ message }: { message: string }) {
	return (
		<div className="flex items-center gap-2 rounded-lg border border-danger-soft-hover bg-danger-soft px-3 py-2.5 text-sm text-danger">
			<Icon icon={AlertCircleIcon} className="shrink-0 icon-sm" />
			{message}
		</div>
	);
}

function ReviewRow({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="flex items-start justify-between gap-3 border-b border-border py-1.5 text-xs last:border-0 last:pb-0">
			<span className="shrink-0 text-muted">{label}</span>
			<span className="text-right font-semibold text-foreground">{children}</span>
		</div>
	);
}

function BuyerFieldCheckbox({
	field,
	label,
	icon,
	isSelected,
	onToggle,
}: {
	field: SettingsFormState['requiredBuyerFields'][number];
	label: string;
	icon: React.ReactNode;
	isSelected: boolean;
	onToggle: (field: SettingsFormState['requiredBuyerFields'][number], checked: boolean) => void;
}) {
	return (
		<Checkbox variant="secondary" isSelected={isSelected} onChange={(checked: boolean) => onToggle(field, checked)}>
			<Checkbox.Control>
				<Checkbox.Indicator />
			</Checkbox.Control>
			<Checkbox.Content>
				<div className="flex items-center gap-2">
					{icon}
					<span className="text-sm">{label}</span>
				</div>
			</Checkbox.Content>
		</Checkbox>
	);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeExpiresAt(preset: ExpirationPreset, customValue: string): string | undefined {
	if (preset === 'custom') {
		return customValue.trim() || undefined;
	}
	const days = EXPIRATION_DAYS_MAP[preset];
	if (!days) return undefined;
	const date = new Date();
	date.setDate(date.getDate() + days);
	return date.toISOString();
}

function _getMinDateOnly(): string {
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	return tomorrow.toISOString().slice(0, 10);
}

function getMinDateTimeValue() {
	return parseDateTime(toLocalDateTimeValue(new Date()));
}

function parseCustomExpiresAt(value: string) {
	if (!value.trim()) return null;
	try {
		return parseDateTime(value.trim());
	} catch {
		return null;
	}
}

function serializeDateTimeValue(value: DateValue | TimeValue | null): string {
	if (!value) return '';
	return value.toString().slice(0, 16);
}

function toLocalDateTimeValue(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	return `${year}-${month}-${day}T${hours}:${minutes}`;
}