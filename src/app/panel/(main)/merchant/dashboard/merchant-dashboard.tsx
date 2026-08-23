'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useMerchantDashboard } from '@/hooks/use-merchant-dashboard';
import { useBalanceVisibility } from '@/hooks/use-balance-visibility';
import type { ReadMerchantDashboardData, DashboardPeriod } from '@/types/merchant/dashboard';
import { formatRelativeTime } from '@/utils/datetime';
import { DashboardSkeleton } from './DashboardSkeleton';
import { MobileMerchantDashboard } from '@/components/panel/mobile-merchant-dashboard';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { RevolutHeroBalanceCard, type MerchantReserveConfig } from './components/RevolutHeroBalanceCard';
import { RevolutPeriodSelector } from './components/RevolutPeriodSelector';
import { RevolutFinancialMetricsGrid } from './components/RevolutFinancialMetricsGrid';
import { RevolutAnalyticsChart } from './components/RevolutAnalyticsChart';
import { PaymentMethodBreakdown } from './components/PaymentMethodBreakdown';
import { RiskDisputesControl } from './components/RiskDisputesControl';
import { Routes } from '@/router/routes';
import {
	RevolutWalletIcon,
	RevolutPlusIcon,
	RevolutArrowUpRightIcon,
	RevolutStatementIcon,
	RevolutPixIcon,
	RevolutInfoIcon,
	RevolutAnalyticsIcon,
} from '@/components/ui/revolut-icons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
	const kpis = dashboard?.kpis;
	const balance = dashboard?.balance;
	const cacheInfo = dashboard?.cacheInfo;
	const periodInfo = dashboard?.periodInfo;

	const isHourlyGranularity = periodInfo
		? new Date(periodInfo.endDate).getTime() - new Date(periodInfo.startDate).getTime() <= 2 * 86400000
		: false;

	return (
		<div className="flex flex-col gap-6 text-white">
			{/* Executive Toolbar */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
				<div>
					<h1 className="text-xl font-bold tracking-tight text-white">Visão Geral</h1>
					<p className="text-xs text-white/50 mt-0.5">
						Métricas de faturamento, liquidação de caixa e eficiência de pagamentos
					</p>
				</div>

				<RevolutPeriodSelector
					selectedPeriod={selectedPeriod}
					onPeriodChange={onPeriodChange}
					onRefresh={onRefresh}
					isRefreshing={isRefreshing}
				/>
			</div>

			{/* Hero Balance Card */}
			<RevolutHeroBalanceCard
				balance={balance}
				isBalanceVisible={isBalanceVisible}
				onToggleBalanceVisibility={onToggleBalanceVisibility}
				hasReserveEnabled={hasReserveEnabled}
				reserveConfig={reserveConfig}
			/>

			{/* High-Contrast Financial Metrics 3-Card Grid */}
			<RevolutFinancialMetricsGrid kpis={kpis} isBalanceVisible={isBalanceVisible} />

			{/* Bespoke Analytics & Core Operations Grid */}
			<div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
				{/* Main Chart + Payment Breakdown Column (2 cols) */}
				<div className="lg:col-span-2 flex flex-col gap-5">
					<RevolutAnalyticsChart
						weeklyData={dashboard?.weeklyChart}
						dailyData={dashboard?.volumeChart}
						isHourlyGranularity={isHourlyGranularity}
						isProcessing={cacheInfo?.isProcessing}
					/>
					<PaymentMethodBreakdown kpis={kpis} isBalanceVisible={isBalanceVisible} />
				</div>

				{/* Risk & Loss Prevention Column (1 col) */}
				<div className="lg:col-span-1 flex flex-col gap-5">
					<RiskDisputesControl kpis={kpis} isBalanceVisible={isBalanceVisible} />
					<QuickActions />
				</div>
			</div>

			{/* Footer Status Bar */}
			<div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-white/50 font-mono">
				<div className="flex items-center gap-3">
					{cacheInfo?.isProcessing && (
						<div className="flex items-center gap-1.5 text-link">
							<div className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-link border-t-transparent" />
							<span>Sincronizando métricas...</span>
						</div>
					)}
					{cacheInfo?.lastUpdatedAt && (
						<div className="flex items-center gap-1.5">
							<span>Atualizado {formatRelativeTime(cacheInfo.lastUpdatedAt)}</span>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger className="cursor-help text-white/40 hover:text-white/70 inline-flex items-center">
										<RevolutInfoIcon size={12} />
									</TooltipTrigger>
									<TooltipContent side="top" className="max-w-72 border-white/12 bg-surface-deep text-xs text-whitexl">
										<p className="font-semibold text-white/90">Ciclo de Liquidação:</p>
										<p className="mt-1 text-white/70">
											Saldo disponível atualizado em tempo real (PIX D+0). Gráficos e indicadores operacionais consolidados a cada{' '}
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
						className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-link' : ''}`}
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
		<div className="flex flex-col gap-5 rounded-[20px] border border-white/12 bg-card p-6 sm:p-7">
			<div>
				<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
					Ações Rápidas
				</span>
				<h3 className="text-base font-bold tracking-tight text-white mt-0.5">
					Operações e Acessos Diretos
				</h3>
			</div>

			<div className="flex flex-col gap-5">
				{actionCategories.map((cat) => (
					<div key={cat.title} className="flex flex-col gap-2.5">
						<span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
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
												: 'border-white/8 bg-surface-deep hover:border-white/15 hover:bg-white/[0.03]'
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
			<div className="rounded-[20px] border border-danger/30 bg-danger/10 p-5 text-sm">
				<p className="font-semibold text-danger">Erro ao carregar dados do dashboard</p>
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
			<div className="rounded-[20px] border border-warning/30 bg-warning/10 p-5 text-sm">
				<p className="font-semibold text-warning">Dados não disponíveis</p>
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
