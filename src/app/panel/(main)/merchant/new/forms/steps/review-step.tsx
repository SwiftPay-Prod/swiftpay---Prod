import { Alert, Checkbox, FieldError } from '@heroui/react';
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import {
	DOCUMENT_TYPE_OPTIONS,
	IDENTITY_DOCUMENT_TYPE_OPTIONS,
	OPERATION_TYPE_OPTIONS,
} from '../../constants/merchant-onboarding.constants';
import type {
	MerchantOnboardingAnswers,
	MerchantOnboardingUploadRequirement,
} from '../../types/merchant-onboarding.types';
import { MerchantKycDocumentType } from '@/types/enums';
import { formatCurrency } from '@/utils/currency';
import { formatCep } from '@/utils/input-masks';
import { isValidCNPJ, isValidCPF, isValidCEP, isValidPhone, isValidURL } from '@/utils/validations';
import type { DocumentFilesMap, FieldCorrectionsResolver, OnboardingValueChange } from './types';

function getOptionLabel<T extends string>(
	options: Array<{ value: T; label: string }>,
	value: T | null | undefined
): string {
	if (!value) return '-';
	return options.find((option) => option.value === value)?.label ?? value;
}

function ReviewField({
	label,
	value,
	breakAll = false,
	preWrap = false,
}: {
	label: string;
	value: string;
	breakAll?: boolean;
	preWrap?: boolean;
}) {
	return (
		<div className="rounded-md border border-divider px-2 py-1.5">
			<p className="text-xs text-muted">{label}</p>
			<p
				className={[
					'text-xs font-medium text-foreground',
					breakAll ? 'break-all' : '',
					preWrap ? 'whitespace-pre-wrap' : '',
				]
					.filter(Boolean)
					.join(' ')}
			>
				{value || '-'}
			</p>
		</div>
	);
}

function StatusPill({ isValid }: { isValid: boolean }) {
	return (
		<span
			className={[
				'rounded-full px-2 py-0.5 text-xs font-medium',
				isValid ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning',
			].join(' ')}
		>
			{isValid ? 'Válido' : 'Pendente'}
		</span>
	);
}

interface ReviewStepProps {
	answers: MerchantOnboardingAnswers;
	isBusy: boolean;
	hasCorrectionRequests: boolean;
	documentFiles: DocumentFilesMap;
	requiredUploads: MerchantOnboardingUploadRequirement[];
	paymentMethodsSummary: string;
	monthlyRevenueInCents: number | null;
	averageTicketInCents: number | null;
	getFieldCorrections: FieldCorrectionsResolver;
	onValueChange: OnboardingValueChange;
	declarationAcceptedError: string | null;
}

export function ReviewStep({
	answers,
	isBusy,
	hasCorrectionRequests,
	documentFiles,
	requiredUploads,
	paymentMethodsSummary,
	monthlyRevenueInCents,
	averageTicketInCents,
	getFieldCorrections,
	onValueChange,
	declarationAcceptedError,
}: ReviewStepProps) {
	const fieldLabelMap: Partial<Record<keyof MerchantOnboardingAnswers, string>> = {
		name: 'Nome da organização',
		email: 'E-mail',
		whatsApp: 'WhatsApp',
		address: 'Endereço',
		addressNumber: 'Número',
		addressComplement: 'Complemento',
		neighborhood: 'Bairro',
		city: 'Cidade',
		state: 'Estado',
		postalCode: 'CEP',
		country: 'País',
		documentType: 'Tipo de documento',
		documentNumber: 'Documento',
		legalName: answers.documentType === MerchantKycDocumentType.CNPJ ? 'Razão social' : 'Nome completo',
		identityDocumentType: 'Documento de identidade',
		identityDocumentNumber: 'Número do documento de identidade',
		operationType: 'Tipo de operação',
		businessDescription: 'Descrição do negócio',
		website: 'Website',
		monthlyRevenue: 'Receita mensal',
		averageTicket: 'Ticket médio',
		paymentMethods: 'Métodos de pagamento',
		declarationAccepted: 'Declaração de veracidade',
	};

	for (const item of requiredUploads) {
		fieldLabelMap[item.key] = item.label;
	}

	const documentSummary = requiredUploads.map((item) => ({
		...item,
		file: documentFiles[item.key],
		isUploaded: Boolean(answers[item.key]),
	}));

	const basicSectionValid =
		Boolean(answers.name.trim()) &&
		Boolean(answers.email.trim()) &&
		Boolean(answers.whatsApp.trim()) &&
		isValidPhone(answers.whatsApp);

	const addressSectionValid =
		Boolean(answers.address.trim()) &&
		Boolean(answers.addressNumber.trim()) &&
		Boolean(answers.neighborhood.trim()) &&
		Boolean(answers.city.trim()) &&
		Boolean(answers.state.trim()) &&
		Boolean(answers.country.trim()) &&
		isValidCEP(answers.postalCode);

	const complianceDocumentValid =
		answers.documentType === MerchantKycDocumentType.CPF
			? isValidCPF(answers.documentNumber)
			: answers.documentType === MerchantKycDocumentType.CNPJ
				? isValidCNPJ(answers.documentNumber)
				: false;

	const complianceSectionValid =
		Boolean(answers.documentType) &&
		complianceDocumentValid &&
		Boolean(answers.legalName.trim()) &&
		Boolean(answers.identityDocumentType) &&
		Boolean(answers.identityDocumentNumber.trim()) &&
		Boolean(answers.operationType) &&
		Boolean(answers.businessDescription.trim()) &&
		Boolean(answers.website.trim()) &&
		isValidURL(answers.website) &&
		Boolean(answers.monthlyRevenue.trim()) &&
		Boolean(answers.averageTicket.trim()) &&
		answers.paymentMethods.length > 0;

	const documentsSectionValid = documentSummary.every((item) => item.isUploaded);

	const reviewPendingItems: string[] = [];
	if (!basicSectionValid) reviewPendingItems.push('Complete os dados básicos da organização.');
	if (!addressSectionValid) reviewPendingItems.push('Revise e complete os dados de endereço.');
	if (!complianceSectionValid) reviewPendingItems.push('Revise os dados de compliance e métodos de pagamento.');
	if (!documentsSectionValid) reviewPendingItems.push('Envie todos os documentos obrigatórios.');
	if (!answers.declarationAccepted) reviewPendingItems.push('Marque a declaração de veracidade para liberar o envio.');

	const correctionRequests = (Object.keys(answers) as Array<keyof MerchantOnboardingAnswers>).flatMap((field) =>
		getFieldCorrections(field).map((item) => ({
			itemId: item.itemId,
			fieldLabel: fieldLabelMap[field] ?? String(field),
			title: item.title,
			description: item.description,
		}))
	);

	const uniqueCorrectionRequests = Array.from(new Map(correctionRequests.map((item) => [item.itemId, item])).values());

	return (
		<div className="flex flex-col gap-3">
			<Alert status="accent">
				<Alert.Indicator>
					<Icon icon={CheckmarkCircle02Icon} className="icon-sm" />
				</Alert.Indicator>
				<Alert.Content>
					<Alert.Title>Revise todas as informações antes de enviar</Alert.Title>
					<Alert.Description>
						Depois do envio, o cadastro da organização entra em análise de compliance e documentos.
					</Alert.Description>
				</Alert.Content>
			</Alert>

			{hasCorrectionRequests && uniqueCorrectionRequests.length > 0 && (
				<div className="rounded-lg border border-warning-soft-hover bg-surface p-3">
					<div className="flex items-center gap-2">
						<div className="rounded-full bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning">
							Correções solicitadas
						</div>
						<p className="text-xs text-muted">Confira abaixo quais campos precisam de ajuste antes do reenvio.</p>
					</div>
					<div className="mt-3 flex flex-col gap-2">
						{uniqueCorrectionRequests.map((item) => (
							<div key={item.itemId} className="rounded-md border border-divider bg-content1 px-3 py-2">
								<div className="flex flex-wrap items-center gap-2">
									<span className="rounded-full bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning">
										Campo: {item.fieldLabel}
									</span>
									<p className="text-xs font-semibold text-foreground">{item.title}</p>
								</div>
								{item.description && <p className="mt-1 text-xs leading-relaxed text-muted">{item.description}</p>}
							</div>
						))}
					</div>
				</div>
			)}

			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-2">
					<div className="flex items-center justify-between">
						<p className="text-xs font-semibold text-muted">Informações básicas</p>
						<StatusPill isValid={basicSectionValid} />
					</div>
					<div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
						<ReviewField label="Nome da organização" value={answers.name} />
						<ReviewField label="E-mail" value={answers.email} breakAll />
						<ReviewField label="WhatsApp" value={answers.whatsApp} />
					</div>
				</div>

				<div className="border-t border-divider" />

				<div className="flex flex-col gap-2">
					<div className="flex items-center justify-between">
						<p className="text-xs font-semibold text-muted">Endereço</p>
						<StatusPill isValid={addressSectionValid} />
					</div>
					<div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
						<ReviewField
							label="Endereço"
							value={[answers.address, answers.addressNumber, answers.addressComplement].filter(Boolean).join(', ')}
						/>
						<ReviewField label="Bairro" value={answers.neighborhood} />
						<ReviewField label="CEP" value={formatCep(answers.postalCode)} />
						<ReviewField label="Cidade" value={answers.city} />
						<ReviewField label="Estado" value={answers.state} />
						<ReviewField label="País" value={answers.country} />
					</div>
				</div>

				<div className="border-t border-divider" />

				<div className="flex flex-col gap-2">
					<div className="flex items-center justify-between">
						<p className="text-xs font-semibold text-muted">Compliance e operação</p>
						<StatusPill isValid={complianceSectionValid} />
					</div>
					<div className="mb-2 grid grid-cols-1 gap-1.5 md:grid-cols-2">
						<ReviewField
							label="Tipo de documento"
							value={getOptionLabel(DOCUMENT_TYPE_OPTIONS, answers.documentType)}
						/>
						<ReviewField label="Documento" value={answers.documentNumber} />
						<ReviewField
							label={answers.documentType === MerchantKycDocumentType.CNPJ ? 'Razão social' : 'Nome completo'}
							value={answers.legalName}
						/>
						<ReviewField
							label="Documento de identidade"
							value={getOptionLabel(IDENTITY_DOCUMENT_TYPE_OPTIONS, answers.identityDocumentType)}
						/>
						<ReviewField label="Número do documento de identidade" value={answers.identityDocumentNumber} />
						<ReviewField
							label="Tipo de operação"
							value={getOptionLabel(OPERATION_TYPE_OPTIONS, answers.operationType)}
						/>
						<ReviewField label="Website" value={answers.website} breakAll />
						<ReviewField
							label="Receita mensal"
							value={monthlyRevenueInCents != null ? formatCurrency(monthlyRevenueInCents) : ''}
						/>
						<ReviewField
							label="Ticket médio"
							value={averageTicketInCents != null ? formatCurrency(averageTicketInCents) : ''}
						/>
						<ReviewField label="Métodos de pagamento" value={paymentMethodsSummary} />
					</div>
					<ReviewField label="Descrição do negócio" value={answers.businessDescription} preWrap />
				</div>

				<div className="border-t border-divider" />

				<div className="flex flex-col gap-2">
					<div className="flex items-center justify-between">
						<p className="text-xs font-semibold text-muted">Documentos obrigatórios</p>
						<StatusPill isValid={documentsSectionValid} />
					</div>
					<div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
						{documentSummary.map((item) => (
							<div key={item.key} className="rounded-md border border-divider px-2 py-1.5">
								<div className="flex items-center justify-between gap-2">
									<p className="text-xs text-muted">{item.label}</p>
									<span
										className={[
											'rounded-full px-2 py-0.5 text-xs font-medium',
											item.isUploaded ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
										].join(' ')}
									>
										{item.isUploaded ? 'Enviado' : 'Pendente'}
									</span>
								</div>
								<p className="mt-1 text-xs font-medium text-foreground">
									{item.file?.originalFileName || 'Arquivo ainda não enviado'}
								</p>
							</div>
						))}
					</div>
				</div>
			</div>

			{reviewPendingItems.length > 0 && (
				<div className="rounded-lg border border-warning-soft-hover bg-warning-soft px-3 py-2">
					<p className="text-xs font-semibold text-warning">Pendências para envio</p>
					<ul className="mt-1 flex list-disc flex-col gap-0.5 pl-4 text-xs text-warning">
						{reviewPendingItems.map((item) => (
							<li key={item}>{item}</li>
						))}
					</ul>
				</div>
			)}

			<Checkbox
				variant="secondary"
				isSelected={answers.declarationAccepted}
				onChange={(checked) => onValueChange('declarationAccepted', checked)}
				isDisabled={isBusy}
				className="w-full rounded-lg border border-divider px-3 py-3"
			>
				<Checkbox.Control>
					<Checkbox.Indicator />
				</Checkbox.Control>
				<Checkbox.Content>
					<span className="text-sm font-medium text-foreground">
						Declaro que todas as informações do cadastro da organização são verdadeiras e estou ciente da
						responsabilidade sobre os dados informados.
					</span>
				</Checkbox.Content>
			</Checkbox>
			{declarationAcceptedError && <FieldError>{declarationAcceptedError}</FieldError>}
		</div>
	);
}
