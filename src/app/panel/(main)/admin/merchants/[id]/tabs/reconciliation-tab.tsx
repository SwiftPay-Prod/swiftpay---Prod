'use client';

import { use, Suspense, useState, useTransition, type ReactNode } from 'react';
import { Card, Alert, Button, Chip, Skeleton, Tooltip, Switch, Label } from '@heroui/react';
import {
	RepeatIcon,
	CheckmarkCircle02Icon,
	Alert01Icon,
	Clock01Icon,
	ViewIcon,
	Wallet01Icon,
	CheckmarkSquare02Icon,
	Loading01Icon,
	Notification03Icon,
	CancelCircleIcon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { SelectFilter } from '@/components/ui/select-filter';
import type { AdminMinimalReconciliation, AdminReconciliationDetails, AdminListReconciliationsRequest } from '@/types/admin/reconciliation';
import type { ApiResponse, Paginated } from '@/types/common';
import { PaymentEnvironment, BankReconciliationStatus } from '@/types/enums';
import {
	bankReconciliationStatusParse,
	mapParseColorToChipColor,
	parseToFilterOptions,
	paymentEnvironmentParse,
} from '@/parse';
import { formatRelativeTime, formatDate } from '@/utils/datetime';
import { formatCurrency } from '@/utils/currency';
import { adminStartReconciliation, adminListReconciliations, adminGetReconciliation } from '@/app/actions/admin/reconciliation';
import { toast } from '@heroui/react';
import { ReconciliationDetailsModal } from './modals/reconciliation-details-modal';

type ReconciliationsPromise = Promise<ApiResponse<Paginated<AdminMinimalReconciliation>>>;
type DetailsPromise = Promise<ApiResponse<AdminReconciliationDetails>>;

interface ReconciliationTabProps {
	merchantId: string;
	fetchPromise: ReconciliationsPromise;
}

const environmentOptions = parseToFilterOptions(paymentEnvironmentParse, 'Todos ambientes');

interface MobileCardButtonProps {
	onClick: () => void;
	disabled?: boolean;
	children: ReactNode;
}

function MobileCardButton({ onClick, disabled, children }: MobileCardButtonProps) {
	const isInteractive = !disabled;

	return (
		<div
			className={`rounded-xl border border-divider bg-surface p-3 overflow-hidden ${isInteractive ? 'cursor-pointer' : ''}`}
			onClick={isInteractive ? onClick : undefined}
			role={isInteractive ? 'button' : undefined}
			tabIndex={isInteractive ? 0 : undefined}
			onKeyDown={
				isInteractive
					? (event) => {
							if (event.key === 'Enter' || event.key === ' ') {
								event.preventDefault();
								onClick();
							}
						}
					: undefined
			}
		>
			{children}
		</div>
	);
}

function ReconciliationTabSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			<Card className="border-dashed">
				<Card.Content className="p-4">
					<div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
						<Skeleton className="h-10 w-64 rounded-lg" />
						<Skeleton className="h-10 w-48 rounded-lg" />
					</div>
				</Card.Content>
			</Card>
			<Card>
				<Card.Content className="p-0">
					<div className="flex flex-col gap-4 p-4">
						{[...Array(5)].map((_, i) => (
							<Skeleton key={i} className="h-12 w-full rounded-lg" />
						))}
					</div>
				</Card.Content>
			</Card>
		</div>
	);
}

export function ReconciliationTab({ merchantId, fetchPromise }: ReconciliationTabProps) {
	return (
		<Suspense fallback={<ReconciliationTabSkeleton />}>
			<ReconciliationTabContent merchantId={merchantId} initialPromise={fetchPromise} />
		</Suspense>
	);
}

function ReconciliationTabContent({
	merchantId,
	initialPromise,
}: {
	merchantId: string;
	initialPromise: ReconciliationsPromise;
}) {
	const [currentPromise, setCurrentPromise] = useState<ReconciliationsPromise>(initialPromise);
	const [isPending, startTransition] = useTransition();
	const [isStarting, startStartTransition] = useTransition();
	const [environment, setEnvironment] = useState<PaymentEnvironment | 'all'>('all');
	const [currentPage, setCurrentPage] = useState(1);
	const [sortBy, setSortBy] = useState('createdAt');
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
	const pageSize = 10;

	const [detailsPromise, setDetailsPromise] = useState<DetailsPromise | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [selectedEnvironment, setSelectedEnvironment] = useState<PaymentEnvironment | null>(null);
	const [silentMode, setSilentMode] = useState(false);

	const response = use(currentPromise);
	const data = response?.data ?? { items: [], totalItems: 0, page: 1, pageSize: 10, totalPages: 0 };

	function fetchData(filters: AdminListReconciliationsRequest) {
		startTransition(() => {
			setCurrentPromise(adminListReconciliations(filters));
		});
	}

	function handleRefresh() {
		fetchData({
			merchantId,
			environment: environment === 'all' ? undefined : environment,
			page: currentPage,
			pageSize,
			sortBy,
			sortOrder,
		});
	}

	function handleEnvironmentChange(key: string) {
		const newEnv = (key || 'all') as PaymentEnvironment | 'all';
		setEnvironment(newEnv);
		setCurrentPage(1);
		fetchData({
			merchantId,
			environment: newEnv === 'all' ? undefined : newEnv,
			page: 1,
			pageSize,
			sortBy,
			sortOrder,
		});
	}

	function handlePageChange(page: number) {
		setCurrentPage(page);
		fetchData({
			merchantId,
			environment: environment === 'all' ? undefined : environment,
			page,
			pageSize,
			sortBy,
			sortOrder,
		});
	}

	function handleSortChange(nextSortBy: string, nextSortOrder: 'asc' | 'desc') {
		setSortBy(nextSortBy);
		setSortOrder(nextSortOrder);
		setCurrentPage(1);
		fetchData({
			merchantId,
			environment: environment === 'all' ? undefined : environment,
			page: 1,
			pageSize,
			sortBy: nextSortBy,
			sortOrder: nextSortOrder,
		});
	}

	function handleOpenConfirmModal(env: PaymentEnvironment) {
		setSelectedEnvironment(env);
		setIsConfirmOpen(true);
	}

	function handleCloseConfirmModal() {
		setIsConfirmOpen(false);
		setSelectedEnvironment(null);
		setSilentMode(false);
	}

	function handleConfirmReconciliation() {
		if (!selectedEnvironment) return;

		startStartTransition(async () => {
			const res = await adminStartReconciliation({ 
				merchantId, 
				environment: selectedEnvironment,
				silentMode,
			});
			if (res?.error) {
				toast('Erro ao iniciar reconciliação', {
					description: res.error.message,
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
				return;
			}
			const message = silentMode 
				? 'Reconciliação iniciada em modo silencioso.' 
				: 'Reconciliação iniciada! Você receberá uma notificação quando estiver pronta.';
			toast('Reconciliação iniciada', {
				description: message,
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				variant: 'success',
			});
			handleCloseConfirmModal();
			handleRefresh();
		});
	}

	function handleViewDetails(id: string) {
		setDetailsPromise(adminGetReconciliation(id));
		setIsModalOpen(true);
	}

	function handleCloseModal() {
		setIsModalOpen(false);
		setDetailsPromise(null);
	}

	function handleCorrectionsApplied() {
		handleCloseModal();
		handleRefresh();
	}

	function handleClearFilters() {
		setEnvironment('all');
		setCurrentPage(1);
		fetchData({ merchantId, page: 1, pageSize, sortBy, sortOrder });
	}

	const hasFilters = environment !== 'all';

	function renderMobileReconciliationCard(item: AdminMinimalReconciliation, index: number, openActions?: () => void): ReactNode {
		const environmentParse = paymentEnvironmentParse[item.environment];
		const statusParse = bankReconciliationStatusParse[item.status];
		const isProcessing = item.status === BankReconciliationStatus.Processing;

		return (
			<MobileCardButton onClick={!isProcessing && openActions ? openActions : (() => {})} disabled={isProcessing}>
				<div className="flex flex-col gap-3">
					{/* Header: Environment chip + Status chip */}
					<div className="flex items-center justify-between gap-2">
						{environmentParse ? (
							<Chip variant="soft" color={mapParseColorToChipColor(environmentParse.color)} size="sm">
								{environmentParse.icon}
								{environmentParse.label}
							</Chip>
						) : (
							<span className="text-sm text-muted">{item.environment}</span>
						)}
						{statusParse ? (
							<Chip variant="soft" color={mapParseColorToChipColor(statusParse.color)} size="sm">
								{statusParse.icon}
								{statusParse.label}
							</Chip>
						) : (
							<span className="text-sm text-muted">{item.status}</span>
						)}
					</div>

					{/* Balances section */}
					<div className="flex flex-col gap-2">
						<div className="flex items-center gap-2">
							<Icon icon={Wallet01Icon} className="icon-xs text-muted shrink-0" />
							<div className="flex items-center gap-2">
								<span className="text-xs text-muted">Saldo Ledger:</span>
								<span className="text-xs font-mono font-medium">{formatCurrency(item.ledgerBalance)}</span>
							</div>
						</div>

						<div className="flex items-center gap-2 pl-5">
							<span className="text-xs text-muted">Saldo Calculado:</span>
							<span className="text-xs font-mono font-medium">{formatCurrency(item.calculatedBalance)}</span>
						</div>

						<div className="flex items-center gap-2 pl-5">
							<span className="text-xs text-muted">Diferença:</span>
							{item.balanceDifference === 0 ? (
								<span className="text-xs font-mono text-success">R$ 0,00</span>
							) : (
								<span className={`text-xs font-mono ${item.balanceDifference > 0 ? 'text-success' : 'text-danger'}`}>
									{item.balanceDifference > 0 ? '+' : ''}{formatCurrency(item.balanceDifference)}
								</span>
							)}
						</div>
					</div>

					{/* Discrepancies */}
					<div className="flex items-center gap-2">
						<span className="text-xs text-muted">Divergências:</span>
						{!item.hasDiscrepancies ? (
							<div className="flex items-center gap-1 text-success">
								<Icon icon={CheckmarkCircle02Icon} className="icon-xs" />
								<span className="text-xs">Nenhuma</span>
							</div>
						) : (
							<div className="flex items-center gap-1 text-warning">
								<Icon icon={Alert01Icon} className="icon-xs" />
								<span className="text-xs">{item.correctedDiscrepancies}/{item.totalDiscrepancies}</span>
							</div>
						)}
					</div>

					{/* Corrections */}
					<div className="flex items-center gap-2">
						<Icon icon={CheckmarkSquare02Icon} className="icon-xs text-muted shrink-0" />
						<span className="text-xs text-muted">Correções:</span>
						{item.correctionsApplied ? (
							<Chip variant="soft" color="success" size="sm">
								Aplicadas
							</Chip>
						) : item.status === BankReconciliationStatus.CompletedWithDiscrepancies ? (
							<Chip variant="soft" color="warning" size="sm">
								Pendente
							</Chip>
						) : (
							<span className="text-xs text-muted">—</span>
						)}
					</div>

					{/* Date */}
					<div className="flex items-center gap-2">
						<Icon icon={Clock01Icon} className="icon-xs text-muted shrink-0" />
						<span className="text-xs text-muted" title={formatDate(item.createdAt)}>
							{formatRelativeTime(item.createdAt)}
						</span>
					</div>

					{/* Processing indicator */}
					{isProcessing && (
						<div className="flex items-center gap-2">
							<Icon icon={Loading01Icon} className="icon-xs text-accent animate-spin shrink-0" />
							<span className="text-xs text-accent">Processando...</span>
						</div>
					)}
				</div>
			</MobileCardButton>
		);
	}

	const columns: DataTableColumn<AdminMinimalReconciliation>[] = [
		{
			key: 'environment',
			header: 'Ambiente',
			render: (item) => {
				const parse = paymentEnvironmentParse[item.environment];
				if (!parse) return <span className="text-muted">{item.environment}</span>;
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(parse.color)} size="sm">
						{parse.icon}
						{parse.label}
					</Chip>
				);
			},
		},
		{
			key: 'status',
			header: 'Status',
			render: (item) => {
				const parse = bankReconciliationStatusParse[item.status];
				if (!parse) return <span className="text-muted">{item.status}</span>;
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(parse.color)} size="sm">
						{parse.icon}
						{parse.label}
					</Chip>
				);
			},
		},
		{
			key: 'balance',
			header: 'Saldo Ledger',
			render: (item) => (
				<span className="font-mono font-medium">{formatCurrency(item.ledgerBalance)}</span>
			),
		},
		{
			key: 'calculated',
			header: 'Saldo Calculado',
			render: (item) => (
				<span className="font-mono font-medium">{formatCurrency(item.calculatedBalance)}</span>
			),
		},
		{
			key: 'difference',
			header: 'Diferença',
			render: (item) => {
				const diff = item.balanceDifference;
				if (diff === 0) {
					return <span className="font-mono text-success">R$ 0,00</span>;
				}
				return (
					<span className={`font-mono ${diff > 0 ? 'text-success' : 'text-danger'}`}>
						{diff > 0 ? '+' : ''}{formatCurrency(diff)}
					</span>
				);
			},
		},
		{
			key: 'discrepancies',
			header: 'Divergências',
			render: (item) => {
				if (!item.hasDiscrepancies) {
					return (
						<div className="flex items-center gap-1 text-success">
							<Icon icon={CheckmarkCircle02Icon} className="icon-sm" />
							<span>Nenhuma</span>
						</div>
					);
				}
				return (
					<div className="flex items-center gap-1 text-warning">
						<Icon icon={Alert01Icon} className="icon-sm" />
						<span>{item.correctedDiscrepancies}/{item.totalDiscrepancies}</span>
					</div>
				);
			},
		},
		{
			key: 'corrections',
			header: 'Correções',
			render: (item) => {
				if (item.correctionsApplied) {
					return (
						<Chip variant="soft" color="success" size="sm">
							<Icon icon={CheckmarkSquare02Icon} className="icon-xs" />
							Aplicadas
						</Chip>
					);
				}
				if (item.status === BankReconciliationStatus.CompletedWithDiscrepancies) {
					return (
						<Chip variant="soft" color="warning" size="sm">
							Pendente
						</Chip>
					);
				}
				return <span className="text-muted">—</span>;
			},
		},
		{
			key: 'date',
			header: 'Data',
			render: (item) => (
				<span className="text-sm text-muted" title={formatDate(item.createdAt)}>
					{formatRelativeTime(item.createdAt)}
				</span>
			),
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			render: (item) => (
				<Tooltip>
					<Button
						isIconOnly
						variant="tertiary"
						onPress={() => handleViewDetails(item.id)}
						isDisabled={item.status === BankReconciliationStatus.Processing}
					>
						{item.status === BankReconciliationStatus.Processing ? (
							<Icon icon={Loading01Icon} className="icon-sm animate-spin" />
						) : (
							<Icon icon={ViewIcon} className="icon-sm" />
						)}
						<Tooltip.Content>
							{item.status === BankReconciliationStatus.Processing ? 'Processando...' : 'Ver detalhes'}
						</Tooltip.Content>
					</Button>
				</Tooltip>
			),
		},
	];

	const renderFiltersContent = () => (
		<SelectFilter
			label="Ambiente"
			value={environment}
			options={environmentOptions}
			onChange={handleEnvironmentChange}
			allLabel="Todos ambientes"
		/>
	);

	return (
		<div className="flex flex-col gap-6">
			{response?.error && (
				<Alert status="danger">
					<Alert.Indicator />
					<Alert.Content>
						<Alert.Title>Erro ao carregar reconciliações</Alert.Title>
						<Alert.Description>{response.error.message}</Alert.Description>
					</Alert.Content>
				</Alert>
			)}

			<Card className="border-dashed">
				<Card.Content className="p-4">
					<div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
								<Icon icon={RepeatIcon} className="icon-md text-accent" />
							</div>
							<div>
								<p className="font-medium">Iniciar nova reconciliação</p>
								<p className="text-sm text-muted">
									Compare o saldo do ledger com pagamentos e saques
								</p>
							</div>
						</div>

						<div className="flex gap-2">
							<Button
								variant="secondary"
								onPress={() => handleOpenConfirmModal(PaymentEnvironment.Sandbox)}
							>
								<Icon icon={Wallet01Icon} className="icon-sm" />
								Sandbox
							</Button>
							<Button
								variant="primary"
								onPress={() => handleOpenConfirmModal(PaymentEnvironment.Production)}
							>
								<Icon icon={Wallet01Icon} className="icon-sm" />
								Produção
							</Button>
						</div>
					</div>
				</Card.Content>
			</Card>

			<DataTable
				columns={columns}
				data={data.items}
				keyExtractor={(item) => item.id}
				renderMobileCard={renderMobileReconciliationCard}
				isLoading={isPending}
				skeletonRows={pageSize}
				emptyMessage="Nenhuma reconciliação encontrada. Clique em um dos botões acima para iniciar."
				minWidth="min-w-280"
				filters={{
					children: renderFiltersContent,
					hasFilters,
					onClear: handleClearFilters,
					onRefresh: handleRefresh,
					isRefreshing: isPending,
				}}
				pagination={{
					page: data.page,
					pageSize: data.pageSize,
					totalItems: data.totalItems,
					totalPages: data.totalPages,
					onPageChange: handlePageChange,
					sortBy,
					sortOrder,
					onSortChange: handleSortChange,
					isNavigating: isPending,
				}}
			/>

			<ReconciliationDetailsModal
				isOpen={isModalOpen}
				onOpenChange={handleCloseModal}
				reconciliationPromise={detailsPromise}
				onCorrectionsApplied={handleCorrectionsApplied}
			/>

			<ConfirmationModal
				isOpen={isConfirmOpen}
				onOpenChange={handleCloseConfirmModal}
				title="Iniciar Reconciliação"
				description={`Deseja iniciar a reconciliação bancária no ambiente ${selectedEnvironment === PaymentEnvironment.Production ? 'Produção' : 'Sandbox'}?`}
				status="accent"
				icon={<Icon icon={RepeatIcon} className="icon-md" />}
				confirmLabel="Iniciar"
				cancelLabel="Cancelar"
				isPending={isStarting}
				onConfirm={handleConfirmReconciliation}
			>
				<div className="flex flex-col gap-4">
					<p className="text-sm text-muted">
						A reconciliação irá comparar o saldo atual do ledger com todos os pagamentos e saques registrados.
						Caso sejam encontradas divergências, você poderá revisar e aplicar correções.
					</p>
					<Switch isSelected={silentMode} onChange={setSilentMode}>
						<div className="flex w-full items-center gap-3 rounded-lg border border-default p-3">
							<Icon icon={Notification03Icon} className="icon-md text-muted shrink-0" />
							<div className="flex grow flex-col gap-1">
								<Label className="text-sm font-medium cursor-pointer">
									Modo silencioso
								</Label>
								<p className="text-xs text-muted">
									Não envia notificações e não aparece no histórico da organização
								</p>
							</div>
							<Switch.Control>
								<Switch.Thumb />
							</Switch.Control>
						</div>
					</Switch>
				</div>
			</ConfirmationModal>
		</div>
	);
}
