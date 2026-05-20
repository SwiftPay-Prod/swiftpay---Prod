'use client';

import type { ReactNode } from 'react';
import { Chip } from '@heroui/react';
import {
	BriefcaseDollarIcon,
	Building02Icon,
	Call02Icon,
	File01Icon,
	InformationCircleIcon,
	MapingIcon,
	Shield01Icon,
} from '@hugeicons/core-free-icons';
import { SystemAccordion } from '@/components/ui/system-accordion';
import { ImageUploader } from '@/components/ui/image-uploader';
import { DocumentDisplay, EmailLink, ExternalLink, PhoneLink } from '@/components/ui/data-links';
import {
	mapParseColorToChipColor,
	merchantDocumentTypeParse,
	merchantIdentityDocumentTypeParse,
	merchantKycStatusParse,
	merchantOperationTypeParse,
	merchantStatusParse,
} from '@/parse';
import type { AdminMerchantAddressData, AdminMerchantDetails, AdminMerchantKycData } from '@/types/admin/merchants';
import {
	MerchantIdentityDocumentType,
	MerchantKycDocumentType,
	MerchantKycOperationType,
	MerchantKycStatus,
	MerchantStatus,
	UploadFolder,
} from '@/types/enums';
import type { AddressData, MerchantData, MerchantKycData } from '@/types/merchant/crud';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/datetime';

type MerchantOrganizationAccordionData = Omit<
	Pick<MerchantData, 'id' | 'name' | 'email' | 'phoneNumber' | 'status' | 'kycStatus' | 'createdAt' | 'onboardingCompletedAt'>,
	never
> & {
	whatsApp?: string | null;
	address: AddressData | AdminMerchantAddressData | null;
	kyc: MerchantKycData | AdminMerchantKycData | null;
	kycSubmittedAt?: string | null;
	kycApprovedAt?: string | null;
};

type MerchantOrganizationAccordionViewer = 'admin' | 'merchant';

interface MerchantOrganizationAccordionProps {
	merchant: MerchantOrganizationAccordionData;
	accordionIdPrefix: string;
	viewer: MerchantOrganizationAccordionViewer;
}

interface MerchantAdminNotesAccordionProps {
	merchant: MerchantOrganizationAccordionData;
	accordionIdPrefix: string;
}

function InfoField({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="py-1">
			<p className="text-xs text-foreground-500">{label}</p>
			<div className="mt-0.5 text-sm font-medium text-foreground">{children}</div>
		</div>
	);
	}

function resolveAccordionId(prefix: string, section: string) {
	return `${prefix}-${section}`;
}

function resolvePaymentMethods(merchant: MerchantOrganizationAccordionData) {
	const methods: string[] = [];

	if (merchant.kyc?.usesPix) methods.push('PIX');
	if (merchant.kyc?.usesBoleto) methods.push('Boleto');
	if (merchant.kyc?.usesCreditCard) methods.push('Cartão de crédito');

	return methods;
}

export function MerchantOrganizationInfoAccordion({ merchant, accordionIdPrefix }: MerchantOrganizationAccordionProps) {
	const statusParse = merchantStatusParse[merchant.status as MerchantStatus];
	const kycStatusParse = merchantKycStatusParse[merchant.kycStatus as MerchantKycStatus];

	return (
		<SystemAccordion
			id={resolveAccordionId(accordionIdPrefix, 'org')}
			defaultExpanded={false}
			icon={Building02Icon}
			title="Informações da organização"
			summary="Dados principais"
			color="accent"
		>
			<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
				<InfoField label="Nome fantasia">{merchant.name || '-'}</InfoField>
				<InfoField label="Razão social / Nome completo">{merchant.kyc?.legalName || '-'}</InfoField>
				<InfoField label="Tipo de documento">
					{merchant.kyc?.documentType ? merchantDocumentTypeParse[merchant.kyc.documentType]?.label : '-'}
				</InfoField>
				<InfoField label="Documento">
					<DocumentDisplay document={merchant.kyc?.documentNumber} documentType={merchant.kyc?.documentType} className="font-medium" />
				</InfoField>
				<InfoField label="Status">
					<Chip variant="soft" size="sm" color={mapParseColorToChipColor(statusParse.color)}>
						{statusParse.label}
					</Chip>
				</InfoField>
				<InfoField label="Status KYC">
					<Chip variant="soft" size="sm" color={mapParseColorToChipColor(kycStatusParse.color)}>
						{kycStatusParse.label}
					</Chip>
				</InfoField>
			</div>
		</SystemAccordion>
	);
}

export function MerchantContactAccordion({ merchant, accordionIdPrefix }: MerchantOrganizationAccordionProps) {
	return (
		<SystemAccordion
			id={resolveAccordionId(accordionIdPrefix, 'contact')}
			defaultExpanded={false}
			icon={Call02Icon}
			title="Contato"
			summary="Dados de contato"
			color="blue"
		>
			<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
				<InfoField label="E-mail comercial">
					<EmailLink email={merchant.email} className="font-medium" />
				</InfoField>
				<InfoField label="WhatsApp">
					<PhoneLink phone={merchant.whatsApp ?? merchant.phoneNumber} className="font-medium" />
				</InfoField>
				<InfoField label="Website">
					<ExternalLink url={merchant.kyc?.website} className="font-medium" />
				</InfoField>
			</div>
		</SystemAccordion>
	);
}

export function MerchantAddressAccordion({ merchant, accordionIdPrefix }: MerchantOrganizationAccordionProps) {
	return (
		<SystemAccordion
			id={resolveAccordionId(accordionIdPrefix, 'address')}
			defaultExpanded={false}
			icon={MapingIcon}
			title="Endereço"
			summary="Dados de localização"
			color="success"
		>
			<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
				<InfoField label="Logradouro">{merchant.address?.street || '-'}</InfoField>
				<InfoField label="Número">{merchant.address?.number || '-'}</InfoField>
				<InfoField label="Complemento">{merchant.address?.complement || '-'}</InfoField>
				<InfoField label="Bairro">{merchant.address?.neighborhood || '-'}</InfoField>
				<InfoField label="Cidade">{merchant.address?.city || '-'}</InfoField>
				<InfoField label="Estado">{merchant.address?.state || '-'}</InfoField>
				<InfoField label="CEP">{merchant.address?.postalCode || '-'}</InfoField>
				<InfoField label="País">{merchant.address?.country || '-'}</InfoField>
			</div>
		</SystemAccordion>
	);
}

export function MerchantBusinessAccordion({ merchant, accordionIdPrefix }: MerchantOrganizationAccordionProps) {
	const enabledPaymentMethods = resolvePaymentMethods(merchant);

	return (
		<SystemAccordion
			id={resolveAccordionId(accordionIdPrefix, 'business')}
			defaultExpanded={false}
			icon={BriefcaseDollarIcon}
			title="Informações do negócio"
			summary="Dados operacionais"
			color="warning"
		>
			<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
				<InfoField label="Tipo de operação">
					{merchant.kyc?.operationType
						? merchantOperationTypeParse[merchant.kyc.operationType as MerchantKycOperationType]?.label
						: '-'}
				</InfoField>
				<InfoField label="Receita mensal">
					{merchant.kyc?.monthlyRevenue ? formatCurrency(merchant.kyc.monthlyRevenue) : '-'}
				</InfoField>
				<InfoField label="Ticket médio">
					{merchant.kyc?.averageTicket ? formatCurrency(merchant.kyc.averageTicket) : '-'}
				</InfoField>
				<InfoField label="Métodos de pagamento">
					{enabledPaymentMethods.length > 0 ? (
						<div className="flex flex-wrap gap-1">
							{enabledPaymentMethods.map((method) => (
								<Chip key={method} variant="soft" size="sm" color="accent">
									{method}
								</Chip>
							))}
						</div>
					) : (
						'-'
					)}
				</InfoField>
				<div className="md:col-span-2">
					<InfoField label="Descrição do negócio">{merchant.kyc?.businessDescription || '-'}</InfoField>
				</div>
			</div>
		</SystemAccordion>
	);
}

export function MerchantDocumentsAccordion({ merchant, accordionIdPrefix, viewer }: MerchantOrganizationAccordionProps) {
	const imageUploaderProps =
		viewer === 'admin'
			? { isAdmin: true as const }
			: { merchantId: merchant.id, isAdmin: false as const };

	return (
		<SystemAccordion
			id={resolveAccordionId(accordionIdPrefix, 'documents')}
			defaultExpanded={false}
			icon={File01Icon}
			title="Documentos"
			summary="Arquivos do KYC"
			color="accent"
		>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<ImageUploader
					{...imageUploaderProps}
					folder={UploadFolder.Kyc}
					label="Comprovante de endereço"
					description="Documento que comprova o endereço da organização"
					maxFiles={1}
					value={[]}
					onChange={() => {}}
					fileValue={merchant.kyc?.proofOfAddress ? [merchant.kyc.proofOfAddress] : []}
					onFileValueChange={() => {}}
					onlyView
					sensitivePreview
				/>
				<ImageUploader
					{...imageUploaderProps}
					folder={UploadFolder.Kyc}
					label="Documento de identidade (frente)"
					description="Frente do documento de identidade do responsável"
					maxFiles={1}
					value={[]}
					onChange={() => {}}
					fileValue={merchant.kyc?.documentFront ? [merchant.kyc.documentFront] : []}
					onFileValueChange={() => {}}
					onlyView
					sensitivePreview
				/>
				<ImageUploader
					{...imageUploaderProps}
					folder={UploadFolder.Kyc}
					label="Documento de identidade (verso)"
					description="Verso do documento de identidade do responsável"
					maxFiles={1}
					value={[]}
					onChange={() => {}}
					fileValue={merchant.kyc?.documentBack ? [merchant.kyc.documentBack] : []}
					onFileValueChange={() => {}}
					onlyView
					sensitivePreview
				/>
				<ImageUploader
					{...imageUploaderProps}
					folder={UploadFolder.Kyc}
					label="Selfie com documento"
					description="Foto do responsável segurando o documento"
					maxFiles={1}
					value={[]}
					onChange={() => {}}
					fileValue={merchant.kyc?.selfie ? [merchant.kyc.selfie] : []}
					onFileValueChange={() => {}}
					onlyView
					sensitivePreview
				/>
				{merchant.kyc?.documentType === MerchantKycDocumentType.CNPJ && (
					<ImageUploader
						{...imageUploaderProps}
						folder={UploadFolder.Kyc}
						label="Cartão CNPJ"
						description="Documento emitido pela Receita Federal"
						maxFiles={1}
						value={[]}
						onChange={() => {}}
						fileValue={merchant.kyc?.cnpjCard ? [merchant.kyc.cnpjCard] : []}
						onFileValueChange={() => {}}
						onlyView
						sensitivePreview
					/>
				)}
				{merchant.kyc?.documentType === MerchantKycDocumentType.CNPJ && merchant.kyc?.usesCreditCard && (
					<ImageUploader
						{...imageUploaderProps}
						folder={UploadFolder.Kyc}
						label="Contrato social"
						description="Obrigatório para CNPJ com cartão de crédito habilitado"
						maxFiles={1}
						value={[]}
						onChange={() => {}}
						fileValue={merchant.kyc?.companyContract ? [merchant.kyc.companyContract] : []}
						onFileValueChange={() => {}}
						onlyView
						sensitivePreview
					/>
				)}
			</div>
		</SystemAccordion>
	);
}

export function MerchantDatesAccordion({ merchant, accordionIdPrefix }: MerchantOrganizationAccordionProps) {
	return (
		<SystemAccordion
			id={resolveAccordionId(accordionIdPrefix, 'dates')}
			defaultExpanded={false}
			icon={InformationCircleIcon}
			title="Datas"
			summary="Histórico de criação e conclusão"
			color="secondary"
		>
			<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
				<InfoField label="Criada em">{formatDate(merchant.createdAt)}</InfoField>
				<InfoField label="Onboarding concluído em">
					{merchant.onboardingCompletedAt ? formatDate(merchant.onboardingCompletedAt) : '-'}
				</InfoField>
				<InfoField label="KYC enviado em">{merchant.kycSubmittedAt ? formatDate(merchant.kycSubmittedAt) : '-'}</InfoField>
				<InfoField label="KYC aprovado em">{merchant.kycApprovedAt ? formatDate(merchant.kycApprovedAt) : '-'}</InfoField>
			</div>
		</SystemAccordion>
	);
}

export function MerchantAdminNotesAccordion({ merchant, accordionIdPrefix }: MerchantAdminNotesAccordionProps) {
	if (!merchant.kyc?.adminNotes) {
		return null;
	}

	return (
		<SystemAccordion
			id={resolveAccordionId(accordionIdPrefix, 'admin-notes')}
			defaultExpanded={false}
			icon={Shield01Icon}
			title="Notas administrativas (interno)"
			summary="Observações internas da análise de KYC"
			color="danger"
		>
			<p className="whitespace-pre-wrap text-sm text-foreground">{merchant.kyc.adminNotes}</p>
		</SystemAccordion>
	);
}

export type { MerchantOrganizationAccordionData };