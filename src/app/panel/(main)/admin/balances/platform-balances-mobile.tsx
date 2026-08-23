'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import {
	Accordion,
	Alert,
	Avatar,
	Button,
	Card,
	Chip,
	Disclosure,
	SearchField,
	Spinner,
	Tooltip,
} from '@heroui/react';
import {
	AlertDiamondIcon,
	ArrowDown01Icon,
	ArrowReloadHorizontalIcon,
	ArrowUp01Icon,
	BankIcon,
	CheckmarkCircle02Icon,
	EyeIcon,
	MinusSignIcon,
	MoneyExchange01Icon,
	MoneyReceiveSquareIcon,
	Search01Icon,
	ServerStack01Icon,
	ShieldEnergyIcon,
	ShieldKeyIcon,
	ViewOffSlashIcon,
	Wallet01Icon,
	Wallet02Icon,
	Wallet03Icon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { formatCurrency } from '@/utils/currency';
import type { AdminPlatformBalanceData, PlatformReconciliationData } from '@/types/admin/dashboard';
import type { AcquirerOperationType } from '@/types/enums';
import type { ChipColor } from '@/parse/types';
import { acquirerOperationTypeParse } from '@/parse/acquirer';
import { SelectFilter } from '@/components/ui/select-filter';
import { ReconciliationModal } from './reconciliation-modal';

type AcquirerFilterType = 'all' | 'positiveBalance' | 'withProcessing' | 'positiveNet';
type AcquirerSortField =
	| 'totalIn'
	| 'grossBalance'
	| 'merchantBalance'
	| 'swiftpayProfit'
	| 'withdrawalFeeIfWithdrawAll'
	| 'netIfWithdrawAll';
type SortDirection = 'asc' | 'desc';
type LocalSelectOption<T extends string> = {
	value: T;
	label: string;
	triggerLabel?: string;
	color?: ChipColor;
	icon?: ReactNode;
};

export interface PlatformBalancesMobileProps {
	balanceData: AdminPlatformBalanceData;
	handleRefresh: () => void;
	handleReconcile: (applyFix: boolean) => void;
	onOpenMerchantAvailability: (acquirer: AdminPlatformBalanceData['acquirerBalances'][number]) => void;
	isRefreshPending: boolean;
	isReconcilePending: boolean;
	reconciliationData: PlatformReconciliationData | null;
	isReconcileModalOpen: boolean;
	setIsReconcileModalOpen: (open: boolean) => void;
}

function Val({
	value,
	isHidden,
	className,
	prefix,
}: {
	value: number;
	isHidden: boolean;
	className?: string;
	prefix?: string;
}) {
	return <AnimatedCurrency value={value} className={`${className ?? ''} ${isHidden ? 'visual-blur' : ''}`} prefix={prefix} />;
}

function getAcquirerSortValue(
	acq: AdminPlatformBalanceData['acquirerBalances'][number],
	sortField: AcquirerSortField,
) {
	switch (sortField) {
		case 'grossBalance':
			return acq.grossBalance;
		case 'merchantBalance':
			return acq.merchantBalance;
		case 'swiftpayProfit':
			return acq.swiftpayProfit;
		case 'withdrawalFeeIfWithdrawAll':
			return acq.withdrawalFeeIfWithdrawAll;
		case 'netIfWithdrawAll':
			return acq.netIfWithdrawAll;
		case 'totalIn':
		default:
			return acq.totalIn;
	}
}

const acquirerFilterOptions: LocalSelectOption<AcquirerFilterType>[] = [
	{ value: 'all', label: 'Todos', color: 'default', icon: <Icon icon={BankIcon} className="icon-xs" /> },
	{
		value: 'positiveBalance',
		label: 'Saldo positivo',
		color: 'success',
		icon: <Icon icon={CheckmarkCircle02Icon} className="icon-xs" />,
	},
	{
		value: 'withProcessing',
		label: 'Com processamento',
		color: 'warning',
		icon: <Icon icon={Wallet02Icon} className="icon-xs" />,
	},
	{
		value: 'positiveNet',
		label: 'Saldo Líquido positivo',
		color: 'accent',
		icon: <Icon icon={MoneyExchange01Icon} className="icon-xs" />,
	},
];

const acquirerSortFieldOptions: LocalSelectOption<AcquirerSortField>[] = [
	{
		value: 'totalIn',
		label: 'Total de entrada',
		triggerLabel: 'Total entrada',
		color: 'success',
		icon: <Icon icon={MoneyReceiveSquareIcon} className="icon-xs" />,
	},
	{
		value: 'grossBalance',
		label: 'Saldo na adquirente',
		triggerLabel: 'Saldo adquirente',
		color: 'accent',
		icon: <Icon icon={BankIcon} className="icon-xs" />,
	},
	{
		value: 'merchantBalance',
		label: 'Saldo das organizações',
		triggerLabel: 'Saldo orgs',
		color: 'default',
		icon: <Icon icon={Wallet03Icon} className="icon-xs" />,
	},
	{
		value: 'swiftpayProfit',
		label: 'Lucro SwiftPay',
		triggerLabel: 'Lucro',
		color: 'success',
		icon: <Icon icon={Wallet01Icon} className="icon-xs" />,
	},
	{
		value: 'withdrawalFeeIfWithdrawAll',
		label: 'Taxa de saque',
		triggerLabel: 'Taxa',
		color: 'danger',
		icon: <Icon icon={MinusSignIcon} className="icon-xs" />,
	},
	{
		value: 'netIfWithdrawAll',
		label: 'Saldo Líquido',
		triggerLabel: 'Líquido',
		color: 'accent',
		icon: <Icon icon={MoneyExchange01Icon} className="icon-xs" />,
	},
];

const acquirerSortDirectionOptions: LocalSelectOption<SortDirection>[] = [
	{
		value: 'desc',
		label: 'Decrescente',
		color: 'default',
		icon: <Icon icon={ArrowDown01Icon} className="icon-xs" />,
	},
	{
		value: 'asc',
		label: 'Crescente',
		color: 'default',
		icon: <Icon icon={ArrowUp01Icon} className="icon-xs" />,
	},
];

export function PlatformBalancesMobile({
	balanceData,
	handleRefresh,
	handleReconcile,
	onOpenMerchantAvailability,
	isRefreshPending,
	isReconcilePending,
	reconciliationData,
	isReconcileModalOpen,
	setIsReconcileModalOpen,
}: PlatformBalancesMobileProps) {
	const [isHidden, setIsHidden] = useState(false);
	const [searchAcquirer, setSearchAcquirer] = useState('');
	const [acquirerFilterType, setAcquirerFilterType] = useState<AcquirerFilterType>('all');
	const [acquirerSortField, setAcquirerSortField] = useState<AcquirerSortField>('totalIn');
	const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

	const totalMerchantBalance = balanceData.totalMerchantBalance;
	const totalAcquirerGrossBalance = balanceData.totalAcquirerGrossBalance;
	const totalAvailableForWithdrawal = balanceData.totalAvailableForWithdrawal;
	const platformTotalBalance = balanceData.totalPlatformOperationalBalance;
	const platformNetIfWithdrawAll = balanceData.netIfWithdrawAll;
	const totalSwiftPayProfit = balanceData.totalSwiftPayProfit;
	const isTotalSwiftPayProfitNegative = totalSwiftPayProfit < 0;

	const filteredAcquirers = (() => {
		const base = balanceData.acquirerBalances;
		const filtered = base.filter((acq) => {
			const acquirerDisplayName = acq.acquirerDisplayName?.trim() || acq.acquirerName;
			const matchesSearch =
				!searchAcquirer.trim() ||
				acquirerDisplayName.toLowerCase().includes(searchAcquirer.toLowerCase()) ||
				acq.acquirerName.toLowerCase().includes(searchAcquirer.toLowerCase());

			if (!matchesSearch) return false;

			switch (acquirerFilterType) {
				case 'positiveBalance':
					return acq.grossBalance > 0;
				case 'withProcessing':
					return acq.platformPayoutsProcessing > 0;
				case 'positiveNet':
					return acq.netIfWithdrawAll > 0;
				default:
					return true;
			}
		});

		const isAsc = sortDirection === 'asc';
		return [...filtered].sort((a, b) => {
			const diff = getAcquirerSortValue(a, acquirerSortField) - getAcquirerSortValue(b, acquirerSortField);
			if (diff !== 0) return isAsc ? diff : -diff;
			const aName = a.acquirerDisplayName?.trim() || a.acquirerName;
			const bName = b.acquirerDisplayName?.trim() || b.acquirerName;
			return aName.localeCompare(bName);
		});
	})();

	const isConsistent = balanceData.isConsistent;

	return (
		<>
			<div className="flex flex-col gap-3 pb-24 text-white">
				{/* Hero balance card */}
				<div className="relative overflow-hidden rounded-[20px] border border-white/12 bg-card p-5">
					{/* Card header: label + actions */}
					<div className="relative z-10 mb-4 flex items-center justify-between">
						<div className="flex items-center gap-2">
							<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15 text-link border border-brand/30">
								<Icon icon={ShieldEnergyIcon} className="icon-xs" />
							</div>
							<p className="text-xs font-bold uppercase tracking-wider text-white/70">Plataforma SwiftPay</p>
						</div>
						<div className="flex items-center gap-1">
							{(isRefreshPending || isReconcilePending) && <Spinner size="sm" color="warning" />}
							<Tooltip>
								<Tooltip.Trigger>
									<button
										type="button"
										onClick={() => handleReconcile(false)}
										disabled={isRefreshPending || isReconcilePending}
										className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
										aria-label="Reconciliar saldos"
									>
										<Icon icon={ShieldKeyIcon} className="icon-xs" />
									</button>
								</Tooltip.Trigger>
								<Tooltip.Content>
									<Tooltip.Arrow />
									Reconciliação
								</Tooltip.Content>
							</Tooltip>
							<button
								type="button"
								onClick={() => setIsHidden(!isHidden)}
								aria-label={isHidden ? 'Mostrar saldo' : 'Ocultar saldo'}
								className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
							>
								<Icon icon={isHidden ? EyeIcon : ViewOffSlashIcon} className="icon-xs" />
							</button>
							<button
								type="button"
								onClick={handleRefresh}
								disabled={isRefreshPending || isReconcilePending}
								className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
								aria-label="Atualizar saldos"
							>
								<Icon
									icon={ArrowReloadHorizontalIcon}
									className={`icon-xs ${isRefreshPending ? 'animate-spin' : ''}`}
								/>
							</button>
						</div>
					</div>

					{/* Main balance */}
					<div className="relative z-10 mb-4">
						<p className="mb-1 text-xs font-semibold text-white/50">Saldo Disponível</p>
						<Val
							value={totalAvailableForWithdrawal}
							isHidden={isHidden}
							className="text-3xl font-extrabold font-mono tabular-nums text-white tracking-tight"
						/>
					</div>

					{/* Sub-stats */}
					<div className="relative z-10 flex gap-2">
						<div className="flex-1 rounded-xl border border-white/8 bg-surface-deep px-3 py-2.5">
							<p className="mb-0.5 text-[11px] font-medium text-white/40">Processando</p>
							<Val value={balanceData.platformBlocked} isHidden={isHidden} className="text-sm font-bold font-mono tabular-nums text-warning" prefix="-" />
						</div>
						<div className="flex-1 rounded-xl border border-white/8 bg-surface-deep px-3 py-2.5">
							<p className="mb-0.5 text-[11px] font-medium text-white/40">Total Sacado</p>
							<Val value={balanceData.platformPayoutsOut} isHidden={isHidden} className="text-sm font-bold font-mono tabular-nums text-white/70" />
						</div>
					</div>
				</div>

				{/* 2×2 stats grid */}
				<div className="grid grid-cols-2 gap-2">
					<div className="rounded-[20px] border border-white/12 bg-card p-3.5 flex flex-col justify-between">
						<div className="mb-2 flex items-center gap-1.5">
							<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-danger/15 text-danger border border-danger/30">
								<Icon icon={MinusSignIcon} className="icon-xs" />
							</div>
							<p className="line-clamp-1 text-xs font-medium text-white/50">Taxas de Saque</p>
						</div>
						<Val
							value={balanceData.totalWithdrawalFeeIfWithdrawAll}
							isHidden={isHidden}
							className="text-base font-bold font-mono tabular-nums text-danger"
							prefix="-"
						/>
						<p className="mt-0.5 text-[10px] text-white/40 font-mono">Se sacar tudo</p>
					</div>

					<div className="rounded-[20px] border border-white/12 bg-card p-3.5 flex flex-col justify-between">
						<div className="mb-2 flex items-center gap-1.5">
							<div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${platformNetIfWithdrawAll >= 0 ? 'bg-success/15 text-success border border-success/30' : 'bg-danger/15 text-danger border border-danger/30'}`}>
								<Icon icon={MoneyExchange01Icon} className="icon-xs" />
							</div>
							<p className="line-clamp-1 text-xs font-medium text-white/50">Saldo Líquido</p>
						</div>
						<Val
							value={platformNetIfWithdrawAll}
							isHidden={isHidden}
							className={`text-base font-bold font-mono tabular-nums ${platformNetIfWithdrawAll >= 0 ? 'text-success' : 'text-danger'}`}
						/>
						<p className="mt-0.5 text-[10px] text-white/40 font-mono">Disponível - Taxas</p>
					</div>

					<div className="rounded-[20px] border border-white/12 bg-card p-3.5 flex flex-col justify-between">
						<div className="mb-2 flex items-center gap-1.5">
							<div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${isTotalSwiftPayProfitNegative ? 'bg-danger/15 text-danger border border-danger/30' : 'bg-success/15 text-success border border-success/30'}`}>
								<Icon icon={MoneyReceiveSquareIcon} className="icon-xs" />
							</div>
							<p className={`line-clamp-1 text-xs font-medium ${isTotalSwiftPayProfitNegative ? 'text-danger' : 'text-white/50'}`}>{isTotalSwiftPayProfitNegative ? 'Prejuízo SwiftPay' : 'Lucro SwiftPay'}</p>
						</div>
						<Val value={totalSwiftPayProfit} isHidden={isHidden} className={`text-base font-bold font-mono tabular-nums ${isTotalSwiftPayProfitNegative ? 'text-danger' : 'text-success'}`} />
						<p className="mt-0.5 text-[10px] text-white/40 font-mono">Taxas - Custos</p>
					</div>

					<div className="rounded-[20px] border border-white/12 bg-card p-3.5 flex flex-col justify-between">
						<div className="mb-2 flex items-center gap-1.5">
							<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-link border border-brand/30">
								<Icon icon={BankIcon} className="icon-xs" />
							</div>
							<p className="line-clamp-1 text-xs font-medium text-white/50">Nas Adquirentes</p>
						</div>
						<Val value={totalAcquirerGrossBalance} isHidden={isHidden} className="text-base font-bold font-mono tabular-nums text-white" />
						<p className="mt-0.5 text-[10px] text-white/40 font-mono">Total custódia</p>
					</div>
				</div>
				{/* Processing alert */}
				{balanceData.platformBlocked > 0 && (
					<div className="rounded-[20px] border border-warning/30 bg-warning/10 p-3.5 flex items-center gap-3">
						<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-warning/20 text-warning">
							<Icon icon={Wallet02Icon} className="icon-xs" />
						</div>
						<div>
							<p className="text-xs font-bold text-white">Saques em Processamento</p>
							<p className="text-[11px] text-white/70">
								<span className={`font-mono font-bold text-warning ${isHidden ? 'visual-blur' : ''}`}>{formatCurrency(balanceData.platformBlocked)}</span> aguardando liquidação.
							</p>
						</div>
					</div>
				)}

				{/* Accordion: Resumo do Lucro + Resumo dos Saques */}
				<Accordion hideSeparator className="gap-2 px-0">
					<Accordion.Item id="lucro" className="overflow-hidden rounded-[20px] border border-white/12 bg-card">
						<Accordion.Heading>
							<Accordion.Trigger className="flex w-full items-center justify-between p-3.5 hover:bg-white/[0.02]">
								<div className="flex items-center gap-2">
									<div className={`flex h-6 w-6 items-center justify-center rounded-lg ${isTotalSwiftPayProfitNegative ? 'bg-danger/15 text-danger' : 'bg-success/15 text-success'}`}>
										<Icon icon={MoneyReceiveSquareIcon} className="icon-xs" />
									</div>
									<span className="text-xs font-bold text-white">{isTotalSwiftPayProfitNegative ? 'Resumo do Prejuízo' : 'Resumo do Lucro'}</span>
								</div>
								<Accordion.Indicator className="text-white/40" />
							</Accordion.Trigger>
						</Accordion.Heading>
						<Accordion.Panel>
							<Accordion.Body className="p-3.5 pt-0">
								<div className="space-y-2.5 rounded-xl border border-white/8 bg-surface-deep p-3">
									<div className="flex items-center justify-between">
										<span className="text-xs text-white/60">{isTotalSwiftPayProfitNegative ? 'Prejuízo Líquido' : 'Lucro Líquido'}</span>
										<Val value={totalSwiftPayProfit} isHidden={isHidden} className={`font-mono text-xs font-bold tabular-nums ${isTotalSwiftPayProfitNegative ? 'text-danger' : 'text-success'}`} />
									</div>
									<div className="flex items-center justify-between">
										<span className="text-xs text-white/60">Em Processamento</span>
										<Val value={balanceData.platformBlocked} isHidden={isHidden} className="font-mono text-xs font-bold text-warning tabular-nums" prefix="-" />
									</div>
									<div className="flex items-center justify-between">
										<span className="text-xs text-white/60">Já Sacados</span>
										<Val value={balanceData.platformPayoutsOut} isHidden={isHidden} className="font-mono text-xs font-bold text-white/70 tabular-nums" prefix="-" />
									</div>
									<div className="flex items-center justify-between border-t border-white/8 pt-2.5">
										<span className="text-xs font-bold text-white">Disponibilidade</span>
										<Val
											value={totalAvailableForWithdrawal}
											isHidden={isHidden}
											className="font-mono text-xs font-extrabold text-success tabular-nums"
										/>
									</div>
								</div>
							</Accordion.Body>
						</Accordion.Panel>
					</Accordion.Item>

					<Accordion.Item id="saques" className="overflow-hidden rounded-[20px] border border-white/12 bg-card">
						<Accordion.Heading>
							<Accordion.Trigger className="flex w-full items-center justify-between p-3.5 hover:bg-white/[0.02]">
								<div className="flex items-center gap-2">
									<div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand/15 text-link">
										<Icon icon={Wallet03Icon} className="icon-xs" />
									</div>
									<span className="text-xs font-bold text-white">Resumo dos Saques</span>
								</div>
								<Accordion.Indicator className="text-white/40" />
							</Accordion.Trigger>
						</Accordion.Heading>
						<Accordion.Panel>
							<Accordion.Body className="p-3.5 pt-0">
								<div className="space-y-2.5 rounded-xl border border-white/8 bg-surface-deep p-3">
									<div className="flex items-center justify-between">
										<span className="text-xs text-white/60">Taxas se sacar tudo</span>
										<Val
											value={balanceData.totalWithdrawalFeeIfWithdrawAll}
											isHidden={isHidden}
											className="font-mono text-xs font-bold text-danger tabular-nums"
											prefix="-"
										/>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-xs text-white/60">Saldo Líquido</span>
										<Val
											value={platformNetIfWithdrawAll}
											isHidden={isHidden}
											className={`font-mono text-xs font-bold tabular-nums ${platformNetIfWithdrawAll >= 0 ? 'text-success' : 'text-danger'}`}
										/>
									</div>
									<div className="flex items-center justify-between border-t border-white/8 pt-2.5">
										<span className="text-xs font-bold text-white">Saldo Conta SwiftPay</span>
										<Val value={balanceData.platformPayoutsOut} isHidden={isHidden} className="font-mono text-xs font-bold text-white tabular-nums" />
									</div>
								</div>
							</Accordion.Body>
						</Accordion.Panel>
					</Accordion.Item>
				</Accordion>

				{/* Validação de consistência */}
				<Disclosure defaultExpanded={false}>
					<Disclosure.Heading>
						<Button
							slot="trigger"
							variant="ghost"
							size="sm"
							className="h-auto gap-2 rounded-xl border border-white/10 bg-card px-3.5 py-2 text-xs text-white/70 hover:bg-white/5 hover:text-white"
						>
							{isConsistent ? (
								<Icon icon={CheckmarkCircle02Icon} className="icon-xs text-success" />
							) : (
								<Icon icon={AlertDiamondIcon} className="icon-xs text-danger" />
							)}
							<span className="font-medium">Validação de Consistência</span>
							<Disclosure.Indicator className="icon-xs text-white/40" />
						</Button>
					</Disclosure.Heading>
					<Disclosure.Content>
						<Disclosure.Body className="mt-2 rounded-[20px] border border-white/12 bg-card p-4">
							<div className="mb-3 flex items-center justify-between">
								<span className="text-xs font-bold text-white">Consistência de Saldos</span>
								{isConsistent ? (
									<span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-mono text-emerald-400">
										Consistente
									</span>
								) : (
									<span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[11px] font-mono text-red-400">
										Inconsistente
									</span>
								)}
							</div>
							<div className="space-y-2 text-xs">
								<div className="flex items-center justify-between rounded-lg border border-white/8 bg-surface-deep p-2.5">
									<span className="text-white/60">Adquirentes</span>
									<span className={`font-mono font-bold text-white tabular-nums ${isHidden ? 'visual-blur' : ''}`}>
										{formatCurrency(totalAcquirerGrossBalance)}
									</span>
								</div>
								<div className="flex items-center justify-between rounded-lg border border-white/8 bg-surface-deep p-2.5">
									<span className="text-white/60">Plataforma</span>
									<span className={`font-mono font-bold text-white tabular-nums ${isHidden ? 'visual-blur' : ''}`}>
										{formatCurrency(platformTotalBalance)}
									</span>
								</div>
								<div className="flex items-center justify-between rounded-lg border border-white/8 bg-surface-deep p-2.5">
									<span className="text-white/60">Organizações</span>
									<span className={`font-mono font-bold text-white tabular-nums ${isHidden ? 'visual-blur' : ''}`}>
										{formatCurrency(totalMerchantBalance)}
									</span>
								</div>
								{!isConsistent && (
									<div className="mt-2 rounded-lg border border-danger/30 bg-danger/10 p-2.5 flex items-center gap-2">
										<Icon icon={AlertDiamondIcon} className="icon-xs text-danger" />
										<p className="text-[11px] text-white/80">
											Diferença de{' '}
											<span className={`font-mono font-bold text-danger ${isHidden ? 'visual-blur' : ''}`}>
												{formatCurrency(balanceData.consistencyDifferenceAbsolute)}
											</span>
										</p>
									</div>
								)}
							</div>
						</Disclosure.Body>
					</Disclosure.Content>
				</Disclosure>

				{/* Saldos por Adquirente */}
				{balanceData.acquirerBalances.length > 0 && (
					<div className="space-y-3 rounded-[20px] border border-white/12 bg-card p-4">
						<div className="flex items-center justify-between border-b border-white/8 pb-3">
							<span className="text-xs font-bold text-white">Saldos por Adquirente</span>
							<span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-mono text-white/60">
								{filteredAcquirers.length} de {balanceData.acquirerBalances.length}
							</span>
						</div>
						<SearchField aria-label="Buscar adquirente" value={searchAcquirer} onChange={setSearchAcquirer}>
							<SearchField.Group className="bg-surface-deep border-white/10">
								<SearchField.SearchIcon>
									<Icon icon={Search01Icon} className="icon-xs text-white/40" />
								</SearchField.SearchIcon>
								<SearchField.Input className="w-full text-xs text-white" placeholder="Buscar adquirente..." />
								<SearchField.ClearButton />
							</SearchField.Group>
						</SearchField>
						<div className="flex gap-2">
							<SelectFilter<AcquirerFilterType>
								label="Filtro"
								value={acquirerFilterType}
								options={acquirerFilterOptions}
								onChange={setAcquirerFilterType}
								className="flex-1"
							/>
							<SelectFilter<AcquirerSortField>
								label="Ordenar"
								value={acquirerSortField}
								options={acquirerSortFieldOptions}
								onChange={setAcquirerSortField}
								className="flex-1"
							/>
						</div>
						<SelectFilter<SortDirection>
							label="Ordem"
							value={sortDirection}
							options={acquirerSortDirectionOptions}
							onChange={setSortDirection}
						/>
						<div className="flex flex-col gap-2">
							{filteredAcquirers.map((acq) => {
								const acquirerDisplayName = acq.acquirerDisplayName?.trim() || acq.acquirerName;
								const acquirerLogoUrl = acq.acquirerLogoUrl?.trim() || null;
								const operationTypes = (acq.operationTypes ?? []) as AcquirerOperationType[];
								const availableForWithdrawal = acq.availableForWithdrawal;
								const netIfWithdrawAll = acq.netIfWithdrawAll;

								return (
									<Accordion hideSeparator className="px-0" key={acq.acquirerId}>
										<Accordion.Item id={acq.acquirerId} className="rounded-[18px] border border-white/10 bg-surface-deep overflow-hidden">
											<Accordion.Heading>
												<Accordion.Trigger className="flex w-full items-center justify-between p-3 hover:bg-white/[0.02]">
													<div className="flex min-w-0 items-center gap-2">
														{acquirerLogoUrl ? (
															<Avatar size="sm" className="bg-white/5 border border-white/10">
																<Avatar.Image src={acquirerLogoUrl} alt={acquirerDisplayName} />
																<Avatar.Fallback>
																	<Icon icon={ServerStack01Icon} className="icon-sm text-link" />
																</Avatar.Fallback>
															</Avatar>
														) : (
															<div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-link border border-brand/25">
																<Icon icon={ServerStack01Icon} className="icon-xs" />
															</div>
														)}
														<div className="min-w-0 text-left">
															<p className="truncate text-xs font-bold text-white">{acquirerDisplayName}</p>
															{acq.grossBalance > 0 ? (
																<span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.2 text-[10px] font-mono text-emerald-400">
																	Saldo positivo
																</span>
															) : (
																<span className="text-[11px] font-mono text-white/40">{acq.acquirerCode}</span>
															)}
														</div>
													</div>
													<div className="flex shrink-0 items-center gap-2">
														<div className="text-right">
															<p className="text-[10px] font-medium text-white/40 uppercase">Entrada</p>
															<Val
																value={acq.totalIn}
																isHidden={isHidden}
																className="text-xs font-mono font-bold text-success tabular-nums"
																prefix="+"
															/>
														</div>
														<Accordion.Indicator className="text-white/40" />
													</div>
												</Accordion.Trigger>
											</Accordion.Heading>
											<Accordion.Panel>
												<Accordion.Body className="flex flex-col gap-2.5 p-3 pt-0 border-t border-white/8 bg-[#000000]/40">
													{operationTypes.length > 0 && (
														<div className="flex flex-wrap gap-1 mt-2">
															{operationTypes.map((type) => {
																const parsed = acquirerOperationTypeParse[type];
																if (!parsed) return null;
																return (
																	<span
																		key={`${acq.acquirerId}-${type}`}
																		className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono text-white/80"
																	>
																		{parsed.icon}
																		{parsed.label}
																	</span>
																);
															})}
														</div>
													)}

													{/* Fluxo na Adquirente */}
													<div className="space-y-2 rounded-xl border border-white/8 bg-card p-3">
														<p className="text-[10px] font-bold uppercase tracking-wide text-white/40">
															Fluxo na Adquirente
														</p>
														<div className="flex justify-between">
															<span className="text-xs text-white/60">Total entrada</span>
															<Val value={acq.totalIn} isHidden={isHidden} className="text-xs font-mono font-bold text-success tabular-nums" prefix="+" />
														</div>
														<div className="flex justify-between">
															<span className="text-xs text-white/60">Total saída</span>
															<Val value={acq.totalOut} isHidden={isHidden} className="text-xs font-mono font-bold text-danger tabular-nums" prefix="-" />
														</div>
														<div className="flex justify-between border-t border-white/8 pt-2">
															<span className="text-xs font-bold text-white">Saldo na Adquirente</span>
															<Val
																value={acq.grossBalance}
																isHidden={isHidden}
																className={`text-xs font-mono font-extrabold tabular-nums ${acq.grossBalance >= 0 ? 'text-success' : 'text-danger'}`}
															/>
														</div>
														<div className="flex justify-between">
															<span className="text-xs text-white/60">Saldo organizações</span>
															<Val value={acq.merchantBalance} isHidden={isHidden} className="text-xs font-mono font-bold text-link tabular-nums" />
														</div>
														<div className="flex justify-between items-center pt-1">
															<button
																type="button"
																onClick={() => onOpenMerchantAvailability(acq)}
																className="button-outline-dark cursor-pointer text-[10px] py-0.5 px-2"
															>
																Ver organizações
															</button>
															<Val
																value={acq.merchantAvailableBalance}
																isHidden={isHidden}
																className={`text-xs font-mono font-bold tabular-nums ${acq.merchantAvailableBalance >= 0 ? 'text-success' : 'text-danger'}`}
															/>
														</div>
													</div>

													{/* Para Saque */}
													<div className="space-y-2 rounded-xl border border-white/8 bg-card p-3">
														<p className="text-[10px] font-bold uppercase tracking-wide text-white/40">Para Saque</p>
														<div className="flex justify-between">
															<span className="text-xs text-white/60">Taxas à adquirente</span>
															<Val
																value={acq.totalAcquirerFees}
																isHidden={isHidden}
																className="text-xs font-mono font-bold text-danger tabular-nums"
																prefix="-"
															/>
														</div>
														<div className="flex justify-between">
															<span className="text-xs text-white/60">Bloqueado</span>
															<Val
																value={acq.platformPayoutsProcessing}
																isHidden={isHidden}
																className="text-xs font-mono font-bold text-warning tabular-nums"
																prefix="-"
															/>
														</div>
														<div className="flex justify-between">
															<span className="text-xs text-white/60">Disponibilidade</span>
															<Val
																value={availableForWithdrawal}
																isHidden={isHidden}
																className={`text-xs font-mono font-bold tabular-nums ${availableForWithdrawal >= 0 ? 'text-success' : 'text-danger'}`}
															/>
														</div>
														<div className="flex justify-between">
															<span className="text-xs text-white/60">Taxa de saque</span>
															<Val
																value={acq.withdrawalFeeIfWithdrawAll}
																isHidden={isHidden}
																className="text-xs font-mono font-bold text-danger tabular-nums"
																prefix="-"
															/>
														</div>
														<div className="flex justify-between border-t border-white/8 pt-2">
															<span className="text-xs font-bold text-white">Saldo Líquido</span>
															<Val
																value={netIfWithdrawAll}
																isHidden={isHidden}
																className={`text-xs font-mono font-extrabold tabular-nums ${netIfWithdrawAll >= 0 ? 'text-success' : 'text-danger'}`}
															/>
														</div>
													</div>
												</Accordion.Body>
											</Accordion.Panel>
										</Accordion.Item>
									</Accordion>
								);
							})}
						</div>
					</div>
				)}
			</div>

			<ReconciliationModal
				isOpen={isReconcileModalOpen}
				onOpenChange={setIsReconcileModalOpen}
				data={reconciliationData}
				onApplyFix={() => handleReconcile(true)}
				isPending={isReconcilePending}
			/>
		</>
	);
}
