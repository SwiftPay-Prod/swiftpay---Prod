'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { createMerchant, respondKycPendingItem, submitOnboarding, updateMerchant } from '@/app/actions/merchant/crud';
import {
	buildInitialAnswers,
	INITIAL_STEP_ERRORS,
	MERCHANT_ONBOARDING_STEPS } from '../constants/merchant-onboarding.constants';
import {
	hasStepErrors,
	isStepValid,
	validateAllSteps,
	validateStep } from '../validations/merchant-onboarding.validation';
import type {
	MerchantOnboardingAnswers,
	MerchantOnboardingController,
	MerchantOnboardingFieldCorrection,
	MerchantOnboardingFormParams,
	MerchantOnboardingPayload,
	MerchantOnboardingStepId } from '../types/merchant-onboarding.types';
import { MerchantKycPendingItemStatus, MerchantKycStatus, MerchantOnboardingStep } from '@/types/enums';
import type { PaymentMethod } from '@/types/enums';
import { formattedCurrencyToCents } from '@/utils/currency';
import { normalizePhoneToE164 } from '@/utils/input-masks';

const PENDING_FIELD_TO_ANSWER_FIELD: Record<string, keyof MerchantOnboardingAnswers> = {
	Name: 'name',
	Email: 'email',
	WhatsApp: 'whatsApp',
	Address: 'address',
	AddressNumber: 'addressNumber',
	AddressComplement: 'addressComplement',
	Neighborhood: 'neighborhood',
	City: 'city',
	State: 'state',
	PostalCode: 'postalCode',
	Country: 'country',
	LegalName: 'legalName',
	DocumentType: 'documentType',
	DocumentNumber: 'documentNumber',
	IdentityDocumentType: 'identityDocumentType',
	IdentityDocumentNumber: 'identityDocumentNumber',
	OperationType: 'operationType',
	BusinessDescription: 'businessDescription',
	Website: 'website',
	MonthlyRevenue: 'monthlyRevenue',
	AverageTicket: 'averageTicket',
	UsesPix: 'paymentMethods',
	ProofOfAddressFileId: 'proofOfAddressFileId',
	DocumentFrontFileId: 'documentFrontFileId',
	DocumentBackFileId: 'documentBackFileId',
	SelfieFileId: 'selfieFileId',
	CnpjCardFileId: 'cnpjCardFileId',
	CompanyContractFileId: 'companyContractFileId' };

const ANSWER_FIELD_TO_PAYLOAD_KEYS: Record<keyof MerchantOnboardingAnswers, Array<keyof MerchantOnboardingPayload>> = {
	name: ['name'],
	email: ['email'],
	whatsApp: ['whatsApp'],
	address: ['address'],
	addressNumber: ['addressNumber'],
	addressComplement: ['addressComplement'],
	neighborhood: ['neighborhood'],
	city: ['city'],
	state: ['state'],
	postalCode: ['postalCode'],
	country: ['country'],
	documentType: ['documentType'],
	documentNumber: ['documentNumber'],
	legalName: ['legalName'],
	identityDocumentType: ['identityDocumentType'],
	identityDocumentNumber: ['identityDocumentNumber'],
	operationType: ['operationType'],
	businessDescription: ['businessDescription'],
	website: ['website'],
	monthlyRevenue: ['monthlyRevenue'],
	averageTicket: ['averageTicket'],
	paymentMethods: ['usesPix'],
	proofOfAddressFileId: ['proofOfAddressFileId'],
	documentFrontFileId: ['documentFrontFileId'],
	documentBackFileId: ['documentBackFileId'],
	selfieFileId: ['selfieFileId'],
	cnpjCardFileId: ['cnpjCardFileId'],
	companyContractFileId: ['companyContractFileId'],
	declarationAccepted: [] };

const ANSWER_FIELD_TO_STEP_ID: Record<keyof MerchantOnboardingAnswers, MerchantOnboardingStepId> = {
	name: 'basic',
	email: 'basic',
	whatsApp: 'basic',
	address: 'address',
	addressNumber: 'address',
	addressComplement: 'address',
	neighborhood: 'address',
	city: 'address',
	state: 'address',
	postalCode: 'address',
	country: 'address',
	documentType: 'compliance',
	documentNumber: 'compliance',
	legalName: 'compliance',
	identityDocumentType: 'compliance',
	identityDocumentNumber: 'compliance',
	operationType: 'compliance',
	businessDescription: 'compliance',
	website: 'compliance',
	monthlyRevenue: 'compliance',
	averageTicket: 'compliance',
	paymentMethods: 'compliance',
	proofOfAddressFileId: 'documents',
	documentFrontFileId: 'documents',
	documentBackFileId: 'documents',
	selfieFileId: 'documents',
	cnpjCardFileId: 'documents',
	companyContractFileId: 'documents',
	declarationAccepted: 'review' };

function getStepIndexFromMerchant(merchant: MerchantOnboardingFormParams['initialMerchant']): number {
	if (!merchant) return 0;

	switch (merchant.onboardingStep) {
		case MerchantOnboardingStep.Address:
			return 1;
		case MerchantOnboardingStep.Documents:
			return 3;
		case MerchantOnboardingStep.Billing:
			return 2;
		case MerchantOnboardingStep.Review:
		case MerchantOnboardingStep.Completed:
			return 4;
		case MerchantOnboardingStep.BasicInfo:
		default:
			return 0;
	}
}

function cleanString(value: string): string | null {
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function buildPayload(answers: MerchantOnboardingAnswers): MerchantOnboardingPayload {
	return {
		name: cleanString(answers.name),
		email: cleanString(answers.email),
		whatsApp: normalizePhoneToE164(answers.whatsApp) ?? cleanString(answers.whatsApp),
		address: cleanString(answers.address),
		addressNumber: cleanString(answers.addressNumber),
		addressComplement: cleanString(answers.addressComplement),
		neighborhood: cleanString(answers.neighborhood),
		city: cleanString(answers.city),
		state: cleanString(answers.state),
		postalCode: cleanString(answers.postalCode),
		country: cleanString(answers.country),
		legalName: cleanString(answers.legalName),
		documentType: answers.documentType,
		documentNumber: cleanString(answers.documentNumber),
		identityDocumentType: answers.identityDocumentType,
		identityDocumentNumber: cleanString(answers.identityDocumentNumber),
		operationType: answers.operationType,
		businessDescription: cleanString(answers.businessDescription),
		website: cleanString(answers.website),
		monthlyRevenue: formattedCurrencyToCents(answers.monthlyRevenue),
		averageTicket: formattedCurrencyToCents(answers.averageTicket),
		usesPix: answers.paymentMethods.includes('Pix' as PaymentMethod),
		proofOfAddressFileId: answers.proofOfAddressFileId,
		documentFrontFileId: answers.documentFrontFileId,
		documentBackFileId: answers.documentBackFileId,
		selfieFileId: answers.selfieFileId,
		cnpjCardFileId: answers.cnpjCardFileId,
		companyContractFileId: answers.companyContractFileId };
}

export function useMerchantOnboardingForm({
	initialMerchant,
	onMerchantCreated,
	onSubmitted }: MerchantOnboardingFormParams): MerchantOnboardingController {
	const defaultAnswers = useMemo(() => buildInitialAnswers(initialMerchant), [initialMerchant]);
	const form = useForm<MerchantOnboardingAnswers>({
		defaultValues: defaultAnswers,
		mode: 'onChange' });

	const watched = useWatch({ control: form.control });
	const answers: MerchantOnboardingAnswers = useMemo(
		() => ({ ...defaultAnswers, ...watched }),
		[defaultAnswers, watched]
	);

	const [merchant, setMerchant] = useState(initialMerchant);
	const [activeStepIndex, setActiveStepIndex] = useState(0);
	const [stepErrors, setStepErrors] = useState(INITIAL_STEP_ERRORS);
	const [isSavingStep, startSavingStep] = useTransition();
	const [isSubmitting, startSubmitting] = useTransition();

	useEffect(() => {
		form.reset(defaultAnswers);
		setMerchant(initialMerchant);
		setActiveStepIndex(getStepIndexFromMerchant(initialMerchant));
		setStepErrors(INITIAL_STEP_ERRORS);
	}, [defaultAnswers, form, initialMerchant]);

	const completedByStep = useMemo(
		() => ({
			basic: isStepValid('basic', answers),
			address: isStepValid('address', answers),
			compliance: isStepValid('compliance', answers),
			documents: isStepValid('documents', answers),
			review: isStepValid('review', answers) }),
		[answers]
	);

	const firstIncompleteIndex = useMemo(() => {
		const index = MERCHANT_ONBOARDING_STEPS.findIndex((step) => !completedByStep[step.id]);
		return index === -1 ? MERCHANT_ONBOARDING_STEPS.length - 1 : index;
	}, [completedByStep]);

	const activeStep = MERCHANT_ONBOARDING_STEPS[activeStepIndex] ?? MERCHANT_ONBOARDING_STEPS[0]!;
	const activeStepError = stepErrors[activeStep.id];

	const correctionsByField = useMemo(() => {
		const result: Partial<Record<keyof MerchantOnboardingAnswers, MerchantOnboardingFieldCorrection[]>> = {};
		const pendingItems = merchant?.kycPendingItems ?? [];

		for (const item of pendingItems) {
			if (item.status !== MerchantKycPendingItemStatus.Pending) {
				continue;
			}

			const answerField = PENDING_FIELD_TO_ANSWER_FIELD[item.fieldKey ?? ''];
			if (!answerField) {
				continue;
			}

			const current = result[answerField] ?? [];
			current.push({
				itemId: item.id,
				title: item.title,
				description: item.description });
			result[answerField] = current;
		}

		return result;
	}, [merchant]);

	const correctionCountByStep = useMemo(() => {
		const countByStep: Record<MerchantOnboardingStepId, number> = {
			basic: 0,
			address: 0,
			compliance: 0,
			documents: 0,
			review: 0 };

		for (const [field, corrections] of Object.entries(correctionsByField)) {
			if (!corrections || corrections.length === 0) {
				continue;
			}

			const stepId = ANSWER_FIELD_TO_STEP_ID[field as keyof MerchantOnboardingAnswers];
			countByStep[stepId] += corrections.length;
		}

		return countByStep;
	}, [correctionsByField]);

	const hasCorrectionRequests = useMemo(
		() => Object.values(correctionCountByStep).some((count) => count > 0),
		[correctionCountByStep]
	);

	const stepperSteps = useMemo(
		() =>
			MERCHANT_ONBOARDING_STEPS.map((step) => ({
				title: step.title,
				description: step.description,
				key: step.id,
				isRequired: true,
				isCompleted: completedByStep[step.id],
				hasWarning: correctionCountByStep[step.id] > 0,
				warningCount: correctionCountByStep[step.id] })),
		[completedByStep, correctionCountByStep]
	);

	const editableFields = useMemo(() => {
		if (merchant?.kycStatus !== MerchantKycStatus.Complement) {
			return null;
		}

		const pendingFields = (merchant.kycPendingItems ?? [])
			.filter((item) => item.status === MerchantKycPendingItemStatus.Pending)
			.map((item) => PENDING_FIELD_TO_ANSWER_FIELD[item.fieldKey ?? ''])
			.filter((value): value is keyof MerchantOnboardingAnswers => Boolean(value));

		if (pendingFields.length === 0) {
			return null;
		}

		return new Set<keyof MerchantOnboardingAnswers>(pendingFields);
	}, [merchant]);

	function isFieldEditable(field: keyof MerchantOnboardingAnswers): boolean {
		if (field === 'declarationAccepted') {
			return true;
		}

		if (!editableFields) {
			return true;
		}

		return editableFields.has(field);
	}

	function handleValueChange<K extends keyof MerchantOnboardingAnswers>(field: K, value: MerchantOnboardingAnswers[K]) {
		if (!isFieldEditable(field)) {
			return;
		}

		form.setValue(field, value as never, { shouldDirty: true });
		setStepErrors((prev) => ({ ...prev, [activeStep.id]: null }));
	}

	function handlePaymentMethodToggle(method: PaymentMethod) {
		const current = answers.paymentMethods;
		const next = current.includes(method)
			? current.filter((item) => item !== method)
			: [...current, method];

		handleValueChange('paymentMethods', next);
	}

	function canGoToStep(index: number): boolean {
		return index <= firstIncompleteIndex;
	}

	function goToStep(index: number) {
		if (!canGoToStep(index)) return;
		setActiveStepIndex(index);
	}

	async function persistAnswers(
		partialAnswers?: Partial<MerchantOnboardingAnswers>,
		stepId: MerchantOnboardingStepId = activeStep.id
	): Promise<boolean> {
		const merchantId = await ensureMerchantExists();
		if (!merchantId) return false;

		const mergedAnswers = { ...answers, ...partialAnswers };
		const payload = buildPayload(mergedAnswers);

		if (editableFields) {
			const partialPayload: Partial<MerchantOnboardingPayload> = {};

			for (const field of editableFields) {
				const payloadKeys = ANSWER_FIELD_TO_PAYLOAD_KEYS[field] ?? [];
				for (const payloadKey of payloadKeys) {
					partialPayload[payloadKey] = payload[payloadKey] as never;
				}
			}

			const response = await updateMerchant(merchantId, partialPayload);
			if (response.error || !response.data) {
				setStepErrors((prev) => ({
					...prev,
					[stepId]: response.error?.message ?? 'Não foi possível salvar os dados.' }));
				return false;
			}

			setMerchant(response.data);
			return true;
		}

		const response = await updateMerchant(merchantId, payload);
		if (response.error || !response.data) {
			setStepErrors((prev) => ({
				...prev,
				[stepId]: response.error?.message ?? 'Não foi possível salvar os dados.' }));
			return false;
		}

		setMerchant(response.data);
		return true;
	}

	async function ensureMerchantExists(): Promise<string | null> {
		if (merchant?.id) return merchant.id;

		const created = await createMerchant({ name: answers.name.trim() || null });
		if (created.error || !created.data) {
			setStepErrors((prev) => ({
				...prev,
				basic: created.error?.message ?? 'Não foi possível criar a organização.' }));
			return null;
		}

		setMerchant(created.data);
		await onMerchantCreated?.(created.data);
		return created.data.id;
	}

	async function persistOnboardingData(stepId: MerchantOnboardingStepId): Promise<boolean> {
		return persistAnswers(undefined, stepId);
	}

	function handleContinue() {
		const stepId = activeStep.id;
		const error = validateStep(stepId, answers);
		if (error) {
			setStepErrors((prev) => ({ ...prev, [stepId]: error }));
			return;
		}

		setStepErrors((prev) => ({ ...prev, [stepId]: null }));
		startSavingStep(async () => {
			try {
				const ok = await persistOnboardingData(stepId);
				if (!ok) return;

				setActiveStepIndex((prev) => Math.min(prev + 1, MERCHANT_ONBOARDING_STEPS.length - 1));
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : 'Ocorreu um erro ao salvar esta etapa. Tente novamente.';
				setStepErrors((prev) => ({ ...prev, [stepId]: message }));
			}
		});
	}

	function handleBack() {
		setActiveStepIndex((prev) => Math.max(prev - 1, 0));
	}

	function handleSubmit() {
		const errors = validateAllSteps(answers);
		setStepErrors(errors);
		if (hasStepErrors(errors)) {
			const firstError = MERCHANT_ONBOARDING_STEPS.findIndex((step) => errors[step.id] !== null);
			if (firstError >= 0) {
				setActiveStepIndex(firstError);
			}
			return;
		}

		startSubmitting(async () => {
			try {
				const merchantId = await ensureMerchantExists();
				if (!merchantId) return;

				const saved = await persistOnboardingData('review');
				if (!saved) return;

				const pendingItems = (merchant?.kycPendingItems ?? []).filter(
					(item) => item.status === MerchantKycPendingItemStatus.Pending
				);

				if (merchant?.kycStatus === MerchantKycStatus.Complement && pendingItems.length > 0) {
					for (const item of pendingItems) {
						const response = await respondKycPendingItem(
							merchantId,
							item.id,
							'Ajustes realizados e cadastro reenviado para nova análise.'
						);

						if (response.error) {
							setStepErrors((prev) => ({
								...prev,
								review: response.error?.message ?? 'Não foi possível responder um ou mais complementos.' }));
							return;
						}
					}

					await onSubmitted(merchantId);
					return;
				}

				const submitted = await submitOnboarding(merchantId);
				if (submitted.error || !submitted.data) {
					setStepErrors((prev) => ({
						...prev,
						review: submitted.error?.message ?? 'Não foi possível enviar o onboarding.' }));
					return;
				}

				setMerchant(submitted.data);
				await onSubmitted(submitted.data.id);
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : 'Ocorreu um erro ao enviar o cadastro. Tente novamente.';
				setStepErrors((prev) => ({ ...prev, review: message }));
			}
		});
	}

	return {
		merchant,
		activeStepIndex,
		activeStep,
		stepperSteps,
		answers,
		activeStepError,
		hasCorrectionRequests,
		correctionsByField,
		correctionCountByStep,
		isFirstStep: activeStepIndex === 0,
		isLastStep: activeStepIndex === MERCHANT_ONBOARDING_STEPS.length - 1,
		isSavingStep,
		isSubmitting,
		isFieldEditable,
		canGoToStep,
		goToStep,
		handleValueChange,
		persistAnswers,
		handlePaymentMethodToggle,
		handleContinue,
		handleBack,
		handleSubmit };
}