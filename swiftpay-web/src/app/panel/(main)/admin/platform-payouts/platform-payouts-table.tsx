'use client';

import { Button, Chip, Tooltip } from '@heroui/react';
import {
	ViewIcon,
	Wallet01Icon,
	Add01Icon,
	ServerStack01Icon,
	Settings02Icon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';
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
				<span className="font-medium">{formatCurrency(payout.totalAmount)}</span>
			),
		},
		{
			key: 'totalFee',
			header: 'Taxa',
			render: (payout) => (
				<span className="text-sm text-danger">{formatCurrency(payout.totalFee)}</span>
			),
		},
		{
			key: 'totalNetAmount',
			header: 'Valor Líquido',
			render: (payout) => (
				<span className="font-medium text-success">{formatCurrency(payout.totalNetAmount)}</span>
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
						<Chip
							variant="soft"
							color={mapParseColorToChipColor(statusParsed.color)}
							size="sm"
							className="gap-1"
						>
							{statusParsed.icon}
							{statusParsed.label}
						</Chip>
						{isSimulated && (
							<Chip variant="soft" color="warning" size="sm">
								Simulado
							</Chip>
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
					<div className="flex flex-col gap-0.5">
						<span className="font-medium">{formatCurrency(payout.totalAmount)}</span>
						<span className="text-xs text-danger">Taxa: {formatCurrency(payout.totalFee)}</span>
						<span className="text-xs text-success">Líquido: {formatCurrency(payout.totalNetAmount)}</span>
					</div>
					<div className="flex flex-col items-end gap-1">
						<Chip
							variant="soft"
							color={mapParseColorToChipColor(platformPayoutStatusParse[payout.status].color)}
							className="shrink-0 text-xs"
						>
							{platformPayoutStatusParse[payout.status].label}
						</Chip>
						{payout.notes?.startsWith('Saque simulado') && (
							<Chip variant="soft" color="warning" className="shrink-0 text-xs">
								Simulado
							</Chip>
						)}
					</div>
				</div>
				<div className="flex items-center gap-1.5">
					<Icon icon={ServerStack01Icon} className="icon-xs text-muted shrink-0" />
					<span className="text-xs text-muted">{payout.items.length} adquirente(s)</span>
				</div>
				{payout.requestedByUserName && (
					<span className="text-xs text-muted">{payout.requestedByUserName}</span>
				)}
				<span className="text-xs text-muted">{formatDate(payout.requestedAt)}</span>
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

	return (
		<div className="flex flex-col gap-4">
			<PageHeader
				icon={<Icon icon={Wallet01Icon} className="icon-md text-accent-foreground" />}
				title="Saques da Plataforma"
				description={
					<div className="flex flex-col items-start gap-2">
						<span>Gerencie os saques do saldo da plataforma para a conta de destino</span>
						{!automaticCashout.isLoading && (
							<div className="flex flex-col items-start gap-1">
								<Chip variant="soft" color={automaticCashout.isEnabled ? 'success' : 'default'} size="sm">
									{automaticCashout.isEnabled ? 'Saque automatizado Ativo' : 'Saque automatizado Inativo'}
								</Chip>
								{automaticCashout.isEnabled && automaticCashout.nextAttemptAt && (
									<span className="text-xs text-muted">
										Próxima tentativa: {formatDate(automaticCashout.nextAttemptAt)}
									</span>
								)}
							</div>
						)}
					</div>
				}
				actions={
					<div className="flex flex-wrap items-center gap-2">
						<Button variant="secondary" size="sm" onPress={actions.openAutomaticConfig}>
							<Icon icon={Settings02Icon} className="icon-sm" />
							Configurar saque automatizado
						</Button>
						<Button variant="primary" onPress={actions.openNewPayout}>
							<Icon icon={Add01Icon} className="icon-sm" />
							Novo Saque
						</Button>
					</div>
				}
			/>
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

