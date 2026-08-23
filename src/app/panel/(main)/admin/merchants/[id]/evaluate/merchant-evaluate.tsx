'use client';

import { useState, useTransition, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
	Chip,
	Alert,
	TextField,
	Button,
	Modal,
	Avatar,
	InputGroup,
} from '@heroui/react';
import { toast } from '@heroui/react';
import { Routes } from '@/router/routes';
import {
	ArrowLeft01Icon,
	CheckmarkCircle02Icon as CheckCircle,
	CancelCircleIcon as CloseCircle,
	ServerStack01Icon,
	Search01Icon,
	QrCodeIcon,
	Wallet01Icon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import type { AdminMerchantDetails, EvaluatePendingItemRequest } from '@/types/admin/merchants';
import { KycPendingItemEvaluationStatus } from '@/types/admin/merchants';
import {
	MerchantKycEvaluationStatus,
	MerchantKycPendingField,
	MerchantKycPendingItemStatus,
	MerchantKycPendingItemType,
	FeeChargeMode,
} from '@/types/enums';
import type { AdminAcquirerData } from '@/types/admin/acquirers';
import {
	merchantStatusParse,
	merchantKycStatusParse,
	mapParseColorToChipColor,
	acquirerOperationTypeParse,
	merchantDocumentTypeParse,
	merchantIdentityDocumentTypeParse,
	merchantOperationTypeParse,
} from '@/parse';
import { formatFeeRate } from '@/utils/currency';
import { adminEvaluateMerchantKyc, adminEvaluateKycPendingItem } from '@/app/actions/admin/merchants';
import { adminListAcquirers, adminSetMerchantAcquirer } from '@/app/actions/admin/acquirers';
import { AsyncButton } from '@/components/ui/async-button';
import { OrganizationAccordions } from './components/organization-accordions';
import { PendingResponsesCard } from './components/pending-responses-card';
import { DecisionCard } from './components/decision-card';

function formatFeeDisplay(fixed: number | null, percentage: number | null, mode: string | null): string {
	return formatFeeRate(mode as FeeChargeMode | null, fixed, percentage);
}

const PENDING_FIELD_OPTIONS: Array<{ value: MerchantKycPendingField; label: string }> = [
	{ value: MerchantKycPendingField.Name, label: 'Nome da organização' },
	{ value: MerchantKycPendingField.Email, label: 'E-mail' },
	{ value: MerchantKycPendingField.PhoneNumber, label: 'Telefone' },
	{ value: MerchantKycPendingField.WhatsApp, label: 'WhatsApp' },
	{ value: MerchantKycPendingField.Address, label: 'Endereço' },
	{ value: MerchantKycPendingField.AddressNumber, label: 'Número' },
	{ value: MerchantKycPendingField.AddressComplement, label: 'Complemento' },
	{ value: MerchantKycPendingField.Neighborhood, label: 'Bairro' },
	{ value: MerchantKycPendingField.City, label: 'Cidade' },
	{ value: MerchantKycPendingField.State, label: 'Estado' },
	{ value: MerchantKycPendingField.PostalCode, label: 'CEP' },
	{ value: MerchantKycPendingField.Country, label: 'País' },
	{ value: MerchantKycPendingField.LegalName, label: 'Razão social / Nome completo' },
	{ value: MerchantKycPendingField.DocumentType, label: 'Tipo de documento' },
	{ value: MerchantKycPendingField.DocumentNumber, label: 'CPF / CNPJ' },
	{ value: MerchantKycPendingField.IdentityDocumentType, label: 'Documento de identidade' },
	{ value: MerchantKycPendingField.IdentityDocumentNumber, label: 'Número do documento de identidade' },
	{ value: MerchantKycPendingField.OperationType, label: 'Tipo de operação' },
	{ value: MerchantKycPendingField.BusinessDescription, label: 'Descrição do negócio' },
	{ value: MerchantKycPendingField.Website, label: 'Website' },
	{ value: MerchantKycPendingField.MonthlyRevenue, label: 'Receita mensal (R$)' },
	{ value: MerchantKycPendingField.AverageTicket, label: 'Ticket médio (R$)' },
	{ value: MerchantKycPendingField.UsesPix, label: 'Métodos de pagamento utilizados (PIX)' },
	{ value: MerchantKycPendingField.ProofOfAddressFileId, label: 'Comprovante de endereço' },
	{ value: MerchantKycPendingField.DocumentFrontFileId, label: 'Documento frente' },
	{ value: MerchantKycPendingField.DocumentBackFileId, label: 'Documento verso' },
	{ value: MerchantKycPendingField.SelfieFileId, label: 'Selfie com documento' },
	{ value: MerchantKycPendingField.CnpjCardFileId, label: 'Cartão CNPJ' },
	{ value: MerchantKycPendingField.CompanyContractFileId, label: 'Contrato social' },
];
function getPendingFieldLabel(fieldKey: MerchantKycPendingField | null | undefined): string {
	if (!fieldKey) return 'Campo não informado';
	return PENDING_FIELD_OPTIONS.find((item) => item.value === fieldKey)?.label ?? fieldKey;
}

function getBooleanLabel(value: boolean | null | undefined): string {
	if (value == null) return '-';
	return value ? 'Sim' : 'Não';
}

interface MerchantEvaluateProps {
	merchant: AdminMerchantDetails;
}

export function MerchantEvaluate({ merchant }: MerchantEvaluateProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [isEvaluatingItem, startEvaluateItemTransition] = useTransition();
	const [decision, setDecision] = useState<MerchantKycEvaluationStatus | null>(null);
	const [reason, setReason] = useState('');
	const [pendingItems, setPendingItems] = useState<EvaluatePendingItemRequest[]>([]);
	const [pendingFieldSearchValues, setPendingFieldSearchValues] = useState<Record<number, string>>({});
	const [rejectingItemId, setRejectingItemId] = useState<string | null>(null);
	const [rejectItemNotes, setRejectItemNotes] = useState('');
	const [evaluatedItemsMap, setEvaluatedItemsMap] = useState<Record<string, MerchantKycPendingItemStatus>>({});

	// Approval modal states
	const [showApprovalConfirm, setShowApprovalConfirm] = useState(false);
	const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
	const [acquirers, setAcquirers] = useState<AdminAcquirerData[]>([]);
	const [loadingAcquirers, setLoadingAcquirers] = useState(false);
	const [selectedAcquirer, setSelectedAcquirer] = useState<AdminAcquirerData | null>(null);
	const [searchQuery, setSearchQuery] = useState('');

	const filteredAcquirers = useMemo(() => {
		if (!searchQuery.trim()) return acquirers;
		const query = searchQuery.toLowerCase().trim();
		return acquirers.filter(
			(acq) =>
				acq.name.toLowerCase().includes(query) ||
				(acq.displayName?.toLowerCase().includes(query) ?? false) ||
				acq.code.toLowerCase().includes(query)
		);
	}, [acquirers, searchQuery]);

	const statusParse = merchantStatusParse[merchant.status];
	const kycStatusParse = merchantKycStatusParse[merchant.kycStatus];

	const getPendingFieldCurrentValue = useCallback(
		(fieldKey: MerchantKycPendingField | null | undefined): string => {
			if (!fieldKey) return '-';

			switch (fieldKey) {
				case MerchantKycPendingField.Name:
					return merchant.name ?? '-';
				case MerchantKycPendingField.Email:
					return merchant.email ?? '-';
				case MerchantKycPendingField.PhoneNumber:
					return merchant.phoneNumber ?? '-';
				case MerchantKycPendingField.WhatsApp:
					return merchant.whatsApp ?? '-';
				case MerchantKycPendingField.Address:
					return merchant.address?.street ?? '-';
				case MerchantKycPendingField.AddressNumber:
					return merchant.address?.number ?? '-';
				case MerchantKycPendingField.AddressComplement:
					return merchant.address?.complement ?? '-';
				case MerchantKycPendingField.Neighborhood:
					return merchant.address?.neighborhood ?? '-';
				case MerchantKycPendingField.City:
					return merchant.address?.city ?? '-';
				case MerchantKycPendingField.State:
					return merchant.address?.state ?? '-';
				case MerchantKycPendingField.PostalCode:
					return merchant.address?.postalCode ?? '-';
				case MerchantKycPendingField.Country:
					return merchant.address?.country ?? '-';
				case MerchantKycPendingField.LegalName:
					return merchant.kyc?.legalName ?? '-';
				case MerchantKycPendingField.DocumentType:
					return merchant.kyc?.documentType ? merchantDocumentTypeParse[merchant.kyc.documentType]?.label ?? '-' : '-';
				case MerchantKycPendingField.DocumentNumber:
					return merchant.kyc?.documentNumber ?? '-';
				case MerchantKycPendingField.IdentityDocumentType:
					return merchant.kyc?.identityDocumentType
						? merchantIdentityDocumentTypeParse[
								merchant.kyc.identityDocumentType as keyof typeof merchantIdentityDocumentTypeParse
						  ]?.label ?? '-'
						: '-';
				case MerchantKycPendingField.IdentityDocumentNumber:
					return merchant.kyc?.identityDocumentNumber ?? '-';
				case MerchantKycPendingField.OperationType:
					return merchant.kyc?.operationType
						? merchantOperationTypeParse[merchant.kyc.operationType]?.label ?? '-'
						: '-';
				case MerchantKycPendingField.BusinessDescription:
					return merchant.kyc?.businessDescription ?? '-';
				case MerchantKycPendingField.Website:
					return merchant.kyc?.website ?? '-';
				case MerchantKycPendingField.MonthlyRevenue:
					return merchant.kyc?.monthlyRevenue != null ? String(merchant.kyc.monthlyRevenue) : '-';
				case MerchantKycPendingField.AverageTicket:
					return merchant.kyc?.averageTicket != null ? String(merchant.kyc.averageTicket) : '-';
				case MerchantKycPendingField.UsesPix:
					return getBooleanLabel(merchant.kyc?.usesPix);
				case MerchantKycPendingField.ProofOfAddressFileId:
					return merchant.kyc?.proofOfAddress?.originalFileName ?? '-';
				case MerchantKycPendingField.DocumentFrontFileId:
					return merchant.kyc?.documentFront?.originalFileName ?? '-';
				case MerchantKycPendingField.DocumentBackFileId:
					return merchant.kyc?.documentBack?.originalFileName ?? '-';
				case MerchantKycPendingField.SelfieFileId:
					return merchant.kyc?.selfie?.originalFileName ?? '-';
				case MerchantKycPendingField.CnpjCardFileId:
					return merchant.kyc?.cnpjCard?.originalFileName ?? '-';
				case MerchantKycPendingField.CompanyContractFileId:
					return merchant.kyc?.companyContract?.originalFileName ?? '-';
				default:
					return '-';
			}
		},
		[merchant]
	);

	const loadAcquirers = useCallback(async () => {
		setLoadingAcquirers(true);
		try {
			const response = await adminListAcquirers({ isActive: true, pageSize: 50 });
			if (response?.data?.items) {
				setAcquirers(response.data.items);
			}
		} finally {
			setLoadingAcquirers(false);
		}
	}, []);

	function handleApproveClick() {
		setDecision(null);
		setShowApprovalConfirm(true);
	}

	function handleConfirmApproval() {
		setShowApprovalConfirm(false);
		setDecision(MerchantKycEvaluationStatus.Approved);
		setSelectedAcquirer(null);
		setSearchQuery('');
		setIsApprovalModalOpen(true);
		if (acquirers.length === 0 && !loadingAcquirers) {
			loadAcquirers();
		}
	}

	function handleCloseApprovalModal() {
		setIsApprovalModalOpen(false);
		setShowApprovalConfirm(false);
		setDecision(null);
		setSelectedAcquirer(null);
		setSearchQuery('');
	}

	function handleSelectDecision(value: MerchantKycEvaluationStatus) {
		setShowApprovalConfirm(false);
		setDecision(value);
	}

	function handleCancelDecision() {
		setShowApprovalConfirm(false);
		setDecision(null);
		setReason('');
		setPendingItems([]);
		setPendingFieldSearchValues({});
	}

	function handleSelectAcquirer(acquirer: AdminAcquirerData) {
		setSelectedAcquirer(acquirer);
	}

	function addPendingItem() {
		setPendingItems((previous) => [
			...previous,
			{
				type: MerchantKycPendingItemType.Document,
				fieldKey: null,
				title: '',
				description: null,
			},
		]);

		setPendingFieldSearchValues((previous) => ({
			...previous,
			[pendingItems.length]: '',
		}));
	}

	function updatePendingItem(index: number, field: keyof EvaluatePendingItemRequest, value: string | null) {
		const updated = [...pendingItems];
		const existing = updated[index];
		if (existing) {
			updated[index] = { ...existing, [field]: value };
		}
		setPendingItems(updated);
	}

	function removePendingItem(index: number) {
		setPendingItems(pendingItems.filter((_, i) => i !== index));
		setPendingFieldSearchValues((prev) => {
			const next: Record<number, string> = {};
			Object.entries(prev).forEach(([key, value]) => {
				const currentIndex = Number(key);
				if (Number.isNaN(currentIndex) || currentIndex === index) return;
				next[currentIndex > index ? currentIndex - 1 : currentIndex] = value;
			});
			return next;
		});
	}

	function updatePendingFieldSearch(index: number, value: string) {
		setPendingFieldSearchValues((prev) => ({ ...prev, [index]: value }));
	}

	function getPendingFieldOptions(searchValue: string) {
		const query = searchValue.trim().toLowerCase();
		if (!query) {
			return PENDING_FIELD_OPTIONS.map((option) => ({
				key: option.value,
				label: option.label,
			}));
		}

		return PENDING_FIELD_OPTIONS.filter((option) => option.label.toLowerCase().includes(query)).map((option) => ({
			key: option.value,
			label: option.label,
		}));
	}

	function handleEvaluateItem(itemId: string, status: KycPendingItemEvaluationStatus, notes?: string) {
		if (status === KycPendingItemEvaluationStatus.Rejected && !notes?.trim()) {
			toast('Motivo obrigatório', {
				description: 'Informe o motivo da rejeição do item.',
				indicator: <Icon icon={CloseCircle} className="icon-sm" />,
				variant: 'danger',
			});
			return;
		}

		startEvaluateItemTransition(async () => {
			const response = await adminEvaluateKycPendingItem(merchant.id, itemId, {
				status,
				notes: notes || null,
			});

			if (response.error) {
				toast('Erro ao avaliar item', {
					description: response.error.message,
					indicator: <Icon icon={CloseCircle} className="icon-sm" />,
					variant: 'danger',
				});
				return;
			}

			const newStatus =
				status === KycPendingItemEvaluationStatus.Approved
					? MerchantKycPendingItemStatus.Approved
					: MerchantKycPendingItemStatus.Rejected;

			setEvaluatedItemsMap((prev) => ({ ...prev, [itemId]: newStatus }));
			setRejectingItemId(null);
			setRejectItemNotes('');

			toast(status === KycPendingItemEvaluationStatus.Approved ? 'Item aprovado' : 'Item rejeitado', {
				description:
					status === KycPendingItemEvaluationStatus.Approved
						? 'O item foi aprovado com sucesso.'
						: 'O item foi rejeitado.',
				indicator: (
					<Icon
						icon={status === KycPendingItemEvaluationStatus.Approved ? CheckCircle : CloseCircle}
						className="icon-sm"
					/>
				),
				variant: status === KycPendingItemEvaluationStatus.Approved ? 'success' : 'danger',
			});
		});
	}

	function handleCancelRejectItem() {
		setRejectingItemId(null);
		setRejectItemNotes('');
	}

	function handleSubmit() {
		if (!decision) {
			toast('Decisão obrigatória', {
				description: 'Selecione uma decisão para continuar.',
				indicator: <Icon icon={CloseCircle} className="icon-sm" />,
				variant: 'danger',
			});
			return;
		}

		if (decision === MerchantKycEvaluationStatus.Approved) {
			if (!selectedAcquirer) {
				toast('Adquirente obrigatória', {
					description: 'Selecione uma adquirente para aprovar a organização.',
					indicator: <Icon icon={CloseCircle} className="icon-sm" />,
					variant: 'danger',
				});
				return;
			}
		}

		if (decision === MerchantKycEvaluationStatus.Rejected && !reason.trim()) {
			toast('Motivo obrigatório', {
				description: 'Informe o motivo da rejeição.',
				indicator: <Icon icon={CloseCircle} className="icon-sm" />,
				variant: 'danger',
			});
			return;
		}

		if (decision === MerchantKycEvaluationStatus.Complement) {
			if (pendingItems.length === 0) {
				toast('Itens obrigatórios', {
					description: 'Adicione pelo menos um item pendente.',
					indicator: <Icon icon={CloseCircle} className="icon-sm" />,
					variant: 'danger',
				});
				return;
			}
			for (const item of pendingItems) {
				if (!item.title.trim() || !item.fieldKey) {
					toast('Campos incompletos', {
						description: 'Preencha campo alvo e título em todos os itens.',
						indicator: <Icon icon={CloseCircle} className="icon-sm" />,
						variant: 'danger',
					});
					return;
				}
			}
		}

		startTransition(async () => {
			// Step 1: Evaluate KYC
			const response = await adminEvaluateMerchantKyc(merchant.id, {
				status: decision,
				reason: decision === MerchantKycEvaluationStatus.Rejected ? reason : null,
				pendingItems: decision === MerchantKycEvaluationStatus.Complement ? pendingItems : null,
			});

			if (response.error) {
				toast('Erro ao avaliar', {
					description: response.error.message,
					indicator: <Icon icon={CloseCircle} className="icon-sm" />,
					variant: 'danger',
				});
				return;
			}

			// Step 2: If approved, set acquirer
			if (decision === MerchantKycEvaluationStatus.Approved && selectedAcquirer) {
				const acquirerResponse = await adminSetMerchantAcquirer(merchant.id, selectedAcquirer.id);
				if (acquirerResponse?.error) {
					toast('Erro ao definir processadora', {
						description: acquirerResponse.error.message,
						indicator: <Icon icon={CloseCircle} className="icon-sm" />,
						variant: 'danger',
					});
					return;
				}
			}

			const successMessages = {
				[MerchantKycEvaluationStatus.Approved]: 'Organização aprovada com sucesso!',
				[MerchantKycEvaluationStatus.Rejected]: 'Organização rejeitada.',
				[MerchantKycEvaluationStatus.Complement]: 'Solicitação de complemento enviada.',
			};

			const successTitles = {
				[MerchantKycEvaluationStatus.Approved]: 'Aprovado',
				[MerchantKycEvaluationStatus.Rejected]: 'Rejeitado',
				[MerchantKycEvaluationStatus.Complement]: 'Complemento solicitado',
			};

			toast(successTitles[decision], {
				description: successMessages[decision],
				indicator: <Icon icon={CheckCircle} className="icon-sm" />,
				variant: 'success',
			});
			setTimeout(() => {
				router.push(Routes.panel.admin.merchants);
			}, 500);
		});
	}

	const pendingItemsAwaitingReview = merchant.kycPendingItems.filter(
		(item) => item.status === MerchantKycPendingItemStatus.Responded && !evaluatedItemsMap[item.id]
	);

	const complementHistory = merchant.kycPendingItems.filter(
		(item) =>
			(item.status === MerchantKycPendingItemStatus.Responded && Boolean(item.response)) ||
			item.status === MerchantKycPendingItemStatus.Approved ||
			item.status === MerchantKycPendingItemStatus.Rejected ||
			item.status === MerchantKycPendingItemStatus.Pending ||
			evaluatedItemsMap[item.id]
	);

	const hasItemsToEvaluate = merchant.kycPendingItems.some(
		(item) => item.status === MerchantKycPendingItemStatus.Responded && !evaluatedItemsMap[item.id]
	);

	return (
		<div className="flex h-full flex-col gap-4">
			<div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
				<div className="flex items-center gap-4">
					<AsyncButton
						isIconOnly
						variant="tertiary"
						onPress={() => router.push(Routes.panel.admin.merchantDetails(merchant.id))}
					>
						<Icon icon={ArrowLeft01Icon} className="icon-md" />
					</AsyncButton>
					<div>
						<h1 className="text-2xl font-bold">Avaliar organização</h1>
						<p className="text-foreground-500">{merchant.name ?? merchant.kyc?.legalName ?? '—'}</p>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-3">
					<div className="flex items-center gap-2">
						<Chip variant="soft" size="sm" color={mapParseColorToChipColor(statusParse.color)}>
							{statusParse.label}
						</Chip>
						<Chip variant="soft" size="sm" color={mapParseColorToChipColor(kycStatusParse.color)}>
							{kycStatusParse.label}
						</Chip>
					</div>
				</div>
			</div>

			{pendingItemsAwaitingReview.length > 0 && (
				<Alert status="accent">
					<Alert.Indicator />
					<Alert.Content>
						<Alert.Title>Respostas recebidas</Alert.Title>
						<Alert.Description>
							A organização respondeu {pendingItemsAwaitingReview.length} item(ns) de complemento. Revise as respostas
							abaixo.
						</Alert.Description>
					</Alert.Content>
				</Alert>
			)}

			<div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
				<div className="xl:col-span-2">
					<OrganizationAccordions
						merchant={merchant}
						evaluatedItemsMap={evaluatedItemsMap}
						complementHistory={complementHistory}
						getPendingFieldLabel={getPendingFieldLabel}
						getPendingFieldCurrentValue={getPendingFieldCurrentValue}
					/>
				</div>
				<div className="flex flex-col gap-4">
					<PendingResponsesCard
						items={pendingItemsAwaitingReview}
						rejectingItemId={rejectingItemId}
						rejectItemNotes={rejectItemNotes}
						isEvaluatingItem={isEvaluatingItem}
						getPendingFieldLabel={getPendingFieldLabel}
						getPendingFieldCurrentValue={getPendingFieldCurrentValue}
						onStartReject={(itemId) => setRejectingItemId(itemId)}
						onCancelReject={handleCancelRejectItem}
						onChangeRejectNotes={setRejectItemNotes}
						onEvaluateItem={handleEvaluateItem}
					/>

					<DecisionCard
						decision={decision}
						reason={reason}
						showApprovalConfirm={showApprovalConfirm}
						hasItemsToEvaluate={hasItemsToEvaluate}
						isPending={isPending}
						pendingItems={pendingItems}
						pendingFieldSearchValues={pendingFieldSearchValues}
						getPendingFieldLabel={getPendingFieldLabel}
						getPendingFieldOptions={getPendingFieldOptions}
						onApproveClick={handleApproveClick}
						onSelectDecision={handleSelectDecision}
						onCancelDecision={handleCancelDecision}
						onCancelApprovalConfirm={() => setShowApprovalConfirm(false)}
						onConfirmApproval={handleConfirmApproval}
						onChangeReason={setReason}
						onAddPendingItem={addPendingItem}
						onRemovePendingItem={removePendingItem}
						onUpdatePendingItem={updatePendingItem}
						onUpdatePendingFieldSearch={updatePendingFieldSearch}
						onSubmit={handleSubmit}
					/>
				</div>
			</div>

			{/* Approval Modal */}
			<Modal.Backdrop isOpen={isApprovalModalOpen} onOpenChange={handleCloseApprovalModal}>
				<Modal.Container size="lg" placement="center" scroll="outside">
					<Modal.Dialog className="max-w-2xl">
						<Modal.CloseTrigger />
						<Modal.Header>
							<Modal.Icon className="bg-success text-success-foreground">
								<Icon icon={CheckCircle} className="icon-md" />
							</Modal.Icon>
							<Modal.Heading>Aprovar Organização</Modal.Heading>
							<p className="text-sm text-foreground-500">Selecione a adquirente que irá processar os pagamentos</p>
						</Modal.Header>
						<Modal.Body>
							<div className="flex flex-col gap-4">
								{loadingAcquirers ? (
									<div className="flex flex-col gap-3">
										<div className="h-10 w-full animate-pulse rounded-lg bg-surface-secondary" />
										<div className="flex flex-col gap-2">
											{[1, 2, 3].map((i) => (
												<div key={i} className="h-20 w-full animate-pulse rounded-lg bg-surface-secondary" />
											))}
										</div>
									</div>
								) : acquirers.length === 0 ? (
									<div className="flex flex-col items-center justify-center py-8 text-foreground-500">
										<Icon icon={ServerStack01Icon} className="icon-xl mb-2" />
										<p>Nenhuma adquirente ativa encontrada</p>
									</div>
								) : (
									<div className="flex flex-col gap-3">
										<TextField variant="secondary" aria-label="Buscar adquirente">
											<InputGroup>
												<InputGroup.Prefix>
													<Icon icon={Search01Icon} className="icon-sm text-foreground/60" />
												</InputGroup.Prefix>
												<InputGroup.Input
													placeholder="Buscar por nome ou código..."
													value={searchQuery}
													onChange={(e) => setSearchQuery(e.target.value)}
												/>
											</InputGroup>
										</TextField>
										<div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
											{filteredAcquirers.length === 0 ? (
												<div className="flex flex-col items-center justify-center py-6 text-foreground-500">
													<p className="text-sm">Nenhuma adquirente encontrada</p>
												</div>
											) : (
												filteredAcquirers.map((acquirer) => {
													const isSelected = selectedAcquirer?.id === acquirer.id;
													const displayName = acquirer.displayName || acquirer.name;

													return (
														<button
															key={acquirer.id}
															type="button"
															onClick={() => handleSelectAcquirer(acquirer)}
															className={`flex cursor-pointer items-start gap-3 rounded-lg border p-2.5 text-left transition-colors ${
																isSelected
																	? 'border-accent bg-accent/10'
																	: 'border-border bg-surface hover:bg-surface-secondary'
															}`}
														>
															<Avatar size="sm" className="mt-0.5 shrink-0">
																{acquirer.logoUrl ? (
																	<Avatar.Image src={acquirer.logoUrl} alt={displayName} />
																) : (
																	<Avatar.Fallback className="text-xs">
																		{displayName
																			.split(' ')
																			.map((n) => n[0])
																			.join('')
																			.toUpperCase()
																			.slice(0, 2)}
																	</Avatar.Fallback>
																)}
															</Avatar>
															<div className="flex min-w-0 flex-1 flex-col gap-1">
																<div className="flex items-center justify-between gap-2">
																	<div className="flex min-w-0 items-center gap-2">
																		<span className="truncate text-sm font-medium text-foreground">{displayName}</span>
																	</div>
																	<div className="flex shrink-0 items-center gap-1.5">
																		{isSelected && <Icon icon={CheckCircle} className="icon-sm text-accent" />}
																	</div>
																</div>
																{acquirer.nominal && (
																	<span className="text-xs text-foreground/60">{acquirer.nominal}</span>
																)}
																<div className="flex flex-wrap items-center gap-1.5">
																	{acquirer.operationTypes?.map((type) => {
																		const parsed =
																			acquirerOperationTypeParse[type as keyof typeof acquirerOperationTypeParse];
																		return parsed ? (
																			<Chip
																				key={type}
																				size="sm"
																				className={`h-5 gap-0.5 text-xs ${parsed.className ?? ''}`}
																			>
																				{parsed.icon}
																				{parsed.label}
																			</Chip>
																		) : null;
																	})}
																	{acquirer.supportsPix && (
																		<Chip
																			size="sm"
																			className="h-5 gap-0.5 text-xs bg-success/10 text-success border-success-soft-hover"
																		>
																			<Icon icon={QrCodeIcon} className="size-3" />
																			PIX
																		</Chip>
																	)}
																	{acquirer.supportsWithdrawal && (
																		<Chip
																			size="sm"
																			className="h-5 gap-0.5 text-xs bg-secondary/10 text-secondary border-secondary-soft-hover"
																		>
																			<Icon icon={Wallet01Icon} className="size-3" />
																			Saque
																		</Chip>
																	)}
																</div>
																<div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-foreground/80">
																	{acquirer.pixInFeeMode && (
																		<span className="flex items-center gap-1">
																			<Icon icon={QrCodeIcon} className="size-3 text-success" />
																			PIX:{' '}
																			{formatFeeDisplay(
																				acquirer.pixInFeeFixed,
																				acquirer.pixInFeePercentage,
																				acquirer.pixInFeeMode
																			)}
																		</span>
																	)}
																	{acquirer.payoutFeeMode && (
																		<span className="flex items-center gap-1">
																			<Icon icon={Wallet01Icon} className="size-3 text-accent" />
																			Saque:{' '}
																			{formatFeeDisplay(
																				acquirer.payoutFeeFixed,
																				acquirer.payoutFeePercentage,
																				acquirer.payoutFeeMode
																			)}
																		</span>
																	)}
																</div>
															</div>
														</button>
													);
												})
											)}
										</div>
									</div>
								)}
							</div>
						</Modal.Body>
						<Modal.Footer>
							<Button variant="tertiary" onPress={handleCloseApprovalModal}>
								Cancelar
							</Button>
							<AsyncButton
								className="bg-success text-success-foreground"
								isPending={isPending}
								isDisabled={!selectedAcquirer}
								onPress={handleSubmit}
							>
								<Icon icon={CheckCircle} className="icon-sm" />
								Confirmar aprovação
							</AsyncButton>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</div>
	);
}
