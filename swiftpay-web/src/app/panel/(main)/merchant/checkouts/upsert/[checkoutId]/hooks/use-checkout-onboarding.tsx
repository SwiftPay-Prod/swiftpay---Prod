'use client';

import { useState, useEffect, useRef, useTransition, useCallback, type RefObject } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { CancelCircleIcon, CheckmarkCircle02Icon, Copy01Icon } from '@hugeicons/core-free-icons';
import { Routes } from '@/router/routes';
import { deleteMerchantCheckout, transferMerchantCheckoutToProduction, updateMerchantCheckout } from '@/app/actions/merchant/checkouts';
import { checkoutStatusParse } from '@/parse';
import {
	CHECKOUT_ONBOARDING_STEPS,
	getCheckoutStepByIndex,
	isFirstStep,
	isLastStep,
} from '@/types/merchant/checkout-onboarding';
import type { CheckoutData, CheckoutTemplateData, UpdateCheckoutRequest } from '@/types/merchant/checkouts';
import { PaymentEnvironment, CheckoutColorMode } from '@/types/enums';
import type { TParse } from '@/parse/types';
import {
	checkoutOnboardingFormSchema,
	type CheckoutOnboardingFormData,
	validateCheckoutOnboardingReview,
} from '../schemas/checkout-upsert-form-schema';

const CHECKOUT_PRIMARY_COLOR_DEFAULT = '#1886ed';

// ── Draft State Interfaces ──

export interface VisualDraftState {
	primaryColor: string;
	secondaryColor: string;
	colorMode: CheckoutColorMode;
	logoUrl: string;
	backgroundImageUrl: string;
	faviconUrl: string;
	hasPendingChanges: boolean;
}

export interface PaymentsDraftState {
	pixEnabled: boolean;
	creditCardEnabled: boolean;
	boletoEnabled: boolean;
	hasPendingChanges: boolean;
}

export interface CustomerDraftState {
	requireCustomerPhone: boolean;
	requireCustomerDocument: boolean;
	requireCustomerAddress: boolean;
	hasPendingChanges: boolean;
}

export interface ProductsDraftState {
	count: number;
	hasPendingChanges: boolean;
	productOperations: Array<{
		operation: 'add' | 'update' | 'remove';
		checkoutProductId?: string;
		productId?: string;
		variantId?: string;
		displayOrder?: number;
		isActive?: boolean;
	}>;
}

export interface FeaturesDraftState {
	couponEnabled: boolean;
	showTimer: boolean;
	timerMinutes: number;
	hasPendingChanges: boolean;
}

export interface UrlsDraftState {
	successUrl: string;
	cancelUrl: string;
	callbackUrl: string;
	hasPendingChanges: boolean;
}

export interface ContactDraftState {
	contactWhatsAppEnabled: boolean;
	contactTelegramEnabled: boolean;
	contactEmailEnabled: boolean;
	hasPendingChanges: boolean;
}

export interface MessagesDraftState {
	pageTitle: string;
	headerMessage: string;
	subHeaderMessage: string;
	footerMessage: string;
	successMessage: string;
	hasPendingChanges: boolean;
}

export interface TrackingDraftState {
	trackingSettings: NonNullable<UpdateCheckoutRequest['trackingSettings']>;
	hasPendingChanges: boolean;
}

export interface SeoDraftState {
	seo: NonNullable<UpdateCheckoutRequest['seo']>;
	hasPendingChanges: boolean;
}

type DraftSetter<T> = (draft: T | null) => void;

// ── Hook Props ──

export interface UseCheckoutOnboardingProps {
	merchantId: string;
	checkout: CheckoutData | null;
	templates: CheckoutTemplateData[];
	initialStep: number;
	isPending: boolean;
	onCreateCheckout: (name: string) => void;
	onUpdateName: (name: string) => void;
	onComplete: () => void;
	onRefresh: () => void;
}

// ── Hook Return ──

export interface CheckoutOnboardingController {
	// State
	currentStep: number;
	activeStep: number;
	isOnboardingCompleted: boolean;
	isFirst: boolean;
	isLast: boolean;
	isReviewStep: boolean;

	// Status
	isStatusPending: boolean;
	hasActiveUnsavedChanges: boolean;
	isActiveStepSaving: boolean;
	isDeletingCheckout: boolean;
	isTransferringCheckout: boolean;
	isDeleteModalOpen: boolean;
	setIsDeleteModalOpen: (open: boolean) => void;
	isTransferModalOpen: boolean;
	setIsTransferModalOpen: (open: boolean) => void;
	isActivationGuideModalOpen: boolean;
	closeActivationGuideModal: () => void;
	isFinalizingActivationTransition: boolean;
	isPreviewModalOpen: boolean;
	setIsPreviewModalOpen: (open: boolean) => void;
	livePreviewUrl: string | null;

	// Steps
	currentStepConfig: ReturnType<typeof getCheckoutStepByIndex>;
	wizardSteps: Array<
		(typeof CHECKOUT_ONBOARDING_STEPS)[number] & { isCompleted?: boolean; fullIndex: number }
	>;
	visibleWizardSteps: Array<
		(typeof CHECKOUT_ONBOARDING_STEPS)[number] & { isCompleted?: boolean; fullIndex: number }
	>;
	visibleContentSteps: typeof CHECKOUT_ONBOARDING_STEPS;

	// Review
	reviewIssues: string[];
	canActivate: boolean;
	activationBlockedReason: string | null;
	savingStepKey: CheckoutStepSaveKey | null;

	// Status parse
	statusParse: TParse | null;

	// Global form
	onboardingForm: ReturnType<typeof useForm<z.input<typeof checkoutOnboardingFormSchema>, unknown, CheckoutOnboardingFormData>>;
	setOnboardingFormValues: (updates: Partial<CheckoutOnboardingFormData>) => void;
	saveStepConfig: (stepKey: CheckoutStepSaveKey) => Promise<void>;

	// Draft setters
	setVisualDraft: DraftSetter<VisualDraftState>;
	setPaymentsDraft: DraftSetter<PaymentsDraftState>;
	setCustomerDraft: DraftSetter<CustomerDraftState>;
	setProductsDraft: DraftSetter<ProductsDraftState>;
	setFeaturesDraft: DraftSetter<FeaturesDraftState>;
	setUrlsDraft: DraftSetter<UrlsDraftState>;
	setContactDraft: DraftSetter<ContactDraftState>;
	setMessagesDraft: DraftSetter<MessagesDraftState>;
	setTrackingDraft: DraftSetter<TrackingDraftState>;
	setSeoDraft: DraftSetter<SeoDraftState>;

	// Draft values (for ReviewTab)
	visualDraft: VisualDraftState | null;
	paymentsDraft: PaymentsDraftState | null;
	customerDraft: CustomerDraftState | null;
	productsDraft: ProductsDraftState | null;
	featuresDraft: FeaturesDraftState | null;
	urlsDraft: UrlsDraftState | null;
	contactDraft: ContactDraftState | null;
	messagesDraft: MessagesDraftState | null;
	trackingDraft: TrackingDraftState | null;
	seoDraft: SeoDraftState | null;

	// Refs
	contentContainerRef: RefObject<HTMLDivElement | null>;

	// Navigation
	handleGoToListing: () => void;
	handleBack: () => void;
	handleNext: () => void;
	handleStepClick: (stepIndex: number) => void;

	// Actions
	handleNameSubmit: (name: string) => void;
	handleFinishOnboarding: () => void;
	handleDeleteCheckout: () => Promise<void>;
	handleTransferCheckoutToProduction: () => Promise<void>;
	triggerActiveStepSave: () => void;

	// Link utilities
	handleCopyLink: () => void;
	handleOpenCheckoutLink: () => void;
	handleShareCheckoutLink: () => void;
}

export type CheckoutStepSaveKey = 'payments' | 'customer' | 'features' | 'urls' | 'visual';

function supportsTracking(checkout: CheckoutData | null): boolean {
	if (!checkout?.template) {
		return false;
	}

	return (
		checkout.template.supportsClarity ||
		checkout.template.supportsFacebookPixel ||
		checkout.template.supportsGoogleTagManager ||
		checkout.template.supportsTikTok ||
		checkout.template.supportsKwai ||
		checkout.template.supportsPinterest ||
		checkout.template.supportsTaboola ||
		checkout.template.supportsUtmify ||
		checkout.template.supportsOtimizey
	);
}

// ── Helpers ──

function buildOnboardingFormDefaults(checkout: CheckoutData | null): CheckoutOnboardingFormData {
	const config = checkout?.config;

	return {
		name: checkout?.name ?? '',
		templateId: checkout?.template?.id ?? '',

		pixEnabled: config?.pixEnabled ?? false,
		pixExpirationMinutes: config?.pixExpirationMinutes ?? 30,
		creditCardEnabled: config?.creditCardEnabled ?? false,
		boletoEnabled: config?.boletoEnabled ?? false,
		reservationExpirationMinutes: config?.reservationExpirationMinutes ?? 15,

		requireCustomerPhone: config?.requireCustomerPhone ?? false,
		requireCustomerDocument: config?.requireCustomerDocument ?? false,
		requireCustomerAddress: config?.requireCustomerAddress ?? false,

		couponEnabled: config?.couponEnabled ?? false,
		shippingEnabled: config?.shippingEnabled ?? false,
		fixedShippingAmount: config?.fixedShippingAmount ?? null,
		showTimer: config?.showTimer ?? false,
		timerMinutes: config?.timerMinutes ?? 15,
		timerText: config?.timerText ?? '',
		timerExpiredText: config?.timerExpiredText ?? '',
		socialProofEnabled: config?.socialProofEnabled ?? false,
		socialProofIntervalSeconds: config?.socialProofSettings?.intervalSeconds ?? 8,
		socialProofDurationSeconds: config?.socialProofSettings?.durationSeconds ?? 4,
		socialProofPosition: config?.socialProofSettings?.position ?? 'BottomLeft',
		socialProofNotifications: config?.socialProofSettings?.notifications ?? [],

		productsCount: checkout?.products.length ?? 0,
		successUrl: config?.successUrl ?? '',
		cancelUrl: config?.cancelUrl ?? '',
		callbackUrl: config?.callbackUrl ?? '',
		primaryColor: config?.primaryColor ?? CHECKOUT_PRIMARY_COLOR_DEFAULT,
		secondaryColor: config?.secondaryColor ?? '',
		colorMode: config?.colorMode ?? CheckoutColorMode.Single,
		logoUrl: config?.logoUrl ?? '',
		backgroundImageUrl: config?.backgroundImageUrl ?? '',
		faviconUrl: config?.faviconUrl ?? '',
	};
}

function buildLivePreviewUrl(
	checkoutUrl: string,
	preview: {
		primaryColor: string;
		secondaryColor: string;
		colorMode?: CheckoutColorMode;
		logoUrl: string;
		backgroundImageUrl: string;
		faviconUrl: string;
	}
): string {
	const url = new URL(checkoutUrl);
	url.searchParams.set('previewMode', '1');
	url.searchParams.set('previewPrimaryColor', preview.primaryColor || '');
	url.searchParams.set('previewSecondaryColor', preview.secondaryColor || '');
	if (preview.colorMode) {
		url.searchParams.set('previewColorMode', preview.colorMode);
	}
	url.searchParams.set('previewLogoUrl', preview.logoUrl || '__empty__');
	url.searchParams.set('previewBackgroundImageUrl', preview.backgroundImageUrl || '__empty__');
	url.searchParams.set('previewFaviconUrl', preview.faviconUrl || '__empty__');

	return url.toString();
}

function isValidAbsoluteUrl(value: string): boolean {
	if (!value.trim()) {
		return true;
	}

	try {
		const parsed = new URL(value);
		return parsed.protocol === 'http:' || parsed.protocol === 'https:';
	} catch {
		return false;
	}
}

function validateStepValues(stepKey: CheckoutStepSaveKey, values: CheckoutOnboardingFormData): string | null {
	switch (stepKey) {
		case 'payments': {
			const hasPaymentMethod = values.pixEnabled || values.creditCardEnabled || values.boletoEnabled;
			if (!hasPaymentMethod) {
				return 'Ative ao menos um método de pagamento.';
			}

			if (values.pixExpirationMinutes < 1 || values.pixExpirationMinutes > 60) {
				return 'Expiração do PIX deve estar entre 1 e 60 minutos.';
			}

			if (values.reservationExpirationMinutes < 1 || values.reservationExpirationMinutes > 60) {
				return 'Tempo de reserva deve estar entre 1 e 60 minutos.';
			}

			return null;
		}
		case 'customer':
			return null;
		case 'features': {
			if (values.shippingEnabled && values.fixedShippingAmount == null) {
				return 'Defina o valor do frete fixo ao habilitar frete.';
			}

			if (values.showTimer) {
				if (values.timerMinutes < 1 || values.timerMinutes > 60) {
					return 'Timer deve estar entre 1 e 60 minutos.';
				}

				if (!values.timerText.trim()) {
					return 'Informe o texto do timer.';
				}

				if (values.timerText.length > 200 || values.timerExpiredText.length > 200) {
					return 'Os textos do timer devem ter no máximo 200 caracteres.';
				}
			}

			if (values.socialProofEnabled) {
				if (values.socialProofIntervalSeconds < 3 || values.socialProofIntervalSeconds > 60) {
					return 'Intervalo da prova social deve estar entre 3 e 60 segundos.';
				}

				if (values.socialProofDurationSeconds < 1 || values.socialProofDurationSeconds > 10) {
					return 'Duração da prova social deve estar entre 1 e 10 segundos.';
				}

				if (values.socialProofNotifications.length === 0) {
					return 'Adicione ao menos uma notificação de prova social.';
				}

				const hasInvalidNotification = values.socialProofNotifications.some(
					(notification) =>
						!notification.name.trim() || !notification.location.trim() || !notification.action.trim()
				);

				if (hasInvalidNotification) {
					return 'Preencha nome, localização e ação em todas as notificações de prova social.';
				}
			}

			return null;
		}
		case 'urls': {
			if (!isValidAbsoluteUrl(values.successUrl) || !isValidAbsoluteUrl(values.cancelUrl) || !isValidAbsoluteUrl(values.callbackUrl)) {
				return 'Uma ou mais URLs são inválidas.';
			}

			return null;
		}
		case 'visual': {
			const hexRegex = /^#([0-9A-Fa-f]{3}){1,2}$/;

			if (!hexRegex.test(values.primaryColor.trim())) {
				return 'A cor principal deve estar em formato hexadecimal válido.';
			}

			if (values.colorMode === CheckoutColorMode.Gradient && values.secondaryColor.trim() && !hexRegex.test(values.secondaryColor.trim())) {
				return 'A cor secundária deve estar em formato hexadecimal válido.';
			}

			return null;
		}
		default:
			return null;
	}
}

// ── Hook ──

export function useCheckoutOnboarding({
	merchantId,
	checkout,
	templates: _templates,
	initialStep,
	isPending: _isPending,
	onCreateCheckout,
	onUpdateName,
	onComplete,
	onRefresh,
}: UseCheckoutOnboardingProps): CheckoutOnboardingController {
	const router = useRouter();
	const [isStatusPending, startStatusTransition] = useTransition();
	const [currentStep, setCurrentStep] = useState(initialStep);
	const [completedLocally, setCompletedLocally] = useState(false);
	const [hasActiveUnsavedChanges, setHasActiveUnsavedChanges] = useState(false);
	const [isActiveStepSaving, setIsActiveStepSaving] = useState(false);
	const [isDeletingCheckout, setIsDeletingCheckout] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isTransferringCheckout, setIsTransferringCheckout] = useState(false);
	const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
	const [isActivationGuideModalOpen, setIsActivationGuideModalOpen] = useState(false);
	const [isFinalizingActivationTransition, setIsFinalizingActivationTransition] = useState(false);
	const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
	const [savingStepKey, setSavingStepKey] = useState<CheckoutStepSaveKey | null>(null);
	const [activationGuidePending, setActivationGuidePending] = useState(false);

	const [visualDraft, setVisualDraft] = useState<VisualDraftState | null>(null);
	const [paymentsDraft, setPaymentsDraft] = useState<PaymentsDraftState | null>(null);
	const [customerDraft, setCustomerDraft] = useState<CustomerDraftState | null>(null);
	const [productsDraft, setProductsDraft] = useState<ProductsDraftState | null>(null);
	const [featuresDraft, setFeaturesDraft] = useState<FeaturesDraftState | null>(null);
	const [urlsDraft, setUrlsDraft] = useState<UrlsDraftState | null>(null);
	const [contactDraft, setContactDraft] = useState<ContactDraftState | null>(null);
	const [messagesDraft, setMessagesDraft] = useState<MessagesDraftState | null>(null);
	const [trackingDraft, setTrackingDraft] = useState<TrackingDraftState | null>(null);
	const [seoDraft, setSeoDraft] = useState<SeoDraftState | null>(null);
	const formDefaults = buildOnboardingFormDefaults(checkout);
	const onboardingForm = useForm<z.input<typeof checkoutOnboardingFormSchema>, unknown, CheckoutOnboardingFormData>({
		resolver: zodResolver(checkoutOnboardingFormSchema),
		defaultValues: formDefaults,
		mode: 'onChange',
	});
	const formValues = useWatch({ control: onboardingForm.control }) as CheckoutOnboardingFormData;
	const { reset, setValue } = onboardingForm;
    const lastDefaultsKeyRef = useRef<string>('');

	const setOnboardingFormValues = useCallback((updates: Partial<CheckoutOnboardingFormData>) => {
		for (const [key, value] of Object.entries(updates) as Array<[keyof CheckoutOnboardingFormData, CheckoutOnboardingFormData[keyof CheckoutOnboardingFormData]]>) {
			setValue(key, value, { shouldValidate: true, shouldDirty: true });
		}
	}, [setValue]);

	const prevCheckoutIdRef = useRef<string | null>(checkout?.id ?? null);
	const contentContainerRef = useRef<HTMLDivElement | null>(null);
	const suppressUnsavedObserverRef = useRef(false);

	useEffect(() => {
		const nextDefaults = buildOnboardingFormDefaults(checkout);
		const nextDefaultsKey = JSON.stringify(nextDefaults);

		if (lastDefaultsKeyRef.current === nextDefaultsKey) {
			return;
		}

		lastDefaultsKeyRef.current = nextDefaultsKey;
		reset(nextDefaults);
	}, [checkout, reset]);

	const applyVisualDraft = useCallback((draft: VisualDraftState | null) => {
		setVisualDraft((prev) => {
			if (JSON.stringify(prev) === JSON.stringify(draft)) {
				return prev;
			}

			return draft;
		});
		setValue('primaryColor', draft?.primaryColor ?? checkout?.config?.primaryColor ?? CHECKOUT_PRIMARY_COLOR_DEFAULT, { shouldValidate: true });
		setValue('secondaryColor', draft?.secondaryColor ?? checkout?.config?.secondaryColor ?? '', { shouldValidate: true });
		setValue('colorMode', draft?.colorMode ?? checkout?.config?.colorMode ?? CheckoutColorMode.Single, { shouldValidate: true });
	}, [checkout?.config?.colorMode, checkout?.config?.primaryColor, checkout?.config?.secondaryColor, setValue]);

	const applyPaymentsDraft = useCallback((draft: PaymentsDraftState | null) => {
		setPaymentsDraft((prev) => {
			if (JSON.stringify(prev) === JSON.stringify(draft)) {
				return prev;
			}

			return draft;
		});
		setValue('pixEnabled', draft?.pixEnabled ?? checkout?.config?.pixEnabled ?? false, { shouldValidate: true });
		setValue('creditCardEnabled', draft?.creditCardEnabled ?? checkout?.config?.creditCardEnabled ?? false, { shouldValidate: true });
		setValue('boletoEnabled', draft?.boletoEnabled ?? checkout?.config?.boletoEnabled ?? false, { shouldValidate: true });
	}, [checkout?.config?.boletoEnabled, checkout?.config?.creditCardEnabled, checkout?.config?.pixEnabled, setValue]);

	const applyCustomerDraft = useCallback((draft: CustomerDraftState | null) => {
		setCustomerDraft((prev) => {
			if (JSON.stringify(prev) === JSON.stringify(draft)) {
				return prev;
			}

			return draft;
		});
	}, []);

	const applyProductsDraft = useCallback((draft: ProductsDraftState | null) => {
		setProductsDraft((prev) => {
			if (JSON.stringify(prev) === JSON.stringify(draft)) {
				return prev;
			}

			return draft;
		});
		setValue('productsCount', draft?.count ?? checkout?.products.length ?? 0, { shouldValidate: true });
	}, [checkout?.products.length, setValue]);

	const applyFeaturesDraft = useCallback((draft: FeaturesDraftState | null) => {
		setFeaturesDraft((prev) => {
			if (JSON.stringify(prev) === JSON.stringify(draft)) {
				return prev;
			}

			return draft;
		});
	}, []);

	const applyUrlsDraft = useCallback((draft: UrlsDraftState | null) => {
		setUrlsDraft((prev) => {
			if (JSON.stringify(prev) === JSON.stringify(draft)) {
				return prev;
			}

			return draft;
		});
		setValue('successUrl', draft?.successUrl ?? checkout?.config?.successUrl ?? '', { shouldValidate: true });
		setValue('cancelUrl', draft?.cancelUrl ?? checkout?.config?.cancelUrl ?? '', { shouldValidate: true });
		setValue('callbackUrl', draft?.callbackUrl ?? checkout?.config?.callbackUrl ?? '', { shouldValidate: true });
	}, [checkout?.config?.callbackUrl, checkout?.config?.cancelUrl, checkout?.config?.successUrl, setValue]);

	const applyContactDraft = useCallback((draft: ContactDraftState | null) => {
		setContactDraft((prev) => {
			if (JSON.stringify(prev) === JSON.stringify(draft)) {
				return prev;
			}

			return draft;
		});
	}, []);

		const applyMessagesDraft = useCallback((draft: MessagesDraftState | null) => {
			setMessagesDraft((prev) => {
				if (JSON.stringify(prev) === JSON.stringify(draft)) {
					return prev;
				}

				return draft;
			});
		}, []);

		const applyTrackingDraft = useCallback((draft: TrackingDraftState | null) => {
			setTrackingDraft((prev) => {
				if (JSON.stringify(prev) === JSON.stringify(draft)) {
					return prev;
				}

				return draft;
			});
		}, []);

		const applySeoDraft = useCallback((draft: SeoDraftState | null) => {
			setSeoDraft((prev) => {
				if (JSON.stringify(prev) === JSON.stringify(draft)) {
					return prev;
				}

				return draft;
			});
		}, []);

	// Sync step when checkout is created for the first time
	useEffect(() => {
		const prevId = prevCheckoutIdRef.current;
		const currentId = checkout?.id ?? null;

		if (!prevId && currentId && checkout?.onboardingStep != null) {
			const step = checkout.onboardingStep;
			requestAnimationFrame(() => {
				setCurrentStep(step);
			});
		}

		prevCheckoutIdRef.current = currentId;
	}, [checkout?.id, checkout?.onboardingStep]);

	useEffect(() => {
		if (!checkout?.id || !activationGuidePending) {
			return;
		}

		if (checkout.status !== 'Active') {
			return;
		}

		const storageKey = `checkout-active-guide-seen:${checkout.id}`;
		const alreadySeen =
			typeof window !== 'undefined' && window.localStorage.getItem(storageKey) === 'true';

		if (!alreadySeen) {
			setIsActivationGuideModalOpen(true);
		}

		setActivationGuidePending(false);
	}, [activationGuidePending, checkout?.id, checkout?.status]);

	useEffect(() => {
		if (!isFinalizingActivationTransition) {
			return;
		}

		if (checkout?.status !== 'Active') {
			return;
		}

		const timer = window.setTimeout(() => {
			setIsFinalizingActivationTransition(false);
		}, 450);

		return () => window.clearTimeout(timer);
	}, [checkout?.status, isFinalizingActivationTransition]);

	useEffect(() => {
		if (!isFinalizingActivationTransition) {
			return;
		}

		const fallbackTimer = window.setTimeout(() => {
			setIsFinalizingActivationTransition(false);
		}, 10000);

		return () => window.clearTimeout(fallbackTimer);
	}, [isFinalizingActivationTransition]);

	// MutationObserver for unsaved changes detection
	useEffect(() => {
		const container = contentContainerRef.current;
		if (!container) return;

		const updateState = () => {
			if (checkout?.status !== 'Active') {
				setHasActiveUnsavedChanges(false);
				setIsActiveStepSaving(false);
				return;
			}

			if (suppressUnsavedObserverRef.current) {
				setHasActiveUnsavedChanges(false);
				setIsActiveStepSaving(false);
				return;
			}

			const activeStepContainer =
				container.querySelector<HTMLElement>('[data-checkout-step-wrapper="true"][data-active-step="true"]') ?? container;

			const hasAlert = !!activeStepContainer.querySelector('[data-unsaved-changes-alert="true"]');
			const isSaving = !!activeStepContainer.querySelector('[data-unsaved-changes-saving="true"]');
			setHasActiveUnsavedChanges(hasAlert);
			setIsActiveStepSaving(isSaving);
		};

		updateState();

		const observer = new MutationObserver(updateState);
		observer.observe(container, { childList: true, subtree: true, attributes: true });

		return () => observer.disconnect();
	}, [currentStep, checkout?.id, checkout?.status]);

	// ── Computed Values ──

	const isOnboardingCompleted = !!checkout?.onboardingCompleted || completedLocally;
	const isDraftFlow = !checkout || checkout.status === 'Draft';
	const reviewStepIndex = CHECKOUT_ONBOARDING_STEPS.findIndex((step) => step.key === 'review');
	const activeStep =
		isOnboardingCompleted && currentStep === reviewStepIndex
			? Math.max(1, reviewStepIndex - 1)
			: currentStep;
	const currentStepConfig = getCheckoutStepByIndex(activeStep);
	const isFirst = isFirstStep(activeStep);
	const isLast = isLastStep(activeStep);
	const isReviewStep = currentStepConfig?.key === 'review';
	const effectiveProductsCount = formValues?.productsCount ?? productsDraft?.count ?? checkout?.products.length ?? 0;
	const reviewIssues = checkout
		? validateCheckoutOnboardingReview({
			name: formValues?.name ?? checkout.name ?? '',
			templateId: formValues?.templateId ?? checkout.template?.id ?? '',
			pixEnabled: formValues?.pixEnabled ?? checkout.config?.pixEnabled ?? false,
			creditCardEnabled: formValues?.creditCardEnabled ?? checkout.config?.creditCardEnabled ?? false,
			boletoEnabled: formValues?.boletoEnabled ?? checkout.config?.boletoEnabled ?? false,
			productsCount: formValues?.productsCount ?? checkout.products.length,
			successUrl: formValues?.successUrl ?? checkout.config?.successUrl ?? '',
			cancelUrl: formValues?.cancelUrl ?? checkout.config?.cancelUrl ?? '',
			callbackUrl: formValues?.callbackUrl ?? checkout.config?.callbackUrl ?? '',
			primaryColor: formValues?.primaryColor ?? checkout.config?.primaryColor ?? CHECKOUT_PRIMARY_COLOR_DEFAULT,
			secondaryColor: formValues?.secondaryColor ?? checkout.config?.secondaryColor ?? '',
			colorMode: formValues?.colorMode ?? checkout.config?.colorMode ?? CheckoutColorMode.Single,
		})
		: ['Checkout ainda não foi criado.'];
	const effectivePrimaryColor = formValues?.primaryColor ?? visualDraft?.primaryColor ?? checkout?.config?.primaryColor ?? '';
	const canActivate = reviewIssues.length === 0;
	const activationBlockedReason = canActivate ? null : (reviewIssues[0] ?? null);
	const statusParse = checkout?.status ? checkoutStatusParse[checkout.status] : null;

	const saveStepConfig = useCallback(async (stepKey: CheckoutStepSaveKey) => {
		if (!checkout) {
			return;
		}

		setSavingStepKey(stepKey);
		try {
			let payload: UpdateCheckoutRequest = {
				pixEnabled: formValues.pixEnabled,
				pixExpirationMinutes: formValues.pixExpirationMinutes,
				creditCardEnabled: formValues.creditCardEnabled,
				boletoEnabled: formValues.boletoEnabled,
				reservationExpirationMinutes: formValues.reservationExpirationMinutes,
				requireCustomerPhone: formValues.requireCustomerPhone,
				requireCustomerDocument: formValues.requireCustomerDocument,
				requireCustomerAddress: formValues.requireCustomerAddress,
				couponEnabled: formValues.couponEnabled,
				shippingEnabled: formValues.shippingEnabled,
				fixedShippingAmount: formValues.fixedShippingAmount ?? undefined,
				clearFixedShippingAmount: formValues.fixedShippingAmount == null,
				showTimer: formValues.showTimer,
				timerMinutes: formValues.timerMinutes,
				timerText: formValues.timerText,
				timerExpiredText: formValues.timerExpiredText,
				socialProofEnabled: formValues.socialProofEnabled,
				socialProofSettings: {
					enabled: formValues.socialProofEnabled,
					intervalSeconds: formValues.socialProofIntervalSeconds,
					durationSeconds: formValues.socialProofDurationSeconds,
					position: formValues.socialProofPosition,
					notifications: formValues.socialProofNotifications,
				},
				successUrl: formValues.successUrl,
				cancelUrl: formValues.cancelUrl,
				callbackUrl: formValues.callbackUrl,
				primaryColor: formValues.primaryColor || CHECKOUT_PRIMARY_COLOR_DEFAULT,
				secondaryColor: formValues.secondaryColor || undefined,
				colorMode: formValues.colorMode,
				logoUrl: formValues.logoUrl || '',
				backgroundImageUrl: formValues.backgroundImageUrl || '',
				faviconUrl: formValues.faviconUrl || '',
			};
			const pendingProductOperations = productsDraft?.hasPendingChanges
				? productsDraft.productOperations
				: undefined;
			const pendingMessagesChanges = messagesDraft?.hasPendingChanges
				? {
					pageTitle: messagesDraft.pageTitle,
					headerMessage: messagesDraft.headerMessage,
					subHeaderMessage: messagesDraft.subHeaderMessage,
					footerMessage: messagesDraft.footerMessage,
					successMessage: messagesDraft.successMessage,
				}
				: undefined;
			const pendingTrackingChanges = trackingDraft?.hasPendingChanges
				? { trackingSettings: trackingDraft.trackingSettings }
				: undefined;
			const pendingSeoChanges = seoDraft?.hasPendingChanges
				? { seo: seoDraft.seo }
				: undefined;

			if (pendingProductOperations && pendingProductOperations.length > 0) {
				payload = {
					...payload,
					productOperations: pendingProductOperations,
				};
			}

			if (pendingMessagesChanges) {
				payload = {
					...payload,
					...pendingMessagesChanges,
				};
			}

			if (pendingTrackingChanges) {
				payload = {
					...payload,
					...pendingTrackingChanges,
				};
			}

			if (pendingSeoChanges) {
				payload = {
					...payload,
					...pendingSeoChanges,
				};
			}

			const validationMessage = validateStepValues(stepKey, formValues);
			if (validationMessage) {
				toast('Não foi possível salvar', {
					description: validationMessage,
					variant: 'danger',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				});
				return;
			}

			const response = await updateMerchantCheckout(merchantId, checkout.id, payload);
			if (response?.error) {
				toast('Erro ao salvar', {
					description: response.error.message ?? 'Não foi possível salvar as configurações.',
					variant: 'danger',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				});
				return;
			}

			toast('Configurações salvas', {
				description:
					pendingProductOperations && pendingProductOperations.length > 0
						? 'As alterações foram salvas com sucesso, incluindo os produtos pendentes.'
						: 'As alterações foram salvas com sucesso.',
				variant: 'success',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			});

			if (pendingProductOperations && pendingProductOperations.length > 0) {
				setProductsDraft(null);
			}

			if (pendingMessagesChanges) {
				setMessagesDraft(null);
			}

			if (pendingTrackingChanges) {
				setTrackingDraft(null);
			}

			if (pendingSeoChanges) {
				setSeoDraft(null);
			}

			suppressUnsavedObserverRef.current = true;
			setHasActiveUnsavedChanges(false);
			setIsActiveStepSaving(false);
			window.setTimeout(() => {
				suppressUnsavedObserverRef.current = false;
			}, 1200);

			onRefresh();
		} finally {
			setSavingStepKey(null);
		}
	}, [checkout, formValues, merchantId, onRefresh, productsDraft, messagesDraft, trackingDraft, seoDraft]);
	const livePreviewUrl = (() => {
		if (!checkout?.checkoutUrl) {
			return null;
		}

		try {
			return buildLivePreviewUrl(checkout.checkoutUrl, {
				primaryColor: visualDraft?.primaryColor ?? checkout.config?.primaryColor ?? CHECKOUT_PRIMARY_COLOR_DEFAULT,
				secondaryColor: visualDraft?.secondaryColor ?? checkout.config?.secondaryColor ?? '',
				colorMode: visualDraft?.colorMode ?? checkout.config?.colorMode,
				logoUrl: visualDraft?.logoUrl ?? checkout.config?.logoUrl ?? '',
				backgroundImageUrl: visualDraft?.backgroundImageUrl ?? checkout.config?.backgroundImageUrl ?? '',
				faviconUrl: visualDraft?.faviconUrl ?? checkout.config?.faviconUrl ?? '',
			});
		} catch {
			return null;
		}
	})();

	const wizardSteps = CHECKOUT_ONBOARDING_STEPS.map((step, fullIndex) => {
		if (step.key === 'template') {
			return { ...step, fullIndex, isCompleted: !!(formValues?.templateId ?? checkout?.template?.id) };
		}
		if (step.key === 'payments') {
			const hasPaymentMethod = [
				formValues?.pixEnabled ?? checkout?.config?.pixEnabled,
				formValues?.creditCardEnabled ?? checkout?.config?.creditCardEnabled,
				formValues?.boletoEnabled ?? checkout?.config?.boletoEnabled,
			].some(Boolean);
			return { ...step, fullIndex, isCompleted: hasPaymentMethod };
		}
		if (step.key === 'products') {
			return { ...step, fullIndex, isCompleted: effectiveProductsCount > 0 };
		}
		if (step.key === 'visual') {
			return { ...step, fullIndex, isCompleted: !!effectivePrimaryColor };
		}
		return { ...step, fullIndex };
	});

	const isCouponFeatureEnabled = featuresDraft?.couponEnabled ?? checkout?.config?.couponEnabled ?? false;
	const shouldShowTrackingStep = supportsTracking(checkout);
	const shouldShowCouponsStep = !!checkout?.template?.supportsCoupons && isCouponFeatureEnabled;

	const requiredDraftStepKeys = new Set(
		CHECKOUT_ONBOARDING_STEPS.filter((step) => step.isRequired).map((step) => step.key)
	);

	const visibleWizardSteps = wizardSteps.filter((step) => {
		if (!isDraftFlow && step.key === 'name') {
			return false;
		}

		if (step.key === 'tracking' && !shouldShowTrackingStep) {
			return false;
		}

		if (step.key === 'coupons' && !shouldShowCouponsStep) {
			return false;
		}

		if (isDraftFlow) {
			if (step.key === 'name' || step.key === 'review') {
				return true;
			}

			return requiredDraftStepKeys.has(step.key);
		}

		if (isOnboardingCompleted && step.key === 'review') {
			return false;
		}

		return true;
	});

	const visibleContentStepKeys = new Set(visibleWizardSteps.map((step) => step.key));
	const visibleContentSteps = CHECKOUT_ONBOARDING_STEPS.filter((step) => {
		if (step.key === 'name') {
			return false;
		}

		return visibleContentStepKeys.has(step.key);
	});

	useEffect(() => {
		const isVisible = visibleWizardSteps.some((step) => step.fullIndex === currentStep);
		if (isVisible) {
			return;
		}

		const fallbackStep =
			visibleWizardSteps.find((step) => step.fullIndex > currentStep) ??
			visibleWizardSteps[visibleWizardSteps.length - 1];
		if (!fallbackStep) {
			return;
		}

		const frame = requestAnimationFrame(() => {
			setCurrentStep(fallbackStep.fullIndex);
		});

		return () => cancelAnimationFrame(frame);
	}, [currentStep, visibleWizardSteps]);

	// ── DOM-based Save Orchestration ──

	function triggerActiveStepSave() {
		const container = contentContainerRef.current;
		if (!container) return;

		const firstSaveButton = container.querySelector<HTMLButtonElement>(
			'[data-unsaved-changes-save="true"]'
		);
		firstSaveButton?.click();
	}

	// ── Navigation ──

	function handleGoToListing() {
		router.push(Routes.panel.merchant.checkouts);
	}

	function handleBack() {
		const currentVisibleIndex = visibleWizardSteps.findIndex((step) => step.fullIndex === currentStep);
		if (currentVisibleIndex <= 0) {
			handleGoToListing();
			return;
		}

		const previousStep = visibleWizardSteps[currentVisibleIndex - 1];
		if (!previousStep) {
			handleGoToListing();
			return;
		}

		setCurrentStep(previousStep.fullIndex);
	}

	function handleNext() {
		const currentVisibleIndex = visibleWizardSteps.findIndex((step) => step.fullIndex === currentStep);
		if (currentVisibleIndex < 0) {
			return;
		}

		const nextStep = visibleWizardSteps[currentVisibleIndex + 1];
		if (!nextStep) {
			setCompletedLocally(true);
			onComplete();
			return;
		}

		setCurrentStep(nextStep.fullIndex);
	}

	function handleStepClick(stepIndex: number) {
		if (stepIndex === 0 && !checkout) return;
		if (stepIndex > currentStep && !checkout) return;
		setCurrentStep(stepIndex);
	}

	// ── Name Submit ──

	function handleNameSubmit(name: string) {
		onboardingForm.setValue('name', name, { shouldValidate: true });

		if (checkout) {
			onUpdateName(name);
			handleNext();
			return;
		}
		onCreateCheckout(name);
	}

	// ── Finish Onboarding ──

	function handleFinishOnboarding() {
		if (reviewIssues.length > 0) {
			toast('Pendências para finalizar', {
				description: reviewIssues[0],
				variant: 'danger',
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
			});
			return;
		}

		if (!checkout?.id) {
			return;
		}

		setIsFinalizingActivationTransition(true);

		startStatusTransition(async () => {
			setActivationGuidePending(true);

			const config = checkout.config;
			const pendingMessagesChanges = messagesDraft?.hasPendingChanges
				? {
					pageTitle: messagesDraft.pageTitle,
					headerMessage: messagesDraft.headerMessage,
					subHeaderMessage: messagesDraft.subHeaderMessage,
					footerMessage: messagesDraft.footerMessage,
					successMessage: messagesDraft.successMessage,
				}
				: {};
			const pendingTrackingChanges = trackingDraft?.hasPendingChanges
				? { trackingSettings: trackingDraft.trackingSettings }
				: {};
			const pendingSeoChanges = seoDraft?.hasPendingChanges
				? { seo: seoDraft.seo }
				: {};
			const completionPayload: UpdateCheckoutRequest = {
				onboardingCompleted: true,
				onboardingStep: 0,
				pixEnabled: paymentsDraft?.pixEnabled ?? config?.pixEnabled ?? false,
				creditCardEnabled: paymentsDraft?.creditCardEnabled ?? config?.creditCardEnabled ?? false,
				boletoEnabled: paymentsDraft?.boletoEnabled ?? config?.boletoEnabled ?? false,
				requireCustomerPhone: customerDraft?.requireCustomerPhone ?? config?.requireCustomerPhone ?? false,
				requireCustomerDocument:
					customerDraft?.requireCustomerDocument ?? config?.requireCustomerDocument ?? false,
				requireCustomerAddress: customerDraft?.requireCustomerAddress ?? config?.requireCustomerAddress ?? false,
				couponEnabled: featuresDraft?.couponEnabled ?? config?.couponEnabled ?? false,
				showTimer: featuresDraft?.showTimer ?? config?.showTimer ?? false,
				timerMinutes: featuresDraft?.timerMinutes ?? config?.timerMinutes ?? 15,
				successUrl: urlsDraft?.successUrl ?? config?.successUrl ?? '',
				cancelUrl: urlsDraft?.cancelUrl ?? config?.cancelUrl ?? '',
				callbackUrl: urlsDraft?.callbackUrl ?? config?.callbackUrl ?? '',
				primaryColor: visualDraft?.primaryColor || config?.primaryColor || CHECKOUT_PRIMARY_COLOR_DEFAULT,
				secondaryColor: visualDraft?.secondaryColor || config?.secondaryColor || undefined,
				colorMode: visualDraft?.colorMode ?? config?.colorMode,
				logoUrl: visualDraft?.logoUrl ?? config?.logoUrl ?? '',
				backgroundImageUrl: visualDraft?.backgroundImageUrl ?? config?.backgroundImageUrl ?? '',
				faviconUrl: visualDraft?.faviconUrl ?? config?.faviconUrl ?? '',
				productOperations: productsDraft?.productOperations,
				...pendingMessagesChanges,
				...pendingTrackingChanges,
				...pendingSeoChanges,
			};

			const completionResponse = await updateMerchantCheckout(merchantId, checkout.id, completionPayload);

			if (completionResponse?.error) {
				setActivationGuidePending(false);
				setIsFinalizingActivationTransition(false);
				toast('Erro ao finalizar', {
					description: completionResponse.error.message ?? 'Não foi possível salvar e finalizar o checkout.',
					variant: 'danger',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				});
				return;
			}

			setVisualDraft(null);
			setPaymentsDraft(null);
			setCustomerDraft(null);
			setProductsDraft(null);
			setFeaturesDraft(null);
			setUrlsDraft(null);
			setContactDraft(null);
			setMessagesDraft(null);
			setTrackingDraft(null);
			setSeoDraft(null);
			suppressUnsavedObserverRef.current = true;
			setHasActiveUnsavedChanges(false);
			setIsActiveStepSaving(false);
			window.setTimeout(() => {
				suppressUnsavedObserverRef.current = false;
			}, 1200);
			setCompletedLocally(true);
			onComplete();
			onRefresh();

		});
	}

	function closeActivationGuideModal() {
		if (checkout?.id && typeof window !== 'undefined') {
			window.localStorage.setItem(`checkout-active-guide-seen:${checkout.id}`, 'true');
		}

		setIsActivationGuideModalOpen(false);
	}

	// ── Delete ──

	async function handleDeleteCheckout() {
		if (!checkout) return;

		setIsDeletingCheckout(true);
		const response = await deleteMerchantCheckout(merchantId, checkout.id);
		setIsDeletingCheckout(false);

		if (response?.error) {
			toast('Erro ao excluir checkout', {
				description: response.error.message ?? 'Não foi possível excluir o checkout.',
				variant: 'danger',
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
			});
			return;
		}

		setIsDeleteModalOpen(false);
		toast('Checkout excluído', {
			description: response?.message ?? 'O checkout foi excluído com sucesso.',
			variant: 'success',
			indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
		});

		router.push(Routes.panel.merchant.checkouts);
	}

	async function handleTransferCheckoutToProduction() {
		if (!checkout || checkout.environment !== PaymentEnvironment.Sandbox) return;

		setIsTransferringCheckout(true);
		const response = await transferMerchantCheckoutToProduction(merchantId, checkout.id);
		setIsTransferringCheckout(false);

		if (response?.error) {
			toast('Erro ao transferir checkout', {
				description: response.error.message ?? 'Não foi possível transferir o checkout para Produção.',
				variant: 'danger',
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
			});
			return;
		}

		setIsTransferModalOpen(false);
		toast('Checkout transferido', {
			description:
				response?.message ??
				'Uma cópia em Produção foi criada com sucesso. Produtos e cupons devem ser configurados no novo checkout.',
			variant: 'success',
			indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
		});

		const targetCheckoutId = response?.data?.targetCheckoutId;
		if (targetCheckoutId) {
			router.push(Routes.panel.merchant.checkoutsUpsert(targetCheckoutId));
			return;
		}

		onRefresh();
	}

	// ── Link Utilities ──

	function handleCopyLink() {
		if (!checkout?.checkoutUrl) return;

		void navigator.clipboard.writeText(checkout.checkoutUrl).then(() => {
			toast('Link copiado', {
				description: 'O link do checkout foi copiado para a area de transferencia.',
				variant: 'success',
				indicator: <Icon icon={Copy01Icon} className="icon-sm" />,
			});
		});
	}

	function handleOpenCheckoutLink() {
		if (!checkout?.checkoutUrl) return;
		window.open(checkout.checkoutUrl, '_blank', 'noopener,noreferrer');
	}

	function handleShareCheckoutLink() {
		if (!checkout?.checkoutUrl) return;

		if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
			void navigator.share({
				title: checkout.name,
				text: `Confira este checkout: ${checkout.name}`,
				url: checkout.checkoutUrl,
			});
			return;
		}

		handleCopyLink();
	}

	return {
		currentStep,
		activeStep,
		isOnboardingCompleted,
		isFirst,
		isLast,
		isReviewStep,

		isStatusPending,
		hasActiveUnsavedChanges,
		isActiveStepSaving,
		isDeletingCheckout,
		isTransferringCheckout,
		isDeleteModalOpen,
		setIsDeleteModalOpen,
		isTransferModalOpen,
		setIsTransferModalOpen,
		isActivationGuideModalOpen,
		closeActivationGuideModal,
		isFinalizingActivationTransition,
		isPreviewModalOpen,
		setIsPreviewModalOpen,
		livePreviewUrl,

		currentStepConfig,
		wizardSteps,
		visibleWizardSteps,
		visibleContentSteps,

		reviewIssues,
		canActivate,
		activationBlockedReason,
		savingStepKey,

		statusParse,

		onboardingForm,
		setOnboardingFormValues,
		saveStepConfig,

		setVisualDraft: applyVisualDraft,
		setPaymentsDraft: applyPaymentsDraft,
		setCustomerDraft: applyCustomerDraft,
		setProductsDraft: applyProductsDraft,
		setFeaturesDraft: applyFeaturesDraft,
		setUrlsDraft: applyUrlsDraft,
		setContactDraft: applyContactDraft,
		setMessagesDraft: applyMessagesDraft,
		setTrackingDraft: applyTrackingDraft,
		setSeoDraft: applySeoDraft,

		visualDraft,
		paymentsDraft,
		customerDraft,
		productsDraft,
		featuresDraft,
		urlsDraft,
		contactDraft,
		messagesDraft,
		trackingDraft,
		seoDraft,

		contentContainerRef,

		handleGoToListing,
		handleBack,
		handleNext,
		handleStepClick,

		handleNameSubmit,
		handleFinishOnboarding,
		handleDeleteCheckout,
		handleTransferCheckoutToProduction,
		triggerActiveStepSave,

		handleCopyLink,
		handleOpenCheckoutLink,
		handleShareCheckoutLink,
	};
}
