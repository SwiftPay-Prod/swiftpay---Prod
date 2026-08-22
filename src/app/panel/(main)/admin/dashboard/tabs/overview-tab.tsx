'use client';

import { Tooltip } from '@heroui/react';
import {
	Analytics02Icon,
	Wallet01Icon,
	Wallet03Icon,
	BankIcon,
	AnalyticsUpIcon,
	ArrowDataTransferHorizontalIcon,
	CheckmarkCircle02Icon,
	CancelCircleIcon,
	HelpCircleIcon,
	UserGroupIcon,
	Building02Icon,
	Time02Icon,
	Settings01Icon,
	UserAdd01Icon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { RevolutStatusBadge } from '@/components/ui/revolut-status-badge';
import {
	RevolutWalletIcon,
	RevolutCheckIcon,
	RevolutTrendingUpIcon,
} from '@/components/ui/revolut-icons';
import type {
	AdminDashboardGrowthKpis,
	AdminDashboardPeriod,
	AdminFinancialKpis,
	AdminMerchantKpis,
	AdminUserKpis,
} from '@/types/admin/dashboard';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { GrowthIndicator } from '../components/growth-indicator';
import { useRouter } from 'next/navigation';
import { Routes } from '@/router/routes';

function getFinancialForPeriod(financial: AdminFinancialKpis, period: AdminDashboardPeriod) {
	switch (period) {
		case 'today':
			return {
				volume: financial.volumeToday,
				fees: financial.feesToday,
				acquirerFees: financial.acquirerFeesToday,
				netRevenue: financial.netRevenueToday,
			};
		case 'this_week':
			return {
				volume: financial.volumeThisWeek,
				fees: financial.feesThisWeek,
				acquirerFees: financial.acquirerFeesThisWeek,
				netRevenue: financial.netRevenueThisWeek,
			};
		case 'this_month':
			return {
				volume: financial.volumeThisMonth,
				fees: financial.feesThisMonth,
				acquirerFees: financial.acquirerFeesThisMonth,
				netRevenue: financial.netRevenueThisMonth,
			};
		default:
			return {
				volume: financial.totalVolume,
				fees: financial.totalFees,
				acquirerFees: financial.totalAcquirerFees,
				netRevenue: financial.totalNetRevenue,
			};
	}
}

export function OverviewTab({
	financial,
	growth,
	selectedPeriod,
	users,
	merchants,
}: {
	financial: AdminFinancialKpis;
	growth: AdminDashboardGrowthKpis;
	selectedPeriod: AdminDashboardPeriod;
	users?: AdminUserKpis;
	merchants?: AdminMerchantKpis;
}) {
	return (
		<div className="flex flex-col gap-6">
			<FinancialOverviewCards financial={financial} growth={growth} selectedPeriod={selectedPeriod} />
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<div className="lg:col-span-2">
					<OperationalAlerts financial={financial} growth={growth} />
				</div>
				<div className="lg:col-span-1">
					<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5">
						<ApprovalHealthBar financial={financial} />
					</div>
				</div>
			</div>
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<div className="lg:col-span-2">
					<FinancialSecondaryCards financial={financial} growth={growth} />
				</div>
				<div className="lg:col-span-1 flex flex-col gap-4">
					{selectedPeriod === 'all' && <FinancialPeriodCards financial={financial} />}
					<OperationalContextCard users={users} merchants={merchants} growth={growth} />
				</div>
			</div>
		</div>
	);
}

function QuickActions() {
	const router = useRouter();

	return (
		<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5">
			<div className="flex flex-col gap-3">
				<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Ações Rápidas</span>
				<div className="flex flex-col gap-2">
					<button
						type="button"
						onClick={() => router.push(Routes.panel.admin.users)}
						className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-left text-xs text-white/70 transition-colors hover:text-white hover:border-white/20 hover:bg-white/10"
					>
						<Icon icon={UserAdd01Icon} className="icon-xs shrink-0" />
						<span>Revisar cadastros pendentes</span>
					</button>
					<button
						type="button"
						onClick={() => router.push(Routes.panel.admin.merchants)}
						className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-left text-xs text-white/70 transition-colors hover:text-white hover:border-white/20 hover:bg-white/10"
					>
						<Icon icon={Settings01Icon} className="icon-xs shrink-0" />
						<span>Aprovar novas organizações</span>
					</button>
				</div>
			</div>
		</div>
	);
}

function OperationalContextCard({
	users,
	merchants,
	growth,
}: {
	users?: AdminUserKpis;
	merchants?: AdminMerchantKpis;
	growth: AdminDashboardGrowthKpis;
}) {
	if (!users || !merchants) return null;

	const pendingKyc = merchants.pendingKycMerchants;
	const pendingText = pendingKyc > 0 ? `${pendingKyc.toLocaleString('pt-BR')} organizações aguardando KYC` : 'Sem KYC pendente';
	const pendingTone = pendingKyc > 0 ? 'text-[#ec7e00]' : 'text-[#00a87e]';

	return (
		<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5">
			<div className="flex flex-col gap-3">
				<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Contexto Operacional</span>
				<div className="flex flex-col gap-2 text-xs">
					<div className="flex items-center justify-between">
						<span className="text-white/50">Usuários totais</span>
						<span className="font-mono font-medium text-white">{users.totalUsers.toLocaleString('pt-BR')}</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-white/50">Organizações</span>
						<span className="font-mono font-medium text-white">{merchants.totalMerchants.toLocaleString('pt-BR')}</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-white/50">KYC pendente</span>
						<span className={`font-mono font-medium ${pendingTone}`}>{pendingText}</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-white/50">Cadastros</span>
						<GrowthIndicator growth={growth.registrationsGrowth} comparisonLabel={growth.growthComparisonLabel} />
					</div>
				</div>
			</div>
		</div>
	);
}

function FinancialOverviewCards({
	financial,
	growth,
	selectedPeriod,
}: {
	financial: AdminFinancialKpis;
	growth: AdminDashboardGrowthKpis;
	selectedPeriod: AdminDashboardPeriod;
}) {
	const periodData = getFinancialForPeriod(financial, selectedPeriod);
	const marginPercent = periodData.volume > 0 ? (periodData.netRevenue / periodData.volume) * 100 : 0;

	const volumeGrowth = growth.volumeGrowth ?? 0;
	const totalFeesGrowth = growth.totalFeesGrowth ?? 0;
	const totalAcquirerFeesGrowth = growth.totalAcquirerFeesGrowth ?? 0;
	const netRevenueGrowth = growth.netRevenueGrowth ?? 0;

	const kpis = [
		{
			label: 'TPV',
			value: periodData.volume,
			growth: volumeGrowth,
			meta: selectedPeriod === 'all' ? `${financial.completedTransactions.toLocaleString('pt-BR')} transações` : undefined,
			color: 'text-white',
			icon: <RevolutTrendingUpIcon size={16} />,
		},
		{
			label: 'Receita Bruta',
			value: periodData.fees,
			growth: totalFeesGrowth,
			meta: periodData.volume > 0 ? `${((periodData.fees / periodData.volume) * 100).toFixed(2)}% do volume` : undefined,
			color: 'text-white',
			icon: <RevolutWalletIcon size={16} />,
		},
		{
			label: 'Custo Adquirentes',
			value: periodData.acquirerFees,
			growth: totalAcquirerFeesGrowth,
			meta: periodData.volume > 0 ? `${((periodData.acquirerFees / periodData.volume) * 100).toFixed(2)}% do volume` : undefined,
			invert: true,
			color: 'text-white',
			icon: <Icon icon={Wallet01Icon} className="icon-xs" />,
		},
		{
			label: 'Resultado Líquido',
			value: periodData.netRevenue,
			growth: netRevenueGrowth,
			meta: `${marginPercent.toFixed(2)}% margem`,
			color: 'text-[#00a87e]',
			icon: <RevolutCheckIcon size={16} />,
		},
	];

	return (
		<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
			{kpis.map((item) => (
				<div key={item.label} className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">{item.label}</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
							{item.icon}
						</div>
					</div>
					<div>
						<AnimatedCurrency value={item.value} className={`text-2xl font-extrabold font-mono tracking-tight tabular-nums ${item.color}`} />
						<div className="flex items-center justify-between text-xs">
							<GrowthIndicator growth={item.growth} comparisonLabel={growth.growthComparisonLabel} invertColors={item.invert} />
							{item.meta && <span className="font-mono text-white/40">{item.meta}</span>}
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

function buildOverviewAlerts(financial: AdminFinancialKpis, growth: AdminDashboardGrowthKpis) {
	const approvalRate = financial.totalTransactions > 0 ? (financial.completedTransactions / financial.totalTransactions) * 100 : 0;
	const feeMargin = financial.totalVolume > 0 ? ((financial.totalFees - financial.totalAcquirerFees) / financial.totalVolume) * 100 : 0;
	const declineCount = financial.totalTransactions - financial.completedTransactions;
	const volumeGrowth = growth.volumeGrowth ?? 0;

	const alerts = [
		volumeGrowth > 0
			? { tone: 'success', label: `Aprovação em alta: +${volumeGrowth.toFixed(1)}% vs período anterior` }
			: volumeGrowth < 0
				? { tone: 'danger', label: `Aprovação em queda: ${volumeGrowth.toFixed(1)}% vs período anterior` }
				: null,
		financial.failedTransactions > 50 ? { tone: 'danger', label: `${financial.failedTransactions.toLocaleString('pt-BR')} transações com falha exigem atenção` } : null,
		declineCount > 0 ? { tone: 'warning', label: `${declineCount.toLocaleString('pt-BR')} pagamentos recusados no período` } : null,
		feeMargin < 2 ? { tone: 'warning', label: `Margem de taxa apertada: ${feeMargin.toFixed(1)}% do volume` } : null,
	].filter(Boolean) as Array<{ tone: 'success' | 'danger' | 'warning'; label: string }>;

	return alerts.slice(0, 3);
}

function OperationalAlerts({ financial, growth }: { financial: AdminFinancialKpis; growth: AdminDashboardGrowthKpis }) {
	const alerts = buildOverviewAlerts(financial, growth);
	if (alerts.length === 0) return null;

	const toneStyles: Record<string, string> = {
		success: 'border-[#00a87e]/20 bg-[#00a87e]/10 text-[#00a87e]',
		warning: 'border-[#ec7e00]/20 bg-[#ec7e00]/10 text-[#ec7e00]',
		danger: 'border-[#e23b4a]/20 bg-[#e23b4a]/10 text-[#e23b4a]',
	};

	return (
		<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5">
			<div className="flex flex-col gap-3">
				<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Alertas Operacionais</span>
				<div className="flex flex-col gap-2">
					{alerts.map((alert) => (
						<div key={alert.label} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${toneStyles[alert.tone]}`}>
							<span className="truncate">{alert.label}</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

function ApprovalHealthBar({ financial }: { financial: AdminFinancialKpis }) {
	const approvalRate = financial.totalTransactions > 0 ? (financial.completedTransactions / financial.totalTransactions) * 100 : 0;
	const declineCount = financial.totalTransactions - financial.completedTransactions;
	const isHealthy = approvalRate >= 85;

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between">
				<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Saúde de Pagamentos</span>
				<span className={`text-xs font-mono font-semibold ${isHealthy ? 'text-[#00a87e]' : 'text-[#ec7e00]'}`}>
					{approvalRate.toFixed(1)}%
				</span>
			</div>
			<div className="h-1.5 w-full rounded-full bg-[#0a0a0a]">
				<div
					className={`h-full rounded-full transition-all ${isHealthy ? 'bg-[#00a87e]' : 'text-[#ec7e00]'}`}
					style={{ width: `${Math.min(approvalRate, 100)}%` }}
				/>
			</div>
			<div className="flex items-center justify-between text-xs font-mono text-white/50">
				<span>{financial.completedTransactions.toLocaleString('pt-BR')} aprovadas</span>
				<span>{declineCount.toLocaleString('pt-BR')} recusadas/pendentes</span>
			</div>
		</div>
	);
}

function FinancialSecondaryCards({ financial, growth }: { financial: AdminFinancialKpis; growth: AdminDashboardGrowthKpis }) {
	const ticketMedio = financial.completedTransactions > 0 ? financial.totalVolume / financial.completedTransactions : 0;

	return (
		<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5">
			<div className="grid grid-cols-2 gap-3">
				<div className="flex flex-col gap-2">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Ticket Médio</span>
						<Tooltip>
							<Tooltip.Trigger>
								<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-white/50 hover:text-white/80 transition-colors" />
							</Tooltip.Trigger>
							<Tooltip.Content className="max-w-72 bg-[#16181a] border border-white/12 text-white">
								<Tooltip.Arrow className="fill-[#16181a] stroke-white/12" />
								<span className="font-medium">Ticket Médio por Transação</span>
								<br />
								<span className="text-xs">
									Valor médio das transações aprovadas. Calculado dividindo o TPV pelo número de transações.
								</span>
							</Tooltip.Content>
						</Tooltip>
					</div>
					<AnimatedCurrency value={ticketMedio} className="text-base font-bold font-mono tracking-tight text-white tabular-nums" />
					<GrowthIndicator growth={growth.netMarginGrowth} comparisonLabel={growth.growthComparisonLabel} />
				</div>

				<div className="flex flex-col gap-2">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Volume Sacado</span>
						<Tooltip>
							<Tooltip.Trigger>
								<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-white/50 hover:text-white/80 transition-colors" />
							</Tooltip.Trigger>
							<Tooltip.Content className="max-w-72 bg-[#16181a] border border-white/12 text-white">
								<Tooltip.Arrow className="fill-[#16181a] stroke-white/12" />
								<span className="font-medium">Total de Saques (Payouts)</span>
								<br />
								<span className="text-xs">
									Soma de todos os saques processados e enviados para as organizações.
								</span>
							</Tooltip.Content>
						</Tooltip>
					</div>
					<AnimatedCurrency value={financial.totalPayoutAmount} className="text-base font-bold font-mono tracking-tight text-white tabular-nums" />
					<GrowthIndicator growth={growth.payoutAmountGrowth} comparisonLabel={growth.growthComparisonLabel} />
					<span className="text-xs font-mono text-white/40">{financial.totalPayouts.toLocaleString('pt-BR')} saques</span>
				</div>

				<div className="flex flex-col gap-2">
					<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Taxa de Aprovação</span>
					<AnimatedNumber
						value={financial.totalTransactions > 0 ? (financial.completedTransactions / financial.totalTransactions) * 100 : 0}
						maximumFractionDigits={1}
						minimumFractionDigits={1}
						suffix="%"
						className="text-base font-bold font-mono tracking-tight text-white tabular-nums"
					/>
					<GrowthIndicator growth={growth.approvalRateGrowth} comparisonLabel={growth.growthComparisonLabel} />
					<span className="text-xs font-mono text-white/40">
						{financial.completedTransactions.toLocaleString('pt-BR')} de {financial.totalTransactions.toLocaleString('pt-BR')}
					</span>
				</div>

				<div className="flex flex-col gap-2">
					<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Transações com Falha</span>
					<div className="flex items-baseline justify-between">
						<span className="text-base font-bold font-mono tracking-tight text-white tabular-nums">{financial.failedTransactions.toLocaleString('pt-BR')}</span>
						<GrowthIndicator growth={growth.failedRateGrowth} comparisonLabel={growth.growthComparisonLabel} invertColors />
					</div>
					<span className="text-xs font-mono text-white/40">
						<AnimatedNumber
							value={financial.totalTransactions > 0 ? (financial.failedTransactions / financial.totalTransactions) * 100 : 0}
							maximumFractionDigits={1}
							minimumFractionDigits={1}
							suffix="% do total"
						/>
					</span>
				</div>
			</div>
		</div>
	);
}

function FinancialPeriodCards({ financial }: { financial: AdminFinancialKpis }) {
	return (
		<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
			{[
				{ title: 'Hoje', volume: financial.volumeToday, fees: financial.feesToday, acquirer: financial.acquirerFeesToday, net: financial.netRevenueToday },
				{ title: 'Esta Semana', volume: financial.volumeThisWeek, fees: financial.feesThisWeek, acquirer: financial.acquirerFeesThisWeek, net: financial.netRevenueThisWeek },
				{ title: 'Este Mês', volume: financial.volumeThisMonth, fees: financial.feesThisMonth, acquirer: financial.acquirerFeesThisMonth, net: financial.netRevenueThisMonth },
			].map((period) => (
				<div key={period.title} className="rounded-[20px] border border-white/12 bg-[#16181a] p-5">
					<div className="flex items-center justify-between">
						<span className="text-xs font-semibold uppercase tracking-widest text-white/70">{period.title}</span>
						<Tooltip>
							<Tooltip.Trigger>
								<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-white/50 hover:text-white/80 transition-colors" />
							</Tooltip.Trigger>
							<Tooltip.Content className="max-w-64 bg-[#16181a] border border-white/12 text-white">
								<Tooltip.Arrow className="fill-[#16181a] stroke-white/12" />
								<span className="text-xs">Métricas financeiras de {period.title.toLowerCase()}</span>
							</Tooltip.Content>
						</Tooltip>
					</div>
					<div className="mt-3 flex flex-col gap-2 text-xs">
						<div className="flex items-center justify-between">
							<span className="text-white/50">Volume</span>
							<AnimatedCurrency value={period.volume} className="font-mono font-medium text-white tabular-nums" />
						</div>
						<div className="flex items-center justify-between">
							<span className="text-white/50">Receita Bruta</span>
							<AnimatedCurrency value={period.fees} className="font-mono font-medium text-[#00a87e] tabular-nums" />
						</div>
						<div className="flex items-center justify-between">
							<span className="text-white/50">Custo Adquirentes</span>
							<AnimatedCurrency value={period.acquirer} className="font-mono font-medium text-[#e23b4a] tabular-nums" />
						</div>
						<div className="flex items-center justify-between border-t border-white/12 pt-2">
							<span className="font-semibold text-[#00a87e]">Resultado Líquido</span>
							<AnimatedCurrency value={period.net} className="font-mono font-bold text-[#00a87e] tabular-nums" />
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
