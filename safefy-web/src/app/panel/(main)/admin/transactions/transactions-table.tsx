'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { Button, Chip, Tooltip, Avatar, toast } from '@heroui/react';
import { ViewIcon, Building02Icon, CreditCardIcon, PlayIcon, SourceCodeSquareIcon, Link02Icon, ShoppingCartCheck01Icon, Copy01Icon, CheckmarkCircle02Icon, CancelCircleIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { SearchFilter } from '@/components/ui/search-filter';
import { SelectFilter } from '@/components/ui/select-filter';
import { AsyncCombobox } from '@/components/ui/async-combobox';
import { DocumentDisplay } from '@/components/ui/data-links';
import { TableIdCell } from '@/components/ui/table-id-cell';
import { AdminMerchantLink } from '@/components/admin/admin-merchant-link';
import { ProviderCategoryChip } from '@/components/admin/provider-category-chip';
import { adminReprocessCompletedTransactionDev } from '@/app/actions/admin/transactions';
import { AdminTransactionDetailsModal } from './modals/admin-transaction-details-modal';
import { AdminReprocessConfirmModal } from '@/components/admin/admin-reprocess-confirm-modal';
import { useTransactionsTable } from './use-transactions-table';
import type { AdminMinimalTransaction } from '@/types/admin/transactions';
import { PaymentRequestSource } from '@/types/enums';
import type { PaymentMethod, PaymentStatus } from '@/types/enums';
import {
	paymentStatusParse,
	paymentMethodParse,
	mapParseColorToChipColor,
	parseToFilterOptions,
	pageSizeFilterOptions,
} from '@/parse';
import { formatDate } from '@/utils/datetime';
import { formatCurrency } from '@/utils/currency';
import type { AdminReprocessTransactionTargetStatus } from '@/types/admin/transactions';

interface TransactionsTableProps {
	canReprocess: boolean;
}

function getAcquirerDisplayName(acquirer: { displayName?: string | null; name: string }): string {
	return acquirer.displayName?.trim() || acquirer.name;
}

const statusOptions = parseToFilterOptions(paymentStatusParse, 'Todos os status');
const methodOptions = parseToFilterOptions(paymentMethodParse, 'Todos os métodos');

function getRequestSourceBadge(source: PaymentRequestSource) {
	if (source === PaymentRequestSource.PaymentLink) {
		return {
			label: 'Link de Pagamento',
			color: 'secondary' as const,
			icon: Link02Icon,
		};
	}

	if (source === PaymentRequestSource.Checkout) {
		return {
			label: 'Checkout',
			color: 'accent' as const,
			icon: ShoppingCartCheck01Icon,
		};
	}

	return {
		label: 'API',
		color: 'default' as const,
		icon: SourceCodeSquareIcon,
	};
}

function getColumns(
	onViewTransaction: (id: string) => void,
	onCopyVisualizationLink: (url: string) => Promise<void>,
	onOpenReprocess: (id: string) => void,
	canReprocess: boolean,
	reprocessingTransactionId: string | null
): DataTableColumn<AdminMinimalTransaction>[] {
	return [
		{
			key: 'id',
			header: 'ID',
			width: '140px',
			render: (transaction) => (
				<div className="flex items-center gap-1.5">
					<TableIdCell id={transaction.id} copyLabel="ID da transação" />
					{transaction.isWayneProtocol && (
						<Tooltip>
							<Image src="/icons/bat.png" alt="Bat icon" width={16} height={16} className="size-4" />
							<Tooltip.Content>Protocolo Wayne: Taxa Interna Processada</Tooltip.Content>
						</Tooltip>
					)}
				</div>
			),
		},
		{
			key: 'merchant',
			header: 'Organização',
			render: (transaction) => (
				<div className="flex items-center gap-2">
					<Icon icon={Building02Icon} className="icon-sm text-muted shrink-0" />
					<div className="flex flex-col">
						<AdminMerchantLink
							merchantId={transaction.merchant.id}
							name={transaction.merchant.name}
							className="text-sm truncate max-w-40 text-accent hover:underline"
						/>
						<DocumentDisplay document={transaction.merchant.document} className="text-xs text-muted" />
					</div>
				</div>
			),
		},
		{
			key: 'acquirer',
			header: 'Processadora',
			render: (transaction) => {
				if (!transaction.acquirer) {
					return <span className="text-sm text-muted">-</span>;
				}
				const displayName = getAcquirerDisplayName(transaction.acquirer);
				return (
					<div className="flex items-center gap-2">
						<Avatar size="sm">
							{transaction.acquirer.logoUrl ? (
								<Avatar.Image src={transaction.acquirer.logoUrl} alt={displayName} />
							) : (
								<Avatar.Fallback className="text-xs">
									{displayName.slice(0, 2).toUpperCase()}
								</Avatar.Fallback>
							)}
						</Avatar>
						<div className="flex flex-col">
							<span className="text-sm">{displayName}</span>
							<ProviderCategoryChip category={transaction.acquirer.providerCategory} size="sm" />
							{transaction.acquirer.nominal && <span className="text-xs text-muted italic">{transaction.acquirer.nominal}</span>}
						</div>
					</div>
				);
			},
		},
		{
			key: 'amount',
			header: 'Valor',
			render: (transaction) => {
				const isLoss = transaction.profit < 0;

				return (
					<div className="flex flex-col">
						<span className="font-medium">{formatCurrency(transaction.amount)}</span>
						<span className="text-xs text-muted">Taxa: {formatCurrency(transaction.fee)}</span>
						<span className={`text-xs ${isLoss ? 'text-danger' : 'text-success'}`}>
							{isLoss ? 'Prejuízo' : 'Lucro'}: {formatCurrency(transaction.profit)}
						</span>
					</div>
				);
			},
		},
		{
			key: 'method',
			header: 'Método',
			render: (transaction) => {
				const methodParse = paymentMethodParse[transaction.method];
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(methodParse.color)} size="sm" className="gap-1">
						{methodParse.icon}
						{methodParse.label}
					</Chip>
				);
			},
		},
		{
			key: 'status',
			header: 'Status',
			render: (transaction) => {
				const statusParsed = paymentStatusParse[transaction.status];
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(statusParsed.color)} size="sm" className="gap-1">
						{statusParsed.icon}
						{statusParsed.label}
					</Chip>
				);
			},
		},
		{
			key: 'origin',
			header: 'Origem',
			sortable: false,
			render: (transaction) => {
				const sourceBadge = getRequestSourceBadge(transaction.requestSource);

				return (
						<Chip variant="soft" color={mapParseColorToChipColor(sourceBadge.color)} size="sm" className="gap-1 w-fit">
						<Icon icon={sourceBadge.icon} className="icon-xs" />
						{sourceBadge.label}
					</Chip>
				);
			},
		},
		{
			key: 'payer',
			header: 'Pagador',
			render: (transaction) => {
				if (!transaction.pix?.payerName) {
					return <span className="text-sm text-muted">-</span>;
				}
				return (
					<div className="flex flex-col">
						<span className="text-sm truncate max-w-40">{transaction.pix.payerName}</span>
						{transaction.pix.payerBank && <span className="text-xs text-muted">{transaction.pix.payerBank}</span>}
					</div>
				);
			},
		},
		{
			key: 'createdAt',
			header: 'Criado em',
			render: (transaction) => <span className="text-sm text-muted">{formatDate(transaction.createdAt)}</span>,
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			render: (transaction) => (
				<div className="flex flex-row gap-x-2 justify-center">
					{transaction.transactionVisualizationUrl && (
						<Tooltip>
							<Button
								isIconOnly
								variant="tertiary"
								onPress={async () => {
									await onCopyVisualizationLink(transaction.transactionVisualizationUrl!);
								}}
							>
								<Icon icon={Copy01Icon} className="icon-sm" />
								<Tooltip.Content>Copiar link de visualização</Tooltip.Content>
							</Button>
						</Tooltip>
					)}
					{canReprocess && transaction.status !== 'Completed' && (
						<Tooltip>
							<Button
								isIconOnly
								variant="primary"
								isDisabled={reprocessingTransactionId === transaction.id}
								onPress={() => onOpenReprocess(transaction.id)}
							>
								<Icon icon={PlayIcon} className="icon-sm" />
								<Tooltip.Content>Reprocessar transação</Tooltip.Content>
							</Button>
						</Tooltip>
					)}
					<Tooltip>
						<Button isIconOnly variant="tertiary" onClick={() => onViewTransaction(transaction.id)}>
							<Icon icon={ViewIcon} className="icon-sm" />
							<Tooltip.Content>Ver detalhes</Tooltip.Content>
						</Button>
					</Tooltip>
				</div>
			),
		},
	];
}

function renderMobileTransactionCard(transaction: AdminMinimalTransaction, _index: number, openActions?: () => void) {
	return (
		<div
			className={`rounded-xl border border-divider bg-surface p-3 overflow-hidden ${openActions ? 'cursor-pointer' : ''}`}
			onClick={openActions}
			role={openActions ? 'button' : undefined}
			tabIndex={openActions ? 0 : undefined}
			onKeyDown={
				openActions
					? (event) => {
							if (event.key === 'Enter' || event.key === ' ') {
								event.preventDefault();
								openActions();
							}
						}
					: undefined
			}
		>
			<div className="flex flex-col gap-2">
				<div>
					{(() => {
						const sourceBadge = getRequestSourceBadge(transaction.requestSource);

						return (
							<Chip variant="soft" color={mapParseColorToChipColor(sourceBadge.color)} className="gap-1 text-xs w-fit">
								<Icon icon={sourceBadge.icon} className="icon-xs" />
								{sourceBadge.label}
							</Chip>
						);
					})()}
				</div>
				<div className="flex items-start justify-between gap-2">
					<div className="flex flex-col gap-0.5 min-w-0">
						<div className="flex items-center gap-1.5">
							<Icon icon={Building02Icon} className="icon-xs text-muted shrink-0" />
							<span className="text-sm font-medium truncate">{transaction.merchant.name}</span>
						</div>
						{transaction.merchant.document && (
							<DocumentDisplay document={transaction.merchant.document} className="text-xs text-muted" />
						)}
					</div>
					<Chip
						variant="soft"
						color={mapParseColorToChipColor(paymentStatusParse[transaction.status].color)}
						className="shrink-0 text-xs"
					>
						{paymentStatusParse[transaction.status].label}
					</Chip>
				</div>
				{transaction.acquirer && (
					<div className="flex items-center gap-2">
					<Avatar size="sm" className="size-5 shrink-0">
						<Avatar.Image src={transaction.acquirer.logoUrl ?? undefined} alt={getAcquirerDisplayName(transaction.acquirer)} />
						<Avatar.Fallback>
							<Icon icon={Building02Icon} className="icon-xs text-accent" />
						</Avatar.Fallback>
					</Avatar>
						<div className="flex flex-col min-w-0">
							<span className="text-xs font-medium truncate">{getAcquirerDisplayName(transaction.acquirer)}</span>
							<ProviderCategoryChip category={transaction.acquirer.providerCategory} size="sm" />
							{transaction.acquirer.nominal && <span className="text-xs text-muted italic">{transaction.acquirer.nominal}</span>}
						</div>
					</div>
				)}
				<div className="flex items-start justify-between gap-2">
					<div className="flex flex-col gap-0.5">
						<span className="font-medium">{formatCurrency(transaction.amount)}</span>
						<span className="text-xs text-muted">Taxa: {formatCurrency(transaction.fee)}</span>
						<span className={`text-xs ${transaction.profit < 0 ? 'text-danger' : 'text-success'}`}>
							{transaction.profit < 0 ? 'Prejuízo' : 'Lucro'}: {formatCurrency(transaction.profit)}
						</span>
					</div>
					<Chip
						variant="soft"
						color={mapParseColorToChipColor(paymentMethodParse[transaction.method].color)}
						className="shrink-0 text-xs"
					>
						{paymentMethodParse[transaction.method].label}
					</Chip>
				</div>
				{transaction.pix?.payerName && (
					<div className="flex flex-col gap-0.5">
						<span className="text-xs text-muted truncate">{transaction.pix.payerName}</span>
						{transaction.pix.payerBank && (
							<span className="text-xs text-muted">{transaction.pix.payerBank}</span>
						)}
					</div>
				)}
				<span className="text-xs text-muted">{formatDate(transaction.createdAt)}</span>
			</div>
		</div>
	);
}

export function TransactionsTable({ canReprocess }: TransactionsTableProps) {
	const { data, filters, modal, actions } = useTransactionsTable();
	const [reprocessingTransactionId, setReprocessingTransactionId] = useState<string | null>(null);
	const [reprocessModal, setReprocessModal] = useState<{ isOpen: boolean; transactionId: string | null }>({
		isOpen: false,
		transactionId: null,
	});
	const [isReprocessing, startReprocessing] = useTransition();

	async function handleCopyVisualizationLink(url: string): Promise<void> {
		try {
			await navigator.clipboard.writeText(url);
			toast('Link de visualização copiado', {
				description: 'A URL da transação foi copiada para a área de transferência.',
				variant: 'success',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			});
		} catch {
			toast('Falha ao copiar link', {
				description: 'Não foi possível copiar automaticamente. Tente novamente.',
				variant: 'danger',
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
			});
		}
	}

	function handleOpenReprocess(transactionId: string) {
		setReprocessModal({ isOpen: true, transactionId });
	}

	function handleCloseReprocess() {
		setReprocessModal({ isOpen: false, transactionId: null });
	}

	async function handleReprocessTransaction(targetStatus: AdminReprocessTransactionTargetStatus) {
		if (!reprocessModal.transactionId) return;

		const transactionId = reprocessModal.transactionId;
		setReprocessingTransactionId(transactionId);
		startReprocessing(async () => {
			const response = await adminReprocessCompletedTransactionDev(transactionId, { targetStatus });

			if (response?.error) {
				toast.danger(response.error.message || 'Falha ao reprocessar transação.');
				setReprocessingTransactionId(null);
				return;
			}

			toast.success(response?.message || 'Transação reprocessada com sucesso.');
			handleCloseReprocess();
			actions.refresh();
			setReprocessingTransactionId(null);
		});
	}

	const columns = getColumns(
		actions.openDetails,
		handleCopyVisualizationLink,
		handleOpenReprocess,
		canReprocess,
		isReprocessing ? reprocessingTransactionId : null
	);

	const renderFiltersContent = () => (
		<>
			<SearchFilter
				label="Buscar"
				placeholder="ID, organização, CNPJ, paymentId, txId ou endToEnd"
				value={filters.values.search}
				onChange={(value) => filters.updateFilter('search', value)}
			/>

			<AsyncCombobox
				label="Organização"
				placeholder="Selecione uma organização"
				searchPlaceholder="Buscar organização"
				searchValue={filters.merchant.search}
				selectedValue={filters.merchant.selectedName}
				isLoading={filters.merchant.isLoading}
				options={filters.merchant.options}
				value={filters.values.merchantId}
				onSearchChange={filters.merchant.onSearchChange}
				onChange={filters.merchant.onChange}
			/>

			<AsyncCombobox
				label="Processadora"
				placeholder="Selecione uma processadora"
				searchPlaceholder="Buscar processadora"
				searchValue={filters.acquirer.search}
				selectedValue={filters.acquirer.selectedDisplayName}
				isLoading={filters.acquirer.isLoading}
				options={filters.acquirer.options}
				value={filters.values.acquirerId}
				onSearchChange={filters.acquirer.onSearchChange}
				onChange={filters.acquirer.onChange}
			/>

			<SelectFilter
				label="Status"
				value={filters.values.status}
				options={statusOptions}
				onChange={(value) => filters.updateFilter('status', (value || 'all') as PaymentStatus | 'all')}
				allLabel="Todos os status"
			/>

			<SelectFilter
				label="Método"
				value={filters.values.method}
				options={methodOptions}
				onChange={(value) => filters.updateFilter('method', (value || 'all') as PaymentMethod | 'all')}
				allLabel="Todos os métodos"
			/>

			<SelectFilter
				label="Por página"
				value={filters.values.pageSize}
				options={pageSizeFilterOptions}
				onChange={(value) => filters.updateFilter('pageSize', value || '10')}
				showChips={false}
			/>
		</>
	);

	return (
		<div className="flex flex-col gap-4">
			<PageHeader
				icon={<Icon icon={CreditCardIcon} className="icon-md text-accent-foreground" />}
				title="Transações"
				description="Gerencie todas as transações da plataforma"
			/>

			<DataTable
				columns={columns}
				data={data.items.items}
				keyExtractor={(transaction) => transaction.id}
				isLoading={data.isLoading}
				skeletonRows={data.pageSizeValue}
				emptyMessage="Nenhuma transação encontrada"
				minWidth="min-w-300"
				renderMobileCard={renderMobileTransactionCard}
				mobileActions={{
					title: (transaction) => transaction.merchant.name ?? 'Transação',
					subtitle: (transaction) => formatCurrency(transaction.amount),
					renderActions: (transaction, close) => (
						<div className="flex flex-col gap-2">
							<Button
								variant="secondary"
								className="w-full justify-start"
								onPress={() => {
									actions.openDetails(transaction.id);
									close();
								}}
							>
								<Icon icon={ViewIcon} className="icon-sm" />
								Ver detalhes
							</Button>
							{transaction.transactionVisualizationUrl && (
								<Button
									variant="secondary"
									className="w-full justify-start"
									onPress={async () => {
										await handleCopyVisualizationLink(transaction.transactionVisualizationUrl!);
										close();
									}}
								>
									<Icon icon={Copy01Icon} className="icon-sm" />
									Copiar link de visualização
								</Button>
							)}
							{canReprocess && transaction.status !== 'Completed' && (
								<Button
									variant="secondary"
									className="w-full justify-start"
									onPress={() => {
										handleOpenReprocess(transaction.id);
										close();
									}}
								>
									<Icon icon={PlayIcon} className="icon-sm" />
									Reprocessar transação
								</Button>
							)}
						</div>
					),
				}}
				filters={{
					children: renderFiltersContent,
					hasFilters: filters.hasFilters,
					onClear: filters.clear,
					onRefresh: actions.refresh,
					isRefreshing: data.isRefreshing,
				}}
				pagination={{
					page: filters.values.page,
					pageSize: data.pageSizeValue,
					totalItems: data.items.totalItems,
					totalPages: data.items.totalPages,
					onPageChange: (nextPage) => filters.updateFilter('page', nextPage),
					isNavigating: data.isLoading,
				}}
			/>

			<AdminTransactionDetailsModal
				isOpen={modal.isOpen}
				transactionPromise={modal.transactionPromise}
				onOpenChange={modal.close}
				canReprocess={canReprocess}
				onReprocessed={actions.refresh}
			/>

			<AdminReprocessConfirmModal
				isOpen={reprocessModal.isOpen}
				onOpenChange={(isOpen) => {
					if (!isOpen) {
						handleCloseReprocess();
					}
				}}
				title="Reprocessar transação"
				description="Selecione o status de destino para reprocessar esta transação."
				confirmLabel="Reprocessar transação"
				statusLabel="Status de destino"
				acknowledgeLabel="Estou ciente do impacto operacional deste reprocessamento."
				options={[
					{
						value: 'Completed',
						label: paymentStatusParse.Completed.label,
						color: paymentStatusParse.Completed.color,
						icon: paymentStatusParse.Completed.icon,
					},
					{
						value: 'Failed',
						label: paymentStatusParse.Failed.label,
						color: paymentStatusParse.Failed.color,
						icon: paymentStatusParse.Failed.icon,
					},
				]}
				defaultStatus="Completed"
				isPending={isReprocessing}
				onConfirm={async (targetStatus) => {
					await handleReprocessTransaction(targetStatus as AdminReprocessTransactionTargetStatus);
				}}
			/>
		</div>
	);
}

