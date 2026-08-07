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
import { PageHeader } from '@/components/ui/page-header';
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
			<div>
				<PageHeader
					icon={<Icon icon={BankIcon} className="icon-md text-emerald-500" />}
					title="Saldos da Plataforma"
					description="Lucro, taxas e saldos por adquirente"
				/>
				<div className="mt-4">
					<Alert status="danger">
						<Alert.Indicator />
						<Alert.Content>
							<Alert.Title>Erro ao carregar saldos</Alert.Title>
							<Alert.Description>{error}</Alert.Description>
						</Alert.Content>
					</Alert>
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
			<div>
				<PageHeader
					icon={<Icon icon={BankIcon} className="icon-md" />}
					title="Saldos da Plataforma"
					description="Lucro, taxas e saldos por adquirente"
				/>
				<div className="mt-4">
					<Alert status="warning">
						<Alert.Indicator />
						<Alert.Content>
							<Alert.Title>Dados não disponíveis</Alert.Title>
							<Alert.Description>Não foi possível carregar os saldos da plataforma.</Alert.Description>
						</Alert.Content>
					</Alert>
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
		<div>
			<PageHeader
				icon={<Icon icon={BankIcon} className="icon-md" />}
				title="Saldos da Plataforma"
				description="Lucro, taxas e saldos por adquirente"
				actions={
					<div className="flex flex-wrap items-center gap-2">
						{(isRefreshPending || isReconcilePending) && (
							<div className="flex items-center gap-2 rounded-full bg-warning-soft px-3 py-1">
								<Spinner size="sm" color="warning" />
								<span className="text-xs font-medium text-warning">
									{isReconcilePending ? 'Reconciliando...' : 'Atualizando...'}
								</span>
							</div>
						)}
						{(currentUserRole === UserRole.God || currentUserRole === UserRole.Admin) && (
							<Tooltip>
								<Tooltip.Trigger>
									<Button
										isIconOnly
										variant="tertiary"
										onPress={() => {
											setHistoryPromise(
												adminListPlatformBalanceAdjustments({ page: 1, pageSize: 10, excludeMerchant: true })
											);
											setIsHistoryModalOpen(true);
										}}
										isDisabled={isRefreshPending || isReconcilePending}
									>
										<Icon icon={TransactionHistoryIcon} className="icon-sm" />
									</Button>
								</Tooltip.Trigger>
								<Tooltip.Content>
									<Tooltip.Arrow />
									Ver histórico de ajustes
								</Tooltip.Content>
							</Tooltip>
						)}
						{currentUserRole === UserRole.God && (
							<Tooltip>
								<Tooltip.Trigger>
									<Button
										isIconOnly
										variant="tertiary"
										onPress={handleOpenAdjustmentModal}
										isDisabled={isRefreshPending || isReconcilePending}
									>
										<Icon icon={PencilEdit01Icon} className="icon-sm" />
									</Button>
								</Tooltip.Trigger>
								<Tooltip.Content>
									<Tooltip.Arrow />
									Ajuste manual de saldo
								</Tooltip.Content>
							</Tooltip>
						)}
						<Tooltip>
							<Tooltip.Trigger>
								<Button
									isIconOnly
									variant="tertiary"
									onPress={() => handleReconcile(false)}
									isDisabled={isRefreshPending || isReconcilePending}
								>
									<Icon icon={ShieldKeyIcon} className="icon-sm" />
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content>
								<Tooltip.Arrow />
								Ver reconciliação de valores
							</Tooltip.Content>
						</Tooltip>
						<Tooltip>
							<Tooltip.Trigger>
								<Button
									isIconOnly
									variant="tertiary"
									onPress={handleRefresh}
									isDisabled={isRefreshPending || isReconcilePending}
								>
									<Icon
										icon={ArrowReloadHorizontalIcon}
										className={`icon-sm ${isRefreshPending ? 'animate-spin' : ''}`}
									/>
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content>
								<Tooltip.Arrow />
								Recarregar dados
							</Tooltip.Content>
						</Tooltip>
					</div>
				}
			/>
			<div className="mt-4 flex flex-col gap-4">
				{/* Cards principais de lucro e taxas */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<Card className="border-accent-soft-hover">
						<Card.Content className="flex flex-col gap-2 p-4">
							<div className="flex items-center gap-2 text-accent">
								<Icon icon={ShieldEnergyIcon} className="icon-md" />
								<span className="text-sm font-medium">Saldo Disponível</span>
								<Tooltip>
									<Tooltip.Trigger>
										<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
									</Tooltip.Trigger>
									<Tooltip.Content className="max-w-64">
										<Tooltip.Arrow />
										Saldo realmente disponível para saque, distribuível entre adquirentes.
									</Tooltip.Content>
								</Tooltip>
							</div>
							<AnimatedCurrency value={totalAvailableForWithdrawal} className="text-2xl font-bold text-accent" />
							<span className="text-xs text-muted">Disponivel para saque</span>
						</Card.Content>
					</Card>

					<Card className="border-danger-soft-hover">
						<Card.Content className="flex flex-col gap-2 p-4">
							<div className="flex items-center gap-2 text-danger">
								<Icon icon={MinusSignIcon} className="icon-md" />
								<span className="text-sm font-medium">Taxas de Saque</span>
								<Tooltip>
									<Tooltip.Trigger>
										<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
									</Tooltip.Trigger>
									<Tooltip.Content className="max-w-64">
										<Tooltip.Arrow />
										Soma das taxas que as adquirentes cobrarão se você sacar todo o saldo disponível.
									</Tooltip.Content>
								</Tooltip>
							</div>
							<AnimatedCurrency
								value={balanceData.totalWithdrawalFeeIfWithdrawAll}
								className="text-2xl font-bold text-danger"
								prefix="-"
							/>
							<span className="text-xs text-muted">Se sacar todo o disponível</span>
						</Card.Content>
					</Card>

					<Card
						className={`border ${platformNetIfWithdrawAll >= 0 ? 'border-emerald-500/20' : 'border-danger-soft-hover'}`}
					>
						<Card.Content className="flex flex-col gap-2 p-4">
							<div
								className={`flex items-center gap-2 ${platformNetIfWithdrawAll >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-danger'}`}
							>
								<Icon icon={MoneyExchange01Icon} className="icon-md" />
								<span className="text-sm font-medium">Saldo Líquido</span>
								<Tooltip>
									<Tooltip.Trigger>
										<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
									</Tooltip.Trigger>
									<Tooltip.Content className="max-w-64">
										<Tooltip.Arrow />
										Valor líquido que você receberia se sacar tudo (Saldo Disponível - Taxas de saque).
									</Tooltip.Content>
								</Tooltip>
							</div>
							<AnimatedCurrency
								value={platformNetIfWithdrawAll}
								className={`text-2xl font-bold ${platformNetIfWithdrawAll >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-danger'}`}
							/>
							<span className="text-xs text-muted">Disponivel - Taxas</span>
						</Card.Content>
					</Card>

					<Card className="bg-linear-to-br from-accent/10 to-accent/5">
						<Card.Content className="flex flex-col gap-2 p-4">
							<div className="flex items-center gap-2 text-muted-foreground">
								<Icon icon={Wallet02Icon} className="icon-md" />
								<span className="text-sm font-medium">Total Sacado</span>
								<Tooltip>
									<Tooltip.Trigger>
										<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
									</Tooltip.Trigger>
									<Tooltip.Content className="max-w-64">
										<Tooltip.Arrow />
										Total liquido ja transferido para a conta bancaria da SwiftPay.
									</Tooltip.Content>
								</Tooltip>
							</div>
							<AnimatedCurrency value={balanceData.platformPayoutsOut} className="text-2xl font-bold" />
							<span className="text-xs text-muted">Saques ja realizados</span>
						</Card.Content>
					</Card>
				</div>

				{/* Cards de resumo */}
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					{/* Resumo do Lucro */}
					<Card>
						<Card.Header className="px-4 pt-4 pb-2">
							<div className="flex items-center gap-2">
								<Icon
									icon={MoneyReceiveSquareIcon}
									className={`icon-md ${isTotalSwiftPayProfitNegative ? 'text-danger' : 'text-emerald-500'}`}
								/>
								<span className="text-sm font-semibold">
									{isTotalSwiftPayProfitNegative ? 'Resumo do Prejuizo' : 'Resumo do Lucro'}
								</span>
							</div>
						</Card.Header>
						<Card.Content className="flex flex-col gap-3 px-4 pb-4">
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-1">
										<span className={`text-sm ${isTotalSwiftPayProfitNegative ? 'text-danger' : 'text-muted'}`}>
											{isTotalSwiftPayProfitNegative
												? 'Prejuizo Líquido (Taxas - Custos)'
												: 'Lucro Líquido (Taxas - Custos)'}
										</span>
										<Tooltip>
											<Tooltip.Trigger>
												<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
											</Tooltip.Trigger>
											<Tooltip.Content className="max-w-64">
												<Tooltip.Arrow />
												{isTotalSwiftPayProfitNegative
													? 'Prejuizo real da SwiftPay: custos e taxas pagos as adquirentes superam as taxas cobradas das organizacoes.'
													: 'Lucro real da SwiftPay: taxa cobrada das organizacoes menos taxa paga as adquirentes.'}
											</Tooltip.Content>
										</Tooltip>
									</div>
									<AnimatedCurrency
										value={totalSwiftPayProfit}
										className={`font-semibold ${isTotalSwiftPayProfitNegative ? 'text-danger' : 'text-success'}`}
									/>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-1">
										<span className="text-sm text-muted">Em Processamento</span>
										<Tooltip>
											<Tooltip.Trigger>
												<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
											</Tooltip.Trigger>
											<Tooltip.Content className="max-w-64">
												<Tooltip.Arrow />
												Saques aguardando liquidação pelas adquirentes.
											</Tooltip.Content>
										</Tooltip>
									</div>
									<AnimatedCurrency
										value={balanceData.platformBlocked}
										className="font-semibold text-warning"
										prefix="-"
									/>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-1">
										<span className="text-sm text-muted">Já Sacados</span>
										<Tooltip>
											<Tooltip.Trigger>
												<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
											</Tooltip.Trigger>
											<Tooltip.Content className="max-w-64">
												<Tooltip.Arrow />
												Total líquido dos saques já finalizados.
											</Tooltip.Content>
										</Tooltip>
									</div>
									<AnimatedCurrency
										value={balanceData.platformPayoutsOut}
										className="font-semibold text-muted"
										prefix="-"
									/>
								</div>
								<div className="flex items-center justify-between border-t border-default pt-3">
									<div className="flex items-center gap-1">
										<span className="text-sm font-medium">Disponibilidade Operacional</span>
										<Tooltip>
											<Tooltip.Trigger>
												<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
											</Tooltip.Trigger>
											<Tooltip.Content className="max-w-64">
												<Tooltip.Arrow />
												Disponibilidade operacional consolidada, calculada apenas no backend a partir de
												`(AcquirerSettlement - AcquirerPayoutsOut) - MerchantAvailable`.
											</Tooltip.Content>
										</Tooltip>
									</div>
									<AnimatedCurrency
										value={totalAvailableForWithdrawal}
										className="font-bold text-emerald-600 dark:text-emerald-400"
									/>
								</div>
							</div>
						</Card.Content>
					</Card>

					{/* Resumo dos Saques */}
					<Card>
						<Card.Header className="px-4 pt-4 pb-2">
							<div className="flex items-center gap-2">
								<Icon icon={Wallet03Icon} className="icon-md text-accent" />
								<span className="text-sm font-semibold">Resumo dos Saques</span>
							</div>
						</Card.Header>
						<Card.Content className="flex flex-col gap-3 px-4 pb-4">
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-1">
										<span className="text-sm text-muted">Total de Taxas (se sacar tudo)</span>
										<Tooltip>
											<Tooltip.Trigger>
												<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
											</Tooltip.Trigger>
											<Tooltip.Content className="max-w-64">
												<Tooltip.Arrow />
												Total de taxas se você sacar todo o saldo disponível.
											</Tooltip.Content>
										</Tooltip>
									</div>
									<AnimatedCurrency
										value={balanceData.totalWithdrawalFeeIfWithdrawAll}
										className="font-semibold text-danger"
										prefix="-"
									/>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-1">
										<span className="text-sm text-muted">Saldo Líquido</span>
										<Tooltip>
											<Tooltip.Trigger>
												<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
											</Tooltip.Trigger>
											<Tooltip.Content className="max-w-64">
												<Tooltip.Arrow />
												Valor que você receberia (Saldo Disponível menos taxas de saque).
											</Tooltip.Content>
										</Tooltip>
									</div>
									<AnimatedCurrency
										value={platformNetIfWithdrawAll}
										className={`font-semibold ${platformNetIfWithdrawAll >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-danger'}`}
									/>
								</div>
								<div className="flex items-center justify-between border-t border-default pt-3">
									<div className="flex items-center gap-1">
										<span className="text-sm font-medium">Saldo Conta SwiftPay</span>
										<Tooltip>
											<Tooltip.Trigger>
												<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
											</Tooltip.Trigger>
											<Tooltip.Content className="max-w-64">
												<Tooltip.Arrow />
												Total líquido já transferido para a conta bancária da SwiftPay.
											</Tooltip.Content>
										</Tooltip>
									</div>
									<AnimatedCurrency value={balanceData.platformPayoutsOut} className="font-bold" />
								</div>
							</div>
						</Card.Content>
					</Card>
				</div>

				{/* Em processamento */}
				{balanceData.platformBlocked > 0 && (
					<Alert status="warning">
						<Alert.Indicator />
						<Alert.Content>
							<Alert.Title>Saques em Processamento</Alert.Title>
							<Alert.Description>
								Você tem {formatCurrency(balanceData.platformBlocked)} em saques aguardando liquidação.
							</Alert.Description>
						</Alert.Content>
					</Alert>
				)}

				{/* Validação de consistência (link discreto) */}
				<Disclosure defaultExpanded={false}>
					<Disclosure.Heading>
						<Button
							slot="trigger"
							variant="ghost"
							size="sm"
							className="h-auto gap-2 px-2 py-1 text-xs text-muted hover:text-foreground"
						>
							{balanceData.isConsistent ? (
								<Icon icon={CheckmarkCircle02Icon} className="icon-xs text-success" />
							) : (
								<Icon icon={AlertDiamondIcon} className="icon-xs text-danger" />
							)}
							<span>Validação de consistência</span>
							<Disclosure.Indicator className="icon-xs" />
						</Button>
					</Disclosure.Heading>
					<Disclosure.Content>
						<Disclosure.Body className="mt-2 rounded-xl border border-default bg-surface/50 p-4">
							<div className="mb-3 flex items-center gap-2">
								<Icon icon={Analytics02Icon} className="icon-sm text-muted" />
								<span className="text-sm font-semibold">Validação de Consistência</span>
								{balanceData.isConsistent ? (
									<Chip size="sm" color="success">
										Consistente
									</Chip>
								) : (
									<Chip size="sm" color="danger">
										Inconsistente
									</Chip>
								)}
							</div>
							<div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
								<div className="space-y-1">
									<span className="text-muted">Saldo nas Adquirentes</span>
									<p className="font-mono font-semibold">{formatCurrency(totalAcquirerGrossBalance)}</p>
								</div>
								<div className="space-y-1">
									<span className="text-muted">Plataforma (Disponível + Bloqueado)</span>
									<p className="font-mono font-semibold">{formatCurrency(platformTotalBalance)}</p>
								</div>
								<div className="space-y-1">
									<span className="text-muted">Organizações (Disponível + Bloqueado)</span>
									<p className="font-mono font-semibold">{formatCurrency(totalMerchantBalance)}</p>
								</div>
							</div>

							{!balanceData.isConsistent && (
								<Alert status="warning" className="mt-4">
									<Alert.Indicator />
									<Alert.Content>
										<Alert.Title>Inconsistência de saldos</Alert.Title>
										<Alert.Description>
											Diferença de {formatCurrency(balanceData.consistencyDifferenceAbsolute)}. Use o botão de
											reconciliação para verificar e corrigir.
										</Alert.Description>
									</Alert.Content>
								</Alert>
							)}
						</Disclosure.Body>
					</Disclosure.Content>
				</Disclosure>

				{/* Saldos por Adquirente */}
				{balanceData.acquirerBalances.length > 0 ? (
					<div className="space-y-3">
						<div className="flex flex-row justify-between gap-2">
							<div className="flex items-center gap-2">
								<span className="text-sm font-semibold text-foreground">Saldos por Adquirente</span>
								<span className="text-xs text-muted">
									({filteredAcquirers.length} de {balanceData.acquirerBalances.length})
								</span>
							</div>
							<div className="flex flex-wrap items-end gap-2">
								<SearchField
									variant="secondary"
									aria-label="Buscar adquirente"
									value={searchAcquirer}
									onChange={setSearchAcquirer}
								>
									<SearchField.Group>
										<SearchField.SearchIcon>
											<Icon icon={Search01Icon} className="icon-xs" />
										</SearchField.SearchIcon>
										<SearchField.Input className="w-48" placeholder="Buscar adquirente" />
										<SearchField.ClearButton />
									</SearchField.Group>
								</SearchField>
								<SelectFilter<AcquirerFilterType>
									label="Filtro"
									value={acquirerFilterType}
									options={acquirerFilterOptions}
									onChange={setAcquirerFilterType}
									className="w-42"
								/>
								<SelectFilter<AcquirerSortField>
									label="Ordenar por"
									value={acquirerSortField}
									options={acquirerSortFieldOptions}
									onChange={setAcquirerSortField}
									className="w-44"
								/>
								<SelectFilter<SortDirection>
									label="Ordem"
									value={sortDirection}
									options={acquirerSortDirectionOptions}
									onChange={setSortDirection}
									className="w-40"
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
										<Accordion.Item id={acq.acquirerId} className="rounded-lg border border-divider bg-surface">
											<Accordion.Heading>
												<Accordion.Trigger className="flex w-full items-center justify-between p-4">
													<div className="flex min-w-0 items-center gap-3">
														{acquirerLogoUrl ? (
															<Avatar size="sm">
																<Avatar.Image src={acquirerLogoUrl} alt={acquirerDisplayName} />
																<Avatar.Fallback>
																	<Icon icon={ServerStack01Icon} className="icon-sm text-accent" />
																</Avatar.Fallback>
															</Avatar>
														) : (
															<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
																<Icon icon={ServerStack01Icon} className="icon-sm text-accent" />
															</div>
														)}
														<div className="min-w-0 text-left">
															<p className="truncate text-sm font-semibold text-foreground">{acquirerDisplayName}</p>
															<div className="flex flex-wrap items-center gap-1 text-xs text-muted">
																<span className="truncate">{acq.acquirerCode}</span>
																{operationTypes.length > 0 && (
																	<>
																		<span>•</span>
																		{operationTypes.map((type) => {
																			const parsed = acquirerOperationTypeParse[type];
																			if (!parsed) return null;
																			return (
																				<Chip
																					key={`${acq.acquirerId}-${type}`}
																					variant="soft"
																					size="sm"
																					className={`gap-1 ${parsed.className ?? ''}`}
																				>
																					{parsed.icon}
																					{parsed.label}
																				</Chip>
																			);
																		})}
																	</>
																)}
															</div>
														</div>
													</div>
													<div className="flex items-center gap-3">
														<div className="hidden items-center gap-3 md:flex">
															<div className="text-right">
																<p className="text-xs text-muted">Total entrada</p>
																<AnimatedCurrency
																	value={acq.totalIn}
																	className="text-xs font-semibold text-success"
																	prefix="+"
																/>
															</div>
															<div className="text-right">
																<p className="text-xs text-muted">Saldo Líquido</p>
																<AnimatedCurrency
																	value={netIfWithdrawAll}
																	className={`text-xs font-semibold ${netIfWithdrawAll >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-danger'}`}
																/>
															</div>
														</div>
														{acq.grossBalance > 0 && (
															<Chip size="sm" color="success">
																Saldo positivo
															</Chip>
														)}
														<Accordion.Indicator className="text-muted" />
													</div>
												</Accordion.Trigger>
											</Accordion.Heading>
											<Accordion.Panel>
												<Accordion.Body className="flex flex-col gap-3 p-4">
													{/* Seção 1: Fluxo de Dinheiro na Adquirente */}
													<div className="space-y-2 text-sm">
														<p className="text-xs font-medium text-muted uppercase tracking-wide">
															Fluxo na Adquirente
														</p>
														<div className="flex items-center justify-between">
															<div className="flex items-center gap-1">
																<span className="text-xs text-muted">Total entrada</span>
																<Tooltip>
																	<Tooltip.Trigger>
																		<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
																	</Tooltip.Trigger>
																	<Tooltip.Content className="max-w-56">
																		<Tooltip.Arrow />
																		Valor líquido que entrou na adquirente (após taxa dela ser descontada).
																	</Tooltip.Content>
																</Tooltip>
															</div>
															<AnimatedCurrency value={acq.totalIn} className="font-semibold text-success" prefix="+" />
														</div>
														<div className="flex items-center justify-between">
															<div className="flex items-center gap-1">
																<span className="text-xs text-muted">Total saída</span>
																<Tooltip>
																	<Tooltip.Trigger>
																		<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
																	</Tooltip.Trigger>
																	<Tooltip.Content className="max-w-56">
																		<Tooltip.Arrow />
																		Total enviado para fora desta adquirente (saques das organizacoes + saques da
																		SwiftPay).
																	</Tooltip.Content>
																</Tooltip>
															</div>
															<AnimatedCurrency value={acq.totalOut} className="font-semibold text-danger" prefix="-" />
														</div>
														<div className="flex items-center justify-between border-t border-default pt-2">
															<div className="flex items-center gap-1">
																<span className="text-xs font-medium">Saldo na Adquirente</span>
																<Tooltip>
																	<Tooltip.Trigger>
																		<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
																	</Tooltip.Trigger>
																	<Tooltip.Content className="max-w-56">
																		<Tooltip.Arrow />
																		Saldo disponível agora na adquirente (Entrada - Saída).
																	</Tooltip.Content>
																</Tooltip>
															</div>
															<AnimatedCurrency
																value={acq.grossBalance}
																className={`font-bold ${acq.grossBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-danger'}`}
															/>
														</div>
														<div className="flex items-center justify-between">
															<div className="flex items-center gap-1">
																<span className="text-xs text-muted">Saldo das organizações</span>
																<Tooltip>
																	<Tooltip.Trigger>
																		<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
																	</Tooltip.Trigger>
																	<Tooltip.Content className="max-w-56">
																		<Tooltip.Arrow />
																		Parcela do saldo da adquirente que pertence às organizações.
																	</Tooltip.Content>
																</Tooltip>
															</div>
															<AnimatedCurrency
																value={acq.merchantBalance}
																className={`font-semibold ${acq.merchantBalance >= 0 ? 'text-accent' : 'text-danger'}`}
															/>
														</div>
														<div className="flex items-center justify-between">
															<div className="flex items-center gap-1">
																<span className="text-xs text-muted">Disponível das organizações</span>
																<Tooltip>
																	<Tooltip.Trigger>
																		<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
																	</Tooltip.Trigger>
																	<Tooltip.Content className="max-w-56">
																		<Tooltip.Arrow />
																		Soma real do bucket Available que as organizações veem nesta adquirente.
																	</Tooltip.Content>
																</Tooltip>
															</div>
															<div className="flex items-center gap-2">
																<Button
																	variant="tertiary"
																	size="sm"
																	onPress={() => handleOpenMerchantAvailability(acq)}
																>
																	Ver organizações
																</Button>
																<AnimatedCurrency
																	value={acq.merchantAvailableBalance}
																	className={`font-semibold ${acq.merchantAvailableBalance >= 0 ? 'text-success' : 'text-danger'}`}
																/>
															</div>
														</div>
													</div>

													{/* Seção 2: Taxas Pagas */}
													<div className="space-y-2 border-t border-default pt-3 text-sm">
														<p className="text-xs font-medium text-muted uppercase tracking-wide">Taxas Pagas</p>
														<div className="flex items-center justify-between">
															<div className="flex items-center gap-1">
																<span className="text-xs text-muted">Taxas pagas à adquirente</span>
																<Tooltip>
																	<Tooltip.Trigger>
																		<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
																	</Tooltip.Trigger>
																	<Tooltip.Content className="max-w-56">
																		<Tooltip.Arrow />
																		Total pago para esta adquirente em taxas de recebimento.
																	</Tooltip.Content>
																</Tooltip>
															</div>
															<AnimatedCurrency
																value={acq.totalAcquirerFees}
																className="font-semibold text-danger"
																prefix="-"
															/>
														</div>
													</div>

													{/* Seção 3: Saldo para Saque */}
													<div className="space-y-2 border-t border-default pt-3 text-sm">
														<p className="text-xs font-medium text-muted uppercase tracking-wide">Saldo para Saque</p>
														<div className="flex items-center justify-between">
															<div className="flex items-center gap-1">
																<span className="text-xs text-muted">Bloqueado (em processamento)</span>
																<Tooltip>
																	<Tooltip.Trigger>
																		<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
																	</Tooltip.Trigger>
																	<Tooltip.Content className="max-w-56">
																		<Tooltip.Arrow />
																		Saques da SwiftPay aguardando confirmação nesta adquirente.
																	</Tooltip.Content>
																</Tooltip>
															</div>
															<AnimatedCurrency
																value={acq.platformPayoutsProcessing}
																className="font-semibold text-warning"
																prefix="-"
															/>
														</div>
														<div className="flex items-center justify-between">
															<div className="flex items-center gap-1">
																<span className="text-xs text-muted">Disponibilidade Operacional</span>
																<Tooltip>
																	<Tooltip.Trigger>
																		<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
																	</Tooltip.Trigger>
																	<Tooltip.Content className="max-w-56">
																		<Tooltip.Arrow />
																		Disponibilidade operacional desta adquirente, calculada apenas no backend a partir
																		de `(AcquirerSettlement - AcquirerPayoutsOut) - MerchantAvailable`.
																	</Tooltip.Content>
																</Tooltip>
															</div>
															<AnimatedCurrency
																value={availableForWithdrawal}
																className={`font-semibold ${availableForWithdrawal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-danger'}`}
															/>
														</div>
														<div className="flex items-center justify-between">
															<div className="flex items-center gap-1">
																<span className="text-xs text-muted">Taxa de saque da adquirente</span>
																<Tooltip>
																	<Tooltip.Trigger>
																		<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
																	</Tooltip.Trigger>
																	<Tooltip.Content className="max-w-56">
																		<Tooltip.Arrow />
																		Taxa estimada se você sacar todo o saldo disponível desta adquirente.
																	</Tooltip.Content>
																</Tooltip>
															</div>
															<AnimatedCurrency
																value={acq.withdrawalFeeIfWithdrawAll}
																className="font-semibold text-danger"
																prefix="-"
															/>
														</div>
														<div className="flex items-center justify-between border-t border-default pt-2">
															<div className="flex items-center gap-1">
																<span className="text-xs font-medium">Saldo Líquido</span>
																<Tooltip>
																	<Tooltip.Trigger>
																		<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
																	</Tooltip.Trigger>
																	<Tooltip.Content className="max-w-56">
																		<Tooltip.Arrow />
																		Valor que cairia na conta bancária (Saldo Disponível - Taxa de saque).
																	</Tooltip.Content>
																</Tooltip>
															</div>
															<AnimatedCurrency
																value={netIfWithdrawAll}
																className={`font-bold ${netIfWithdrawAll >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-danger'}`}
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
					<Card>
						<Card.Content className="flex items-center justify-center p-8">
							<div className="text-center">
								<Icon icon={BankIcon} className="icon-lg mx-auto mb-2 text-muted" />
								<p className="text-sm text-muted">Nenhuma adquirente configurada</p>
							</div>
						</Card.Content>
					</Card>
				)}
			</div>

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
			<div className="hidden md:block">
				<PageHeader
					icon={<Icon icon={BankIcon} className="icon-md" />}
					title="Saldos da Plataforma"
					description="Saldos do ledger e por adquirente"
				/>
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
