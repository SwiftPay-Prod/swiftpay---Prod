'use client';

import { Button, Tooltip } from '@heroui/react';
import {
	ViewIcon,
	Wallet01Icon,
	Add01Icon,
	ServerStack01Icon,
	Settings02Icon,
	CheckmarkCircle02Icon,
	ArrowReloadHorizontalIcon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { RevolutStatusBadge } from '@/components/ui/revolut-status-badge';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { AnimatedNumber } from '@/components/ui/animated-number';
import type { AdminPlatformPayoutData } from '@/types/admin/platform-payouts';
import {
	platformPayoutStatusParse,
	mapParseColorToChipColor,
	parseToFilterOptions,
	pageSizeFilterOptions,
} from '@/parse';
import { formatDate } from '@/utils/datetime';
import { formatCurrency } from '@/utils/currency';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { TableIdCell } from '@/components/ui/table-id-cell';
import { SelectFilter } from '@/components/ui/select-filter';
import { AdminPlatformPayoutDetailsModal } from './modals/admin-platform-payout-details-modal';
import { AdminNewPlatformPayoutModal } from './modals/admin-new-platform-payout-modal';
import { AutomaticPlatformCashoutConfigModal } from './modals/automatic-platform-cashout-config-modal';
import { usePlatformPayoutsTable } from './use-platform-payouts-table';

const statusOptions = parseToFilterOptions(platformPayoutStatusParse, 'Todos os status');

function getColumns(
	onViewPayout: (id: string) => void
): DataTableColumn<AdminPlatformPayoutData>[] {
	return [
		{
			key: 'id',
			header: 'ID',
			width: '140px',
			render: (payout) => <TableIdCell id={payout.id} copyLabel="ID do saque da plataforma" />,
		},
		{
			key: 'totalAmount',
			header: 'Valor Total',
			render: (payout) => (
				<span className="font-mono tabular-nums text-white">{formatCurrency(payout.totalAmount)}</span>
			),
		},
		{
			key: 'totalFee',
			header: 'Taxa',
			render: (payout) => (
				<span className="font-mono tabular-nums text-sm text-danger">{formatCurrency(payout.totalFee)}</span>
			),
		},
		{
			key: 'totalNetAmount',
			header: 'Valor Líquido',
			render: (payout) => (
				<span className="font-mono tabular-nums font-medium text-success">{formatCurrency(payout.totalNetAmount)}</span>
			),
		},
		{
			key: 'status',
			header: 'Status',
			render: (payout) => {
				const statusParsed = platformPayoutStatusParse[payout.status];
				const isSimulated = payout.notes?.startsWith('Saque simulado') ?? false;
				return (
					<div className="flex items-center gap-2">
						<RevolutStatusBadge status={payout.status} label={statusParsed.label} />
						{isSimulated && (
							<span className="inline-flex items-center rounded-full border border-white/12 bg-white/5 px-2.5 py-0.5 font-mono font-medium text-xs text-white/70">
								Simulado
							</span>
						)}
					</div>
				);
			},
		},
		{
			key: 'acquirers',
			header: 'Adquirentes',
			render: (payout) => (
				<div className="flex items-center gap-1.5">
					<Icon icon={ServerStack01Icon} className="icon-xs text-muted shrink-0" />
					<span className="text-sm">{payout.items.length} adquirente{payout.items.length !== 1 ? 's' : ''}</span>
				</div>
			),
		},
		{
			key: 'requestedBy',
			header: 'Solicitado por',
			render: (payout) => (
				<span className="text-sm text-muted truncate max-w-32">
					{payout.requestedByUserName ?? '-'}
				</span>
			),
		},
		{
			key: 'requestedAt',
			header: 'Data',
			render: (payout) => (
				<span className="text-sm text-muted">{formatDate(payout.requestedAt)}</span>
			),
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			render: (payout) => (
				<div className="flex flex-row gap-x-2 justify-center">
					<Tooltip>
						<Button isIconOnly variant="tertiary" size="sm" onPress={() => onViewPayout(payout.id)}>
							<Icon icon={ViewIcon} className="icon-sm" />
							<Tooltip.Content>Ver detalhes</Tooltip.Content>
						</Button>
					</Tooltip>
				</div>
			),
		},
	];
}

function renderMobilePlatformPayoutCard(payout: AdminPlatformPayoutData, _index: number, openActions?: () => void) {
	return (
		<div
			className={`rounded-[20px] border border-white/12 bg-[#16181a] p-4 overflow-hidden ${openActions ? 'cursor-pointer' : ''}`}
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
			<div className="flex flex-col gap-3">
				<div className="flex items-start justify-between gap-2">
					<div className="flex flex-col gap-1">
						<span className="font-mono tabular-nums text-white">{formatCurrency(payout.totalAmount)}</span>
						<span className="text-xs text-danger">Taxa: {formatCurrency(payout.totalFee)}</span>
						<span className="font-mono tabular-nums text-xs text-success">{formatCurrency(payout.totalNetAmount)}</span>
					</div>
					<div className="flex flex-col items-end gap-1">
						<RevolutStatusBadge status={payout.status} label={platformPayoutStatusParse[payout.status].label} />
						{payout.notes?.startsWith('Saque simulado') && (
							<span className="inline-flex items-center rounded-full border border-white/12 bg-white/5 px-2.5 py-0.5 font-mono font-medium text-xs text-white/70">
								Simulado
							</span>
						)}
					</div>
				</div>
				<div className="flex items-center gap-1.5">
					<Icon icon={ServerStack01Icon} className="icon-xs text-white/50 shrink-0" />
					<span className="text-xs text-white/50">{payout.items.length} adquirente(s)</span>
				</div>
				{payout.requestedByUserName && (
					<span className="text-xs text-white/50">{payout.requestedByUserName}</span>
				)}
				<span className="text-xs text-white/50">{formatDate(payout.requestedAt)}</span>
			</div>
		</div>
	);
}

export function PlatformPayoutsTable() {
	const { data, automaticCashout, filters, modals, actions } = usePlatformPayoutsTable();

	const columns = getColumns(actions.openDetails);

	const renderFiltersContent = () => (
		<>
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
	const totalItemsCount = data.items.totalItems;
	const completedCount = itemsList.filter((p) => p.status === 'Completed').length;
	const totalNetAmountSum = itemsList.reduce((sum, p) => sum + (p.totalNetAmount ?? 0), 0);

	return (
		<div className="flex flex-col gap-6 text-white">
			{/* Executive Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
				<div>
					<div className="flex items-center gap-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
							<Icon icon={Wallet01Icon} className="icon-sm text-[#4f55f1]" />
						</div>
						<h1 className="text-xl font-bold tracking-tight text-white">Saques da Plataforma</h1>
					</div>
					<p className="text-xs text-white/50 mt-1">
						Gestão de transferências e liquidação do saldo operacional para a conta bancária da SwiftPay
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<button
						type="button"
						onClick={actions.openAutomaticConfig}
						className="button-outline-dark cursor-pointer text-xs"
					>
						<Icon icon={Settings02Icon} className="icon-xs" />
						<span>Saque Automatizado</span>
					</button>
					<button
						type="button"
						onClick={actions.openNewPayout}
						className="button-primary cursor-pointer text-xs"
					>
						<Icon icon={Add01Icon} className="icon-xs" />
						<span>+ Novo Saque</span>
					</button>
				</div>
			</div>

			{/* 3-Tile High Contrast KPI Grid */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Total de Saques
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
							<Icon icon={Wallet01Icon} className="icon-xs" />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block">
							<AnimatedNumber value={totalItemsCount} />
						</span>
						<p className="text-xs text-white/40 font-mono mt-0.5">Operações registradas</p>
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
						<p className="text-xs text-[#00a87e]/80 font-mono mt-0.5">Liquidados na conta bancária</p>
					</div>
				</div>

				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Volume Líquido na Página
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/30">
							<Icon icon={Wallet01Icon} className="icon-xs" />
						</div>
					</div>
					<div>
						<AnimatedCurrency
							value={totalNetAmountSum}
							className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block"
						/>
						<p className="text-xs text-white/40 font-mono mt-0.5">Líquido após taxas bancárias</p>
					</div>
				</div>
			</div>

			{/* Main Data Table */}
			<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 sm:p-6 overflow-hidden">
				<DataTable
					columns={columns}
					data={data.items.items}
					keyExtractor={(payout) => payout.id}
					isLoading={data.isLoading}
					skeletonRows={data.pageSizeValue}
					emptyMessage="Nenhum saque encontrado"
					minWidth="min-w-250"
					renderMobileCard={renderMobilePlatformPayoutCard}
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
						isNavigating: data.isLoading,
					}}
				/>
			</div>
			<AdminPlatformPayoutDetailsModal
				isOpen={modals.details.isOpen}
				onOpenChange={modals.details.close}
				payoutPromise={modals.details.payoutPromise}
				onReprocessed={modals.details.onReprocessed}
			/>

			<AdminNewPlatformPayoutModal
				isOpen={modals.newPayout.isOpen}
				onOpenChange={modals.newPayout.close}
				onCreated={modals.newPayout.onCreated}
				availabilityPromise={modals.newPayout.availabilityPromise}
				accountsPromise={modals.newPayout.accountsPromise}
			/>

			<AutomaticPlatformCashoutConfigModal
				isOpen={modals.automaticConfig.isOpen}
				onOpenChange={modals.automaticConfig.close}
				settingsPromise={modals.automaticConfig.settingsPromise}
				payoutAccountsPromise={modals.automaticConfig.accountsPromise}
				onSuccess={modals.automaticConfig.onSaved}
			/>
		</div>
	);
}
