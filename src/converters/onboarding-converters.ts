import type { MerchantData, UpdateMerchantRequest } from '@/types/merchant/crud';
import { normalizePhoneToE164 } from '@/utils/input-masks';

export type BasicInfoFormData = Pick<UpdateMerchantRequest, 'name' | 'email' | 'whatsApp'>;

export type AddressFormData = Pick<
	UpdateMerchantRequest,
	| 'address'
	| 'addressNumber'
	| 'addressComplement'
	| 'neighborhood'
	| 'city'
	| 'state'
	| 'postalCode'
	| 'country'
>;

export type DocumentsFormData = Pick<
	UpdateMerchantRequest,
	| 'legalName'
	| 'documentType'
	| 'documentNumber'
	| 'identityDocumentType'
	| 'identityDocumentNumber'
	| 'operationType'
	| 'proofOfAddressFileId'
	| 'documentFrontFileId'
	| 'documentBackFileId'
	| 'selfieFileId'
>;

export type BillingFormData = Pick<
	UpdateMerchantRequest,
	| 'website'
	| 'businessDescription'
	| 'monthlyRevenue'
	| 'averageTicket'
>;

export function merchantToBasicInfoFormData(merchant: MerchantData): BasicInfoFormData {
	return {
		name: merchant.name,
		email: merchant.email,
		whatsApp: normalizePhoneToE164(merchant.whatsApp),
	};
}

export function merchantToAddressFormData(merchant: MerchantData): AddressFormData {
	return {
		address: merchant.address?.street ?? null,
		addressNumber: merchant.address?.number ?? null,
		addressComplement: merchant.address?.complement ?? null,
		neighborhood: merchant.address?.neighborhood ?? null,
		city: merchant.address?.city ?? null,
		state: merchant.address?.state ?? null,
		postalCode: merchant.address?.postalCode ?? null,
		country: merchant.address?.country ?? 'BR',
	};
}

export function merchantToDocumentsFormData(merchant: MerchantData): DocumentsFormData {
	const kyc = merchant.kyc;
	return {
		legalName: kyc?.legalName ?? null,
		documentType: kyc?.documentType as DocumentsFormData['documentType'],
		documentNumber: kyc?.documentNumber ?? null,
		identityDocumentType: kyc?.identityDocumentType as DocumentsFormData['identityDocumentType'],
		identityDocumentNumber: kyc?.identityDocumentNumber ?? null,
		operationType: kyc?.operationType as DocumentsFormData['operationType'],
		proofOfAddressFileId: kyc?.proofOfAddress?.id ?? null,
		documentFrontFileId: kyc?.documentFront?.id ?? null,
		documentBackFileId: kyc?.documentBack?.id ?? null,
		selfieFileId: kyc?.selfie?.id ?? null,
	};
}

export function merchantToBillingFormData(merchant: MerchantData): BillingFormData {
	const kyc = merchant.kyc;
	const monthlyRevenueInReais =
		kyc?.monthlyRevenue != null ? kyc.monthlyRevenue / 100 : null;
	const averageTicketInReais =
		kyc?.averageTicket != null ? kyc.averageTicket / 100 : null;
	return {
		website: kyc?.website ?? null,
		businessDescription: kyc?.businessDescription ?? null,
		monthlyRevenue: monthlyRevenueInReais,
		averageTicket: averageTicketInReais,
	};
}

