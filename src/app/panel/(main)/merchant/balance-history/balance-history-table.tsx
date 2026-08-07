'use client';

import { useMemo } from 'react';
import { Button, Card, Chip, Tooltip } from '@heroui/react';
import { Clock04Icon, ViewIcon, CheckmarkCircle02Icon, Alert01Icon, Wallet01Icon, MoneyReceive02Icon, ArrowDataTransferHorizontalIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import {
	bankReconciliationStatusParse,
	mapParseColorToChipColor,
	pageSizeFilterOptions,
} from '@/parse';
import { formatDate } from '@/utils/datetime';
import { formatCurrency } from '@/utils/currency';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { SelectFilter } from '@/components/ui/select-filter';
import { BalanceHistoryDetailsModal } from './modals/balance-history-details-modal';
import { useBalanceHistoryTable, type BalanceHistoryTableFilters } from './use-balance-history-table';
import type { MinimalBalanceHistory } from '@/types/merchant/balance-history';

interface BalanceHistoryTableProps {
	merchantId: string;
	initialFilters: BalanceHistoryTableFilters;
}

function getColumns(
	handleViewDetails: (id: string) => void
): DataTableColumn<MinimalBalanceHistory>[] {
	return [
		{
			key: 'date',
			header: 'Data',
			render: (item) => (
				<span className="text-sm">{formatDate(item.processedAt)}</span>
			),
		},
		{
			key: 'previousBalance',
			header: 'Saldo Anterior',
			render: (item) => (
				<span className="font-mono font-medium tabular-nums">{formatCurrency(item.previousBalance)}</span>
			),
		},
		{
			key: 'newBalance',
			header: 'Novo Saldo',
			render: (item) => (
				<span className="font-mono font-medium tabular-nums">{formatCurrency(item.newBalance)}</span>
			),
		},
		{
			key: 'difference',
			header: 'Diferença',
			render: (item) => {
				const diff = item.balanceChange;
				if (diff === 0) {
					return <span className="text-muted">Sem alteração</span>;
				}
				const isPositive = diff > 0;
				return (
					<div className="flex items-center gap-1">
						<span className={`font-mono tabular-nums ${isPositive ? 'text-success font-medium' : 'text-danger font-medium'}`}>
							{isPositive ? '+' : ''}{formatCurrency(diff)}
						</span>
						{isPositive ? (
							<Chip variant="soft" color="success" size="sm">Adição</Chip>
						) : (
							<Chip variant="soft" color="danger" size="sm">Redução</Chip>
						)}
					</div>
				);
			},
		},
		{
			key: 'status',
			header: 'Status',
			render: (item) => {
				const statusParsed = bankReconciliationStatusParse[item.status];
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(statusParsed.color)} size="sm" className="gap-1">
						{statusParsed.icon}
						{statusParsed.label}
					</Chip>
				);
			},
		},
		{
			key: 'result',
			header: 'Resultado',
			render: (item) => (
				<div className="flex items-center gap-2">
					{item.hasCorrections ? (
						<>
							<Icon icon={Alert01Icon} className="icon-sm text-warning" />
							<span className="text-sm text-warning">{item.totalCorrections} correção(ões)</span>
						</>
					) : (
						<>
							<Icon icon={CheckmarkCircle02Icon} className="icon-sm text-success" />
							<span className="text-sm text-success">Saldo correto</span>
						</>
					)}
				</div>
			),
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			render: (item) => (
				<div className="flex items-center justify-center gap-1">
					<Tooltip>
						<Button isIconOnly variant="tertiary" onPress={() => handleViewDetails(item.id)}>
							<Icon icon={ViewIcon} className="icon-sm" />
							<Tooltip.Content>Ver detalhes</Tooltip.Content>
						</Button>
					</Tooltip>
				</div>
			),
		},
	];
}

function renderMobileBalanceHistoryCard(item: MinimalBalanceHistory, _index: number, openActions?: () => void) {
	const statusParsed = bankReconciliationStatusParse[item.status];
	const diff = item.balanceChange;
	const isPositive = diff > 0;
	return (
		<div
			className={`rounded-xl border border-divider bg-surface p-3 overflow-hidden${openActions ? ' cursor-pointer' : ''}`}
			onClick={openActions}
			role={openActions ? 'button' : undefined}
			tabIndex={openActions ? 0 : undefined}
			onKeyDown={openActions ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openActions(); } } : undefined}
		>
			<div className="flex items-start justify-between gap-3 mb-3">
				<div>
					<span className="font-medium text-sm">{formatDate(item.processedAt)}</span>
					<p className="text-xs text-muted mt-0.5">
						{item.hasCorrections ? `${item.totalCorrections} correção(ões)` : 'Saldo correto'}
					</p>
				</div>
				<Chip variant="soft" color={mapParseColorToChipColor(statusParsed.color)} size="sm" className="gap-1">
					{statusParsed.icon}
					{statusParsed.label}
				</Chip>
			</div>
			<div className="grid grid-cols-2 gap-3">
				<div className="flex flex-col gap-0.5">
					<span className="text-xs text-muted">Saldo Anterior</span>
					<span className="font-mono text-sm font-medium tabular-nums">{formatCurrency(item.previousBalance)}</span>
				</div>
				<div className="flex flex-col gap-0.5">
					<span className="text-xs text-muted">Novo Saldo</span>
					<span className="font-mono text-sm font-medium tabular-nums">{formatCurrency(item.newBalance)}</span>
				</div>
				<div className="flex flex-col gap-0.5">
					<span className="text-xs text-muted">Diferença</span>
					{diff === 0 ? (
						<span className="text-sm text-muted">Sem alteração</span>
					) : (
						<span className={`font-mono text-sm font-medium tabular-nums ${isPositive ? 'text-success' : 'text-danger'}`}>
							{isPositive ? '+' : ''}{formatCurrency(diff)}
						</span>
					)}
				</div>
			</div>
		</div>
	);
}

export function BalanceHistoryTable({ merchantId, initialFilters }: BalanceHistoryTableProps) {
	const { data, filters, modals } = useBalanceHistoryTable({
		merchantId,
		initialFilters,
	});

	const columns = getColumns(modals.details.open);

	const renderFiltersContent = () => (
		<SelectFilter
			label="Por página"
			value={String(filters.values.pageSize)}
			options={pageSizeFilterOptions}
			onChange={(value) => filters.update({ pageSize: Number(value) })}
			showChips={false}
		/>
	);

	return (
		<div className="flex flex-col gap-4">
			<PageHeader
				icon={<Icon icon={Clock04Icon} className="icon-md text-accent-foreground" />}
				title="Histórico de Saldo"
				description="Veja o histórico de correções e ajustes realizados no saldo da sua organização"
			/>

			{(() => {
				const items = data.balanceHistory.items;
				const withCorrections = items.filter((item) => item.hasCorrections).length;
				const currentBalance = items.length > 0 ? items[0]!.newBalance : 0;
				const lastChange = items.length > 0 ? items[0]!.balanceChange : 0;

				const stats = useMemo(
					() =>
						[
							{
								label: 'Reconciliações',
								value: <AnimatedNumber value={items.length} />,
								icon: <Icon icon={Clock04Icon} className="icon-sm text-muted" />,
							},
							{
								label: 'Com Correções',
								value: <AnimatedNumber value={withCorrections} />,
								icon: <Icon icon={Alert01Icon} className="icon-sm text-warning" />,
								accent: 'text-warning',
							},
							{
								label: 'Saldo Atual',
								value: <AnimatedCurrency value={currentBalance} />,
								icon: <Icon icon={Wallet01Icon} className="icon-sm text-muted" />,
							},
							{
								label: 'Última Diferença',
								value: (
									<span className={lastChange >= 0 ? 'text-success' : 'text-danger'}>
										<AnimatedCurrency value={Math.abs(lastChange)} prefix={lastChange >= 0 ? '+' : '-'} />
									</span>
								),
								icon: <Icon icon={ArrowDataTransferHorizontalIcon} className="icon-sm text-muted" />,
							},
						],
					[items, withCorrections, currentBalance, lastChange]
				);

				return (
					<div className="grid grid-cols-2 gap-2 md:grid-cols-4">
						{stats.map((item) => (
							<Card key={item.label} className="border border-border/80 bg-card">
								<Card.Content className="flex items-center gap-3 p-3">
									{item.icon}
									<div className="flex flex-col">
										<span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{item.label}</span>
										<span className={`text-sm font-semibold tabular-nums ${item.accent ?? 'text-foreground'}`}>{item.value}</span>
									</div>
								</Card.Content>
							</Card>
						))}
					</div>
				);
			})()}

			<div className="border border-border/80 bg-card rounded-lg p-3">
				<div className="flex items-start gap-2.5">
					<Icon icon={Clock04Icon} className="icon-sm text-accent shrink-0 mt-0.5" />
					<div className="flex flex-col gap-0.5">
						<span className="text-xs font-medium text-foreground">O que é o histórico de saldo?</span>
						<p className="text-xs text-muted leading-relaxed">
							Nossa IA monitora 24/7 seu saldo comparando todas as movimentações (recebimentos, saques e taxas). Havendo diferença, o saldo é ajustado automaticamente.
						</p>
					</div>
				</div>
			</div>

			<DataTable
				columns={columns}
				data={data.balanceHistory.items}
				keyExtractor={(item) => item.id}
				isLoading={data.isLoading}
				skeletonRows={filters.values.pageSize}
				renderMobileCard={renderMobileBalanceHistoryCard}
				emptyMessage="Nenhum histórico de saldo encontrado"
				minWidth="min-w-200"
				filters={{
					children: renderFiltersContent,
					hasFilters: filters.hasFilters,
					onClear: filters.clear,
					onRefresh: filters.refresh,
					isRefreshing: data.isLoading,
				}}
				pagination={{
					page: data.balanceHistory.page,
					pageSize: data.balanceHistory.pageSize,
					totalItems: data.balanceHistory.totalItems,
					totalPages: data.balanceHistory.totalPages,
					onPageChange: (page) => filters.update({ page }),
					sortBy: filters.values.sortBy,
					sortOrder: filters.values.sortOrder,
					onSortChange: (sortBy, sortOrder) => filters.update({ sortBy, sortOrder, page: 1 }),
					isNavigating: data.isLoading,
				}}
			/>

			<BalanceHistoryDetailsModal
				isOpen={modals.details.isOpen}
				onOpenChange={(open) => !open && modals.details.close()}
				detailsPromise={modals.details.detailsPromise}
			/>
		</div>
	);
}

