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
	| 'safefyProfit'
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
		case 'safefyProfit':
			return acq.safefyProfit;
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
		value: 'safefyProfit',
		label: 'Lucro Safefy',
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
	const totalSafefyProfit = balanceData.totalSafefyProfit;
	const isTotalSafefyProfitNegative = totalSafefyProfit < 0;

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
			<div className="flex flex-col gap-3 pb-24">
				{/* Hero balance card */}
				<div className="relative overflow-hidden rounded-2xl border border-accent/30 bg-linear-to-br from-accent-soft-hover via-accent/8 to-accent-soft-hover p-5">
					{/* Card header: label + actions */}
					<div className="relative z-10 mb-4 flex items-center justify-between">
						<div className="flex items-center gap-1.5">
							<Icon icon={ShieldEnergyIcon} className="icon-xs text-accent" />
							<p className="text-[10px] font-medium uppercase tracking-wider text-accent">Plataforma Safefy</p>
						</div>
						<div className="flex items-center gap-0.5">
							{(isRefreshPending || isReconcilePending) && <Spinner size="sm" color="warning" />}
							<Tooltip>
								<Tooltip.Trigger>
									<Button
										isIconOnly
										variant="ghost"
										size="sm"
										className="text-accent/70 hover:text-accent"
										onPress={() => handleReconcile(false)}
										isDisabled={isRefreshPending || isReconcilePending}
									>
										<Icon icon={ShieldKeyIcon} className="icon-xs" />
									</Button>
								</Tooltip.Trigger>
								<Tooltip.Content>
									<Tooltip.Arrow />
									Reconciliação
								</Tooltip.Content>
							</Tooltip>
							<Button
								isIconOnly
								variant="ghost"
								size="sm"
								className="text-accent/70 hover:text-accent"
								onPress={() => setIsHidden(!isHidden)}
							>
								<Icon icon={isHidden ? EyeIcon : ViewOffSlashIcon} className="icon-xs" />
							</Button>
							<Button
								isIconOnly
								variant="ghost"
								size="sm"
								className="text-accent/70 hover:text-accent"
								onPress={handleRefresh}
								isDisabled={isRefreshPending || isReconcilePending}
							>
								<Icon
									icon={ArrowReloadHorizontalIcon}
									className={`icon-xs ${isRefreshPending ? 'animate-spin' : ''}`}
								/>
							</Button>
						</div>
					</div>

					{/* Main balance */}
					<div className="relative z-10 mb-4">
						<p className="mb-1 text-xs font-medium text-accent">Saldo Disponível</p>
						<Val
							value={totalAvailableForWithdrawal}
							isHidden={isHidden}
							className="text-3xl font-bold tabular-nums text-accent"
						/>
					</div>

					{/* Sub-stats */}
					<div className="relative z-10 flex gap-2">
						<div className="flex-1 rounded-xl border border-warning-soft-hover bg-warning/10 px-3 py-2">
							<p className="mb-0.5 text-[10px] font-medium text-warning/70">Processando</p>
							<Val value={balanceData.platformBlocked} isHidden={isHidden} className="text-sm font-semibold tabular-nums text-warning" />
						</div>
						<div className="flex-1 rounded-xl border border-accent/10 bg-accent/5 px-3 py-2">
							<p className="mb-0.5 text-[10px] font-medium text-muted">Total Sacado</p>
							<Val value={balanceData.platformPayoutsOut} isHidden={isHidden} className="text-sm font-semibold tabular-nums" />
						</div>
					</div>
				</div>

				{/* 2×2 stats grid */}
				<div className="grid grid-cols-2 gap-2">
					<Card className="overflow-hidden border-danger-soft-hover">
						<Card.Content className="p-3">
							<div className="mb-2 flex items-center gap-1.5">
								<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-danger/10">
									<Icon icon={MinusSignIcon} className="icon-xs text-danger" />
								</div>
								<p className="line-clamp-1 text-[11px] text-muted">Taxas de Saque</p>
							</div>
							<Val
								value={balanceData.totalWithdrawalFeeIfWithdrawAll}
								isHidden={isHidden}
								className="text-base font-bold tabular-nums text-danger"
								prefix="-"
							/>
							<p className="mt-0.5 text-[10px] text-muted">Se sacar tudo</p>
						</Card.Content>
					</Card>

					<Card className={`overflow-hidden border ${platformNetIfWithdrawAll >= 0 ? 'border-emerald-500/20' : 'border-danger-soft-hover'}`}>
						<Card.Content className="p-3">
							<div className="mb-2 flex items-center gap-1.5">
								<div
									className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${balanceData.netIfWithdrawAll >= 0 ? 'bg-emerald-500/10' : 'bg-danger/10'}`}
								>
									<Icon
										icon={MoneyExchange01Icon}
										className={`icon-xs ${platformNetIfWithdrawAll >= 0 ? 'text-emerald-500' : 'text-danger'}`}
									/>
								</div>
								<p className="line-clamp-1 text-[11px] text-muted">Saldo Líquido</p>
							</div>
							<Val
								value={platformNetIfWithdrawAll}
								isHidden={isHidden}
								className={`text-base font-bold tabular-nums ${platformNetIfWithdrawAll >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-danger'}`}
							/>
							<p className="mt-0.5 text-[10px] text-muted">Disponível - Taxas</p>
						</Card.Content>
					</Card>

					<Card className="overflow-hidden border-success-soft-hover">
						<Card.Content className="p-3">
							<div className="mb-2 flex items-center gap-1.5">
								<div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${isTotalSafefyProfitNegative ? 'bg-danger/10' : 'bg-success/10'}`}>
									<Icon icon={MoneyReceiveSquareIcon} className={`icon-xs ${isTotalSafefyProfitNegative ? 'text-danger' : 'text-success'}`} />
								</div>
								<p className={`line-clamp-1 text-[11px] ${isTotalSafefyProfitNegative ? 'text-danger' : 'text-muted'}`}>{isTotalSafefyProfitNegative ? 'Prejuizo Safefy' : 'Lucro Safefy'}</p>
							</div>
							<Val value={totalSafefyProfit} isHidden={isHidden} className={`text-base font-bold tabular-nums ${isTotalSafefyProfitNegative ? 'text-danger' : 'text-success'}`} />
							<p className="mt-0.5 text-[10px] text-muted">Taxas - Custos</p>
						</Card.Content>
					</Card>

					<Card className="overflow-hidden">
						<Card.Content className="p-3">
							<div className="mb-2 flex items-center gap-1.5">
								<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-accent/10">
									<Icon icon={BankIcon} className="icon-xs text-accent" />
								</div>
								<p className="line-clamp-1 text-[11px] text-muted">Nas Adquirentes</p>
							</div>
							<Val value={totalAcquirerGrossBalance} isHidden={isHidden} className="text-base font-bold tabular-nums" />
							<p className="mt-0.5 text-[10px] text-muted">Total custódia</p>
						</Card.Content>
					</Card>
				</div>

				{/* Processing alert */}
				{balanceData.platformBlocked > 0 && (
					<Alert status="warning">
						<Alert.Indicator />
						<Alert.Content>
							<Alert.Title>Saques em Processamento</Alert.Title>
							<Alert.Description>
								<span className={isHidden ? 'visual-blur' : ''}>{formatCurrency(balanceData.platformBlocked)}</span> aguardando liquidação.
							</Alert.Description>
						</Alert.Content>
					</Alert>
				)}

					{/* Accordion: Resumo do Lucro + Resumo dos Saques */}
				<Accordion hideSeparator className="gap-2 px-0">
					<Accordion.Item id="lucro" className="overflow-hidden rounded-xl border border-default">
						<Accordion.Heading>
							<Accordion.Trigger className="flex w-full items-center justify-between px-3 py-3">
								<div className="flex items-center gap-2">
										<Icon icon={MoneyReceiveSquareIcon} className={`icon-sm ${isTotalSafefyProfitNegative ? 'text-danger' : 'text-emerald-500'}`} />
											<span className={`text-sm font-medium ${isTotalSafefyProfitNegative ? 'text-danger' : ''}`}>{isTotalSafefyProfitNegative ? 'Resumo do Prejuizo' : 'Resumo do Lucro'}</span>
								</div>
								<Accordion.Indicator />
							</Accordion.Trigger>
						</Accordion.Heading>
						<Accordion.Panel>
							<Accordion.Body className="px-3 pb-3 pt-0">
								<div className="space-y-3 rounded-lg bg-surface/50 p-3">
									<div className="flex items-center justify-between">
												<span className={`text-sm ${isTotalSafefyProfitNegative ? 'text-danger' : 'text-muted'}`}>{isTotalSafefyProfitNegative ? 'Prejuizo Líquido' : 'Lucro Líquido'}</span>
											<Val value={totalSafefyProfit} isHidden={isHidden} className={`font-semibold ${isTotalSafefyProfitNegative ? 'text-danger' : 'text-success'}`} />
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm text-muted">Em Processamento</span>
										<Val value={balanceData.platformBlocked} isHidden={isHidden} className="font-semibold text-warning" prefix="-" />
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm text-muted">Já Sacados</span>
										<Val value={balanceData.platformPayoutsOut} isHidden={isHidden} className="font-semibold text-muted" prefix="-" />
									</div>
									<div className="flex items-center justify-between border-t border-default pt-3">
										<span className="text-sm font-medium">Disponibilidade Operacional</span>
										<Val
											value={totalAvailableForWithdrawal}
											isHidden={isHidden}
											className="font-bold text-emerald-600 dark:text-emerald-400"
										/>
									</div>
								</div>
							</Accordion.Body>
						</Accordion.Panel>
					</Accordion.Item>

					<Accordion.Item id="saques" className="overflow-hidden rounded-xl border border-default">
						<Accordion.Heading>
							<Accordion.Trigger className="flex w-full items-center justify-between px-3 py-3">
								<div className="flex items-center gap-2">
									<Icon icon={Wallet03Icon} className="icon-sm text-accent" />
									<span className="text-sm font-medium">Resumo dos Saques</span>
								</div>
								<Accordion.Indicator />
							</Accordion.Trigger>
						</Accordion.Heading>
						<Accordion.Panel>
							<Accordion.Body className="px-3 pb-3 pt-0">
								<div className="space-y-3 rounded-lg bg-surface/50 p-3">
									<div className="flex items-center justify-between">
										<span className="text-sm text-muted">Taxas se sacar tudo</span>
										<Val
											value={balanceData.totalWithdrawalFeeIfWithdrawAll}
											isHidden={isHidden}
											className="font-semibold text-danger"
											prefix="-"
										/>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm text-muted">Saldo Líquido</span>
										<Val
											value={platformNetIfWithdrawAll}
											isHidden={isHidden}
											className={`font-semibold ${platformNetIfWithdrawAll >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-danger'}`}
										/>
									</div>
									<div className="flex items-center justify-between border-t border-default pt-3">
										<span className="text-sm font-medium">Saldo Conta Safefy</span>
										<Val value={balanceData.platformPayoutsOut} isHidden={isHidden} className="font-bold" />
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
							className="h-auto gap-2 px-2 py-1 text-xs text-muted hover:text-foreground"
						>
							{isConsistent ? (
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
								{isConsistent ? (
									<Chip size="sm" color="success">
										Consistente
									</Chip>
								) : (
									<Chip size="sm" color="danger">
										Inconsistente
									</Chip>
								)}
							</div>
							<div className="space-y-2 text-sm">
								<div className="flex items-center justify-between">
									<span className="text-xs text-muted">Adquirentes</span>
									<span className={`font-mono text-xs font-semibold ${isHidden ? 'visual-blur' : ''}`}>
										{formatCurrency(totalAcquirerGrossBalance)}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-xs text-muted">Plataforma</span>
									<span className={`font-mono text-xs font-semibold ${isHidden ? 'visual-blur' : ''}`}>
										{formatCurrency(platformTotalBalance)}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-xs text-muted">Organizações</span>
									<span className={`font-mono text-xs font-semibold ${isHidden ? 'visual-blur' : ''}`}>
										{formatCurrency(totalMerchantBalance)}
									</span>
								</div>
								{!isConsistent && (
									<Alert status="warning" className="mt-2">
										<Alert.Indicator />
										<Alert.Content>
											<Alert.Title>Inconsistência</Alert.Title>
											<Alert.Description>
												Diferença de{' '}
												<span className={isHidden ? 'visual-blur' : ''}>
													{formatCurrency(balanceData.consistencyDifferenceAbsolute)}
												</span>
											</Alert.Description>
										</Alert.Content>
									</Alert>
								)}
							</div>
						</Disclosure.Body>
					</Disclosure.Content>
				</Disclosure>

				{/* Saldos por Adquirente */}
				{balanceData.acquirerBalances.length > 0 && (
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<span className="text-sm font-semibold">Saldos por Adquirente</span>
							<span className="text-xs text-muted">
								({filteredAcquirers.length} de {balanceData.acquirerBalances.length})
							</span>
						</div>
						<SearchField aria-label="Buscar adquirente" value={searchAcquirer} onChange={setSearchAcquirer}>
							<SearchField.Group>
								<SearchField.SearchIcon>
									<Icon icon={Search01Icon} className="icon-xs" />
								</SearchField.SearchIcon>
								<SearchField.Input className="w-full" placeholder="Buscar adquirente" />
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
										<Accordion.Item id={acq.acquirerId} className="rounded-lg border border-divider bg-surface">
											<Accordion.Heading>
												<Accordion.Trigger className="flex w-full items-center justify-between p-3">
													<div className="flex min-w-0 items-center gap-2">
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
															<p className="truncate text-sm font-semibold">{acquirerDisplayName}</p>
															{acq.grossBalance > 0 ? (
																<Chip size="sm" color="success">
																	Saldo positivo
																</Chip>
															) : (
																<span className="text-[11px] text-muted">{acq.acquirerCode}</span>
															)}
														</div>
													</div>
													<div className="flex shrink-0 items-center gap-2">
														<div className="text-right">
															<p className="text-[11px] text-muted">Entrada</p>
															<Val
																value={acq.totalIn}
																isHidden={isHidden}
																className="text-xs font-semibold text-success"
																prefix="+"
															/>
														</div>
														<Accordion.Indicator className="text-muted" />
													</div>
												</Accordion.Trigger>
											</Accordion.Heading>
											<Accordion.Panel>
												<Accordion.Body className="flex flex-col gap-3 p-3 pt-0">
													{operationTypes.length > 0 && (
														<div className="flex flex-wrap gap-1">
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
														</div>
													)}

													{/* Fluxo na Adquirente */}
													<div className="space-y-2 rounded-lg bg-surface/80 p-3">
														<p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
															Fluxo na Adquirente
														</p>
														<div className="flex justify-between">
															<span className="text-xs text-muted">Total entrada</span>
															<Val value={acq.totalIn} isHidden={isHidden} className="text-xs font-semibold text-success" prefix="+" />
														</div>
														<div className="flex justify-between">
															<span className="text-xs text-muted">Total saída</span>
															<Val value={acq.totalOut} isHidden={isHidden} className="text-xs font-semibold text-danger" prefix="-" />
														</div>
														<div className="flex justify-between border-t border-default pt-2">
															<span className="text-xs font-medium">Saldo na Adquirente</span>
															<Val
																value={acq.grossBalance}
																isHidden={isHidden}
																className={`text-xs font-bold ${acq.grossBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-danger'}`}
															/>
														</div>
														<div className="flex justify-between">
															<span className="text-xs text-muted">Saldo organizações</span>
															<Val value={acq.merchantBalance} isHidden={isHidden} className="text-xs font-semibold text-accent" />
														</div>
														<div className="flex justify-between">
															<div className="flex flex-col items-start gap-1">
																<span className="text-xs text-muted">Disponível das organizações</span>
																<Button variant="tertiary" size="sm" onPress={() => onOpenMerchantAvailability(acq)}>
																	Ver organizações
																</Button>
															</div>
															<Val
																value={acq.merchantAvailableBalance}
																isHidden={isHidden}
																className={`text-xs font-semibold ${acq.merchantAvailableBalance >= 0 ? 'text-success' : 'text-danger'}`}
															/>
														</div>
													</div>

													{/* Para Saque */}
													<div className="space-y-2 rounded-lg bg-surface/80 p-3">
														<p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Para Saque</p>
														<div className="flex justify-between">
															<span className="text-xs text-muted">Taxas à adquirente</span>
															<Val
																value={acq.totalAcquirerFees}
																isHidden={isHidden}
																className="text-xs font-semibold text-danger"
																prefix="-"
															/>
														</div>
														<div className="flex justify-between">
															<span className="text-xs text-muted">Bloqueado</span>
															<Val
																value={acq.platformPayoutsProcessing}
																isHidden={isHidden}
																className="text-xs font-semibold text-warning"
																prefix="-"
															/>
														</div>
														<div className="flex justify-between">
															<span className="text-xs text-muted">Disponibilidade Operacional</span>
															<Val
																value={availableForWithdrawal}
																isHidden={isHidden}
																className={`text-xs font-semibold ${availableForWithdrawal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-danger'}`}
															/>
														</div>
														<div className="flex justify-between">
															<span className="text-xs text-muted">Taxa de saque</span>
															<Val
																value={acq.withdrawalFeeIfWithdrawAll}
																isHidden={isHidden}
																className="text-xs font-semibold text-danger"
																prefix="-"
															/>
														</div>
														<div className="flex justify-between border-t border-default pt-2">
															<span className="text-xs font-medium">Saldo Líquido</span>
															<Val
																value={netIfWithdrawAll}
																isHidden={isHidden}
																className={`text-xs font-bold ${netIfWithdrawAll >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-danger'}`}
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
