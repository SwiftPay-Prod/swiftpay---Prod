'use client';

import { useRouter } from 'next/navigation';
import { Select, ListBox } from '@heroui/react';
import { PERIOD_OPTIONS, useMerchantDashboard } from '@/hooks/use-merchant-dashboard';
import { useBalanceVisibility } from '@/hooks/use-balance-visibility';
import type { ReadMerchantDashboardData, DashboardPeriod } from '@/types/merchant/dashboard';
import { formatRelativeTime } from '@/utils/datetime';
import { DashboardSkeleton } from './DashboardSkeleton';
import { MobileMerchantDashboard } from '@/components/panel/mobile-merchant-dashboard';
import { useIsMobile } from '@/hooks/use-is-mobile';
import type { MerchantKpiData } from '@/types/merchant/dashboard';
import { VolumeChart } from './components/VolumeChart';
import { WeeklyVolumeChart } from './components/WeeklyVolumeChart';
import { SecondaryKpiSection } from './components/SecondaryKpiSection';
import { Routes } from '@/router/routes';
import { Icon } from '@/components/ui/icon';
import {
	Wallet01Icon,
	BankIcon,
	Link02Icon,
	UserAdd01Icon,
	Ticket01Icon,
	MoneyExchange01Icon,
	ArrowUpRight01Icon,
	ArrowDownRight01Icon,
	Alert01Icon,
	AlertCircleIcon,
	CheckmarkCircle02Icon,
	HelpCircleIcon,
} from '@hugeicons/core-free-icons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Card } from '@heroui/react';

interface MerchantReserveConfig {
	pixReservePercentage: number;
	boletoReservePercentage: number;
	creditCardReservePercentage: number;
}

interface DashboardContentProps {
	dashboard: ReadMerchantDashboardData;
	onRefresh: () => void;
	isRefreshing: boolean;
	selectedPeriod: DashboardPeriod;
	onPeriodChange: (period: DashboardPeriod) => void;
	isBalanceVisible: boolean;
	hasReserveEnabled: boolean;
	reserveConfig: MerchantReserveConfig | null;
}

function formatTrend(value: number | null | undefined): string {
	if (value == null) return '';
	return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function DashboardContent({
	dashboard,
	onRefresh,
	isRefreshing,
	selectedPeriod,
	onPeriodChange,
	isBalanceVisible,
	hasReserveEnabled,
	reserveConfig,
}: DashboardContentProps) {
	const kpis = dashboard.kpis;
	const balance = dashboard.balance;
	const cacheInfo = dashboard.cacheInfo;
	const periodInfo = dashboard.periodInfo;

	const weeklyChart = (
		<WeeklyVolumeChart
			data={dashboard.weeklyChart}
			isHourlyGranularity={periodInfo ? new Date(periodInfo.endDate).getTime() - new Date(periodInfo.startDate).getTime() <= 2 * 86400000 : false}
			isProcessing={cacheInfo.isProcessing}
		/>
	);

	const volumeChart = (
		<VolumeChart
			data={dashboard.volumeChart}
			adaptiveData={dashboard.weeklyChart}
			isHourlyGranularity={periodInfo ? new Date(periodInfo.endDate).getTime() - new Date(periodInfo.startDate).getTime() <= 2 * 86400000 : false}
			isProcessing={cacheInfo.isProcessing}
			periodLabel={periodInfo?.label}
		/>
	);

	return (
		<div className="flex flex-col gap-3">
			{/* Executive Toolbar */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
				<div>
					<h1 className="text-base font-semibold text-foreground tracking-tight">Visão Geral</h1>
					<p className="text-xs text-muted-foreground mt-0.5">Métricas de faturamento, caixa e desempenho operacional</p>
				</div>
				<div className="flex items-center gap-2">
					<Select
						variant="secondary"
						size="sm"
						aria-label="Período"
						className="min-w-36"
						value={selectedPeriod}
						onChange={(key) => key && onPeriodChange(key as DashboardPeriod)}
					>
						<Select.Trigger>
							<Select.Value />
						</Select.Trigger>
						<Select.Popover>
							<ListBox>
								{PERIOD_OPTIONS.map((opt) => (
									<ListBox.Item key={opt.key} id={opt.key}>
										{opt.label}
									</ListBox.Item>
								))}
							</ListBox>
						</Select.Popover>
					</Select>
				</div>
			</div>

			{/* Operational Alerts — visíveis antes de qualquer scroll */}
			<OperationalAlertBanner kpis={kpis} />

			{/* Cash Hero + Primary Financial Metrics */}
			<div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
				<CashHeroCard
					balance={balance}
					isBalanceVisible={isBalanceVisible}
					hasReserveEnabled={hasReserveEnabled}
					reserveConfig={reserveConfig}
				/>
				<FinancialMetricCard
					label="Faturamento Líquido"
					value={kpis.totalNetVolume}
					isBalanceVisible={isBalanceVisible}
					format="currency"
					trend={kpis.volumeGrowth}
				/>
				<FinancialMetricCard
					label="Volume Total"
					value={kpis.totalVolume}
					isBalanceVisible={isBalanceVisible}
					format="currency"
				/>
				<FinancialMetricCard
					label="Aprovadas"
					value={kpis.completedTransactions}
					isBalanceVisible={isBalanceVisible}
					format="number"
					meta={`de ${kpis.totalTransactions}`}
					trend={kpis.transactionsGrowth}
				/>
			</div>

			{/* Performance + Health */}
			<div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
				<div className="lg:col-span-2 flex flex-col gap-3">
					{weeklyChart}
					{volumeChart}
				</div>
				<div className="lg:col-span-1 flex flex-col gap-3">
					<ApprovalHealthCard kpis={kpis} isBalanceVisible={isBalanceVisible} />
					<div className="grid grid-cols-2 gap-2">
						<SecondaryKpiSection kpis={kpis} cacheInfo={cacheInfo} isBalanceVisible={isBalanceVisible} />
					</div>
				</div>
			</div>

			{/* Quick Actions */}
			<QuickActions />

			{/* Footer Status */}
			<div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs text-muted-foreground">
				<div className="flex items-center gap-3">
					{cacheInfo.isProcessing && (
						<div className="flex items-center gap-1.5">
							<div className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
							<span>Sincronizando dados...</span>
						</div>
					)}
					{cacheInfo.lastUpdatedAt && (
						<div className="flex items-center gap-1.5">
							<span>Atualizado {formatRelativeTime(cacheInfo.lastUpdatedAt)}</span>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger className="inline-flex cursor-help">
										<Icon icon={HelpCircleIcon} className="icon-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
									</TooltipTrigger>
									<TooltipContent side="top" className="max-w-72 text-xs">
										<span className="font-medium">Sincronização:</span>{' '}
										Saldo em tempo real; métricas atualizadas a cada {cacheInfo.cacheDurationMinutes} min.
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>
					)}
				</div>
				<button
					type="button"
					onClick={onRefresh}
					disabled={isRefreshing}
					className="inline-flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium text-muted-foreground border border-border/80 hover:text-foreground hover:bg-surface rounded transition-colors disabled:opacity-50"
				>
					<svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
						<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" />
					</svg>
					{isRefreshing ? 'Atualizando...' : 'Atualizar'}
				</button>
			</div>
		</div>
	);
}

function CashHeroCard({
	balance,
	isBalanceVisible,
	hasReserveEnabled,
	reserveConfig,
}: {
	balance: ReadMerchantDashboardData['balance'];
	isBalanceVisible: boolean;
	hasReserveEnabled: boolean;
	reserveConfig: MerchantReserveConfig | null;
}) {
	const router = useRouter();
	const blurClass = isBalanceVisible ? '' : 'visual-blur';

	return (
		<Card className="border border-success/20 bg-card lg:col-span-1">
			<Card.Content className="flex h-full flex-col gap-2 p-3">
				<div className="flex items-center justify-between gap-2">
					<span className="text-xs font-mono font-medium uppercase tracking-wider text-muted-foreground">Saldo Disponível</span>
					<Icon icon={Wallet01Icon} className="icon-sm text-success" />
				</div>
				<div className={`text-lg font-bold font-mono tracking-tight text-success ${blurClass}`}>
					<AnimatedCurrency value={balance.available} />
				</div>
				<div className="flex flex-col gap-0.5 text-xs font-mono text-muted-foreground">
					<span className={blurClass}>
						Pendente: <AnimatedCurrency value={balance.pending} />
					</span>
					{hasReserveEnabled && balance.reserved > 0 && reserveConfig && (
						<span className={blurClass}>
							Reserva: <AnimatedCurrency value={balance.reserved} />{' '}
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger className="inline-flex cursor-help">
										<Icon icon={HelpCircleIcon} className="icon-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
									</TooltipTrigger>
									<TooltipContent side="top" className="max-w-64 text-xs">
										Retenção configurada: PIX {reserveConfig.pixReservePercentage}% · Boleto{' '}
										{reserveConfig.boletoReservePercentage}% · Cartão {reserveConfig.creditCardReservePercentage}%
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</span>
					)}
				</div>
				<div className="mt-auto flex flex-wrap gap-1.5 pt-1">
					<button
						type="button"
						onClick={() => router.push(Routes.panel.merchant.balanceHistory)}
						className="inline-flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium text-foreground border border-border/80 hover:bg-surface rounded transition-colors"
					>
						<Icon icon={MoneyExchange01Icon} className="icon-xs" />
						Ver extrato
					</button>
					<button
						type="button"
						onClick={() => router.push(Routes.panel.merchant.cashouts)}
						className="inline-flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium text-success border border-success/30 hover:bg-success/5 rounded transition-colors"
					>
						<Icon icon={Wallet01Icon} className="icon-xs" />
						Solicitar saque
					</button>
				</div>
			</Card.Content>
		</Card>
	);
}

function FinancialMetricCard({
	label,
	value,
	isBalanceVisible,
	format = 'currency',
	accent = false,
	positive = false,
	meta,
	trend,
}: {
	label: string;
	value: number | null | undefined;
	isBalanceVisible: boolean;
	format?: 'currency' | 'number' | 'percent';
	accent?: boolean;
	positive?: boolean;
	meta?: string;
	trend?: number | null;
}) {
	const blurClass = isBalanceVisible ? '' : 'visual-blur';
	const numValue = value ?? 0;
	const trendUp = (trend ?? 0) >= 0;

	return (
		<Card className="border border-border/80 bg-card hover:border-border transition-colors">
			<Card.Content className="flex flex-col gap-1.5 p-3">
				<span className="text-xs font-mono font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
				<div className={`text-lg font-bold font-mono tracking-tight ${blurClass} ${accent ? 'text-success' : positive ? 'text-success' : 'text-foreground'}`}>
					{format === 'currency' && <AnimatedCurrency value={numValue} />}
					{format === 'number' && <AnimatedNumber value={numValue} />}
					{format === 'percent' && <AnimatedNumber value={numValue} suffix="%" maximumFractionDigits={1} />}
				</div>
				{(meta || trend != null) && (
					<div className="flex items-center gap-1.5">
						{trend != null && (
							<span className={`inline-flex items-center gap-0.5 text-xs font-mono font-medium ${trendUp ? 'text-success' : 'text-danger'}`}>
								<Icon icon={trendUp ? ArrowUpRight01Icon : ArrowDownRight01Icon} className="icon-xs" />
								{formatTrend(trend)}
							</span>
						)}
						{meta && <span className="text-xs font-mono text-muted-foreground">{meta}</span>}
					</div>
				)}
			</Card.Content>
		</Card>
	);
}

function OperationalAlertBanner({ kpis }: { kpis: MerchantKpiData }) {
	const declineCount = kpis.failedTransactions ?? 0;
	const chargebackCount = kpis.chargebackCount ?? 0;
	const volumeGrowth = kpis.volumeGrowth ?? 0;

	const alerts: Array<{ tone: 'success' | 'danger' | 'warning'; label: string }> = [
		...(volumeGrowth > 0
			? [{ tone: 'success' as const, label: `Faturamento em alta: +${volumeGrowth.toFixed(1)}% vs período anterior` }]
			: volumeGrowth < 0
				? [{ tone: 'danger' as const, label: `Faturamento em queda: ${volumeGrowth.toFixed(1)}% vs período anterior` }]
				: []),
		...(declineCount > 0 ? [{ tone: 'warning' as const, label: `${declineCount.toLocaleString('pt-BR')} transações recusadas` }] : []),
		...(chargebackCount > 0 ? [{ tone: 'danger' as const, label: `${chargebackCount} chargebacks registrados` }] : []),
	];

	if (alerts.length === 0) return null;

	const iconFor: Record<'success' | 'danger' | 'warning', typeof Alert01Icon> = {
		success: CheckmarkCircle02Icon,
		warning: Alert01Icon,
		danger: AlertCircleIcon,
	};

	const toneStyles: Record<string, string> = {
		success: 'border-success/20 bg-success/5 text-success',
		warning: 'border-warning/20 bg-warning/5 text-warning',
		danger: 'border-danger/20 bg-danger/5 text-danger',
	};

	return (
		<div className="flex flex-wrap items-center gap-1.5">
			<span className="text-xs font-mono font-medium uppercase tracking-wider text-muted-foreground">Alertas</span>
			{alerts.slice(0, 3).map((item) => (
				<span key={item.label} className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${toneStyles[item.tone]}`}>
					<Icon icon={iconFor[item.tone]} className="icon-sm" />
					<span className="truncate">{item.label}</span>
				</span>
			))}
		</div>
	);
}

function ApprovalHealthCard({
	kpis,
	isBalanceVisible,
}: {
	kpis: MerchantKpiData;
	isBalanceVisible: boolean;
}) {
	const isHealthy = kpis.approvalRate >= 80;
	const blurClass = isBalanceVisible ? '' : 'visual-blur';

	return (
		<Card className="border border-border/80 bg-card">
			<Card.Content className="p-3">
				<div className="flex flex-col gap-1.5">
					<div className="flex items-center justify-between">
						<span className="text-xs font-mono uppercase text-muted-foreground font-medium">Saúde de Aprovação</span>
						<span className={`text-xs font-mono font-semibold ${blurClass} ${isHealthy ? 'text-success' : 'text-warning'}`}>
							{kpis.approvalRate.toFixed(1)}%
						</span>
					</div>
					<div className="h-1.5 w-full rounded-full bg-surface">
						<div
							className={`h-full rounded-full transition-all ${isHealthy ? 'bg-success' : 'bg-warning'}`}
							style={{ width: `${Math.min(kpis.approvalRate, 100)}%` }}
						/>
					</div>
					<span className="text-xs font-mono text-muted-foreground">
						{isHealthy ? 'Taxa dentro do esperado' : 'Abaixo da média da plataforma'}
					</span>
					<div className="mt-1 grid grid-cols-2 gap-2 border-t border-border/60 pt-2">
						<div className="flex flex-col gap-0.5">
							<span className="text-xs font-mono uppercase text-muted-foreground">Aprovadas</span>
							<span className={`text-sm font-semibold font-mono tabular-nums ${blurClass}`}>
								{kpis.completedTransactions}
								<span className="text-xs font-normal text-muted-foreground"> / {kpis.totalTransactions}</span>
							</span>
						</div>
						<div className="flex flex-col gap-0.5">
							<span className="text-xs font-mono uppercase text-muted-foreground">Chargebacks</span>
							<span className="text-sm font-semibold font-mono tabular-nums text-danger">
								{kpis.chargebackCount}
								{kpis.chargebackRate > 0 && (
									<span className="text-xs font-normal text-muted-foreground"> ({kpis.chargebackRate.toFixed(1)}%)</span>
								)}
							</span>
						</div>
					</div>
				</div>
			</Card.Content>
		</Card>
	);
}

function QuickActions() {
	const router = useRouter();

	const groups: Array<{
		label: string;
		items: Array<{ label: string; icon: typeof Wallet01Icon; route: string }>;
	}> = [
		{
			label: 'Financeiro',
			items: [
				{ label: 'Solicitar Saque', icon: Wallet01Icon, route: Routes.panel.merchant.cashouts },
				{ label: 'Conta PIX', icon: BankIcon, route: Routes.panel.merchant.cashoutAccounts },
			],
		},
		{
			label: 'Vendas',
			items: [
				{ label: 'Novo Checkout', icon: Link02Icon, route: Routes.panel.merchant.checkouts },
				{ label: 'Novo Cliente', icon: UserAdd01Icon, route: Routes.panel.merchant.customers },
				{ label: 'Novo Cupom', icon: Ticket01Icon, route: Routes.panel.merchant.coupons },
			],
		},
	];

	return (
		<Card className="border border-border/80 bg-card">
			<Card.Content className="p-3">
				<div className="flex flex-col gap-3">
					<span className="text-xs font-mono font-medium uppercase tracking-wider text-muted-foreground">Ações Rápidas</span>
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						{groups.map((group) => (
							<div key={group.label} className="flex flex-col gap-1.5">
								<span className="text-xs font-mono uppercase text-muted-foreground/70">{group.label}</span>
								<div className="flex flex-col gap-1.5">
									{group.items.map((item) => (
										<button
											key={item.label}
											type="button"
											onClick={() => router.push(item.route)}
											className="flex items-center gap-2.5 rounded-md border border-border/80 bg-card px-2.5 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-surface"
										>
											<Icon icon={item.icon} className="icon-sm text-muted-foreground" />
											<span>{item.label}</span>
										</button>
									))}
								</div>
							</div>
						))}
					</div>
				</div>
			</Card.Content>
		</Card>
	);
}

interface MerchantDashboardProps {
	merchantId: string;
}

export function MerchantDashboard({ merchantId }: MerchantDashboardProps) {
	const isMobile = useIsMobile();
	const router = useRouter();
	const { data: hookData, period, actions } = useMerchantDashboard({ merchantId });
	const { isVisible: isBalanceVisible, toggle: toggleBalanceVisibility } = useBalanceVisibility();

	function openLiveBalanceRoute() {
		router.push(Routes.panel.merchant.liveBalance);
	}

	if (hookData.isLoading) {
		return <DashboardSkeleton />;
	}

	if (hookData.error) {
		return (
			<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm">
				<p className="font-semibold text-destructive">Erro ao carregar dados</p>
				<p className="mt-1 text-muted-foreground">{hookData.error}</p>
			</div>
		);
	}

	if (!hookData.dashboard) {
		return (
			<div className="rounded-lg border border-warning/50 bg-warning/10 p-4 text-sm">
				<p className="font-semibold text-warning">Dados não disponíveis</p>
				<p className="mt-1 text-muted-foreground">Não foi possível carregar os dados do dashboard.</p>
			</div>
		);
	}

	if (isMobile) {
		return (
			<MobileMerchantDashboard
				merchantId={merchantId}
				onOpenLiveScreen={openLiveBalanceRoute}
				isBalanceVisible={isBalanceVisible}
				onToggleBalanceVisibility={toggleBalanceVisibility}
				hasReserveEnabled={hookData.hasReserveEnabled}
			/>
		);
	}

	return (
		<DashboardContent
			dashboard={hookData.dashboard}
			onRefresh={actions.refresh}
			isRefreshing={hookData.isRefreshing}
			selectedPeriod={period.selected}
			onPeriodChange={period.change}
			isBalanceVisible={isBalanceVisible}
			hasReserveEnabled={hookData.hasReserveEnabled}
			reserveConfig={hookData.reserveConfig}
		/>
	);
}
