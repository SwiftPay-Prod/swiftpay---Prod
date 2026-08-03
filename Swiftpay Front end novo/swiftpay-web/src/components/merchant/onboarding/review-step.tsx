'use client';

import { useTransition } from 'react';
import { Button, Card, Chip } from '@heroui/react';
import { toast } from '@heroui/react';
import { submitOnboarding } from '@/app/actions/merchant/crud';
import type { MerchantData } from '@/types/merchant/crud';
import { useRouter } from 'next/navigation';
import { Routes } from '@/router/routes';
import { Icon } from '@/components/ui/icon';
import {
	Alert01Icon,
	ArrowRight01Icon,
	CheckmarkCircle02Icon,
	File01Icon,
	CancelCircleIcon,
} from '@hugeicons/core-free-icons';
import { AsyncButton } from '@/components/ui/async-button';
import { EmailLink, PhoneLink, DocumentDisplay } from '@/components/ui/data-links';
import { MerchantKycStatus, MerchantKycDocumentType, MerchantIdentityDocumentType, MerchantKycOperationType } from '@/types/enums';
import { merchantDocumentTypeParse, merchantIdentityDocumentTypeParse, merchantOperationTypeParse } from '@/parse';

interface ReviewStepProps {
	merchant: MerchantData;
	onBack: () => void;
	onSubmitSuccess: (merchantId?: string) => void;
}

interface ReviewItemProps {
	label: string;
	value: React.ReactNode;
	isComplete?: boolean;
}

function ReviewItem({ label, value, isComplete = true }: ReviewItemProps) {
	return (
		<div className="flex justify-between items-start py-2.5">
			<span className="text-muted text-small">{label}</span>
			<div className="flex items-center gap-2">
				<span className="text-foreground text-small font-medium text-right max-w-60 truncate">
					{value || <span className="text-muted italic">Não informado</span>}
				</span>
				{isComplete ? (
					<Icon icon={CheckmarkCircle02Icon} className="size-4 text-success shrink-0" />
				) : (
					<Icon icon={Alert01Icon} className="size-4 text-warning shrink-0" />
				)}
			</div>
		</div>
	);
}

function DocumentReviewItem({ label, hasFile, isComplete }: { label: string; hasFile: boolean; isComplete: boolean }) {
	return (
		<div className="flex justify-between items-center py-2.5">
			<div className="flex items-center gap-2">
				<Icon icon={File01Icon} className="size-4 text-muted" />
				<span className="text-muted text-small">{label}</span>
			</div>
			<div className="flex items-center gap-2">
				<Chip variant="soft" size="sm" color={hasFile ? 'success' : 'warning'}>
					{hasFile ? 'Enviado' : 'Pendente'}
				</Chip>
				{isComplete ? (
					<Icon icon={CheckmarkCircle02Icon} className="size-4 text-success shrink-0" />
				) : (
					<Icon icon={Alert01Icon} className="size-4 text-warning shrink-0" />
				)}
			</div>
		</div>
	);
}

function ReviewSection({
	title,
	children,
	isComplete,
}: {
	title: string;
	children: React.ReactNode;
	isComplete: boolean;
}) {
	return (
		<Card className="bg-content2">
			<Card.Content className="gap-0">
				<div className="flex items-center justify-between mb-3">
					<h4 className="text-medium font-semibold text-foreground">{title}</h4>
					<Chip variant="soft" size="sm" color={isComplete ? 'success' : 'warning'}>
						{isComplete ? 'Completo' : 'Incompleto'}
					</Chip>
				</div>
				<div className="divide-y divide-default-200">{children}</div>
			</Card.Content>
		</Card>
	);
}

export function ReviewStep({ merchant, onBack, onSubmitSuccess }: ReviewStepProps) {
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	const isComplement = merchant.kycStatus === MerchantKycStatus.Complement;

	// Basic Info validation
	const hasName = !!merchant.name;
	const hasEmail = !!merchant.email;
	const hasWhatsApp = !!merchant.whatsApp;
	const basicInfoComplete = hasName && hasEmail && hasWhatsApp;

	// Address validation
	const hasStreet = !!merchant.address?.street;
	const hasNumber = !!merchant.address?.number;
	const hasNeighborhood = !!merchant.address?.neighborhood;
	const hasCity = !!merchant.address?.city;
	const hasState = !!merchant.address?.state;
	const hasPostalCode = !!merchant.address?.postalCode;
	const addressComplete = hasStreet && hasNumber && hasNeighborhood && hasCity && hasState && hasPostalCode;

	// KYC Legal Info validation
	const hasLegalName = !!merchant.kyc?.legalName;
	const hasDocumentType = !!merchant.kyc?.documentType;
	const hasDocumentNumber = !!merchant.kyc?.documentNumber;
	const legalInfoComplete = hasLegalName && hasDocumentType && hasDocumentNumber;

	// Identity Document validation
	const hasIdentityDocumentType = !!merchant.kyc?.identityDocumentType;
	const hasIdentityDocumentNumber = !!merchant.kyc?.identityDocumentNumber;
	const identityDocumentComplete = hasIdentityDocumentType && hasIdentityDocumentNumber;

	// Business Info validation
	const hasOperationType = !!merchant.kyc?.operationType;
	const businessInfoComplete = hasOperationType;

	// Billing Info validation
	const hasWebsite = !!merchant.kyc?.website;
	const hasBusinessDescription = !!merchant.kyc?.businessDescription;
	const hasMonthlyRevenue = !!merchant.kyc?.monthlyRevenue && merchant.kyc.monthlyRevenue > 0;
	const hasAverageTicket = !!merchant.kyc?.averageTicket && merchant.kyc.averageTicket > 0;
	const billingInfoComplete = hasWebsite && hasBusinessDescription && hasMonthlyRevenue && hasAverageTicket;

	// Documents Files validation
	const hasProofOfAddress = !!merchant.kyc?.proofOfAddress;
	const hasDocumentFront = !!merchant.kyc?.documentFront;
	const hasDocumentBack = !!merchant.kyc?.documentBack;
	const hasSelfie = !!merchant.kyc?.selfie;
	const documentsComplete = hasProofOfAddress && hasDocumentFront && hasDocumentBack && hasSelfie;

	const allComplete =
		basicInfoComplete &&
		addressComplete &&
		legalInfoComplete &&
		identityDocumentComplete &&
		businessInfoComplete &&
		billingInfoComplete &&
		documentsComplete;

	const getDocumentTypeLabel = (type: MerchantKycDocumentType | null | undefined) => {
		if (!type) return null;
		return merchantDocumentTypeParse[type]?.label ?? type;
	};

	const getIdentityDocumentTypeLabel = (type: MerchantIdentityDocumentType | null | undefined) => {
		if (!type) return null;
		return merchantIdentityDocumentTypeParse[type]?.label ?? type;
	};

	const getOperationTypeLabel = (type: MerchantKycOperationType | null | undefined) => {
		if (!type) return null;
		return merchantOperationTypeParse[type]?.label ?? type;
	};

	const formatCurrency = (value: number | null | undefined) => {
		if (!value) return null;
		return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
	};

	const formatPostalCode = (cep: string | null | undefined) => {
		if (!cep) return null;
		const clean = cep.replace(/\D/g, '');
		if (clean.length === 8) {
			return `${clean.slice(0, 5)}-${clean.slice(5)}`;
		}
		return cep;
	};

	function handleSubmit() {
		if (!allComplete) {
			toast('Informações incompletas', {
				description: 'Preencha todas as informações obrigatórias antes de enviar.',
				indicator: <Icon icon={Alert01Icon} className="icon-sm" />,
				variant: 'warning',
			});
			return;
		}

		startTransition(async () => {
			const response = await submitOnboarding(merchant.id);

			if (response.error) {
				toast('Erro ao enviar', {
					description: response.error.message ?? 'Tente novamente mais tarde.',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
				return;
			}

			toast('Cadastro enviado!', {
				description: 'Seu cadastro foi enviado para análise. Aguarde a aprovação.',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				variant: 'success',
			});

			if (response?.data) {
				onSubmitSuccess(response?.data.id);
			} else {
				onSubmitSuccess();
			}

			router.push(Routes.panel.merchant.review);
		});
	}

	function handleGoToReview() {
		if (!allComplete) {
			toast('Informações incompletas', {
				description: 'Preencha todas as informações obrigatórias antes de voltar para análise.',
				indicator: <Icon icon={Alert01Icon} className="icon-sm" />,
				variant: 'warning',
			});
			return;
		}

		router.push(Routes.panel.merchant.review);
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h2 className="text-xl font-semibold text-foreground">Revisão do Cadastro</h2>
				<p className="text-default-500 mt-1">Confira todas as informações antes de enviar para análise.</p>
			</div>

			<div className="h-px bg-divider" />

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<ReviewSection title="Informações Básicas" isComplete={basicInfoComplete}>
					<ReviewItem label="Nome Fantasia" value={merchant.name} isComplete={hasName} />
					<ReviewItem label="E-mail Comercial" value={<EmailLink email={merchant.email} />} isComplete={hasEmail} />
					<ReviewItem label="WhatsApp" value={<PhoneLink phone={merchant.whatsApp} />} isComplete={hasWhatsApp} />
				</ReviewSection>

				<ReviewSection title="Endereço" isComplete={addressComplete}>
					<ReviewItem 
						label="Endereço Completo" 
						value={merchant.address?.street && merchant.address?.number 
							? `${merchant.address.street}, ${merchant.address.number}${merchant.address.complement ? ` - ${merchant.address.complement}` : ''}`
							: null
						} 
						isComplete={hasStreet && hasNumber} 
					/>
					<ReviewItem label="Bairro" value={merchant.address?.neighborhood} isComplete={hasNeighborhood} />
					<ReviewItem 
						label="Cidade / Estado" 
						value={merchant.address?.city && merchant.address?.state 
							? `${merchant.address.city} - ${merchant.address.state}`
							: null
						} 
						isComplete={hasCity && hasState} 
					/>
					<ReviewItem label="CEP" value={formatPostalCode(merchant.address?.postalCode)} isComplete={hasPostalCode} />
				</ReviewSection>

				<ReviewSection title="Dados Jurídicos" isComplete={legalInfoComplete}>
					<ReviewItem label="Razão Social" value={merchant.kyc?.legalName} isComplete={hasLegalName} />
					<ReviewItem label="Tipo de Pessoa" value={getDocumentTypeLabel(merchant.kyc?.documentType)} isComplete={hasDocumentType} />
					<ReviewItem
						label={merchant.kyc?.documentType === 'CNPJ' ? 'CNPJ' : 'CPF'}
						value={<DocumentDisplay document={merchant.kyc?.documentNumber} documentType={merchant.kyc?.documentType} />}
						isComplete={hasDocumentNumber}
					/>
				</ReviewSection>

				<ReviewSection title="Informações do Negócio" isComplete={businessInfoComplete}>
					<ReviewItem label="Tipo de Operação" value={getOperationTypeLabel(merchant.kyc?.operationType)} isComplete={hasOperationType} />
				</ReviewSection>

				<ReviewSection title="Faturamento" isComplete={billingInfoComplete}>
					<ReviewItem label="Website" value={merchant.kyc?.website} isComplete={hasWebsite} />
					<ReviewItem
						label="Faturamento Mensal"
						value={formatCurrency(merchant.kyc?.monthlyRevenue != null ? merchant.kyc.monthlyRevenue / 100 : null)}
						isComplete={hasMonthlyRevenue}
					/>
					<ReviewItem
						label="Ticket Médio"
						value={formatCurrency(merchant.kyc?.averageTicket != null ? merchant.kyc.averageTicket / 100 : null)}
						isComplete={hasAverageTicket}
					/>
					<ReviewItem
						label="Descrição do Negócio"
						value={merchant.kyc?.businessDescription}
						isComplete={hasBusinessDescription}
					/>
				</ReviewSection>

				<ReviewSection title="Documento de Identidade do Responsável" isComplete={identityDocumentComplete}>
					<ReviewItem
						label="Tipo de Documento"
						value={getIdentityDocumentTypeLabel(merchant.kyc?.identityDocumentType)}
						isComplete={hasIdentityDocumentType}
					/>
					<ReviewItem
						label="Número do Documento"
						value={merchant.kyc?.identityDocumentNumber}
						isComplete={hasIdentityDocumentNumber}
					/>
				</ReviewSection>

				<ReviewSection title="Documentos Anexados" isComplete={documentsComplete}>
					<DocumentReviewItem
						label="Comprovante de Endereço"
						hasFile={hasProofOfAddress}
						isComplete={hasProofOfAddress}
					/>
					<DocumentReviewItem
						label="Documento (Frente)"
						hasFile={hasDocumentFront}
						isComplete={hasDocumentFront}
					/>
					<DocumentReviewItem
						label="Documento (Verso)"
						hasFile={hasDocumentBack}
						isComplete={hasDocumentBack}
					/>
					<DocumentReviewItem
						label="Selfie com Documento"
						hasFile={hasSelfie}
						isComplete={hasSelfie}
					/>
				</ReviewSection>
			</div>

			{!allComplete && (
				<div className="flex items-center gap-2 p-4 rounded-medium bg-warning/10 border border-warning-soft-hover">
					<Icon icon={Alert01Icon} className="size-5 text-warning shrink-0" />
					<p className="text-small text-warning">
						Algumas informações obrigatórias estão pendentes. Volte e preencha antes de enviar.
					</p>
				</div>
			)}

			<div className="flex justify-between items-center pt-4">
				<Button variant="secondary" onPress={onBack}>
					Voltar
				</Button>
			{isComplement ? (
					<Button variant="primary" onPress={handleGoToReview} isDisabled={!allComplete}>
						Voltar para Análise
						<Icon icon={ArrowRight01Icon} className="icon-sm" />
					</Button>
				) : (
					<AsyncButton variant="primary" onPress={handleSubmit} isPending={isPending} isDisabled={!allComplete}>
						Enviar para Análise
					</AsyncButton>
				)}
			</div>
		</div>
	);
}

