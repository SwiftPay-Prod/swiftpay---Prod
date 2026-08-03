'use client';

import { useRouter } from 'next/navigation';
import { PERIOD_OPTIONS, useMerchantDashboard } from '@/hooks/use-merchant-dashboard';
import { useDashboardLayout } from '@/hooks/use-dashboard-layout';
import { useBalanceVisibility } from '@/hooks/use-balance-visibility';
import type { ReadMerchantDashboardData, DashboardPeriod } from '@/types/merchant/dashboard';
import { formatRelativeTime } from '@/utils/datetime';
import { DashboardSkeleton } from './DashboardSkeleton';
import { MobileMerchantDashboard } from '@/components/panel/mobile-merchant-dashboard';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { VolumeChart } from './components/VolumeChart';
import { WeeklyVolumeChart } from './components/WeeklyVolumeChart';
import { ApprovalRateGauge } from './components/ApprovalRateGauge';
import { MainKpiSection } from './components/MainKpiSection';
import { SecondaryKpiSection } from './components/SecondaryKpiSection';
import { DashboardLayoutPicker } from './components/DashboardLayoutPicker';
import { Routes } from '@/router/routes';
import { Icon } from '@/components/ui/icon';
import { ArrowReloadHorizontalIcon, HelpCircleIcon } from '@hugeicons/core-free-icons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
	onOpenLiveScreen: () => void;
	hasReserveEnabled: boolean;
	reserveConfig: MerchantReserveConfig | null;
}

function DashboardContent({
	dashboard,
	onRefresh,
	isRefreshing,
	selectedPeriod,
	onPeriodChange,
	isBalanceVisible,
	onOpenLiveScreen,
	hasReserveEnabled,
	reserveConfig,
}: DashboardContentProps) {
	const kpis = dashboard.kpis;
	const balance = dashboard.balance;
	const cacheInfo = dashboard.cacheInfo;
	const periodInfo = dashboard.periodInfo;
	const averageTicket = kpis.completedTransactions > 0 ? Math.round(kpis.totalVolume / kpis.completedTransactions) : 0;

	const { layout, changeLayout } = useDashboardLayout();

	const periodDays = periodInfo
		? Math.max(1, Math.floor(
				(new Date(periodInfo.endDate).getTime() - new Date(periodInfo.startDate).getTime()) / (1000 * 60 * 60 * 24)
			) + 1)
		: 7;
	const isHourlyGranularity = periodDays <= 2;

	const weeklyChart = (
		<WeeklyVolumeChart
			data={dashboard.weeklyChart}
			isHourlyGranularity={isHourlyGranularity}
			isProcessing={cacheInfo.isProcessing}
		/>
	);

	const volumeChart = (
		<VolumeChart
			data={dashboard.volumeChart}
			adaptiveData={dashboard.weeklyChart}
			isHourlyGranularity={isHourlyGranularity}
			isProcessing={cacheInfo.isProcessing}
			periodLabel={periodInfo?.label}
		/>
	);

	const approvalGauge = (
		<ApprovalRateGauge
			approvalRate={kpis.approvalRate}
			approvalRateLevel={kpis.approvalRateLevel}
			isProcessing={cacheInfo.isProcessing}
			isBalanceVisible={isBalanceVisible}
		/>
	);

	const mainKpis = (
		<MainKpiSection
			kpis={kpis}
			balance={balance}
			cacheInfo={cacheInfo}
			averageTicket={averageTicket}
			isBalanceVisible={isBalanceVisible}
			hasReserveEnabled={hasReserveEnabled}
			reserveConfig={reserveConfig}
		/>
	);

	const secondaryKpis = (
		<SecondaryKpiSection kpis={kpis} cacheInfo={cacheInfo} isBalanceVisible={isBalanceVisible} />
	);

	function renderSections() {
		switch (layout) {
			case 'focus-charts':
				return (
					<>
						<div className="mockup-chart-grid">{weeklyChart}{volumeChart}</div>
						{mainKpis}
						{secondaryKpis}
						{approvalGauge}
					</>
				);
			case 'focus-kpis':
				return (
					<>
						{mainKpis}
						{secondaryKpis}
						{weeklyChart}
						<div className="mockup-chart-grid">{volumeChart}{approvalGauge}</div>
					</>
				);
			case 'compact':
				return (
					<>
						<div className="mockup-chart-grid mockup-chart-grid-3">
							<div className="lg:col-span-2">{weeklyChart}</div>
							{approvalGauge}
						</div>
						{mainKpis}
						{secondaryKpis}
						{volumeChart}
					</>
				);
			default:
				return (
					<>
						{weeklyChart}
						{mainKpis}
						{secondaryKpis}
						<div className="mockup-chart-grid">{volumeChart}{approvalGauge}</div>
					</>
				);
		}
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<div className="text-xs text-muted-foreground mb-2">Visão Geral / Dashboard</div>
				<div className="flex items-center justify-between">
					<h1 className="text-xl font-bold text-foreground">Dashboard</h1>
				</div>
			</div>

			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<label className="mockup-toolbar-label">Período</label>
					<select
						value={selectedPeriod}
						onChange={(e) => onPeriodChange(e.target.value as DashboardPeriod)}
						className="mockup-select"
					>
						{PERIOD_OPTIONS.map((opt) => (
							<option key={opt.key} value={opt.key}>{opt.label}</option>
						))}
					</select>
				</div>
				<div className="flex items-center gap-3">
					<DashboardLayoutPicker layout={layout} onLayoutChange={changeLayout} />
				</div>
			</div>

			<div className="mockup-kpi-grid">
				{mainKpis}
			</div>

			{renderSections()}

			<div className="mockup-kpi-grid mockup-kpi-grid-secondary">
				{secondaryKpis}
			</div>

			<div className="flex items-center justify-between border-t border-border pt-4">
				<div className="flex items-center gap-3">
					{cacheInfo.isProcessing && (
						<div className="flex items-center gap-2 rounded-full bg-warning/10 px-3 py-1">
							<div className="h-3 w-3 animate-spin rounded-full border-2 border-warning border-t-transparent" />
							<span className="text-xs font-medium text-warning">Atualizando...</span>
						</div>
					)}
					{cacheInfo.lastUpdatedAt && (
						<div className="flex items-center gap-1.5">
							<span className="text-xs text-muted-foreground">Atualizado {formatRelativeTime(cacheInfo.lastUpdatedAt)}</span>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger className="inline-flex cursor-help">
										<Icon icon={HelpCircleIcon} className="icon-xs text-muted-foreground" />
									</TooltipTrigger>
									<TooltipContent side="top" className="max-w-72 text-xs">
										<span className="font-medium">Como funciona a atualização?</span>
										<br />
										O <strong>saldo</strong> é sempre atualizado em tempo real. As demais estatísticas são atualizadas a
										cada {cacheInfo.cacheDurationMinutes} minutos.
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
					className="mockup-btn-primary"
				>
					↻ {isRefreshing ? 'Atualizando...' : 'Atualizar'}
				</button>
			</div>
		</div>
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
			onOpenLiveScreen={openLiveBalanceRoute}
			hasReserveEnabled={hookData.hasReserveEnabled}
			reserveConfig={hookData.reserveConfig}
		/>
	);
}
