import { MerchantKycDocumentType } from '@/types/enums';
import { isValidCNPJ, isValidCPF, isValidPhone, isValidURL } from '@/utils/validations';
import type {
	MerchantOnboardingAnswers,
	MerchantOnboardingStepErrors,
	MerchantOnboardingStepId } from '../types/merchant-onboarding.types';
import { INITIAL_STEP_ERRORS, UPLOAD_REQUIREMENTS } from '../constants/merchant-onboarding.constants';

function hasValue(value: string | null | undefined): boolean {
	return !!value && value.trim().length > 0;
}

function validateBasicStep(answers: MerchantOnboardingAnswers): string | null {
	if (!hasValue(answers.name)) return 'Nome da organização é obrigatório.';
	if (!hasValue(answers.email)) return 'E-mail é obrigatório.';
	if (!hasValue(answers.whatsApp)) return 'WhatsApp é obrigatório.';
	if (!isValidPhone(answers.whatsApp)) return 'WhatsApp inválido. Informe com DDI do país.';
	return null;
}

function validateAddressStep(answers: MerchantOnboardingAnswers): string | null {
	if (!hasValue(answers.address)) return 'Endereço é obrigatório.';
	if (!hasValue(answers.addressNumber)) return 'Número do endereço é obrigatório.';
	if (!hasValue(answers.neighborhood)) return 'Bairro é obrigatório.';
	if (!hasValue(answers.city)) return 'Cidade é obrigatória.';
	if (!hasValue(answers.state)) return 'Estado é obrigatório.';
	if (!hasValue(answers.postalCode)) return 'CEP é obrigatório.';
	if (!hasValue(answers.country)) return 'País é obrigatório.';
	return null;
}

function validateComplianceStep(answers: MerchantOnboardingAnswers): string | null {
	if (!answers.documentType) return 'Tipo de documento é obrigatório.';
	if (!hasValue(answers.documentNumber)) return 'Número do documento é obrigatório.';

	if (answers.documentType === MerchantKycDocumentType.CPF && !isValidCPF(answers.documentNumber)) {
		return 'CPF inválido.';
	}

	if (answers.documentType === MerchantKycDocumentType.CNPJ && !isValidCNPJ(answers.documentNumber)) {
		return 'CNPJ inválido.';
	}

	if (!hasValue(answers.legalName)) {
		return answers.documentType === MerchantKycDocumentType.CNPJ
			? 'Razão social é obrigatória para CNPJ.'
			: 'Nome completo é obrigatório para CPF.';
	}

	if (!answers.identityDocumentType) return 'Tipo do documento de identidade é obrigatório.';
	if (!hasValue(answers.identityDocumentNumber)) return 'Número do documento de identidade é obrigatório.';
	if (!answers.operationType) return 'Tipo de operação é obrigatório.';
	if (!hasValue(answers.businessDescription)) return 'Descrição do negócio é obrigatória.';
	if (!hasValue(answers.website)) return 'Website é obrigatório.';
	if (!isValidURL(answers.website)) return 'URL inválida (ex: https://exemplo.com.br).';
	if (!hasValue(answers.monthlyRevenue)) return 'Receita mensal é obrigatória.';
	if (!hasValue(answers.averageTicket)) return 'Ticket médio é obrigatório.';

	if (answers.paymentMethods.length === 0) {
		return 'Selecione ao menos um método de pagamento.';
	}

	return null;
}

function validateDocumentsStep(answers: MerchantOnboardingAnswers): string | null {

	for (const requirement of UPLOAD_REQUIREMENTS) {
		if (!requirement.isRequired(answers)) {
			continue;
		}

		if (!answers[requirement.key]) {
			return `${requirement.label} é obrigatório.`;
		}
	}

	return null;
}

export function validateStep(stepId: MerchantOnboardingStepId, answers: MerchantOnboardingAnswers): string | null {
	if (stepId === 'basic') return validateBasicStep(answers);
	if (stepId === 'address') return validateAddressStep(answers);
	if (stepId === 'compliance') return validateComplianceStep(answers);
	if (stepId === 'documents') return validateDocumentsStep(answers);

	const complianceError = validateComplianceStep(answers);
	if (complianceError) return complianceError;

	const documentsError = validateDocumentsStep(answers);
	if (documentsError) return documentsError;

	if (!answers.declarationAccepted) {
		return 'Você deve declarar que as informações do cadastro são verdadeiras.';
	}

	return null;
}

export function validateAllSteps(answers: MerchantOnboardingAnswers): MerchantOnboardingStepErrors {
	return {
		...INITIAL_STEP_ERRORS,
		basic: validateStep('basic', answers),
		address: validateStep('address', answers),
		compliance: validateStep('compliance', answers),
		documents: validateStep('documents', answers),
		review: validateStep('review', answers) };
}

export function hasStepErrors(errors: MerchantOnboardingStepErrors): boolean {
	return Object.values(errors).some((value) => value !== null);
}

export function isStepValid(stepId: MerchantOnboardingStepId, answers: MerchantOnboardingAnswers): boolean {
	return validateStep(stepId, answers) === null;
}
