'use client';

import { useMemo } from 'react';
import { Button, Tooltip } from '@heroui/react';
import {
	Clock04Icon,
	ViewIcon,
	CheckmarkCircle02Icon,
	Alert01Icon,
	Wallet01Icon,
	ArrowDataTransferHorizontalIcon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import {
	bankReconciliationStatusParse,
	pageSizeFilterOptions,
} from '@/parse';
import { formatDate } from '@/utils/datetime';
import { formatCurrency } from '@/utils/currency';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { SelectFilter } from '@/components/ui/select-filter';
import { BalanceHistoryDetailsModal } from './modals/balance-history-details-modal';
import { useBalanceHistoryTable, type BalanceHistoryTableFilters } from './use-balance-history-table';
import type { MinimalBalanceHistory } from '@/types/merchant/balance-history';
import { RevolutStatusBadge } from '@/components/ui/revolut-status-badge';
import {
	RevolutStatementIcon,
	RevolutTrendingUpIcon,
	RevolutTrendingDownIcon,
	RevolutInfoIcon,
} from '@/components/ui/revolut-icons';

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
			header: 'Data do Processamento',
			render: (item) => (
				<span className="text-xs font-mono text-white/70">{formatDate(item.processedAt)}</span>
			),
		},
		{
			key: 'previousBalance',
			header: 'Saldo Anterior',
			render: (item) => (
				<span className="font-mono font-medium text-white/80 tabular-nums text-sm">{formatCurrency(item.previousBalance)}</span>
			),
		},
		{
			key: 'newBalance',
			header: 'Novo Saldo',
			render: (item) => (
				<span className="font-mono font-bold text-white tabular-nums text-sm">{formatCurrency(item.newBalance)}</span>
			),
		},
		{
			key: 'difference',
			header: 'Variação / Ajuste',
			render: (item) => {
				const diff = item.balanceChange;
				if (diff === 0) {
					return <span className="text-xs font-mono text-white/40">Sem alteração</span>;
				}
				const isPositive = diff > 0;
				return (
					<div className="flex items-center gap-1.5">
						<span className={`font-mono text-sm font-bold tabular-nums ${isPositive ? 'text-[#00a87e]' : 'text-[#e23b4a]'}`}>
							{isPositive ? '+' : ''}{formatCurrency(diff)}
						</span>
						<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold ${
							isPositive
								? 'bg-[#00a87e]/15 text-[#00a87e] border border-[#00a87e]/30'
								: 'bg-[#e23b4a]/15 text-[#e23b4a] border border-[#e23b4a]/30'
						}`}>
							{isPositive ? 'Crédito' : 'Débito'}
						</span>
					</div>
				);
			},
		},
		{
			key: 'status',
			header: 'Status da Conciliação',
			render: (item) => (
				<RevolutStatusBadge
					status={item.status}
					label={bankReconciliationStatusParse[item.status]?.label}
				/>
			),
		},
		{
			key: 'result',
			header: 'Resultado da Auditoria',
			render: (item) => (
				<div className="flex items-center gap-2">
					{item.hasCorrections ? (
						<>
							<Icon icon={Alert01Icon} className="icon-sm text-[#ec7e00]" />
							<span className="text-xs font-mono text-[#ec7e00] font-medium">{item.totalCorrections} ajuste(s)</span>
						</>
					) : (
						<>
							<Icon icon={CheckmarkCircle02Icon} className="icon-sm text-[#00a87e]" />
							<span className="text-xs font-mono text-[#00a87e] font-medium">Saldo Consistente</span>
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
						<button
							type="button"
							onClick={() => handleViewDetails(item.id)}
							className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white transition-colors"
						>
							<Icon icon={ViewIcon} className="icon-sm" />
						</button>
						<Tooltip.Content>Ver detalhes da reconciliação</Tooltip.Content>
					</Tooltip>
				</div>
			),
		},
	];
}

function renderMobileBalanceHistoryCard(item: MinimalBalanceHistory, _index: number, openActions?: () => void) {
	const diff = item.balanceChange;
	const isPositive = diff > 0;
	return (
		<div
			className={`rounded-2xl border border-white/10 bg-[#16181a] p-4 text-white overflow-hidden transition-all ${openActions ? 'cursor-pointer hover:border-white/20' : ''}`}
			onClick={openActions}
			role={openActions ? 'button' : undefined}
			tabIndex={openActions ? 0 : undefined}
			onKeyDown={openActions ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openActions(); } } : undefined}
		>
			<div className="flex items-start justify-between gap-3 mb-3">
				<div>
					<span className="font-bold text-sm text-white">{formatDate(item.processedAt)}</span>
					<p className="text-xs text-white/50 font-mono mt-0.5">
						{item.hasCorrections ? `${item.totalCorrections} ajuste(s) de conciliação` : 'Saldo 100% conciliado'}
					</p>
				</div>
				<RevolutStatusBadge status={item.status} label={bankReconciliationStatusParse[item.status]?.label} />
			</div>
			<div className="grid grid-cols-3 gap-2 border-t border-white/8 pt-3">
				<div className="flex flex-col">
					<span className="text-[11px] uppercase tracking-wider text-white/40">Anterior</span>
					<span className="font-mono text-xs font-medium text-white/70 tabular-nums">{formatCurrency(item.previousBalance)}</span>
				</div>
				<div className="flex flex-col">
					<span className="text-[11px] uppercase tracking-wider text-white/40">Novo Saldo</span>
					<span className="font-mono text-xs font-bold text-white tabular-nums">{formatCurrency(item.newBalance)}</span>
				</div>
				<div className="flex flex-col">
					<span className="text-[11px] uppercase tracking-wider text-white/40">Variação</span>
					{diff === 0 ? (
						<span className="text-xs text-white/40">0,00</span>
					) : (
						<span className={`font-mono text-xs font-bold tabular-nums ${isPositive ? 'text-[#00a87e]' : 'text-[#e23b4a]'}`}>
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

	const items = data.balanceHistory.items;
	const withCorrections = items.filter((item) => item.hasCorrections).length;
	const currentBalance = items.length > 0 ? items[0]!.newBalance : 0;
	const lastChange = items.length > 0 ? items[0]!.balanceChange : 0;

	return (
		<div className="flex flex-col gap-6 text-white">
			{/* Executive Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
				<div>
					<div className="flex items-center gap-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
							<RevolutStatementIcon size={16} />
						</div>
						<h1 className="text-xl font-bold tracking-tight text-white">Extrato & Histórico de Saldo</h1>
					</div>
					<p className="text-xs text-white/50 mt-1">
						Auditoria automatizada 24/7 de liquidações, saques e conciliações financeiras
					</p>
				</div>
			</div>

			{/* 4-Tile High Contrast KPI Grid */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{/* Reconciliações */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Reconciliações
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
							<RevolutStatementIcon size={14} />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block">
							<AnimatedNumber value={items.length} />
						</span>
						<p className="text-xs text-white/40 font-mono mt-0.5">Ciclos de auditoria registrados</p>
					</div>
				</div>

				{/* Com Correções */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Ajustes Automáticos
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ec7e00]/15 text-[#ec7e00] border border-[#ec7e00]/30">
							<Icon icon={Alert01Icon} className="icon-xs" />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-[#ec7e00] tracking-tight tabular-nums block">
							<AnimatedNumber value={withCorrections} />
						</span>
						<p className="text-xs text-white/40 font-mono mt-0.5">Correções automáticas aplicadas</p>
					</div>
				</div>

				{/* Saldo Atual */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Saldo Consolidado
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00a87e]/15 text-[#00a87e] border border-[#00a87e]/30">
							<Icon icon={Wallet01Icon} className="icon-xs" />
						</div>
					</div>
					<div>
						<AnimatedCurrency
							value={currentBalance}
							className="text-2xl font-extrabold font-mono text-[#00a87e] tracking-tight tabular-nums"
						/>
						<p className="text-xs text-[#00a87e]/80 font-mono mt-0.5">Saldo após último ciclo</p>
					</div>
				</div>

				{/* Última Diferença */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Último Movimento
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/30">
							<Icon icon={ArrowDataTransferHorizontalIcon} className="icon-xs" />
						</div>
					</div>
					<div>
						<span className={`text-2xl font-extrabold font-mono tracking-tight tabular-nums block ${lastChange >= 0 ? 'text-[#00a87e]' : 'text-[#e23b4a]'}`}>
							<AnimatedCurrency value={Math.abs(lastChange)} prefix={lastChange >= 0 ? '+' : '-'} />
						</span>
						<p className="text-xs text-white/40 font-mono mt-0.5">Impacto no saldo</p>
					</div>
				</div>
			</div>

			{/* Main Data Table */}
			<div className="rounded-[24px] border border-white/12 bg-[#16181a] p-5 sm:p-6 overflow-hidden">
				<DataTable
					columns={columns}
					data={data.balanceHistory.items}
					keyExtractor={(item) => item.id}
					isLoading={data.isLoading}
					skeletonRows={filters.values.pageSize}
					renderMobileCard={renderMobileBalanceHistoryCard}
					emptyMessage="Nenhum registro de histórico de saldo encontrado."
					minWidth="min-w-200"
					filters={{
						children: renderFiltersContent,
						hasFilters: filters.hasFilters,
						onClear: filters.clear,
						onRefresh: filters.refresh,
						isRefreshing: data.isLoading,
					}}
					pagination={{
						page: filters.values.page,
						pageSize: filters.values.pageSize,
						totalItems: data.balanceHistory.totalItems,
						totalPages: data.balanceHistory.totalPages,
						onPageChange: (nextPage) => filters.update({ page: nextPage }),
						sortBy: filters.values.sortBy,
						sortOrder: filters.values.sortOrder,
						onSortChange: (sortBy, sortOrder) => {
							filters.update({ sortBy, sortOrder, page: 1 });
						},
						isNavigating: data.isLoading,
					}}
				/>
			</div>

			<BalanceHistoryDetailsModal
				isOpen={modals.details.isOpen}
				onOpenChange={modals.details.close}
				detailsPromise={modals.details.detailsPromise}
			/>
		</div>
	);
}
