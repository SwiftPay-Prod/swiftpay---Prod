'use client';

import { useState, useTransition } from 'react';
import { Button, Tooltip, Avatar, toast, Chip } from '@heroui/react';
import {
	ViewIcon,
	Building02Icon,
	WalletRemove01Icon,
	Key01Icon,
	CheckmarkCircle02Icon,
	PlayIcon,
	Wallet01Icon,
	ArrowReloadHorizontalIcon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import type { AdminMinimalCashout } from '@/types/admin/cashouts';
import { PayoutStatus } from '@/types/enums';
import {
	payoutStatusParse,
	pixKeyTypeParse,
	mapParseColorToChipColor,
	parseToFilterOptions,
	pageSizeFilterOptions,
} from '@/parse';
import { formatDate } from '@/utils/datetime';
import { formatCurrency } from '@/utils/currency';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { RevolutStatusBadge } from '@/components/ui/revolut-status-badge';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { SearchFilter } from '@/components/ui/search-filter';
import { SelectFilter } from '@/components/ui/select-filter';
import { AsyncCombobox } from '@/components/ui/async-combobox';
import { DocumentDisplay } from '@/components/ui/data-links';
import { TableIdCell } from '@/components/ui/table-id-cell';
import { AdminMerchantLink } from '@/components/admin/admin-merchant-link';
import { ProviderCategoryChip } from '@/components/admin/provider-category-chip';
import { adminReprocessCompletedCashoutDev } from '@/app/actions/admin/cashouts';
import { AdminCashoutDetailsModal } from './modals/admin-cashout-details-modal';
import { AdminCashoutEvaluateModal } from './modals/admin-cashout-evaluate-modal';
import { AdminReprocessConfirmModal } from '@/components/admin/admin-reprocess-confirm-modal';
import { formatDocument } from '@/utils/input-masks';
import { useCashoutsTable } from './use-cashouts-table';
import type { AdminReprocessCashoutTargetStatus } from '@/types/admin/cashouts';

interface CashoutsTableProps {
	canReprocess: boolean;
}

function getAcquirerDisplayName(acquirer: { displayName?: string | null; name: string }): string {
	return acquirer.displayName?.trim() || acquirer.name;
}

const statusOptions = parseToFilterOptions(payoutStatusParse, 'Todos os status');

function getColumns(
	onViewCashout: (id: string) => void,
	onEvaluateCashout: (cashout: AdminMinimalCashout) => void,
	onOpenReprocess: (id: string) => void,
	canReprocess: boolean,
	reprocessingCashoutId: string | null
): DataTableColumn<AdminMinimalCashout>[] {
	return [
		{
			key: 'id',
			header: 'ID',
			width: '140px',
			render: (cashout) => <TableIdCell id={cashout.id} copyLabel="ID do saque" />,
		},
		{
			key: 'merchant',
			header: 'Organização',
			render: (cashout) => (
				<div className="flex items-center gap-2">
					<Icon icon={Building02Icon} className="icon-sm text-muted shrink-0" />
					<div className="flex flex-col">
						<AdminMerchantLink
							merchantId={cashout.merchant.id}
							name={cashout.merchant.name}
							className="text-sm truncate max-w-40 text-accent hover:underline"
						/>
						<DocumentDisplay document={cashout.merchant.document} className="text-xs text-muted" />
					</div>
				</div>
			),
		},
		{
			key: 'acquirer',
			header: 'Processadora',
			render: (cashout) => {
				if (!cashout.acquirer) {
					return <span className="text-sm text-muted">-</span>;
				}
				const displayName = getAcquirerDisplayName(cashout.acquirer);
				return (
					<div className="flex items-center gap-2">
						<Avatar size="sm">
							{cashout.acquirer.logoUrl ? (
								<Avatar.Image src={cashout.acquirer.logoUrl} alt={displayName} />
							) : (
								<Avatar.Fallback className="text-xs">
									{displayName.slice(0, 2).toUpperCase()}
								</Avatar.Fallback>
							)}
						</Avatar>
						<div className="flex flex-col">
							<span className="text-sm">{displayName}</span>
							<ProviderCategoryChip category={cashout.acquirer.providerCategory} size="sm" />
							{cashout.acquirer.nominal && <span className="text-xs text-muted">{cashout.acquirer.nominal}</span>}
						</div>
					</div>
				);
			},
		},
		{
			key: 'totalDebited',
			header: 'Total Debitado',
			render: (cashout) => {
				const isLoss = cashout.swiftpayProfitAmount < 0;

				return (
					<div className="flex flex-col">
						<span className="font-medium">{formatCurrency(cashout.amount)}</span>
						<span className="text-xs text-muted">Taxa: {formatCurrency(cashout.feeAmount)}</span>
						<span className={`text-xs ${isLoss ? 'text-danger' : 'text-success'}`}>
							{isLoss ? 'Prejuízo' : 'Lucro'}: {formatCurrency(cashout.swiftpayProfitAmount)}
						</span>
					</div>
				);
			},
		},
		{
			key: 'status',
			header: 'Status',
			render: (cashout) => (
				<RevolutStatusBadge status={cashout.status} label={payoutStatusParse[cashout.status]?.label} />
			),
		},
		{
			key: 'payoutAccount',
			header: 'Conta Destino',
			render: (cashout) => {
				const payoutAccount = cashout.payoutAccount;
				if (!payoutAccount) {
					return <span className="text-sm text-muted">Conta não informada</span>;
				}

				const pixKeyParse = pixKeyTypeParse[payoutAccount.pixKeyType];
				return (
					<div className="flex flex-col">
						<div className="flex items-center gap-1.5">
							<Icon icon={Key01Icon} className="icon-xs text-muted" />
							<span className="text-sm truncate max-w-32">{payoutAccount.pixKey}</span>
						</div>
						<span className="text-xs text-muted">{pixKeyParse.label}</span>
					</div>
				);
			},
		},
		{
			key: 'requestedAt',
			header: 'Solicitado em',
			render: (cashout) => (
				<span className="text-sm text-muted">{formatDate(cashout.requestedAt)}</span>
			),
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			render: (cashout) => {
				const isPendingStatus = cashout.status === PayoutStatus.Pending;

				return (
					<div className="flex flex-row gap-x-2 justify-center">
						{canReprocess && cashout.status !== PayoutStatus.Completed && (
							<Tooltip>
								<Button
									isIconOnly
									variant="primary"
									size="sm"
									isDisabled={reprocessingCashoutId === cashout.id}
									onPress={() => onOpenReprocess(cashout.id)}
								>
									<Icon icon={PlayIcon} className="icon-sm" />
									<Tooltip.Content>Reprocessar saque</Tooltip.Content>
								</Button>
							</Tooltip>
						)}
						{isPendingStatus && (
							<Tooltip>
								<Button
									isIconOnly
									variant="primary"
									size="sm"
									onClick={() => onEvaluateCashout(cashout)}
								>
									<Icon icon={CheckmarkCircle02Icon} className="icon-sm" />
									<Tooltip.Content>Avaliar saque</Tooltip.Content>
								</Button>
							</Tooltip>
						)}
						<Tooltip>
							<Button isIconOnly variant="tertiary" size="sm" onClick={() => onViewCashout(cashout.id)}>
								<Icon icon={ViewIcon} className="icon-sm" />
								<Tooltip.Content>Ver detalhes</Tooltip.Content>
							</Button>
						</Tooltip>
					</div>
				);
			},
		},
	];
}

function renderMobileCashoutCard(cashout: AdminMinimalCashout, _index: number, openActions?: () => void) {
	const payoutAccount = cashout.payoutAccount;
	const pixKeyParse = payoutAccount ? pixKeyTypeParse[payoutAccount.pixKeyType] : null;

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
				<div className="flex items-start justify-between gap-2">
					<div className="flex flex-col gap-0.5 min-w-0">
						<div className="flex items-center gap-1.5">
							<Icon icon={Building02Icon} className="icon-xs text-muted shrink-0" />
							<span className="text-sm font-medium truncate">{cashout.merchant.name}</span>
						</div>
						{cashout.merchant.document && (
							<DocumentDisplay document={cashout.merchant.document} className="text-xs text-muted" />
						)}
					</div>
					<Chip
						variant="soft"
						color={mapParseColorToChipColor(payoutStatusParse[cashout.status].color)}
						className="shrink-0 text-xs"
					>
						{payoutStatusParse[cashout.status].label}
					</Chip>
				</div>
				{cashout.acquirer && (
					<div className="flex items-center gap-2">
					<Avatar size="sm" className="size-5 shrink-0">
						<Avatar.Image src={cashout.acquirer.logoUrl ?? undefined} alt={getAcquirerDisplayName(cashout.acquirer)} />
						<Avatar.Fallback>
							<Icon icon={Building02Icon} className="icon-xs text-accent" />
						</Avatar.Fallback>
					</Avatar>
						<div className="flex flex-col min-w-0">
							<span className="text-xs font-medium truncate">{getAcquirerDisplayName(cashout.acquirer)}</span>
							<ProviderCategoryChip category={cashout.acquirer.providerCategory} size="sm" />
							{cashout.acquirer.nominal && <span className="text-xs text-muted">{cashout.acquirer.nominal}</span>}
						</div>
					</div>
				)}
				<div className="flex flex-col gap-0.5">
					<span className="font-medium">{formatCurrency(cashout.amount)}</span>
					<span className="text-xs text-muted">Taxa: {formatCurrency(cashout.feeAmount)}</span>
					<span className={`text-xs ${cashout.swiftpayProfitAmount < 0 ? 'text-danger' : 'text-success'}`}>
						{cashout.swiftpayProfitAmount < 0 ? 'Prejuízo' : 'Lucro'}: {formatCurrency(cashout.swiftpayProfitAmount)}
					</span>
					<span className="text-xs text-danger">Pago: {formatCurrency(cashout.netAmount)}</span>
				</div>
				<div className="flex items-center gap-1.5">
					<Icon icon={Key01Icon} className="icon-xs text-muted shrink-0" />
					{payoutAccount && pixKeyParse ? (
						<>
							<span className="text-xs truncate">{payoutAccount.pixKey}</span>
							<span className="text-xs text-muted shrink-0">{pixKeyParse.label}</span>
						</>
					) : (
						<span className="text-xs text-muted">Conta não informada</span>
					)}
				</div>
				<span className="text-xs text-muted">{formatDate(cashout.requestedAt)}</span>
			</div>
		</div>
	);
}

export function CashoutsTable({ canReprocess }: CashoutsTableProps) {
	const { data, filters, merchantFilter, acquirerFilter, modals, actions } = useCashoutsTable();
	const [reprocessingCashoutId, setReprocessingCashoutId] = useState<string | null>(null);
	const [reprocessModal, setReprocessModal] = useState<{ isOpen: boolean; cashoutId: string | null }>({
		isOpen: false,
		cashoutId: null,
	});
	const [isReprocessing, startReprocessing] = useTransition();

	function handleOpenReprocess(cashoutId: string) {
		setReprocessModal({ isOpen: true, cashoutId });
	}

	function handleCloseReprocess() {
		setReprocessModal({ isOpen: false, cashoutId: null });
	}

	async function handleReprocessCashout(targetStatus: AdminReprocessCashoutTargetStatus) {
		if (!reprocessModal.cashoutId) return;

		const cashoutId = reprocessModal.cashoutId;
		setReprocessingCashoutId(cashoutId);
		startReprocessing(async () => {
			const response = await adminReprocessCompletedCashoutDev(cashoutId, { targetStatus });

			if (response?.error) {
				toast.danger(response.error.message || 'Falha ao reprocessar saque.');
				setReprocessingCashoutId(null);
				return;
			}

			toast.success(response?.message || 'Saque reprocessado com sucesso.');
			handleCloseReprocess();
			filters.handleRefresh();
			setReprocessingCashoutId(null);
		});
	}

	const columns = getColumns(
		actions.openDetails,
		actions.openEvaluate,
		handleOpenReprocess,
		canReprocess,
		isReprocessing ? reprocessingCashoutId : null
	);

	const renderFiltersContent = () => (
		<>
			<SearchFilter
				label="Buscar"
				placeholder="ID, organização, CNPJ ou chave PIX"
				value={filters.values.search}
				onChange={filters.handleSearchChange}
			/>

			<AsyncCombobox
				label="Organização"
				placeholder="Selecione uma organização"
				searchPlaceholder="Buscar organização"
				searchValue={filters.values.merchantSearch}
				selectedValue={merchantFilter.selected?.name}
				isLoading={merchantFilter.isLoading}
				options={merchantFilter.options.map((merchant) => ({
					key: merchant.id,
					label: merchant.name ?? 'Sem nome',
					description: merchant.document ? formatDocument(merchant.document) : null,
				}))}
				value={filters.values.merchantId}
				onSearchChange={merchantFilter.handleSearchChange}
				onChange={merchantFilter.handleChange}
			/>

			<AsyncCombobox
				label="Processadora"
				placeholder="Selecione uma processadora"
				searchPlaceholder="Buscar processadora"
				searchValue={filters.values.acquirerSearch}
				selectedValue={acquirerFilter.selected ? getAcquirerDisplayName(acquirerFilter.selected) : undefined}
				isLoading={acquirerFilter.isLoading}
				options={acquirerFilter.options.map((acquirer) => ({
					key: acquirer.id,
					label: getAcquirerDisplayName(acquirer),
					description: acquirer.nominal ?? acquirer.name,
				}))}
				value={filters.values.acquirerId}
				onSearchChange={acquirerFilter.handleSearchChange}
				onChange={acquirerFilter.handleChange}
			/>

			<SelectFilter
				label="Status"
				value={filters.values.status}
				options={statusOptions}
				onChange={filters.handleStatusChange}
				allLabel="Todos os status"
			/>

			<SelectFilter
				label="Por página"
				value={filters.values.pageSize}
				options={pageSizeFilterOptions}
				onChange={filters.handlePageSizeChange}
				showChips={false}
			/>
		</>
	);

	const itemsList = data.items.items;
	const totalVolume = itemsList.reduce((sum, c) => sum + (c.amount ?? 0), 0);
	const completedCount = itemsList.filter((c) => c.status === 'Completed').length;
	const totalProfit = itemsList.reduce((sum, c) => sum + (c.swiftpayProfitAmount ?? 0), 0);

	return (
		<div className="flex flex-col gap-6 text-white">
			{/* Executive Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
				<div>
					<div className="flex items-center gap-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
							<Icon icon={WalletRemove01Icon} className="icon-sm text-[#4f55f1]" />
						</div>
						<h1 className="text-xl font-bold tracking-tight text-white">Saques das Organizações</h1>
					</div>
					<p className="text-xs text-white/50 mt-1">
						Auditoria, liberação e liquidação PIX dos saques solicitados pelos merchants
					</p>
				</div>

				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={filters.handleRefresh}
						disabled={data.isRefreshing}
						className="button-outline-dark cursor-pointer text-xs"
					>
						<Icon icon={ArrowReloadHorizontalIcon} className={`icon-xs ${data.isRefreshing ? 'animate-spin' : ''}`} />
						<span>Atualizar</span>
					</button>
				</div>
			</div>

			{/* 4-Tile High Contrast KPI Grid */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Total na Página
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
							<Icon icon={WalletRemove01Icon} className="icon-xs" />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block">
							<AnimatedNumber value={data.items.totalItems} />
						</span>
						<p className="text-xs text-white/40 font-mono mt-0.5">Pedidos de saque</p>
					</div>
				</div>

				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Saques Concluídos
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00a87e]/15 text-[#00a87e] border border-[#00a87e]/30">
							<Icon icon={CheckmarkCircle02Icon} className="icon-xs text-[#00a87e]" />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-[#00a87e] tracking-tight tabular-nums block">
							<AnimatedNumber value={completedCount} />
						</span>
						<p className="text-xs text-[#00a87e]/80 font-mono mt-0.5">Liquidados via PIX</p>
					</div>
				</div>

				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Volume Solicitado
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/30">
							<Icon icon={Wallet01Icon} className="icon-xs" />
						</div>
					</div>
					<div>
						<AnimatedCurrency
							value={totalVolume}
							className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block"
						/>
						<p className="text-xs text-white/40 font-mono mt-0.5">Soma dos saques exibidos</p>
					</div>
				</div>

				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Lucro SwiftPay
						</span>
						<div className={`flex h-7 w-7 items-center justify-center rounded-lg ${totalProfit >= 0 ? 'bg-[#00a87e]/15 text-[#00a87e] border border-[#00a87e]/30' : 'bg-[#e23b4a]/15 text-[#e23b4a] border border-[#e23b4a]/30'}`}>
							<Icon icon={Wallet01Icon} className="icon-xs" />
						</div>
					</div>
					<div>
						<AnimatedCurrency
							value={totalProfit}
							className={`text-2xl font-extrabold font-mono tracking-tight tabular-nums block ${totalProfit >= 0 ? 'text-[#00a87e]' : 'text-[#e23b4a]'}`}
						/>
						<p className="text-xs text-white/40 font-mono mt-0.5">Taxas líquidas de saque</p>
					</div>
				</div>
			</div>

			{/* Main Data Table */}
			<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 sm:p-6 overflow-hidden">
				<DataTable
					columns={columns}
					data={data.items.items}
					keyExtractor={(cashout) => cashout.id}
					isLoading={data.isLoading}
					skeletonRows={data.pageSizeValue}
					emptyMessage="Nenhum saque encontrado"
					minWidth="min-w-300"
					renderMobileCard={renderMobileCashoutCard}
					filters={{
						children: renderFiltersContent,
						hasFilters: filters.hasFilters,
						onClear: filters.handleClearFilters,
						onRefresh: filters.handleRefresh,
						isRefreshing: data.isRefreshing,
					}}
					pagination={{
						page: filters.values.page,
						pageSize: data.pageSizeValue,
						totalItems: data.items.totalItems,
						totalPages: data.items.totalPages,
						onPageChange: filters.handlePageChange,
						sortBy: filters.values.sortBy,
						sortOrder: filters.values.sortOrder,
						onSortChange: (sortBy, sortOrder) => {
							filters.updateFilter('sortBy', sortBy);
							filters.updateFilter('sortOrder', sortOrder);
							filters.updateFilter('page', 1);
						},
						isNavigating: data.isLoading,
					}}
				/>
			</div>
			<AdminCashoutDetailsModal
				isOpen={modals.details.isOpen}
				onOpenChange={modals.details.close}
				cashoutPromise={modals.details.cashoutPromise}
				canReprocess={canReprocess}
				onReprocessed={filters.handleRefresh}
			/>

			<AdminCashoutEvaluateModal
				isOpen={modals.evaluate.isOpen}
				onOpenChange={modals.evaluate.close}
				cashout={modals.evaluate.cashout}
				onEvaluated={modals.evaluate.onEvaluated}
			/>

			<AdminReprocessConfirmModal
				isOpen={reprocessModal.isOpen}
				onOpenChange={(isOpen) => {
					if (!isOpen) {
						handleCloseReprocess();
					}
				}}
				title="Reprocessar saque"
				description="Selecione o status de destino para reprocessar este saque."
				confirmLabel="Reprocessar saque"
				statusLabel="Status de destino"
				acknowledgeLabel="Estou ciente do impacto operacional deste reprocessamento."
				options={[
					{
						value: 'Completed',
						label: payoutStatusParse.Completed.label,
						color: payoutStatusParse.Completed.color,
						icon: payoutStatusParse.Completed.icon,
					},
					{
						value: 'Failed',
						label: payoutStatusParse.Failed.label,
						color: payoutStatusParse.Failed.color,
						icon: payoutStatusParse.Failed.icon,
					},
					{
						value: 'Rejected',
						label: payoutStatusParse.Rejected.label,
						color: payoutStatusParse.Rejected.color,
						icon: payoutStatusParse.Rejected.icon,
					},
				]}
				defaultStatus="Completed"
				isPending={isReprocessing}
				onConfirm={async (targetStatus) => {
					await handleReprocessCashout(targetStatus as AdminReprocessCashoutTargetStatus);
				}}
			/>
		</div>
	);
}

