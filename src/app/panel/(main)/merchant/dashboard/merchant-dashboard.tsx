'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useMerchantDashboard } from '@/hooks/use-merchant-dashboard';
import { useBalanceVisibility } from '@/hooks/use-balance-visibility';
import type { ReadMerchantDashboardData, DashboardPeriod, MerchantKpiData } from '@/types/merchant/dashboard';
import { formatRelativeTime } from '@/utils/datetime';
import { DashboardSkeleton } from './DashboardSkeleton';
import { MobileMerchantDashboard } from '@/components/panel/mobile-merchant-dashboard';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { VolumeChart } from './components/VolumeChart';
import { WeeklyVolumeChart } from './components/WeeklyVolumeChart';
import { SecondaryKpiSection } from './components/SecondaryKpiSection';
import { RevolutHeroBalanceCard, type MerchantReserveConfig } from './components/RevolutHeroBalanceCard';
import { RevolutPeriodSelector } from './components/RevolutPeriodSelector';
import { RevolutFinancialMetricsGrid } from './components/RevolutFinancialMetricsGrid';
import { Routes } from '@/router/routes';
import {
	RevolutWalletIcon,
	RevolutPlusIcon,
	RevolutArrowUpRightIcon,
	RevolutStatementIcon,
	RevolutCheckIcon,
	RevolutAlertIcon,
	RevolutPixIcon,
	RevolutInfoIcon,
	RevolutAnalyticsIcon,
} from '@/components/ui/revolut-icons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AnimatedNumber } from '@/components/ui/animated-number';

interface DashboardContentProps {
	dashboard: ReadMerchantDashboardData;
	onRefresh: () => void;
	isRefreshing: boolean;
	selectedPeriod: DashboardPeriod;
	onPeriodChange: (period: DashboardPeriod) => void;
	isBalanceVisible: boolean;
	onToggleBalanceVisibility: () => void;
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
	onToggleBalanceVisibility,
	hasReserveEnabled,
	reserveConfig,
}: DashboardContentProps) {
	const kpis = dashboard.kpis;
	const balance = dashboard.balance;
	const cacheInfo = dashboard.cacheInfo;
	const periodInfo = dashboard.periodInfo;

	const isHourlyGranularity = periodInfo
		? new Date(periodInfo.endDate).getTime() - new Date(periodInfo.startDate).getTime() <= 2 * 86400000
		: false;

	return (
		<div className="flex flex-col gap-5 text-white">
			{/* Executive Toolbar */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
				<div>
					<h1 className="text-xl font-bold tracking-tight text-white">Visão Geral</h1>
					<p className="text-xs text-white/50 mt-0.5">
						Métricas de faturamento, fluxo de caixa e desempenho operacional
					</p>
				</div>

				<RevolutPeriodSelector
					selectedPeriod={selectedPeriod}
					onPeriodChange={onPeriodChange}
					onRefresh={onRefresh}
					isRefreshing={isRefreshing}
				/>
			</div>

			{/* Operational Alerts */}
			<OperationalAlertBanner kpis={kpis} />

			{/* Hero Balance Card */}
			<RevolutHeroBalanceCard
				balance={balance}
				isBalanceVisible={isBalanceVisible}
				onToggleBalanceVisibility={onToggleBalanceVisibility}
				hasReserveEnabled={hasReserveEnabled}
				reserveConfig={reserveConfig}
			/>

			{/* Primary High-Contrast Financial Metrics Grid */}
			<RevolutFinancialMetricsGrid kpis={kpis} isBalanceVisible={isBalanceVisible} />

			{/* Performance & Charts Grid */}
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				{/* Charts Column (2 cols) */}
				<div className="lg:col-span-2 flex flex-col gap-4">
					<WeeklyVolumeChart
						data={dashboard.weeklyChart}
						isHourlyGranularity={isHourlyGranularity}
						isProcessing={cacheInfo.isProcessing}
					/>
					<VolumeChart
						data={dashboard.volumeChart}
						adaptiveData={dashboard.weeklyChart}
						isHourlyGranularity={isHourlyGranularity}
						isProcessing={cacheInfo.isProcessing}
						periodLabel={periodInfo?.label}
					/>
				</div>

				{/* Health & Secondary Metrics Column (1 col) */}
				<div className="lg:col-span-1 flex flex-col gap-4">
					<ApprovalHealthCard kpis={kpis} isBalanceVisible={isBalanceVisible} />
					<SecondaryKpiSection
						kpis={kpis}
						cacheInfo={cacheInfo}
						isBalanceVisible={isBalanceVisible}
					/>
				</div>
			</div>

			{/* Quick Actions Card */}
			<QuickActions />

			{/* Footer Status Bar */}
			<div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-white/50 font-mono">
				<div className="flex items-center gap-3">
					{cacheInfo.isProcessing && (
						<div className="flex items-center gap-1.5 text-[#4f55f1]">
							<div className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-[#4f55f1] border-t-transparent" />
							<span>Sincronizando métricas...</span>
						</div>
					)}
					{cacheInfo.lastUpdatedAt && (
						<div className="flex items-center gap-1.5">
							<span>Atualizado {formatRelativeTime(cacheInfo.lastUpdatedAt)}</span>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger className="cursor-help text-white/40 hover:text-white/70 inline-flex items-center">
										<RevolutInfoIcon size={12} />
									</TooltipTrigger>
									<TooltipContent side="top" className="max-w-72 border-white/12 bg-[#0a0a0a] text-xs text-white shadow-xl">
										<p className="font-semibold text-white/90">Ciclo de Sincronização:</p>
										<p className="mt-1 text-white/70">
											Saldo disponível em tempo real. Gráficos e indicadores operacionais atualizados a cada{' '}
											{cacheInfo.cacheDurationMinutes} min.
										</p>
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
					className="button-outline-dark text-xs py-1.5 px-3"
				>
					<svg
						className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#4f55f1]' : ''}`}
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
						<path d="M21 3v5h-5" />
					</svg>
					<span>{isRefreshing ? 'Atualizando...' : 'Atualizar Dados'}</span>
				</button>
			</div>
		</div>
	);
}

function OperationalAlertBanner({ kpis }: { kpis: MerchantKpiData }) {
	const declineCount = kpis.failedTransactions ?? 0;
	const chargebackCount = kpis.chargebackCount ?? 0;
	const volumeGrowth = kpis.volumeGrowth ?? 0;

	const alerts: Array<{ tone: 'success' | 'danger' | 'warning'; label: string }> = [
		...(volumeGrowth > 0
			? [{ tone: 'success' as const, label: `Faturamento em alta (+${volumeGrowth.toFixed(1)}%)` }]
			: volumeGrowth < 0
				? [{ tone: 'danger' as const, label: `Faturamento em queda (${volumeGrowth.toFixed(1)}%)` }]
				: []),
		...(declineCount > 0
			? [{ tone: 'warning' as const, label: `${declineCount.toLocaleString('pt-BR')} transações recusadas` }]
			: []),
		...(chargebackCount > 0
			? [{ tone: 'danger' as const, label: `${chargebackCount} chargebacks registrados` }]
			: []),
	];

	if (alerts.length === 0) return null;

	const toneStyles: Record<'success' | 'danger' | 'warning', string> = {
		success: 'border-[#00a87e]/25 bg-[#00a87e]/10 text-[#00a87e]',
		warning: 'border-[#ec7e00]/25 bg-[#ec7e00]/10 text-[#ec7e00]',
		danger: 'border-[#e23b4a]/25 bg-[#e23b4a]/10 text-[#e23b4a]',
	};

	return (
		<div className="flex flex-wrap items-center gap-2">
			<span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">Alertas</span>
			{alerts.slice(0, 3).map((item) => (
				<span
					key={item.label}
					className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-medium ${toneStyles[item.tone]}`}
				>
					{item.tone === 'success' && <RevolutCheckIcon size={13} />}
					{item.tone === 'warning' && <RevolutAlertIcon size={13} />}
					{item.tone === 'danger' && <RevolutAlertIcon size={13} />}
					<span>{item.label}</span>
				</span>
			))}
		</div>
	);
}

function ApprovalHealthCard({
	kpis,
	isBalanceVisible,
}: {
	kpis?: MerchantKpiData | null;
	isBalanceVisible: boolean;
}) {
	const total = typeof kpis?.totalTransactions === 'number' ? kpis.totalTransactions : 0;
	const completed = typeof kpis?.completedTransactions === 'number' ? kpis.completedTransactions : 0;
	const chargebackCount = typeof kpis?.chargebackCount === 'number' ? kpis.chargebackCount : 0;
	const chargebackRate = typeof kpis?.chargebackRate === 'number' ? kpis.chargebackRate : 0;
	const approvalRate = typeof kpis?.approvalRate === 'number' ? kpis.approvalRate : 0;
	const hasTransactions = total > 0;

	const isHealthy = hasTransactions && approvalRate >= 80;
	const isMedium = hasTransactions && approvalRate >= 60 && approvalRate < 80;
	const blurClass = isBalanceVisible ? '' : 'visual-blur';

	const healthColor = !hasTransactions
		? 'rgba(255, 255, 255, 0.4)'
		: isHealthy
			? '#00a87e'
			: isMedium
				? '#ec7e00'
				: '#e23b4a';

	const badgeBg = !hasTransactions
		? 'bg-white/5 text-white/50'
		: isHealthy
			? 'bg-[#00a87e]/15 text-[#00a87e]'
			: isMedium
				? 'bg-[#ec7e00]/15 text-[#ec7e00]'
				: 'bg-[#e23b4a]/15 text-[#e23b4a]';

	const HealthIcon = !hasTransactions || isHealthy ? RevolutCheckIcon : RevolutAlertIcon;

	return (
		<div className="flex flex-col justify-between gap-3.5 rounded-[20px] border border-white/12 bg-[#16181a] p-5 transition-all hover:border-white/20">
			<div className="flex flex-col gap-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div className={`flex h-6 w-6 items-center justify-center rounded-lg ${badgeBg}`}>
							<HealthIcon size={14} />
						</div>
						<span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
							Saúde de Conversão
						</span>
					</div>

					<span
						className={`font-mono text-sm font-bold ${blurClass}`}
						style={{ color: healthColor }}
					>
						{hasTransactions ? `${approvalRate.toFixed(1)}%` : '—'}
					</span>
				</div>

				{/* Rounded Health Progress Bar */}
				<div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
					<div
						className="h-full rounded-full transition-all"
						style={{
							width: hasTransactions ? `${Math.min(approvalRate, 100)}%` : '0%',
							backgroundColor: healthColor,
						}}
					/>
				</div>

				<span className="text-xs text-white/50">
					{!hasTransactions
						? 'Nenhuma transação registrada no período'
						: isHealthy
							? 'Taxa de aprovação dentro do padrão de excelência'
							: isMedium
								? 'Taxa moderada — monitore transações recusadas'
								: 'Atenção — volume de recusas acima da média'}
				</span>
			</div>

			<div className="grid grid-cols-2 gap-2 border-t border-white/8 pt-3 font-mono">
				<div className="flex flex-col gap-0.5">
					<span className="text-[10px] uppercase text-white/40 font-semibold">Aprovadas</span>
					<span className={`text-sm font-bold text-white ${blurClass}`}>
						{completed}
						<span className="text-xs font-normal text-white/40"> / {total}</span>
					</span>
				</div>

				<div className="flex flex-col gap-0.5">
					<span className="text-[10px] uppercase text-white/40 font-semibold">Chargebacks</span>
					<span
						className={`text-sm font-bold ${
							chargebackCount > 0 ? 'text-[#e23b4a]' : 'text-white'
						}`}
					>
						{chargebackCount}
						{chargebackRate > 0 && (
							<span className="text-xs font-normal text-white/40"> ({chargebackRate.toFixed(1)}%)</span>
						)}
					</span>
				</div>
			</div>
		</div>
	);
}

function QuickActions() {
	const router = useRouter();

	const actionCategories = [
		{
			title: 'Gestão Financeira',
			items: [
				{
					label: 'Solicitar Saque',
					description: 'Transferir saldo para conta PIX',
					icon: RevolutArrowUpRightIcon,
					route: Routes.panel.merchant.cashouts,
					variant: 'default' as const,
				},
				{
					label: 'Contas Bancárias PIX',
					description: 'Gerenciar chaves cadastradas',
					icon: RevolutPixIcon,
					route: Routes.panel.merchant.cashoutAccounts,
					variant: 'default' as const,
				},
				{
					label: 'Extrato Completo',
					description: 'Histórico detalhado de movimentações',
					icon: RevolutStatementIcon,
					route: Routes.panel.merchant.balanceHistory,
					variant: 'default' as const,
				},
			],
		},
		{
			title: 'Vendas & Cobranças',
			items: [
				{
					label: 'Nova Cobrança / Link',
					description: 'Criar checkout instantâneo',
					icon: RevolutPlusIcon,
					route: Routes.panel.merchant.checkoutsUpsert('new'),
					variant: 'primary' as const,
				},
				{
					label: 'Clientes',
					description: 'Base de compradores e contatos',
					icon: RevolutWalletIcon,
					route: Routes.panel.merchant.customers,
					variant: 'default' as const,
				},
				{
					label: 'Cupons de Desconto',
					description: 'Criar promoções e descontos',
					icon: RevolutAnalyticsIcon,
					route: Routes.panel.merchant.coupons,
					variant: 'default' as const,
				},
			],
		},
	];

	return (
		<div className="flex flex-col gap-4 rounded-[24px] border border-white/12 bg-[#16181a] p-6 sm:p-7">
			<div>
				<span className="text-[11px] font-semibold uppercase tracking-widest text-white/60">
					Ações Rápidas
				</span>
				<h2 className="text-base font-bold tracking-tight text-white mt-0.5">
					Operações e Acessos Diretos
				</h2>
			</div>

			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
				{actionCategories.map((cat) => (
					<div key={cat.title} className="flex flex-col gap-2.5">
						<span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
							{cat.title}
						</span>

						<div className="flex flex-col gap-2">
							{cat.items.map((item) => {
								const ItemIcon = item.icon;
								return (
									<button
										key={item.label}
										type="button"
										onClick={() => router.push(item.route)}
										className={`group flex items-center justify-between rounded-[16px] border p-3 text-left transition-all ${
											item.variant === 'primary'
												? 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
												: 'border-white/8 bg-[#0a0a0a] hover:border-white/15 hover:bg-white/[0.03]'
										}`}
									>
										<div className="flex items-center gap-3">
											<div
												className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
													item.variant === 'primary'
														? 'bg-white text-black font-semibold'
														: 'bg-white/5 text-white/80 group-hover:bg-white/10 group-hover:text-white'
												}`}
											>
												<ItemIcon size={18} />
											</div>

											<div className="flex flex-col">
												<span className="text-sm font-semibold text-white group-hover:text-white">
													{item.label}
												</span>
												<span className="text-xs text-white/40">{item.description}</span>
											</div>
										</div>

										<div className="text-white/30 transition-transform group-hover:translate-x-0.5 group-hover:text-white/70">
											<RevolutArrowUpRightIcon size={16} />
										</div>
									</button>
								);
							})}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

export interface MerchantDashboardProps {
	merchantId: string;
}

export function MerchantDashboard({ merchantId }: MerchantDashboardProps) {
	const isMobile = useIsMobile();
	const router = useRouter();
	const { data: hookData, period, actions } = useMerchantDashboard({ merchantId });
	const { isVisible: isBalanceVisible, toggle: toggleBalanceVisibility } = useBalanceVisibility();


	if (hookData.isLoading) {
		return <DashboardSkeleton />;
	}

	if (hookData.error) {
		return (
			<div className="rounded-[20px] border border-[#e23b4a]/30 bg-[#e23b4a]/10 p-5 text-sm">
				<p className="font-semibold text-[#e23b4a]">Erro ao carregar dados do dashboard</p>
				<p className="mt-1 text-white/60">{hookData.error}</p>
				<button
					type="button"
					onClick={actions.refresh}
					className="button-outline-dark mt-3 text-xs"
				>
					Tentar Novamente
				</button>
			</div>
		);
	}

	if (!hookData.dashboard) {
		return (
			<div className="rounded-[20px] border border-[#ec7e00]/30 bg-[#ec7e00]/10 p-5 text-sm">
				<p className="font-semibold text-[#ec7e00]">Dados não disponíveis</p>
				<p className="mt-1 text-white/60">Não foi possível carregar os dados do dashboard.</p>
				<button
					type="button"
					onClick={actions.refresh}
					className="button-outline-dark mt-3 text-xs"
				>
					Atualizar
				</button>
			</div>
		);
	}

	if (isMobile) {
		return (
			<MobileMerchantDashboard
				merchantId={merchantId}
				onOpenLiveScreen={() => router.push(Routes.panel.merchant.liveBalance)}
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
			onToggleBalanceVisibility={toggleBalanceVisibility}
			hasReserveEnabled={hookData.hasReserveEnabled}
			reserveConfig={hookData.reserveConfig}
		/>
	);
}
