'use client';

import { use, useState, useTransition } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
	Accordion,
	Alert,
	Avatar,
	Button,
	Card,
	Chip,
	Disclosure,
	SearchField,
	Skeleton,
	Spinner,
	Tooltip,
} from '@heroui/react';
import {
	Analytics02Icon,
	ArrowDown01Icon,
	ArrowReloadHorizontalIcon,
	ArrowUp01Icon,
	BankIcon,
	CheckmarkCircle02Icon,
	CancelCircleIcon,
	HelpCircleIcon,
	PencilEdit01Icon,
	ShieldEnergyIcon,
	ShieldKeyIcon,
	Wallet01Icon,
	Wallet02Icon,
	Wallet03Icon,
	AlertDiamondIcon,
	MoneyReceiveSquareIcon,
	MoneyExchange01Icon,
	MinusSignIcon,
	Search01Icon,
	ServerStack01Icon,
	TransactionHistoryIcon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { formatCurrency } from '@/utils/currency';
import {
	adminGetPlatformBalanceAcquirerMerchantAvailability,
	adminReconcilePlatformBalance,
	adminRefreshPlatformBalance,
	adminListPlatformBalanceAdjustments,
} from '@/app/actions/admin/dashboard';
import { adminListAcquirers } from '@/app/actions/admin/acquirers';
import type {
	AdminPlatformBalanceData,
	AdminPlatformBalanceMerchantAvailabilityData,
	PlatformReconciliationData,
} from '@/types/admin/dashboard';
import type { AdminAcquirerData } from '@/types/admin/acquirers';
import type { ApiResponse, Paginated } from '@/types/common';
import type { ChipColor } from '@/parse/types';
import type { AcquirerOperationType } from '@/types/enums';
import { UserRole } from '@/types/enums';
import { ReconciliationModal } from './reconciliation-modal';
import { CreateAdjustmentModal } from './create-adjustment-modal';
import { AdjustmentHistoryModal } from './adjustment-history-modal';
import { MerchantAvailabilityModal } from './merchant-availability-modal';
import { PlatformBalancesMobile } from './platform-balances-mobile';
import { SelectFilter } from '@/components/ui/select-filter';
import { acquirerOperationTypeParse } from '@/parse/acquirer';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { toast } from '@heroui/react';

type BalancePromise = Promise<ApiResponse<AdminPlatformBalanceData>>;
type AcquirersPromise = Promise<ApiResponse<Paginated<AdminAcquirerData>>>;
type MerchantAvailabilityPromise = Promise<ApiResponse<Paginated<AdminPlatformBalanceMerchantAvailabilityData>>>;
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

interface PlatformBalancesProps {
	balancePromise: BalancePromise;
	currentUserRole?: UserRole;
}

export function PlatformBalances({ balancePromise, currentUserRole }: PlatformBalancesProps) {
	const router = useRouter();
	const [isRefreshPending, startRefreshTransition] = useTransition();
	const [isReconcilePending, startReconcileTransition] = useTransition();
	const [reconciliationData, setReconciliationData] = useState<PlatformReconciliationData | null>(null);
	const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
	const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
	const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
	const [historyPromise, setHistoryPromise] = useState<ReturnType<typeof adminListPlatformBalanceAdjustments> | null>(
		null
	);
	const [acquirersPromise, setAcquirersPromise] = useState<AcquirersPromise | null>(null);
	const [isMerchantAvailabilityModalOpen, setIsMerchantAvailabilityModalOpen] = useState(false);
	const [merchantAvailabilityPromise, setMerchantAvailabilityPromise] = useState<MerchantAvailabilityPromise | null>(
		null
	);
	const [selectedMerchantAvailabilityAcquirer, setSelectedMerchantAvailabilityAcquirer] = useState<
		AdminPlatformBalanceData['acquirerBalances'][number] | null
	>(null);
	const [searchAcquirer, setSearchAcquirer] = useState('');
	const [acquirerFilterType, setAcquirerFilterType] = useState<AcquirerFilterType>('all');
	const [acquirerSortField, setAcquirerSortField] = useState<AcquirerSortField>('totalIn');
	const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
	const isMobile = useIsMobile();

	const response = use(balancePromise);
	const balanceData = response?.data ?? null;
	const error = response?.error?.message ?? null;

	function getAcquirerSortValue(
		acq: AdminPlatformBalanceData['acquirerBalances'][number],
		sortField: AcquirerSortField
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

	const filteredAcquirers = (() => {
		if (!balanceData?.acquirerBalances) return [];
		const base = balanceData.acquirerBalances;
		const filtered = base.filter((acq) => {
			const acquirerDisplayName = acq.acquirerDisplayName?.trim() || acq.acquirerName;
			const matchesSearch =
				!searchAcquirer.trim() ||
				acquirerDisplayName.toLowerCase().includes(searchAcquirer.toLowerCase()) ||
				acq.acquirerName.toLowerCase().includes(searchAcquirer.toLowerCase());

			if (!matchesSearch) {
				return false;
			}

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
			if (diff !== 0) {
				return isAsc ? diff : -diff;
			}
			const aName = a.acquirerDisplayName?.trim() || a.acquirerName;
			const bName = b.acquirerDisplayName?.trim() || b.acquirerName;
			return aName.localeCompare(bName);
		});
	})();

	function handleRefresh() {
		startRefreshTransition(async () => {
			await adminRefreshPlatformBalance();
			router.refresh();
		});
	}

	function handleOpenAdjustmentModal() {
		setAcquirersPromise(adminListAcquirers({ page: 1, pageSize: 100, isActive: true }));
		setIsAdjustmentModalOpen(true);
	}

	function handleAdjustmentSuccess() {
		setIsAdjustmentModalOpen(false);
		setAcquirersPromise(null);
		router.refresh();
	}

	function handleOpenMerchantAvailability(acquirer: AdminPlatformBalanceData['acquirerBalances'][number]) {
		setSelectedMerchantAvailabilityAcquirer(acquirer);
		setMerchantAvailabilityPromise(
			adminGetPlatformBalanceAcquirerMerchantAvailability(acquirer.acquirerId, {
				page: 1,
				pageSize: 10,
			})
		);
		setIsMerchantAvailabilityModalOpen(true);
	}

	function handleMerchantAvailabilityOpenChange(open: boolean) {
		setIsMerchantAvailabilityModalOpen(open);

		if (!open) {
			setSelectedMerchantAvailabilityAcquirer(null);
			setMerchantAvailabilityPromise(null);
		}
	}

	function handleReconcile(applyFix: boolean = false) {
		startReconcileTransition(async () => {
			const result = await adminReconcilePlatformBalance({ applyFix });

			if (result?.error) {
				toast('Erro ao reconciliar', {
					description: result.error.message,
					variant: 'danger',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				});
				return;
			}

			// Se applyFix=true, a API retorna 202 com mensagem, sem data
			if (applyFix) {
				toast('Correção iniciada', {
					description:
						result?.message || 'Correção de saldos iniciada. Você será notificado quando o processo for concluído.',
					variant: 'success',
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				});
				setIsReconcileModalOpen(false);
				return;
			}

			// Preview: abre modal com dados
			if (result?.data) {
				setReconciliationData(result.data);
				setIsReconcileModalOpen(true);
			}
		});
	}

	if (error) {
		if (isMobile) {
			return (
				<div className="p-4">
					<Alert status="danger">
						<Alert.Indicator />
						<Alert.Content>
							<Alert.Title>Erro ao carregar saldos</Alert.Title>
							<Alert.Description>{error}</Alert.Description>
						</Alert.Content>
					</Alert>
				</div>
			);
		}
		return (
			<div className="flex flex-col gap-6 text-white">
				<div className="flex items-center gap-2 border-b border-white/10 pb-5">
					<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
						<Icon icon={BankIcon} className="icon-sm text-[#4f55f1]" />
					</div>
					<div>
						<h1 className="text-xl font-bold tracking-tight text-white">Saldos da Plataforma</h1>
						<p className="text-xs text-white/50">Lucro, taxas e saldos por adquirente</p>
					</div>
				</div>
				<div className="rounded-[20px] border border-[#e23b4a]/30 bg-[#e23b4a]/10 p-4 text-[#e23b4a]">
					<p className="font-bold text-sm">Erro ao carregar saldos</p>
					<p className="text-xs text-white/80 mt-1">{error}</p>
				</div>
			</div>
		);
	}

	if (!balanceData) {
		if (isMobile) {
			return (
				<div className="p-4">
					<Alert status="warning">
						<Alert.Indicator />
						<Alert.Content>
							<Alert.Title>Dados não disponíveis</Alert.Title>
							<Alert.Description>Não foi possível carregar os saldos da plataforma.</Alert.Description>
						</Alert.Content>
					</Alert>
				</div>
			);
		}
		return (
			<div className="flex flex-col gap-6 text-white">
				<div className="flex items-center gap-2 border-b border-white/10 pb-5">
					<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
						<Icon icon={BankIcon} className="icon-sm text-[#4f55f1]" />
					</div>
					<div>
						<h1 className="text-xl font-bold tracking-tight text-white">Saldos da Plataforma</h1>
						<p className="text-xs text-white/50">Lucro, taxas e saldos por adquirente</p>
					</div>
				</div>
				<div className="rounded-[20px] border border-[#ec7e00]/30 bg-[#ec7e00]/10 p-4 text-[#ec7e00]">
					<p className="font-bold text-sm">Dados não disponíveis</p>
					<p className="text-xs text-white/80 mt-1">Não foi possível carregar os saldos da plataforma.</p>
				</div>
			</div>
		);
	}

	const totalMerchantBalance = balanceData.totalMerchantBalance;
	const totalAcquirerGrossBalance = balanceData.totalAcquirerGrossBalance;
	const totalAvailableForWithdrawal = balanceData.totalAvailableForWithdrawal;
	const platformTotalBalance = balanceData.totalPlatformOperationalBalance;
	const platformNetIfWithdrawAll = balanceData.netIfWithdrawAll;
	const totalSwiftPayProfit = balanceData.totalSwiftPayProfit;
	const isTotalSwiftPayProfitNegative = totalSwiftPayProfit < 0;

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
			triggerLabel: 'Total de entrada',
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
			triggerLabel: 'Saldo organizações',
			color: 'default',
			icon: <Icon icon={Wallet03Icon} className="icon-xs" />,
		},
		{
			value: 'swiftpayProfit',
			label: 'Lucro SwiftPay',
			triggerLabel: 'Lucro SwiftPay',
			color: 'success',
			icon: <Icon icon={Wallet01Icon} className="icon-xs" />,
		},
		{
			value: 'withdrawalFeeIfWithdrawAll',
			label: 'Taxa de saque',
			triggerLabel: 'Taxa de saque',
			color: 'danger',
			icon: <Icon icon={Wallet02Icon} className="icon-xs" />,
		},
		{
			value: 'netIfWithdrawAll',
			label: 'Saldo Líquido',
			triggerLabel: 'Saldo Líquido',
			color: 'accent',
			icon: <Icon icon={MoneyExchange01Icon} className="icon-xs" />,
		},
	];

	const acquirerSortDirectionOptions: LocalSelectOption<SortDirection>[] = [
		{
			value: 'desc',
			label: 'Decrescente',
			triggerLabel: 'Decrescente',
			color: 'default',
			icon: <Icon icon={ArrowDown01Icon} className="icon-xs" />,
		},
		{
			value: 'asc',
			label: 'Crescente',
			triggerLabel: 'Crescente',
			color: 'default',
			icon: <Icon icon={ArrowUp01Icon} className="icon-xs" />,
		},
	];

	if (isMobile) {
		return (
			<PlatformBalancesMobile
				balanceData={balanceData}
				handleRefresh={handleRefresh}
				handleReconcile={handleReconcile}
				onOpenMerchantAvailability={handleOpenMerchantAvailability}
				isRefreshPending={isRefreshPending}
				isReconcilePending={isReconcilePending}
				reconciliationData={reconciliationData}
				isReconcileModalOpen={isReconcileModalOpen}
				setIsReconcileModalOpen={setIsReconcileModalOpen}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-6 text-white">
			{/* Executive Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
				<div>
					<div className="flex items-center gap-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
							<Icon icon={BankIcon} className="icon-sm text-[#4f55f1]" />
						</div>
						<h1 className="text-xl font-bold tracking-tight text-white">Saldos da Plataforma</h1>
					</div>
					<p className="text-xs text-white/50 mt-1">
						Auditoria financeira consolidada de lucro, taxas e liquidez por adquirente
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					{(isRefreshPending || isReconcilePending) && (
						<div className="flex items-center gap-2 rounded-full bg-[#ec7e00]/15 border border-[#ec7e00]/30 px-3 py-1 text-xs font-medium text-[#ec7e00]">
							<Spinner size="sm" color="warning" />
							<span>{isReconcilePending ? 'Reconciliando...' : 'Atualizando...'}</span>
						</div>
					)}
					{(currentUserRole === UserRole.God || currentUserRole === UserRole.Admin) && (
						<button
							type="button"
							onClick={() => {
								setHistoryPromise(
									adminListPlatformBalanceAdjustments({ page: 1, pageSize: 10, excludeMerchant: true })
								);
								setIsHistoryModalOpen(true);
							}}
							disabled={isRefreshPending || isReconcilePending}
							className="button-outline-dark cursor-pointer text-xs"
						>
							<Icon icon={TransactionHistoryIcon} className="icon-xs" />
							<span>Histórico de Ajustes</span>
						</button>
					)}
					{currentUserRole === UserRole.God && (
						<button
							type="button"
							onClick={handleOpenAdjustmentModal}
							disabled={isRefreshPending || isReconcilePending}
							className="button-outline-dark cursor-pointer text-xs"
						>
							<Icon icon={PencilEdit01Icon} className="icon-xs" />
							<span>Ajuste Manual</span>
						</button>
					)}
					<button
						type="button"
						onClick={() => handleReconcile(false)}
						disabled={isRefreshPending || isReconcilePending}
						className="button-outline-dark cursor-pointer text-xs"
					>
						<Icon icon={ShieldKeyIcon} className="icon-xs" />
						<span>Reconciliar</span>
					</button>
					<button
						type="button"
						onClick={handleRefresh}
						disabled={isRefreshPending || isReconcilePending}
						className="button-outline-dark cursor-pointer text-xs"
					>
						<Icon icon={ArrowReloadHorizontalIcon} className={`icon-xs ${isRefreshPending ? 'animate-spin' : ''}`} />
						<span>Atualizar</span>
					</button>
				</div>
			</div>

			{/* 4-Tile High Contrast KPI Grid */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{/* Saldo Disponível */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Saldo Disponível
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/30">
							<Icon icon={ShieldEnergyIcon} className="icon-xs" />
						</div>
					</div>
					<div>
						<AnimatedCurrency
							value={totalAvailableForWithdrawal}
							className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block"
						/>
						<p className="text-xs text-white/40 font-mono mt-0.5">Disponível para saque nas adquirentes</p>
					</div>
				</div>

				{/* Taxas de Saque */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Taxas de Saque
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e23b4a]/15 text-[#e23b4a] border border-[#e23b4a]/30">
							<Icon icon={MinusSignIcon} className="icon-xs" />
						</div>
					</div>
					<div>
						<AnimatedCurrency
							value={balanceData.totalWithdrawalFeeIfWithdrawAll}
							className="text-2xl font-extrabold font-mono text-[#e23b4a] tracking-tight tabular-nums block"
							prefix="-"
						/>
						<p className="text-xs text-white/40 font-mono mt-0.5">Custos se sacar todo o disponível</p>
					</div>
				</div>

				{/* Saldo Líquido */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Saldo Líquido
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00a87e]/15 text-[#00a87e] border border-[#00a87e]/30">
							<Icon icon={MoneyExchange01Icon} className="icon-xs" />
						</div>
					</div>
					<div>
						<AnimatedCurrency
							value={platformNetIfWithdrawAll}
							className={`text-2xl font-extrabold font-mono tracking-tight tabular-nums block ${platformNetIfWithdrawAll >= 0 ? 'text-[#00a87e]' : 'text-[#e23b4a]'}`}
						/>
						<p className="text-xs text-white/40 font-mono mt-0.5">Disponível menos taxas</p>
					</div>
				</div>

				{/* Total Sacado */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Total Sacado
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
							<Icon icon={Wallet02Icon} className="icon-xs" />
						</div>
					</div>
					<div>
						<AnimatedCurrency
							value={balanceData.platformPayoutsOut}
							className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block"
						/>
						<p className="text-xs text-white/40 font-mono mt-0.5">Saques já liquidados</p>
					</div>
				</div>
			</div>
			{/* Cards de resumo */}
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				{/* Resumo do Lucro */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 sm:p-6 flex flex-col justify-between">
					<div className="flex items-center justify-between pb-4 border-b border-white/8">
						<div className="flex items-center gap-2">
							<div className={`flex h-7 w-7 items-center justify-center rounded-lg ${isTotalSwiftPayProfitNegative ? 'bg-[#e23b4a]/15 text-[#e23b4a] border border-[#e23b4a]/30' : 'bg-[#00a87e]/15 text-[#00a87e] border border-[#00a87e]/30'}`}>
								<Icon icon={MoneyReceiveSquareIcon} className="icon-xs" />
							</div>
							<span className="text-sm font-bold text-white">
								{isTotalSwiftPayProfitNegative ? 'Resumo do Prejuízo' : 'Resumo do Lucro'}
							</span>
						</div>
						<span className="text-xs font-mono text-white/40">SwiftPay Net</span>
					</div>
					<div className="flex flex-col gap-3 pt-4">
						<div className="rounded-xl border border-white/8 bg-[#0a0a0a] p-3.5 flex items-center justify-between">
							<div className="flex items-center gap-1.5">
								<span className="text-xs font-medium text-white/60">
									{isTotalSwiftPayProfitNegative ? 'Prejuízo Líquido (Taxas - Custos)' : 'Lucro Líquido (Taxas - Custos)'}
								</span>
								<Tooltip>
									<Tooltip.Trigger>
										<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-white/40 hover:text-white" />
									</Tooltip.Trigger>
									<Tooltip.Content className="max-w-64">
										<Tooltip.Arrow />
										{isTotalSwiftPayProfitNegative
											? 'Prejuízo real da SwiftPay: custos e taxas pagos às adquirentes superam as taxas cobradas das organizações.'
											: 'Lucro real da SwiftPay: taxa cobrada das organizações menos taxa paga às adquirentes.'}
									</Tooltip.Content>
								</Tooltip>
							</div>
							<AnimatedCurrency
								value={totalSwiftPayProfit}
								className={`font-mono text-sm font-bold tabular-nums ${isTotalSwiftPayProfitNegative ? 'text-[#e23b4a]' : 'text-[#00a87e]'}`}
							/>
						</div>

						<div className="rounded-xl border border-white/8 bg-[#0a0a0a] p-3.5 flex items-center justify-between">
							<div className="flex items-center gap-1.5">
								<span className="text-xs font-medium text-white/60">Em Processamento</span>
								<Tooltip>
									<Tooltip.Trigger>
										<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-white/40 hover:text-white" />
									</Tooltip.Trigger>
									<Tooltip.Content className="max-w-64">
										<Tooltip.Arrow />
										Saques aguardando liquidação pelas adquirentes.
									</Tooltip.Content>
								</Tooltip>
							</div>
							<AnimatedCurrency
								value={balanceData.platformBlocked}
								className="font-mono text-sm font-bold text-[#ec7e00] tabular-nums"
								prefix="-"
							/>
						</div>

						<div className="rounded-xl border border-white/8 bg-[#0a0a0a] p-3.5 flex items-center justify-between">
							<div className="flex items-center gap-1.5">
								<span className="text-xs font-medium text-white/60">Já Sacados</span>
								<Tooltip>
									<Tooltip.Trigger>
										<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-white/40 hover:text-white" />
									</Tooltip.Trigger>
									<Tooltip.Content className="max-w-64">
										<Tooltip.Arrow />
										Total líquido dos saques já finalizados.
									</Tooltip.Content>
								</Tooltip>
							</div>
							<AnimatedCurrency
								value={balanceData.platformPayoutsOut}
								className="font-mono text-sm font-bold text-white/70 tabular-nums"
								prefix="-"
							/>
						</div>

						<div className="rounded-xl border border-white/12 bg-white/5 p-3.5 flex items-center justify-between">
							<div className="flex items-center gap-1.5">
								<span className="text-xs font-bold text-white">Disponibilidade Operacional</span>
								<Tooltip>
									<Tooltip.Trigger>
										<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-white/40 hover:text-white" />
									</Tooltip.Trigger>
									<Tooltip.Content className="max-w-64">
										<Tooltip.Arrow />
										Disponibilidade operacional consolidada, calculada apenas no backend a partir de `(AcquirerSettlement - AcquirerPayoutsOut) - MerchantAvailable`.
									</Tooltip.Content>
								</Tooltip>
							</div>
							<AnimatedCurrency
								value={totalAvailableForWithdrawal}
								className="font-mono text-sm font-extrabold text-[#00a87e] tabular-nums"
							/>
						</div>
					</div>
				</div>

				{/* Resumo dos Saques */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 sm:p-6 flex flex-col justify-between">
					<div className="flex items-center justify-between pb-4 border-b border-white/8">
						<div className="flex items-center gap-2">
							<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/30">
								<Icon icon={Wallet03Icon} className="icon-xs" />
							</div>
							<span className="text-sm font-bold text-white">Resumo dos Saques</span>
						</div>
						<span className="text-xs font-mono text-white/40">Custos e Repasses</span>
					</div>
					<div className="flex flex-col gap-3 pt-4">
						<div className="rounded-xl border border-white/8 bg-[#0a0a0a] p-3.5 flex items-center justify-between">
							<div className="flex items-center gap-1.5">
								<span className="text-xs font-medium text-white/60">Total de Taxas (se sacar tudo)</span>
								<Tooltip>
									<Tooltip.Trigger>
										<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-white/40 hover:text-white" />
									</Tooltip.Trigger>
									<Tooltip.Content className="max-w-64">
										<Tooltip.Arrow />
										Total de taxas se você sacar todo o saldo disponível.
									</Tooltip.Content>
								</Tooltip>
							</div>
							<AnimatedCurrency
								value={balanceData.totalWithdrawalFeeIfWithdrawAll}
								className="font-mono text-sm font-bold text-[#e23b4a] tabular-nums"
								prefix="-"
							/>
						</div>

						<div className="rounded-xl border border-white/8 bg-[#0a0a0a] p-3.5 flex items-center justify-between">
							<div className="flex items-center gap-1.5">
								<span className="text-xs font-medium text-white/60">Saldo Líquido</span>
								<Tooltip>
									<Tooltip.Trigger>
										<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-white/40 hover:text-white" />
									</Tooltip.Trigger>
									<Tooltip.Content className="max-w-64">
										<Tooltip.Arrow />
										Valor que você receberia (Saldo Disponível menos taxas de saque).
									</Tooltip.Content>
								</Tooltip>
							</div>
							<AnimatedCurrency
								value={platformNetIfWithdrawAll}
								className={`font-mono text-sm font-bold tabular-nums ${platformNetIfWithdrawAll >= 0 ? 'text-[#00a87e]' : 'text-[#e23b4a]'}`}
							/>
						</div>

						<div className="rounded-xl border border-white/8 bg-[#0a0a0a] p-3.5 flex items-center justify-between">
							<div className="flex items-center gap-1.5">
								<span className="text-xs font-medium text-white/60">Saldo Conta SwiftPay</span>
								<Tooltip>
									<Tooltip.Trigger>
										<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-white/40 hover:text-white" />
									</Tooltip.Trigger>
									<Tooltip.Content className="max-w-64">
										<Tooltip.Arrow />
										Total líquido já transferido para a conta bancária da SwiftPay.
									</Tooltip.Content>
								</Tooltip>
							</div>
							<AnimatedCurrency
								value={balanceData.platformPayoutsOut}
								className="font-mono text-sm font-bold text-white tabular-nums"
							/>
						</div>

						<div className="rounded-xl border border-white/12 bg-white/5 p-3.5 flex items-center justify-between">
							<span className="text-xs font-bold text-white">Status da Liquidação</span>
							<span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-mono text-emerald-400">
								Operacional
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Em processamento */}
			{balanceData.platformBlocked > 0 && (
				<div className="rounded-[20px] border border-[#ec7e00]/30 bg-[#ec7e00]/10 p-4 flex items-center gap-3">
					<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ec7e00]/20 text-[#ec7e00]">
						<Icon icon={Wallet02Icon} className="icon-sm" />
					</div>
					<div>
						<h4 className="text-sm font-bold text-white">Saques em Processamento</h4>
						<p className="text-xs text-white/70">
							Você tem <span className="font-mono font-bold text-[#ec7e00]">{formatCurrency(balanceData.platformBlocked)}</span> em saques aguardando liquidação.
						</p>
					</div>
				</div>
			)}

			{/* Validação de consistência */}
			<Disclosure defaultExpanded={false}>
				<Disclosure.Heading>
					<Button
						slot="trigger"
						variant="ghost"
						size="sm"
						className="h-auto gap-2 rounded-xl border border-white/10 bg-[#16181a] px-3.5 py-2 text-xs text-white/70 hover:bg-white/5 hover:text-white"
					>
						{balanceData.isConsistent ? (
							<Icon icon={CheckmarkCircle02Icon} className="icon-xs text-[#00a87e]" />
						) : (
							<Icon icon={AlertDiamondIcon} className="icon-xs text-[#e23b4a]" />
						)}
						<span className="font-medium">Validação de Consistência</span>
						<Disclosure.Indicator className="icon-xs text-white/40" />
					</Button>
				</Disclosure.Heading>
				<Disclosure.Content>
					<Disclosure.Body className="mt-2 rounded-[20px] border border-white/12 bg-[#16181a] p-5">
						<div className="mb-4 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/30">
									<Icon icon={Analytics02Icon} className="icon-xs" />
								</div>
								<span className="text-sm font-bold text-white">Auditoria de Consistência</span>
							</div>
							{balanceData.isConsistent ? (
								<span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-mono text-emerald-400">
									Consistente
								</span>
							) : (
								<span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-xs font-mono text-red-400">
									Inconsistente
								</span>
							)}
						</div>
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
							<div className="rounded-xl border border-white/8 bg-[#0a0a0a] p-3.5 space-y-1">
								<span className="text-xs text-white/50">Saldo nas Adquirentes</span>
								<p className="font-mono text-base font-extrabold text-white tabular-nums">{formatCurrency(totalAcquirerGrossBalance)}</p>
							</div>
							<div className="rounded-xl border border-white/8 bg-[#0a0a0a] p-3.5 space-y-1">
								<span className="text-xs text-white/50">Plataforma (Disponível + Bloqueado)</span>
								<p className="font-mono text-base font-extrabold text-white tabular-nums">{formatCurrency(platformTotalBalance)}</p>
							</div>
							<div className="rounded-xl border border-white/8 bg-[#0a0a0a] p-3.5 space-y-1">
								<span className="text-xs text-white/50">Organizações (Disponível + Bloqueado)</span>
								<p className="font-mono text-base font-extrabold text-white tabular-nums">{formatCurrency(totalMerchantBalance)}</p>
							</div>
						</div>

						{!balanceData.isConsistent && (
							<div className="mt-4 rounded-xl border border-[#e23b4a]/30 bg-[#e23b4a]/10 p-3.5 flex items-center gap-3">
								<Icon icon={AlertDiamondIcon} className="icon-sm text-[#e23b4a]" />
								<p className="text-xs text-white/80">
									Diferença de <span className="font-mono font-bold text-[#e23b4a]">{formatCurrency(balanceData.consistencyDifferenceAbsolute)}</span>. Use o botão de reconciliação para verificar e corrigir.
								</p>
							</div>
						)}
					</Disclosure.Body>
				</Disclosure.Content>
			</Disclosure>

			{/* Saldos por Adquirente */}
			{balanceData.acquirerBalances.length > 0 ? (
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 sm:p-6 space-y-5">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/8 pb-4">
						<div className="flex items-center gap-2">
							<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/30">
								<Icon icon={ServerStack01Icon} className="icon-xs" />
							</div>
							<span className="text-sm font-bold text-white">Saldos por Adquirente</span>
							<span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-mono text-white/60">
								{filteredAcquirers.length} de {balanceData.acquirerBalances.length}
							</span>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<SearchField
								variant="secondary"
								aria-label="Buscar adquirente"
								value={searchAcquirer}
								onChange={setSearchAcquirer}
								className="w-full sm:w-48"
							>
								<SearchField.Group className="bg-[#0a0a0a] border-white/10">
									<SearchField.SearchIcon>
										<Icon icon={Search01Icon} className="icon-xs text-white/40" />
									</SearchField.SearchIcon>
									<SearchField.Input className="text-xs text-white" placeholder="Buscar adquirente..." />
									<SearchField.ClearButton />
								</SearchField.Group>
							</SearchField>
							<SelectFilter<AcquirerFilterType>
								label="Filtro"
								value={acquirerFilterType}
								options={acquirerFilterOptions}
								onChange={setAcquirerFilterType}
								className="w-36"
							/>
							<SelectFilter<AcquirerSortField>
								label="Ordenar por"
								value={acquirerSortField}
								options={acquirerSortFieldOptions}
								onChange={setAcquirerSortField}
								className="w-40"
							/>
							<SelectFilter<SortDirection>
								label="Ordem"
								value={sortDirection}
								options={acquirerSortDirectionOptions}
								onChange={setSortDirection}
								className="w-36"
							/>
						</div>
					</div>
					<div className="flex flex-col gap-3">
						{filteredAcquirers.map((acq) => {
							const acquirerDisplayName = acq.acquirerDisplayName?.trim() || acq.acquirerName;
							const acquirerLogoUrl = acq.acquirerLogoUrl?.trim() || null;
							const operationTypes = (acq.operationTypes ?? []) as AcquirerOperationType[];
							const availableForWithdrawal = acq.availableForWithdrawal;
							const netIfWithdrawAll = acq.netIfWithdrawAll;

							return (
								<Accordion hideSeparator className="px-0" key={acq.acquirerId}>
									<Accordion.Item id={acq.acquirerId} className="rounded-[20px] border border-white/10 bg-[#0a0a0a] overflow-hidden">
										<Accordion.Heading>
											<Accordion.Trigger className="flex w-full items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
												<div className="flex min-w-0 items-center gap-3">
													{acquirerLogoUrl ? (
														<Avatar size="sm" className="bg-white/5 border border-white/10">
															<Avatar.Image src={acquirerLogoUrl} alt={acquirerDisplayName} />
															<Avatar.Fallback>
																<Icon icon={ServerStack01Icon} className="icon-sm text-[#4f55f1]" />
															</Avatar.Fallback>
														</Avatar>
													) : (
														<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
															<Icon icon={ServerStack01Icon} className="icon-sm" />
														</div>
													)}
													<div className="min-w-0 text-left">
														<p className="truncate text-sm font-bold text-white">{acquirerDisplayName}</p>
														<div className="flex flex-wrap items-center gap-1.5 text-xs text-white/50">
															<span className="truncate font-mono text-white/40">{acq.acquirerCode}</span>
															{operationTypes.length > 0 && (
																<>
																	<span>•</span>
																	{operationTypes.map((type) => {
																		const parsed = acquirerOperationTypeParse[type];
																		if (!parsed) return null;
																		return (
																			<span
																				key={`${acq.acquirerId}-${type}`}
																				className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-mono text-white/80"
																			>
																				{parsed.icon}
																				{parsed.label}
																			</span>
																		);
																	})}
																</>
															)}
														</div>
													</div>
												</div>
												<div className="flex items-center gap-4">
													<div className="hidden items-center gap-4 md:flex">
														<div className="text-right">
															<p className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Entrada</p>
															<AnimatedCurrency
																value={acq.totalIn}
																className="text-xs font-mono font-bold text-[#00a87e] tabular-nums"
																prefix="+"
															/>
														</div>
														<div className="text-right">
															<p className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Saldo Líquido</p>
															<AnimatedCurrency
																value={netIfWithdrawAll}
																className={`text-xs font-mono font-bold tabular-nums ${netIfWithdrawAll >= 0 ? 'text-[#00a87e]' : 'text-[#e23b4a]'}`}
															/>
														</div>
													</div>
													{acq.grossBalance > 0 && (
														<span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-mono text-emerald-400">
															Saldo positivo
														</span>
													)}
													<Accordion.Indicator className="text-white/40" />
												</div>
											</Accordion.Trigger>
										</Accordion.Heading>
										<Accordion.Panel>
											<Accordion.Body className="flex flex-col gap-4 p-5 border-t border-white/8 bg-[#000000]/40">
												{/* Seção 1: Fluxo de Dinheiro na Adquirente */}
												<div className="space-y-2.5 text-sm">
													<p className="text-[11px] font-bold text-white/50 uppercase tracking-wider">
														Fluxo na Adquirente
													</p>
													<div className="flex items-center justify-between">
														<div className="flex items-center gap-1.5">
															<span className="text-xs text-white/60">Total entrada</span>
															<Tooltip>
																<Tooltip.Trigger>
																	<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-white/40 hover:text-white" />
																</Tooltip.Trigger>
																<Tooltip.Content className="max-w-56">
																	<Tooltip.Arrow />
																	Valor líquido que entrou na adquirente (após taxa dela ser descontada).
																</Tooltip.Content>
															</Tooltip>
														</div>
														<AnimatedCurrency value={acq.totalIn} className="font-mono text-xs font-bold text-[#00a87e] tabular-nums" prefix="+" />
													</div>
													<div className="flex items-center justify-between">
														<div className="flex items-center gap-1.5">
															<span className="text-xs text-white/60">Total saída</span>
															<Tooltip>
																<Tooltip.Trigger>
																	<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-white/40 hover:text-white" />
																</Tooltip.Trigger>
																<Tooltip.Content className="max-w-56">
																	<Tooltip.Arrow />
																	Total enviado para fora desta adquirente (saques das organizações + saques da SwiftPay).
																</Tooltip.Content>
															</Tooltip>
														</div>
														<AnimatedCurrency value={acq.totalOut} className="font-mono text-xs font-bold text-[#e23b4a] tabular-nums" prefix="-" />
													</div>
													<div className="flex items-center justify-between border-t border-white/8 pt-2.5">
														<div className="flex items-center gap-1.5">
															<span className="text-xs font-bold text-white">Saldo na Adquirente</span>
															<Tooltip>
																<Tooltip.Trigger>
																	<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-white/40 hover:text-white" />
																</Tooltip.Trigger>
																<Tooltip.Content className="max-w-56">
																	<Tooltip.Arrow />
																	Saldo disponível agora na adquirente (Entrada - Saída).
																</Tooltip.Content>
															</Tooltip>
														</div>
														<AnimatedCurrency
															value={acq.grossBalance}
															className={`font-mono text-xs font-extrabold tabular-nums ${acq.grossBalance >= 0 ? 'text-[#00a87e]' : 'text-[#e23b4a]'}`}
														/>
													</div>
													<div className="flex items-center justify-between">
														<div className="flex items-center gap-1.5">
															<span className="text-xs text-white/60">Saldo das organizações</span>
															<Tooltip>
																<Tooltip.Trigger>
																	<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-white/40 hover:text-white" />
																</Tooltip.Trigger>
																<Tooltip.Content className="max-w-56">
																	<Tooltip.Arrow />
																	Parcela do saldo da adquirente que pertence às organizações.
																</Tooltip.Content>
															</Tooltip>
														</div>
														<AnimatedCurrency
															value={acq.merchantBalance}
															className={`font-mono text-xs font-bold tabular-nums ${acq.merchantBalance >= 0 ? 'text-[#4f55f1]' : 'text-[#e23b4a]'}`}
														/>
													</div>
													<div className="flex items-center justify-between">
														<div className="flex items-center gap-1.5">
															<span className="text-xs text-white/60">Disponível das organizações</span>
															<Tooltip>
																<Tooltip.Trigger>
																	<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-white/40 hover:text-white" />
																</Tooltip.Trigger>
																<Tooltip.Content className="max-w-56">
																	<Tooltip.Arrow />
																	Soma real do bucket Available que as organizações veem nesta adquirente.
																</Tooltip.Content>
															</Tooltip>
														</div>
														<div className="flex items-center gap-2">
															<button
																type="button"
																onClick={() => handleOpenMerchantAvailability(acq)}
																className="button-outline-dark cursor-pointer text-[11px] py-1 px-2.5"
															>
																Ver organizações
															</button>
															<AnimatedCurrency
																value={acq.merchantAvailableBalance}
																className={`font-mono text-xs font-bold tabular-nums ${acq.merchantAvailableBalance >= 0 ? 'text-[#00a87e]' : 'text-[#e23b4a]'}`}
															/>
														</div>
													</div>
												</div>

												{/* Seção 2: Taxas Pagas */}
												<div className="space-y-2.5 border-t border-white/8 pt-3 text-sm">
													<p className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Taxas Pagas</p>
													<div className="flex items-center justify-between">
														<div className="flex items-center gap-1.5">
															<span className="text-xs text-white/60">Taxas pagas à adquirente</span>
															<Tooltip>
																<Tooltip.Trigger>
																	<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-white/40 hover:text-white" />
																</Tooltip.Trigger>
																<Tooltip.Content className="max-w-56">
																	<Tooltip.Arrow />
																	Total pago para esta adquirente em taxas de recebimento.
																</Tooltip.Content>
															</Tooltip>
														</div>
														<AnimatedCurrency
															value={acq.totalAcquirerFees}
															className="font-mono text-xs font-bold text-[#e23b4a] tabular-nums"
															prefix="-"
														/>
													</div>
												</div>

												{/* Seção 3: Saldo para Saque */}
												<div className="space-y-2.5 border-t border-white/8 pt-3 text-sm">
													<p className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Saldo para Saque</p>
													<div className="flex items-center justify-between">
														<div className="flex items-center gap-1.5">
															<span className="text-xs text-white/60">Bloqueado (em processamento)</span>
															<Tooltip>
																<Tooltip.Trigger>
																	<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-white/40 hover:text-white" />
																</Tooltip.Trigger>
																<Tooltip.Content className="max-w-56">
																	<Tooltip.Arrow />
																	Saques da SwiftPay aguardando confirmação nesta adquirente.
																</Tooltip.Content>
															</Tooltip>
														</div>
														<AnimatedCurrency
															value={acq.platformPayoutsProcessing}
															className="font-mono text-xs font-bold text-[#ec7e00] tabular-nums"
															prefix="-"
														/>
													</div>
													<div className="flex items-center justify-between">
														<div className="flex items-center gap-1.5">
															<span className="text-xs text-white/60">Disponibilidade Operacional</span>
															<Tooltip>
																<Tooltip.Trigger>
																	<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-white/40 hover:text-white" />
																</Tooltip.Trigger>
																<Tooltip.Content className="max-w-56">
																	<Tooltip.Arrow />
																	Disponibilidade operacional desta adquirente, calculada apenas no backend a partir de `(AcquirerSettlement - AcquirerPayoutsOut) - MerchantAvailable`.
																</Tooltip.Content>
															</Tooltip>
														</div>
														<AnimatedCurrency
															value={availableForWithdrawal}
															className={`font-mono text-xs font-bold tabular-nums ${availableForWithdrawal >= 0 ? 'text-[#00a87e]' : 'text-[#e23b4a]'}`}
														/>
													</div>
													<div className="flex items-center justify-between">
														<div className="flex items-center gap-1.5">
															<span className="text-xs text-white/60">Taxa de saque da adquirente</span>
															<Tooltip>
																<Tooltip.Trigger>
																	<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-white/40 hover:text-white" />
																</Tooltip.Trigger>
																<Tooltip.Content className="max-w-56">
																	<Tooltip.Arrow />
																	Taxa estimada se você sacar todo o saldo disponível desta adquirente.
																</Tooltip.Content>
															</Tooltip>
														</div>
														<AnimatedCurrency
															value={acq.withdrawalFeeIfWithdrawAll}
															className="font-mono text-xs font-bold text-[#e23b4a] tabular-nums"
															prefix="-"
														/>
													</div>
													<div className="flex items-center justify-between border-t border-white/8 pt-2.5">
														<div className="flex items-center gap-1.5">
															<span className="text-xs font-bold text-white">Saldo Líquido</span>
															<Tooltip>
																<Tooltip.Trigger>
																	<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-white/40 hover:text-white" />
																</Tooltip.Trigger>
																<Tooltip.Content className="max-w-56">
																	<Tooltip.Arrow />
																	Valor que cairia na conta bancária (Saldo Disponível - Taxa de saque).
																</Tooltip.Content>
															</Tooltip>
														</div>
														<AnimatedCurrency
															value={netIfWithdrawAll}
															className={`font-mono text-xs font-extrabold tabular-nums ${netIfWithdrawAll >= 0 ? 'text-[#00a87e]' : 'text-[#e23b4a]'}`}
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
			) : (
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-12 text-center">
					<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white/40 mx-auto mb-3 border border-white/10">
						<Icon icon={BankIcon} className="icon-md" />
					</div>
					<h3 className="text-sm font-bold text-white">Nenhuma adquirente configurada</h3>
					<p className="text-xs text-white/50 mt-1">Configure uma processadora PIX para visualizar os saldos operacionais.</p>
				</div>
			)}


			<ReconciliationModal
				isOpen={isReconcileModalOpen}
				onOpenChange={setIsReconcileModalOpen}
				data={reconciliationData}
				onApplyFix={() => handleReconcile(true)}
				isPending={isReconcilePending}
			/>

			{currentUserRole === UserRole.God && (
				<CreateAdjustmentModal
					isOpen={isAdjustmentModalOpen}
					onOpenChange={setIsAdjustmentModalOpen}
					onSuccess={handleAdjustmentSuccess}
					acquirersPromise={acquirersPromise}
				/>
			)}
			<AdjustmentHistoryModal
				isOpen={isHistoryModalOpen}
				onOpenChange={setIsHistoryModalOpen}
				initialDataPromise={historyPromise}
			/>
			{selectedMerchantAvailabilityAcquirer && merchantAvailabilityPromise && (
				<MerchantAvailabilityModal
					key={selectedMerchantAvailabilityAcquirer.acquirerId}
					isOpen={isMerchantAvailabilityModalOpen}
					onOpenChange={handleMerchantAvailabilityOpenChange}
					acquirerId={selectedMerchantAvailabilityAcquirer.acquirerId}
					acquirerDisplayName={
						selectedMerchantAvailabilityAcquirer.acquirerDisplayName?.trim() ||
						selectedMerchantAvailabilityAcquirer.acquirerName
					}
					initialPromise={merchantAvailabilityPromise}
				/>
			)}
		</div>
	);
}

export function PlatformBalancesSkeleton() {
	return (
		<>
			{/* Mobile skeleton */}
			<div className="flex flex-col gap-3 pb-24 md:hidden">
				{/* Hero card */}
				<Skeleton className="h-44 w-full rounded-2xl" />

				{/* 2×2 stats grid */}
				<div className="grid grid-cols-2 gap-2">
					{[...Array(4)].map((_, i) => (
						<Card key={i} className="overflow-hidden">
							<Card.Content className="p-3">
								<Skeleton className="mb-2 h-6 w-3/4 rounded-md" />
								<Skeleton className="h-5 w-1/2 rounded-md" />
								<Skeleton className="mt-1 h-3 w-2/3 rounded-md" />
							</Card.Content>
						</Card>
					))}
				</div>

				{/* Accordion skeletons */}
				{[...Array(2)].map((_, i) => (
					<Skeleton key={i} className="h-12 w-full rounded-xl" />
				))}

				{/* Validation disclosure */}
				<Skeleton className="h-8 w-48 rounded-lg" />

				{/* Acquirer list header */}
				<div className="flex items-center justify-between">
					<Skeleton className="h-5 w-40 rounded-md" />
					<Skeleton className="h-4 w-16 rounded-md" />
				</div>

				{/* Search + filters */}
				<Skeleton className="h-10 w-full rounded-xl" />
				<div className="flex gap-2">
					<Skeleton className="h-10 flex-1 rounded-xl" />
					<Skeleton className="h-10 flex-1 rounded-xl" />
				</div>
				<Skeleton className="h-10 w-full rounded-xl" />

				{/* Acquirer cards */}
				{[...Array(3)].map((_, i) => (
					<Skeleton key={i} className="h-16 w-full rounded-xl" />
				))}
			</div>

			{/* Desktop skeleton */}
			<div className="hidden md:flex flex-col gap-6 text-white">
				<div className="flex items-center gap-2 border-b border-white/10 pb-5">
					<Skeleton className="h-7 w-7 rounded-lg bg-white/10" />
					<Skeleton className="h-6 w-48 rounded bg-white/10" />
				</div>
				<div className="mt-4 space-y-4">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
						{[...Array(4)].map((_, i) => (
							<Card key={i}>
								<Card.Content className="p-4">
									<Skeleton className="h-20 w-full rounded-lg" />
								</Card.Content>
							</Card>
						))}
					</div>
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
						{[...Array(2)].map((_, i) => (
							<Card key={i}>
								<Card.Content className="p-4">
									<Skeleton className="h-36 w-full rounded-lg" />
								</Card.Content>
							</Card>
						))}
					</div>
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<Skeleton className="h-5 w-48 rounded-md" />
							<div className="flex gap-2">
								<Skeleton className="h-9 w-48 rounded-xl" />
								<Skeleton className="h-9 w-40 rounded-xl" />
								<Skeleton className="h-9 w-44 rounded-xl" />
								<Skeleton className="h-9 w-40 rounded-xl" />
							</div>
						</div>
						{[...Array(3)].map((_, i) => (
							<Skeleton key={i} className="h-16 w-full rounded-lg" />
						))}
					</div>
				</div>
			</div>
		</>
	);
}
