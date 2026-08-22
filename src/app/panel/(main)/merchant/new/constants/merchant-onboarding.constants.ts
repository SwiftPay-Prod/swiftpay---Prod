import { MerchantIdentityDocumentType, MerchantKycDocumentType, MerchantKycOperationType, PaymentMethod } from '@/types/enums';
import type {
	MerchantOnboardingAnswers,
	MerchantOnboardingStepDefinition,
	MerchantOnboardingStepErrors,
	MerchantOnboardingUploadRequirement,
} from '../types/merchant-onboarding.types';
import type { MerchantData } from '@/types/merchant/crud';
import { centsToFormattedCurrency } from '@/utils/currency';

export const MERCHANT_ONBOARDING_STEPS: MerchantOnboardingStepDefinition[] = [
	{
		id: 'basic',
		title: 'Informações básicas',
		description: 'Dados principais da organização e contato.',
	},
	{
		id: 'address',
		title: 'Endereço',
		description: 'Localização e dados de correspondência.',
	},
	{
		id: 'compliance',
		title: 'Compliance',
		description: 'KYC, operação e métodos de pagamento.',
	},
	{
		id: 'documents',
		title: 'Documentos',
		description: 'Envie todos os documentos obrigatórios para análise.',
	},
	{
		id: 'review',
		title: 'Revisão e envio',
		description: 'Revise as informações antes de enviar para análise.',
	},
];

export const PAYMENT_METHOD_OPTIONS: Array<{ value: PaymentMethod; label: string; description: string }> = [
	{ value: PaymentMethod.Pix, label: 'PIX Instantâneo', description: 'Recebimentos em sub-50ms via SPI Banco Central.' },
];

export const DOCUMENT_TYPE_OPTIONS: Array<{ value: MerchantKycDocumentType; label: string }> = [
	{ value: MerchantKycDocumentType.CPF, label: 'CPF' },
	{ value: MerchantKycDocumentType.CNPJ, label: 'CNPJ' },
];

export const IDENTITY_DOCUMENT_TYPE_OPTIONS: Array<{ value: MerchantIdentityDocumentType; label: string }> = [
	{ value: MerchantIdentityDocumentType.RG, label: 'RG' },
	{ value: MerchantIdentityDocumentType.CNH, label: 'CNH' },
];

export const OPERATION_TYPE_OPTIONS: Array<{ value: MerchantKycOperationType; label: string }> = [
	{ value: MerchantKycOperationType.Black, label: 'Black' },
	{ value: MerchantKycOperationType.White, label: 'White' },
];

export const INITIAL_STEP_ERRORS: MerchantOnboardingStepErrors = {
	basic: null,
	address: null,
	compliance: null,
	documents: null,
	review: null,
};

export const UPLOAD_REQUIREMENTS: MerchantOnboardingUploadRequirement[] = [
	{
		key: 'companyContractFileId',
		label: 'Contrato Social ou Requerimento de Empresário',
		description: 'Documento societário atualizado da empresa.',
		isRequired: (answers) =>
			answers.documentType === MerchantKycDocumentType.CNPJ &&
			answers.paymentMethods.includes(PaymentMethod.CreditCard),
	},
	{
		key: 'cnpjCardFileId',
		label: 'Cartão CNPJ',
		description: 'Documento emitido pela Receita Federal.',
		isRequired: (answers) => answers.documentType === MerchantKycDocumentType.CNPJ,
	},
	{
		key: 'proofOfAddressFileId',
		label: 'Comprovante de Endereço',
		description: 'Últimos 3 meses.',
		isRequired: () => true,
	},
	{
		key: 'documentFrontFileId',
		label: 'Documento (Frente)',
		description: 'Frente do RG ou CNH.',
		isRequired: () => true,
	},
	{
		key: 'documentBackFileId',
		label: 'Documento (Verso)',
		description: 'Verso do RG ou CNH.',
		isRequired: () => true,
	},
	{
		key: 'selfieFileId',
		label: 'Selfie com Documento',
		description: 'Foto segurando o documento ao lado do rosto.',
		isRequired: () => true,
	},
];

export function buildInitialAnswers(merchant: MerchantData | null): MerchantOnboardingAnswers {
	const kyc = merchant?.kyc;

	const paymentMethods: PaymentMethod[] = [];
	if (kyc?.usesPix) paymentMethods.push(PaymentMethod.Pix);
	if (kyc?.usesBoleto) paymentMethods.push(PaymentMethod.Boleto);
	if (kyc?.usesCreditCard) paymentMethods.push(PaymentMethod.CreditCard);

	return {
		name: merchant?.name ?? '',
		email: merchant?.email ?? '',
		whatsApp: merchant?.whatsApp ?? '',
		address: merchant?.address?.street ?? '',
		addressNumber: merchant?.address?.number ?? '',
		addressComplement: merchant?.address?.complement ?? '',
		neighborhood: merchant?.address?.neighborhood ?? '',
		city: merchant?.address?.city ?? '',
		state: merchant?.address?.state ?? '',
		postalCode: merchant?.address?.postalCode ?? '',
		country: merchant?.address?.country ?? 'BR',
		documentType: kyc?.documentType ?? null,
		documentNumber: kyc?.documentNumber ?? '',
		legalName: kyc?.legalName ?? '',
		identityDocumentType: kyc?.identityDocumentType ?? null,
		identityDocumentNumber: kyc?.identityDocumentNumber ?? '',
		operationType: kyc?.operationType ?? null,
		businessDescription: kyc?.businessDescription ?? '',
		website: kyc?.website ?? '',
		monthlyRevenue: kyc?.monthlyRevenue != null ? centsToFormattedCurrency(kyc.monthlyRevenue) : '',
		averageTicket: kyc?.averageTicket != null ? centsToFormattedCurrency(kyc.averageTicket) : '',
		paymentMethods,
		proofOfAddressFileId: kyc?.proofOfAddress?.id ?? null,
		documentFrontFileId: kyc?.documentFront?.id ?? null,
		documentBackFileId: kyc?.documentBack?.id ?? null,
		selfieFileId: kyc?.selfie?.id ?? null,
		cnpjCardFileId: kyc?.cnpjCard?.id ?? null,
		companyContractFileId: kyc?.companyContract?.id ?? null,
		declarationAccepted: false,
	};
}