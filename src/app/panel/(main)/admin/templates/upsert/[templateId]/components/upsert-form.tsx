'use client';

import { use, useActionState, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Skeleton, toast } from '@heroui/react';
import {
	Alert01Icon,
	ArrowLeft01Icon,
	ArrowRight01Icon,
	CheckmarkCircle02Icon,
	PaintBoardIcon,
	Tick01Icon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { adminCreateTemplate, adminUpdateTemplate } from '@/app/actions/admin/templates';
import { WizardStepper } from '@/components/ui/wizard-stepper';
import { UnsavedChangesAlert } from '@/components/ui/unsaved-changes-alert';
import { FormPageHeader } from '@/components/ui/form-page-header';
import { CheckoutTemplateType, FeeChargeMode } from '@/types/enums';
import { Routes } from '@/router/routes';
import type { AdminTemplateData } from '@/types/admin/templates';
import type { ApiResponse } from '@/types/common';
import { TemplateGeneralStep } from './steps/template-general-step';
import { TemplateConfigurationStep } from './steps/template-configuration-step';
import { TemplateMediaStep } from './steps/template-media-step';
import { TemplateReviewStep } from './steps/template-review-step';

interface FormState {
	error: string | null;
}

type TemplateStepId = 'general' | 'configuration' | 'media' | 'review';

interface TemplateWizardStepDefinition {
	key: TemplateStepId;
	title: string;
	description: string;
	isRequired?: boolean;
}

const TEMPLATE_WIZARD_STEPS: TemplateWizardStepDefinition[] = [
	{
		key: 'general',
		title: 'Informações',
		description: 'Defina os dados principais e o tipo do template.',
		isRequired: true,
	},
	{
		key: 'configuration',
		title: 'Configurações',
		description: 'Configure taxa, funcionalidades e integrações.',
	},
	{
		key: 'media',
		title: 'Mídia',
		description: 'Adicione thumbnail e imagens de preview.',
	},
	{
		key: 'review',
		title: 'Revisão',
		description: 'Confira os dados antes de criar o template.',
	},
];

const STEP_ACCORDION_COUNT: Record<TemplateStepId, number> = {
	general: 2,
	configuration: 3,
	media: 1,
	review: 4,
};

interface FlagItem {
	label: string;
	isEnabled: boolean;
}

const CHECKOUT_FEATURE_FLAGS: Array<(state: {
	supportsCoupons: boolean;
	supportsShipping: boolean;
	supportsTimer: boolean;
	supportsSocialProof: boolean;
}) => FlagItem> = [
	(state) => ({ label: 'Cupons', isEnabled: state.supportsCoupons }),
	(state) => ({ label: 'Frete', isEnabled: state.supportsShipping }),
	(state) => ({ label: 'Timer', isEnabled: state.supportsTimer }),
	(state) => ({ label: 'Prova social', isEnabled: state.supportsSocialProof }),
];

const TRACKING_FEATURE_FLAGS: Array<(state: {
	supportsClarity: boolean;
	supportsFacebookPixel: boolean;
	supportsGoogleTagManager: boolean;
	supportsTikTok: boolean;
	supportsKwai: boolean;
	supportsPinterest: boolean;
	supportsTaboola: boolean;
	supportsUtmify: boolean;
	supportsOtimizey: boolean;
}) => FlagItem> = [
	(state) => ({ label: 'Microsoft Clarity', isEnabled: state.supportsClarity }),
	(state) => ({ label: 'Facebook Pixel', isEnabled: state.supportsFacebookPixel }),
	(state) => ({ label: 'Google Tag Manager', isEnabled: state.supportsGoogleTagManager }),
	(state) => ({ label: 'TikTok Pixel', isEnabled: state.supportsTikTok }),
	(state) => ({ label: 'Kwai Pixel', isEnabled: state.supportsKwai }),
	(state) => ({ label: 'Pinterest Tag', isEnabled: state.supportsPinterest }),
	(state) => ({ label: 'Taboola Pixel', isEnabled: state.supportsTaboola }),
	(state) => ({ label: 'Utmify', isEnabled: state.supportsUtmify }),
	(state) => ({ label: 'Otimizey', isEnabled: state.supportsOtimizey }),
];

interface TemplateSnapshotInput {
	code: string;
	name: string;
	shortDescription: string;
	fullDescription: string;
	bestFor: string;
	selectedType: CheckoutTemplateType | null;
	feeMode: FeeChargeMode | null;
	feeFixedCents: number | undefined;
	feePercentageValue: number | undefined;
	isActive: boolean;
	thumbnailUrl: string[];
	previewImages: string[];
	featuresList: string[];
	supportsCoupons: boolean;
	supportsShipping: boolean;
	supportsTimer: boolean;
	supportsSocialProof: boolean;
	supportsClarity: boolean;
	supportsFacebookPixel: boolean;
	supportsGoogleTagManager: boolean;
	supportsTikTok: boolean;
	supportsKwai: boolean;
	supportsPinterest: boolean;
	supportsTaboola: boolean;
	supportsUtmify: boolean;
	supportsOtimizey: boolean;
}

function toNormalizedTextArray(values: string[]): string[] {
	return values.map((value) => value.trim()).filter((value) => value.length > 0);
}

function buildTemplateSnapshot(input: TemplateSnapshotInput): string {
	return JSON.stringify({
		code: input.code.trim(),
		name: input.name.trim(),
		shortDescription: input.shortDescription.trim(),
		fullDescription: input.fullDescription.trim(),
		bestFor: input.bestFor.trim(),
		selectedType: input.selectedType,
		feeMode: input.feeMode,
		feeFixedCents: input.feeFixedCents ?? null,
		feePercentageValue: input.feePercentageValue ?? null,
		isActive: input.isActive,
		thumbnailUrl: toNormalizedTextArray(input.thumbnailUrl),
		previewImages: toNormalizedTextArray(input.previewImages),
		featuresList: toNormalizedTextArray(input.featuresList),
		supportsCoupons: input.supportsCoupons,
		supportsShipping: input.supportsShipping,
		supportsTimer: input.supportsTimer,
		supportsSocialProof: input.supportsSocialProof,
		supportsClarity: input.supportsClarity,
		supportsFacebookPixel: input.supportsFacebookPixel,
		supportsGoogleTagManager: input.supportsGoogleTagManager,
		supportsTikTok: input.supportsTikTok,
		supportsKwai: input.supportsKwai,
		supportsPinterest: input.supportsPinterest,
		supportsTaboola: input.supportsTaboola,
		supportsUtmify: input.supportsUtmify,
		supportsOtimizey: input.supportsOtimizey,
	});
}

export interface TemplateUpsertFormProps {
	template?: AdminTemplateData | null;
	templatePromise?: Promise<ApiResponse<AdminTemplateData>>;
}

export function TemplateUpsertForm({ template, templatePromise }: TemplateUpsertFormProps) {
	const router = useRouter();
	const formRef = useRef<HTMLFormElement | null>(null);

	const response = templatePromise ? use(templatePromise) : null;
	const resolvedTemplate = template ?? response?.data ?? null;
	const isEditMode = !!resolvedTemplate;
	const templateId = resolvedTemplate?.id ?? null;
	const [selectedStep, setSelectedStep] = useState<TemplateStepId>('general');

	const [selectedType, setSelectedType] = useState<CheckoutTemplateType | null>(resolvedTemplate?.type ?? null);
	const [feeMode, setFeeMode] = useState<FeeChargeMode | null>(resolvedTemplate?.feeMode ?? null);
	const [feeFixedCents, setFeeFixedCents] = useState<number | undefined>(resolvedTemplate?.feeFixed ?? undefined);
	const [feePercentageValue, setFeePercentageValue] = useState<number | undefined>(
		resolvedTemplate?.feePercentage ? resolvedTemplate.feePercentage / 100 : undefined
	);
	const [isActive, setIsActive] = useState(resolvedTemplate?.isActive ?? true);
	const [thumbnailUrl, setThumbnailUrl] = useState<string[]>(
		resolvedTemplate?.thumbnailUrl ? [resolvedTemplate.thumbnailUrl] : []
	);
	const [previewImages, setPreviewImages] = useState<string[]>(resolvedTemplate?.previewImages ?? []);
	const [features, setFeatures] = useState<string>(resolvedTemplate?.features?.join('\n') ?? '');

	const [code, setCode] = useState(resolvedTemplate?.code ?? '');
	const [name, setName] = useState(resolvedTemplate?.name ?? '');
	const [shortDescription, setShortDescription] = useState(resolvedTemplate?.shortDescription ?? '');
	const [fullDescription, setFullDescription] = useState(resolvedTemplate?.fullDescription ?? '');
	const [bestFor, setBestFor] = useState(resolvedTemplate?.bestFor ?? '');

	const [supportsCoupons, setSupportsCoupons] = useState(resolvedTemplate?.supportsCoupons ?? false);
	const [supportsShipping, setSupportsShipping] = useState(resolvedTemplate?.supportsShipping ?? false);
	const [supportsTimer, setSupportsTimer] = useState(resolvedTemplate?.supportsTimer ?? false);
	const [supportsSocialProof, setSupportsSocialProof] = useState(resolvedTemplate?.supportsSocialProof ?? false);

	const [supportsClarity, setSupportsClarity] = useState(resolvedTemplate?.supportsClarity ?? false);
	const [supportsFacebookPixel, setSupportsFacebookPixel] = useState(resolvedTemplate?.supportsFacebookPixel ?? false);
	const [supportsGoogleTagManager, setSupportsGoogleTagManager] = useState(
		resolvedTemplate?.supportsGoogleTagManager ?? false
	);
	const [supportsTikTok, setSupportsTikTok] = useState(resolvedTemplate?.supportsTikTok ?? false);
	const [supportsKwai, setSupportsKwai] = useState(resolvedTemplate?.supportsKwai ?? false);
	const [supportsPinterest, setSupportsPinterest] = useState(resolvedTemplate?.supportsPinterest ?? false);
	const [supportsTaboola, setSupportsTaboola] = useState(resolvedTemplate?.supportsTaboola ?? false);
	const [supportsUtmify, setSupportsUtmify] = useState(resolvedTemplate?.supportsUtmify ?? false);
	const [supportsOtimizey, setSupportsOtimizey] = useState(resolvedTemplate?.supportsOtimizey ?? false);

	const isFree = feeMode === null;

	const featuresList = features
		.split('\n')
		.map((item) => item.trim())
		.filter((item) => item.length > 0);

	const initialSnapshot = useMemo(() => {
		return buildTemplateSnapshot({
			code: resolvedTemplate?.code ?? '',
			name: resolvedTemplate?.name ?? '',
			shortDescription: resolvedTemplate?.shortDescription ?? '',
			fullDescription: resolvedTemplate?.fullDescription ?? '',
			bestFor: resolvedTemplate?.bestFor ?? '',
			selectedType: resolvedTemplate?.type ?? null,
			feeMode: resolvedTemplate?.feeMode ?? null,
			feeFixedCents: resolvedTemplate?.feeFixed ?? undefined,
			feePercentageValue: resolvedTemplate?.feePercentage
				? resolvedTemplate.feePercentage / 100
				: undefined,
			isActive: resolvedTemplate?.isActive ?? true,
			thumbnailUrl: resolvedTemplate?.thumbnailUrl ? [resolvedTemplate.thumbnailUrl] : [],
			previewImages: resolvedTemplate?.previewImages ?? [],
			featuresList: resolvedTemplate?.features ?? [],
			supportsCoupons: resolvedTemplate?.supportsCoupons ?? false,
			supportsShipping: resolvedTemplate?.supportsShipping ?? false,
			supportsTimer: resolvedTemplate?.supportsTimer ?? false,
			supportsSocialProof: resolvedTemplate?.supportsSocialProof ?? false,
			supportsClarity: resolvedTemplate?.supportsClarity ?? false,
			supportsFacebookPixel: resolvedTemplate?.supportsFacebookPixel ?? false,
			supportsGoogleTagManager: resolvedTemplate?.supportsGoogleTagManager ?? false,
			supportsTikTok: resolvedTemplate?.supportsTikTok ?? false,
			supportsKwai: resolvedTemplate?.supportsKwai ?? false,
			supportsPinterest: resolvedTemplate?.supportsPinterest ?? false,
			supportsTaboola: resolvedTemplate?.supportsTaboola ?? false,
			supportsUtmify: resolvedTemplate?.supportsUtmify ?? false,
			supportsOtimizey: resolvedTemplate?.supportsOtimizey ?? false,
		});
	}, [resolvedTemplate]);

	const currentSnapshot = buildTemplateSnapshot({
		code,
		name,
		shortDescription,
		fullDescription,
		bestFor,
		selectedType,
		feeMode,
		feeFixedCents,
		feePercentageValue,
		isActive,
		thumbnailUrl,
		previewImages,
		featuresList,
		supportsCoupons,
		supportsShipping,
		supportsTimer,
		supportsSocialProof,
		supportsClarity,
		supportsFacebookPixel,
		supportsGoogleTagManager,
		supportsTikTok,
		supportsKwai,
		supportsPinterest,
		supportsTaboola,
		supportsUtmify,
		supportsOtimizey,
	});

	const [baselineSnapshot, setBaselineSnapshot] = useState(initialSnapshot);
	const hasUnsavedChanges = isEditMode && baselineSnapshot !== currentSnapshot;

	const [state, formAction, isPending] = useActionState(
		async (_prevState: FormState, _formData: FormData): Promise<FormState> => {
			if (!name.trim()) return { error: 'Informe o nome do template' };
			if (!selectedType) return { error: 'Selecione o tipo do template' };

			if (!isEditMode && !code.trim()) return { error: 'Informe o código do template' };
			if (!isEditMode && !/^[a-z0-9-]+$/.test(code)) {
				return { error: 'O código deve conter apenas letras minúsculas, números e hífens' };
			}

			const feeFixed = feeFixedCents ?? 0;
			const feePercentage = feePercentageValue ? Math.round(feePercentageValue * 100) : 0;
			const featuresList = features
				.split('\n')
				.map((f) => f.trim())
				.filter((f) => f.length > 0);

			if (isEditMode && templateId) {
				const res = await adminUpdateTemplate(templateId, {
					code: code.trim() || null,
					type: selectedType,
					name: name.trim(),
					shortDescription: shortDescription.trim() || null,
					fullDescription: fullDescription.trim() || null,
					bestFor: bestFor.trim() || null,
					thumbnailUrl: thumbnailUrl[0] || null,
					previewImages: previewImages.length > 0 ? previewImages : null,
					features: featuresList.length > 0 ? featuresList : null,
					feeMode: isFree ? null : feeMode,
					feeFixed: isFree ? 0 : feeFixed,
					feePercentage: isFree ? 0 : feePercentage,
					removeFee: isFree,
					isActive,
					supportsCoupons,
					supportsShipping,
					supportsTimer,
					supportsSocialProof,
					supportsClarity,
					supportsFacebookPixel,
					supportsGoogleTagManager,
					supportsTikTok,
					supportsKwai,
					supportsPinterest,
					supportsTaboola,
					supportsUtmify,
					supportsOtimizey,
				});

				if (res?.error) return { error: res.error.message };

				toast('Template atualizado', {
					description: res?.message || 'Template atualizado com sucesso!',
					variant: 'success',
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				});
				setBaselineSnapshot(currentSnapshot);
				return { error: null };
			} else {
				const res = await adminCreateTemplate({
					code: code.trim(),
					type: selectedType,
					name: name.trim(),
					shortDescription: shortDescription.trim() || null,
					fullDescription: fullDescription.trim() || null,
					bestFor: bestFor.trim() || null,
					thumbnailUrl: thumbnailUrl[0] || null,
					previewImages: previewImages.length > 0 ? previewImages : null,
					features: featuresList.length > 0 ? featuresList : null,
					feeMode: isFree ? null : feeMode,
					feeFixed: isFree ? 0 : feeFixed,
					feePercentage: isFree ? 0 : feePercentage,
					isActive,
					supportsCoupons,
					supportsShipping,
					supportsTimer,
					supportsSocialProof,
					supportsClarity,
					supportsFacebookPixel,
					supportsGoogleTagManager,
					supportsTikTok,
					supportsKwai,
					supportsPinterest,
					supportsTaboola,
					supportsUtmify,
					supportsOtimizey,
				});

				if (res?.error) return { error: res.error.message };

				toast('Template criado', {
					description: res?.message || 'Template criado com sucesso!',
					variant: 'success',
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				});
				router.push(Routes.panel.admin.templates);
				return { error: null };
			}
		},
		{ error: null }
	);

	const isValid = selectedType !== null;
	const isReviewStep = !isEditMode && selectedStep === 'review';
	const canGoToReview = isValid && !!name.trim() && !!code.trim();

	const showFeeFixed = feeMode === FeeChargeMode.FixedOnly || feeMode === FeeChargeMode.FixedAndPercentage;
	const showFeePercentage = feeMode === FeeChargeMode.PercentageOnly || feeMode === FeeChargeMode.FixedAndPercentage;
	const hasThumbnail = thumbnailUrl.length > 0;
	const previewImageCount = previewImages.length;

	const checkoutFeatures = CHECKOUT_FEATURE_FLAGS.map((builder) =>
		builder({
			supportsCoupons,
			supportsShipping,
			supportsTimer,
			supportsSocialProof,
		})
	);

	const trackingFeatures = TRACKING_FEATURE_FLAGS.map((builder) =>
		builder({
			supportsClarity,
			supportsFacebookPixel,
			supportsGoogleTagManager,
			supportsTikTok,
			supportsKwai,
			supportsPinterest,
			supportsTaboola,
			supportsUtmify,
			supportsOtimizey,
		})
	);

	const activeCheckoutFeatures = checkoutFeatures.filter((item) => item.isEnabled);
	const activeTrackingFeatures = trackingFeatures.filter((item) => item.isEnabled);

	const stepDefinitions = isEditMode
		? TEMPLATE_WIZARD_STEPS.filter((step) => step.key !== 'review')
		: TEMPLATE_WIZARD_STEPS;
	const stepOrder = stepDefinitions.map((step) => step.key);
	const currentStepIndex = Math.max(0, stepOrder.indexOf(selectedStep));

	const wizardSteps = stepDefinitions.map((step) => {
		if (step.key === 'general') {
			return {
				...step,
				isCompleted: isEditMode
					? !!name.trim() && selectedType !== null
					: !!name.trim() && !!code.trim() && selectedType !== null,
			};
		}

		if (step.key === 'review') {
			return {
				...step,
				isCompleted: canGoToReview,
			};
		}

		return step;
	});

	function shouldExpandAccordionsByDefault(step: TemplateStepId): boolean {
		return STEP_ACCORDION_COUNT[step] <= 2;
	}

	async function goToStep(step: TemplateStepId) {
		if (!isEditMode && step === 'review' && !canGoToReview) {
			toast('Campos obrigatórios pendentes', {
				description: 'Preencha código, nome e tipo antes de avançar para revisão.',
				variant: 'warning',
				indicator: <Icon icon={Alert01Icon} className="icon-sm" />,
			});
			return;
		}

		setSelectedStep(step);
	}

	function handleWizardBack() {
		if (currentStepIndex <= 0) return;
		setSelectedStep(stepOrder[currentStepIndex - 1] ?? 'general');
	}

	function handleWizardNext() {
		if (currentStepIndex >= stepOrder.length - 1) return;
		const targetStep = stepOrder[currentStepIndex + 1] ?? 'general';
		void goToStep(targetStep);
	}

	function handleSaveChanges() {
		formRef.current?.requestSubmit();
	}

	return (
		<div className="flex flex-col gap-6">
			<FormPageHeader
				title={isEditMode ? 'Editar template' : 'Novo template'}
				description={
					isEditMode ? 'Altere as informações do template de checkout.' : 'Cadastre um novo template de checkout.'
				}
				backLabel="Voltar para templates"
				onBack={() => router.push(Routes.panel.admin.templates)}
				icon={<Icon icon={PaintBoardIcon} className="icon-lg text-accent" />}
			/>

			<form ref={formRef} action={formAction} className="flex flex-col gap-6">
				{isEditMode && (
					<UnsavedChangesAlert hasChanges={hasUnsavedChanges} onSave={handleSaveChanges} isSaving={isPending} />
				)}

				<div className="flex flex-col gap-4">
					<WizardStepper
						steps={wizardSteps}
						currentStep={currentStepIndex}
						mode={isEditMode ? 'editor' : 'wizard'}
						isDisabled={isPending}
						onStepClick={(index) => {
							const targetStep = stepOrder[index] ?? 'general';
							void goToStep(targetStep);
						}}
						submitSlot={null}
					/>

					{selectedStep === 'general' && (
						<TemplateGeneralStep
							isEditMode={isEditMode}
							code={code}
							onCodeChange={setCode}
							name={name}
							onNameChange={setName}
							selectedType={selectedType}
							onSelectedTypeChange={setSelectedType}
							isActive={isActive}
							onIsActiveChange={setIsActive}
							shortDescription={shortDescription}
							onShortDescriptionChange={setShortDescription}
							fullDescription={fullDescription}
							onFullDescriptionChange={setFullDescription}
							bestFor={bestFor}
							onBestForChange={setBestFor}
							features={features}
							onFeaturesChange={setFeatures}
							defaultExpanded={shouldExpandAccordionsByDefault('general')}
						/>
					)}

					{selectedStep === 'configuration' && (
						<TemplateConfigurationStep
							defaultExpanded={shouldExpandAccordionsByDefault('configuration')}
							isFree={isFree}
							feeMode={feeMode}
							onFeeModeChange={setFeeMode}
							feeFixedCents={feeFixedCents}
							onFeeFixedCentsChange={setFeeFixedCents}
							feePercentageValue={feePercentageValue}
							onFeePercentageValueChange={setFeePercentageValue}
							showFeeFixed={showFeeFixed}
							showFeePercentage={showFeePercentage}
							supportsCoupons={supportsCoupons}
							onSupportsCouponsChange={setSupportsCoupons}
							supportsShipping={supportsShipping}
							onSupportsShippingChange={setSupportsShipping}
							supportsTimer={supportsTimer}
							onSupportsTimerChange={setSupportsTimer}
							supportsSocialProof={supportsSocialProof}
							onSupportsSocialProofChange={setSupportsSocialProof}
							supportsClarity={supportsClarity}
							onSupportsClarityChange={setSupportsClarity}
							supportsFacebookPixel={supportsFacebookPixel}
							onSupportsFacebookPixelChange={setSupportsFacebookPixel}
							supportsGoogleTagManager={supportsGoogleTagManager}
							onSupportsGoogleTagManagerChange={setSupportsGoogleTagManager}
							supportsTikTok={supportsTikTok}
							onSupportsTikTokChange={setSupportsTikTok}
							supportsKwai={supportsKwai}
							onSupportsKwaiChange={setSupportsKwai}
							supportsPinterest={supportsPinterest}
							onSupportsPinterestChange={setSupportsPinterest}
							supportsTaboola={supportsTaboola}
							onSupportsTaboolaChange={setSupportsTaboola}
							supportsUtmify={supportsUtmify}
							onSupportsUtmifyChange={setSupportsUtmify}
							supportsOtimizey={supportsOtimizey}
							onSupportsOtimizeyChange={setSupportsOtimizey}
						/>
					)}

					{selectedStep === 'media' && (
						<TemplateMediaStep
							defaultExpanded={shouldExpandAccordionsByDefault('media')}
							thumbnailUrl={thumbnailUrl}
							onThumbnailUrlChange={setThumbnailUrl}
							previewImages={previewImages}
							onPreviewImagesChange={setPreviewImages}
						/>
					)}

					{!isEditMode && selectedStep === 'review' && (
						<TemplateReviewStep
							defaultExpanded={shouldExpandAccordionsByDefault('review')}
							code={code}
							name={name}
							selectedType={selectedType}
							isActive={isActive}
							shortDescription={shortDescription}
							fullDescription={fullDescription}
							bestFor={bestFor}
							isFree={isFree}
							feeMode={feeMode}
							showFeeFixed={showFeeFixed}
							showFeePercentage={showFeePercentage}
							feeFixedCents={feeFixedCents}
							feePercentageValue={feePercentageValue}
							activeCheckoutFeatures={activeCheckoutFeatures}
							activeTrackingFeatures={activeTrackingFeatures}
							featuresList={featuresList}
							hasThumbnail={hasThumbnail}
							previewImageCount={previewImageCount}
						/>
					)}

					{state.error && (
						<div className="flex items-center gap-2 text-sm text-danger">
							<Icon icon={Alert01Icon} className="icon-sm" />
							<span>{state.error}</span>
						</div>
					)}

					{!isEditMode && (
						<div className="rounded-xl border border-border bg-surface p-4">
							<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
								<Button
									variant="secondary"
									onPress={currentStepIndex === 0 ? () => router.push(Routes.panel.admin.templates) : handleWizardBack}
									isDisabled={isPending}
									className="sm:mr-auto"
								>
									<Icon icon={ArrowLeft01Icon} className="icon-sm" />
									Voltar
								</Button>

								{!isReviewStep ? (
									<Button variant="primary" onPress={handleWizardNext} isDisabled={isPending} className="w-full sm:w-auto">
										Próximo
										<Icon icon={ArrowRight01Icon} className="icon-sm" />
									</Button>
								) : (
									<Button
										variant="primary"
										onPress={handleSaveChanges}
										isPending={isPending}
										isDisabled={!canGoToReview}
										className="w-full sm:w-auto"
									>
										<Icon icon={Tick01Icon} className="icon-sm" />
										Criar template
									</Button>
								)}
							</div>
						</div>
					)}
				</div>
			</form>
		</div>
	);
}

export function TemplateUpsertFormSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-2">
				<Skeleton className="h-8 w-48 rounded-lg" />
				<Skeleton className="h-4 w-72 rounded-lg" />
			</div>

			<Card>
				<Card.Header>
					<div className="flex flex-col gap-1">
						<Skeleton className="h-5 w-40 rounded-lg" />
						<Skeleton className="h-3 w-64 rounded-lg" />
					</div>
				</Card.Header>
				<Card.Content className="flex flex-col gap-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Skeleton className="h-16 rounded-lg" />
						<Skeleton className="h-16 rounded-lg" />
					</div>
					<Skeleton className="h-16 rounded-lg" />
					<Skeleton className="h-16 rounded-lg" />
				</Card.Content>
			</Card>

			<Card>
				<Card.Header>
					<div className="flex flex-col gap-1">
						<Skeleton className="h-5 w-32 rounded-lg" />
						<Skeleton className="h-3 w-56 rounded-lg" />
					</div>
				</Card.Header>
				<Card.Content className="flex flex-col gap-4">
					<Skeleton className="h-16 rounded-lg" />
					<Skeleton className="h-24 rounded-lg" />
					<Skeleton className="h-16 rounded-lg" />
					<Skeleton className="h-24 rounded-lg" />
				</Card.Content>
			</Card>

			<Card>
				<Card.Header>
					<div className="flex flex-col gap-1">
						<Skeleton className="h-5 w-36 rounded-lg" />
						<Skeleton className="h-3 w-60 rounded-lg" />
					</div>
				</Card.Header>
				<Card.Content>
					<Skeleton className="h-32 rounded-lg" />
				</Card.Content>
			</Card>
		</div>
	);
}
