import type { MerchantData, UpdateMerchantRequest } from '@/types/merchant/crud';
import type { MerchantKycDocumentType, MerchantIdentityDocumentType, MerchantKycOperationType, PaymentMethod } from '@/types/enums';

export type MerchantOnboardingStepId = 'basic' | 'address' | 'compliance' | 'documents' | 'review';

export interface MerchantOnboardingStepDefinition {
	id: MerchantOnboardingStepId;
	title: string;
	description: string;
}

export interface MerchantOnboardingFieldCorrection {
	itemId: string;
	title: string;
	description: string | null;
}

export interface MerchantOnboardingAnswers {
	name: string;
	email: string;
	whatsApp: string;
	address: string;
	addressNumber: string;
	addressComplement: string;
	neighborhood: string;
	city: string;
	state: string;
	postalCode: string;
	country: string;
	documentType: MerchantKycDocumentType | null;
	documentNumber: string;
	legalName: string;
	identityDocumentType: MerchantIdentityDocumentType | null;
	identityDocumentNumber: string;
	operationType: MerchantKycOperationType | null;
	businessDescription: string;
	website: string;
	monthlyRevenue: string;
	averageTicket: string;
	paymentMethods: PaymentMethod[];
	proofOfAddressFileId: string | null;
	documentFrontFileId: string | null;
	documentBackFileId: string | null;
	selfieFileId: string | null;
	cnpjCardFileId: string | null;
	companyContractFileId: string | null;
	declarationAccepted: boolean;
}

export type MerchantOnboardingStepErrors = Record<MerchantOnboardingStepId, string | null>;

export interface MerchantOnboardingFormState {
	merchant: MerchantData | null;
	activeStepIndex: number;
	answers: MerchantOnboardingAnswers;
	stepErrors: MerchantOnboardingStepErrors;
	isSavingStep: boolean;
	isSubmitting: boolean;
}

export interface MerchantOnboardingFormParams {
	initialMerchant: MerchantData | null;
	onMerchantCreated?: (merchant: MerchantData) => Promise<void>;
	onSubmitted: (merchantId: string) => Promise<void>;
}

export interface MerchantOnboardingController {
	merchant: MerchantData | null;
	activeStepIndex: number;
	activeStep: MerchantOnboardingStepDefinition;
	stepperSteps: Array<{
		title: string;
		description: string;
		key: MerchantOnboardingStepId;
		isRequired: boolean;
		isCompleted: boolean;
		hasWarning?: boolean;
		warningCount?: number;
	}>;
	answers: MerchantOnboardingAnswers;
	activeStepError: string | null;
	hasCorrectionRequests: boolean;
	correctionsByField: Partial<Record<keyof MerchantOnboardingAnswers, MerchantOnboardingFieldCorrection[]>>;
	correctionCountByStep: Record<MerchantOnboardingStepId, number>;
	isFirstStep: boolean;
	isLastStep: boolean;
	isSavingStep: boolean;
	isSubmitting: boolean;
	isFieldEditable: (field: keyof MerchantOnboardingAnswers) => boolean;
	canGoToStep: (index: number) => boolean;
	goToStep: (index: number) => void;
	handleValueChange: <K extends keyof MerchantOnboardingAnswers>(field: K, value: MerchantOnboardingAnswers[K]) => void;
	persistAnswers: (partialAnswers?: Partial<MerchantOnboardingAnswers>, stepId?: MerchantOnboardingStepId) => Promise<boolean>;
	handlePaymentMethodToggle: (method: PaymentMethod) => void;
	handleContinue: () => void;
	handleBack: () => void;
	handleSubmit: () => void;
}

export interface MerchantOnboardingUploadRequirement {
	key: keyof Pick<
		MerchantOnboardingAnswers,
		'proofOfAddressFileId' | 'documentFrontFileId' | 'documentBackFileId' | 'selfieFileId' | 'cnpjCardFileId' | 'companyContractFileId'
	>;
	label: string;
	description: string;
	isRequired: (answers: MerchantOnboardingAnswers) => boolean;
}

export type MerchantOnboardingPayload = Omit<UpdateMerchantRequest, 'id'>;