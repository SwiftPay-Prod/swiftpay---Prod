'use client';

import { useEffect, useRef, useState } from 'react';
import { Alert, Button, FieldError } from '@heroui/react';
import {
	Building02Icon,
	MapPinIcon,
	SecurityCheckIcon,
	File01Icon,
	CheckmarkCircle02Icon,
	ArrowLeft01Icon,
	ArrowRight01Icon,
} from '@hugeicons/core-free-icons';
import { fetchAddressByCep } from '@/app/actions/address';
import { AsyncButton } from '@/components/ui/async-button';
import { Icon } from '@/components/ui/icon';
import { SystemAccordion } from '@/components/ui/system-accordion';
import { WizardStepper } from '@/components/ui/wizard-stepper';
import { PAYMENT_METHOD_OPTIONS, UPLOAD_REQUIREMENTS } from '../constants/merchant-onboarding.constants';
import type {
	MerchantOnboardingAnswers,
	MerchantOnboardingController,
	MerchantOnboardingFieldCorrection,
	MerchantOnboardingStepId,
} from '../types/merchant-onboarding.types';
import { MerchantKycStatus } from '@/types/enums';
import { shouldShowCreditCardWarning } from '../validations/merchant-onboarding.validation';
import { formattedCurrencyToCents } from '@/utils/currency';
import { isValidCEP } from '@/utils/validations';
import { BasicStep } from './steps/basic-step';
import { AddressStep } from './steps/address-step';
import { ComplianceStep } from './steps/compliance-step';
import { DocumentsStep } from './steps/documents-step';
import { ReviewStep } from './steps/review-step';
import type { DocumentFilesMap, DocumentUploadKey } from './steps/types';
import type { FileData, MerchantData } from '@/types/merchant/crud';

interface MerchantOnboardingFormProps {
	controller: MerchantOnboardingController;
}

type OnboardingAccordionConfig = {
	icon: typeof Building02Icon;
	color: string;
};

const DOCUMENT_KEYS: DocumentUploadKey[] = [
	'proofOfAddressFileId',
	'documentFrontFileId',
	'documentBackFileId',
	'selfieFileId',
	'cnpjCardFileId',
	'companyContractFileId',
];

function buildDocumentFiles(merchant: MerchantData | null): DocumentFilesMap {
	return {
		proofOfAddressFileId: merchant?.kyc?.proofOfAddress ?? null,
		documentFrontFileId: merchant?.kyc?.documentFront ?? null,
		documentBackFileId: merchant?.kyc?.documentBack ?? null,
		selfieFileId: merchant?.kyc?.selfie ?? null,
		cnpjCardFileId: merchant?.kyc?.cnpjCard ?? null,
		companyContractFileId: merchant?.kyc?.companyContract ?? null,
	};
}

const STEP_ACCORDION_CONFIG: Record<MerchantOnboardingStepId, OnboardingAccordionConfig> = {
	basic: { icon: Building02Icon, color: 'blue' },
	address: { icon: MapPinIcon, color: 'warning' },
	compliance: { icon: SecurityCheckIcon, color: 'secondary' },
	documents: { icon: File01Icon, color: 'orange' },
	review: { icon: CheckmarkCircle02Icon, color: 'success' },
};

export function MerchantOnboardingForm({ controller }: MerchantOnboardingFormProps) {
	const {
		merchant,
		activeStep,
		activeStepError,
		activeStepIndex,
		answers,
		canGoToStep,
		correctionsByField,
		hasCorrectionRequests,
		goToStep,
		handleBack,
		handleContinue,
		handlePaymentMethodToggle,
		handleSubmit,
		handleValueChange,
		isLastStep,
		isSavingStep,
		isSubmitting,
		isFieldEditable,
		persistAnswers,
		stepperSteps,
	} = controller;

	type MerchantOnboardingAnswerField = Extract<keyof MerchantOnboardingAnswers, string>;

	function getFieldCorrections(field: MerchantOnboardingAnswerField): MerchantOnboardingFieldCorrection[] {
		return correctionsByField[field] ?? [];
	}

	const [documentFiles, setDocumentFiles] = useState<DocumentFilesMap>(() => buildDocumentFiles(merchant));
	const [allowManualAddressEntry, setAllowManualAddressEntry] = useState(false);
	const [cepLookupError, setCepLookupError] = useState<string | null>(null);
	const [hasAttemptedDocumentsContinue, setHasAttemptedDocumentsContinue] = useState(false);
	const [isFetchingCep, setIsFetchingCep] = useState(false);
	const previousMerchantIdRef = useRef<string | null>(merchant?.id ?? null);

	useEffect(() => {
		const nextFiles = buildDocumentFiles(merchant);
		const merchantId = merchant?.id ?? null;

		setDocumentFiles((current) => {
			if (previousMerchantIdRef.current !== merchantId) {
				previousMerchantIdRef.current = merchantId;
				return nextFiles;
			}

			const merged = { ...current };

			for (const key of DOCUMENT_KEYS) {
				const answerId = answers[key];
				if (!answerId) {
					merged[key] = null;
					continue;
				}

				if (!merged[key] || merged[key]?.id !== answerId) {
					merged[key] = nextFiles[key] ?? merged[key];
				}
			}

			return merged;
		});
	}, [
		answers,
		answers.cnpjCardFileId,
		answers.companyContractFileId,
		answers.documentBackFileId,
		answers.documentFrontFileId,
		answers.proofOfAddressFileId,
		answers.selfieFileId,
		merchant,
	]);

	const isBusy = isSavingStep || isSubmitting || isFetchingCep;
	const defaultPhoneCountry = answers.country.trim().toLowerCase() || 'br';
	const canEditAddressFields =
		allowManualAddressEntry || Boolean(answers.address || answers.neighborhood || answers.city || answers.state);
	const monthlyRevenueInCents = formattedCurrencyToCents(answers.monthlyRevenue);
	const averageTicketInCents = formattedCurrencyToCents(answers.averageTicket);
	const showCreditCardWarning = shouldShowCreditCardWarning(answers);
	const requiredUploads = UPLOAD_REQUIREMENTS.filter((item) => item.isRequired(answers));
	const paymentMethodsSummary =
		answers.paymentMethods.length > 0
			? answers.paymentMethods
					.map((value) => PAYMENT_METHOD_OPTIONS.find((option) => option.value === value)?.label ?? value)
					.join(', ')
			: '-';

	function matchesStepError(stepId: MerchantOnboardingStepId, ...messages: string[]): string | null {
		if (activeStep.id !== stepId || !activeStepError) {
			return null;
		}

		return messages.includes(activeStepError) ? activeStepError : null;
	}

	const declarationAcceptedError = matchesStepError(
		'review',
		'Você deve declarar que as informações do cadastro são verdadeiras.'
	);
	const accordionConfig = STEP_ACCORDION_CONFIG[activeStep.id];
	const isComplementMode = merchant?.kycStatus === MerchantKycStatus.Complement;

	const shouldShowGenericStepError = Boolean(
		activeStepError &&
		activeStep.id !== 'review' &&
		activeStep.id !== 'documents' &&
		activeStep.id !== 'compliance' &&
		activeStep.id !== 'address' &&
		activeStep.id !== 'basic'
	);

	async function handlePostalCodeChange(value: string) {
		const cleanCep = value.replace(/\D/g, '');
		handleValueChange('postalCode', cleanCep);
		setAllowManualAddressEntry(false);

		if (!isValidCEP(cleanCep)) {
			setCepLookupError(null);
			setIsFetchingCep(false);
			return;
		}

		setCepLookupError(null);
		setIsFetchingCep(true);

		const result = await fetchAddressByCep(cleanCep);
		setIsFetchingCep(false);

		if (result.success) {
			handleValueChange('address', result.data.address);
			handleValueChange('neighborhood', result.data.neighborhood);
			handleValueChange('city', result.data.city);
			handleValueChange('state', result.data.state);
			handleValueChange('country', answers.country.trim() || 'BR');
			handleValueChange('addressComplement', result.data.complement ?? answers.addressComplement);
			setCepLookupError(null);
			return;
		}

		handleValueChange('address', '');
		handleValueChange('addressNumber', '');
		handleValueChange('addressComplement', '');
		handleValueChange('neighborhood', '');
		handleValueChange('city', '');
		handleValueChange('state', '');
		handleValueChange('country', 'BR');
		setCepLookupError(result.error);
	}

	function handleContinueClick() {
		if (activeStep.id === 'documents') {
			setHasAttemptedDocumentsContinue(true);
		}

		handleContinue();
	}

	function getCurrentDocumentFile(key: DocumentUploadKey) {
		const currentFile = documentFiles[key];
		return currentFile ? [currentFile] : [];
	}

	function getDocumentUploadError(label: string): string | null {
		if (activeStep.id !== 'documents' || !hasAttemptedDocumentsContinue || !activeStepError) {
			return null;
		}

		return activeStepError === `${label} é obrigatório.` ? activeStepError : null;
	}

	async function handleDocumentFilesChange(key: DocumentUploadKey, files: FileData[]) {
		if (!isFieldEditable(key)) {
			return;
		}

		const nextFile: DocumentFilesMap[DocumentUploadKey] = files[0] ?? null;

		setDocumentFiles((current) => ({
			...current,
			[key]: nextFile,
		}));

		handleValueChange(key, nextFile?.id ?? null);

		if (!merchant?.id) {
			return;
		}

		const saved = await persistAnswers({ [key]: nextFile?.id ?? null }, 'documents');
		if (!saved && nextFile?.id) {
			setHasAttemptedDocumentsContinue(true);
		}
	}

	return (
		<div className="flex flex-col gap-4">
			{hasCorrectionRequests && (
				<Alert status="warning">
					<Alert.Indicator />
					<Alert.Content>
						<Alert.Title>Complemento/correção solicitado</Alert.Title>
						<Alert.Description>
							Existem campos marcados para ajuste. O stepper mostra as etapas com indicador amarelo e cada campo sinalizado exibe a solicitação do analista.
						</Alert.Description>
					</Alert.Content>
				</Alert>
			)}

			<WizardStepper
				steps={stepperSteps}
				currentStep={activeStepIndex}
				isDisabled={isBusy}
				onStepClick={goToStep}
				isStepClickDisabled={(index) => !canGoToStep(index)}
			/>

			<SystemAccordion
				id={`merchant-onboarding-${activeStep.id}`}
				icon={accordionConfig.icon}
				color={accordionConfig.color}
				title={activeStep.title}
				summary={activeStep.description}
				defaultExpanded
			>
				{activeStep.id === 'basic' && (
					<BasicStep
						answers={answers}
						isBusy={isBusy}
						isFieldEditable={isFieldEditable}
						defaultPhoneCountry={defaultPhoneCountry}
						matchesStepError={matchesStepError}
						getFieldCorrections={getFieldCorrections}
						onValueChange={handleValueChange}
					/>
				)}

				{activeStep.id === 'address' && (
					<AddressStep
						answers={answers}
						isBusy={isBusy}
						isFieldEditable={isFieldEditable}
						isFetchingCep={isFetchingCep}
						canEditAddressFields={canEditAddressFields}
						cepLookupError={cepLookupError}
						allowManualAddressEntry={allowManualAddressEntry}
						setAllowManualAddressEntry={setAllowManualAddressEntry}
						matchesStepError={matchesStepError}
						getFieldCorrections={getFieldCorrections}
						onPostalCodeChange={handlePostalCodeChange}
						onValueChange={handleValueChange}
					/>
				)}

				{activeStep.id === 'compliance' && (
					<ComplianceStep
						answers={answers}
						isBusy={isBusy}
						isFieldEditable={isFieldEditable}
						monthlyRevenueInCents={monthlyRevenueInCents}
						averageTicketInCents={averageTicketInCents}
						showCreditCardWarning={showCreditCardWarning}
						matchesStepError={matchesStepError}
						getFieldCorrections={getFieldCorrections}
						onValueChange={handleValueChange}
						onTogglePaymentMethod={handlePaymentMethodToggle}
					/>
				)}

				{activeStep.id === 'documents' && (
					<DocumentsStep
						merchant={merchant}
						answers={answers}
						isBusy={isBusy}
						isFieldEditable={isFieldEditable}
						requiredUploads={requiredUploads}
						getFieldCorrections={getFieldCorrections}
						getCurrentDocumentFile={getCurrentDocumentFile}
						getDocumentUploadError={getDocumentUploadError}
						onDocumentFilesChange={handleDocumentFilesChange}
					/>
				)}

				{activeStep.id === 'review' && (
					<ReviewStep
						answers={answers}
						isBusy={isBusy}
						hasCorrectionRequests={hasCorrectionRequests}
						documentFiles={documentFiles}
						requiredUploads={requiredUploads}
						paymentMethodsSummary={paymentMethodsSummary}
						monthlyRevenueInCents={monthlyRevenueInCents}
						averageTicketInCents={averageTicketInCents}
						getFieldCorrections={getFieldCorrections}
						onValueChange={handleValueChange}
						declarationAcceptedError={declarationAcceptedError}
					/>
				)}

				{shouldShowGenericStepError && <FieldError>{activeStepError}</FieldError>}

				<div className="mt-4 border-t border-divider pt-4">
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
						<Button
							variant="secondary"
							onPress={handleBack}
							isDisabled={activeStepIndex === 0 || isBusy}
							className="sm:mr-auto"
						>
							<Icon icon={ArrowLeft01Icon} className="icon-sm" />
							Voltar
						</Button>

						{!isLastStep ? (
							<Button variant="primary" onPress={handleContinueClick} isDisabled={isBusy} className="w-full sm:w-auto">
								Próximo
								<Icon icon={ArrowRight01Icon} className="icon-sm" />
							</Button>
						) : (
							<AsyncButton
								variant="primary"
								onPress={handleSubmit}
								isPending={isSubmitting}
								isDisabled={!answers.declarationAccepted || isBusy}
								className="w-full sm:w-auto"
							>
								{isComplementMode ? 'Responder complementos e reenviar para análise' : 'Finalizar e enviar cadastro'}
							</AsyncButton>
						)}
					</div>
				</div>
			</SystemAccordion>
		</div>
	);
}
