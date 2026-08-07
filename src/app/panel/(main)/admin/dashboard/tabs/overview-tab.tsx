'use client';

import { Card, Tooltip } from '@heroui/react';
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
		<div className="flex flex-col gap-3">
			<FinancialOverviewCards financial={financial} growth={growth} selectedPeriod={selectedPeriod} />
			<div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
				<div className="lg:col-span-2">
					<OperationalAlerts financial={financial} growth={growth} />
				</div>
				<div className="lg:col-span-1">
					<Card className="border border-border/80 bg-card">
						<Card.Content className="p-3">
							<ApprovalHealthBar financial={financial} />
						</Card.Content>
					</Card>
				</div>
			</div>
			<div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
				<div className="lg:col-span-2">
					<FinancialSecondaryCards financial={financial} growth={growth} />
				</div>
				<div className="lg:col-span-1 flex flex-col gap-3">
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
		<Card className="border border-border/80 bg-card">
			<Card.Content className="p-3">
				<div className="flex flex-col gap-2">
					<span className="text-xs font-mono font-medium uppercase tracking-wider text-muted-foreground">Ações Rápidas</span>
					<div className="flex flex-col gap-1.5">
						<button
							type="button"
							onClick={() => router.push(Routes.panel.admin.users)}
							className="flex items-center gap-2 rounded-md border border-border/80 bg-card px-2.5 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:text-foreground hover:bg-surface"
						>
							<Icon icon={UserAdd01Icon} className="icon-xs shrink-0" />
							<span>Revisar cadastros pendentes</span>
						</button>
						<button
							type="button"
							onClick={() => router.push(Routes.panel.admin.merchants)}
							className="flex items-center gap-2 rounded-md border border-border/80 bg-card px-2.5 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:text-foreground hover:bg-surface"
						>
							<Icon icon={Settings01Icon} className="icon-xs shrink-0" />
							<span>Aprovar novas organizações</span>
						</button>
					</div>
				</div>
			</Card.Content>
		</Card>
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
	const pendingTone = pendingKyc > 0 ? 'text-warning' : 'text-success';

	return (
		<Card className="border border-border/80 bg-card">
			<Card.Content className="p-3">
				<div className="flex flex-col gap-2">
					<span className="text-xs font-mono font-medium uppercase tracking-wider text-muted-foreground">Contexto Operacional</span>
					<div className="flex flex-col gap-1.5 text-xs">
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">Usuários totais</span>
							<span className="font-mono font-medium text-foreground">{users.totalUsers.toLocaleString('pt-BR')}</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">Organizações</span>
							<span className="font-mono font-medium text-foreground">{merchants.totalMerchants.toLocaleString('pt-BR')}</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">KYC pendente</span>
							<span className={`font-mono font-medium ${pendingTone}`}>{pendingText}</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">Cadastros</span>
							<GrowthIndicator growth={growth.registrationsGrowth} comparisonLabel={growth.growthComparisonLabel} />
						</div>
					</div>
				</div>
			</Card.Content>
		</Card>
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
			color: 'text-foreground',
		},
		{
			label: 'Receita Bruta',
			value: periodData.fees,
			growth: totalFeesGrowth,
			meta: periodData.volume > 0 ? `${((periodData.fees / periodData.volume) * 100).toFixed(2)}% do volume` : undefined,
			color: 'text-foreground',
		},
		{
			label: 'Custo Adquirentes',
			value: periodData.acquirerFees,
			growth: totalAcquirerFeesGrowth,
			meta: periodData.volume > 0 ? `${((periodData.acquirerFees / periodData.volume) * 100).toFixed(2)}% do volume` : undefined,
			invert: true,
			color: 'text-foreground',
		},
		{
			label: 'Resultado Líquido',
			value: periodData.netRevenue,
			growth: netRevenueGrowth,
			meta: `${marginPercent.toFixed(2)}% margem`,
			color: 'text-emerald-400',
		},
	];

	return (
		<div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
			{kpis.map((item) => (
				<Card key={item.label} className="border border-border/80 bg-card hover:border-border transition-colors">
					<Card.Content className="flex flex-col gap-1.5 p-3">
						<span className="text-xs font-medium tracking-wide uppercase text-muted-foreground">{item.label}</span>
						<AnimatedCurrency value={item.value} className={`text-lg font-bold font-mono tracking-tight ${item.color}`} />
						<div className="flex items-center justify-between text-xs">
							<GrowthIndicator growth={item.growth} comparisonLabel={growth.growthComparisonLabel} invertColors={item.invert} />
							{item.meta && <span className="font-mono text-muted-foreground">{item.meta}</span>}
						</div>
					</Card.Content>
				</Card>
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
		success: 'border-success/20 bg-success/5 text-success',
		warning: 'border-warning/20 bg-warning/5 text-warning',
		danger: 'border-danger/20 bg-danger/5 text-danger',
	};

	return (
		<div className="flex flex-col gap-1.5">
			<span className="text-xs font-mono font-medium uppercase tracking-wider text-muted-foreground">Alertas Operacionais</span>
			<div className="flex flex-col gap-1">
				{alerts.map((alert) => (
					<div key={alert.label} className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium ${toneStyles[alert.tone]}`}>
						<span className="truncate">{alert.label}</span>
					</div>
				))}
			</div>
		</div>
	);
}

function ApprovalHealthBar({ financial }: { financial: AdminFinancialKpis }) {
	const approvalRate = financial.totalTransactions > 0 ? (financial.completedTransactions / financial.totalTransactions) * 100 : 0;
	const declineCount = financial.totalTransactions - financial.completedTransactions;
	const isHealthy = approvalRate >= 85;

	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex items-center justify-between">
				<span className="text-xs font-mono uppercase text-muted-foreground font-medium">Saúde de Pagamentos</span>
				<span className={`text-xs font-mono font-semibold ${isHealthy ? 'text-success' : 'text-warning'}`}>
					{approvalRate.toFixed(1)}%
				</span>
			</div>
			<div className="h-1.5 w-full rounded-full bg-surface">
				<div
					className={`h-full rounded-full transition-all ${isHealthy ? 'bg-success' : 'bg-warning'}`}
					style={{ width: `${Math.min(approvalRate, 100)}%` }}
				/>
			</div>
			<div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
				<span>{financial.completedTransactions.toLocaleString('pt-BR')} aprovadas</span>
				<span>{declineCount.toLocaleString('pt-BR')} recusadas/pendentes</span>
			</div>
		</div>
	);
}

function FinancialSecondaryCards({ financial, growth }: { financial: AdminFinancialKpis; growth: AdminDashboardGrowthKpis }) {
	const ticketMedio = financial.completedTransactions > 0 ? financial.totalVolume / financial.completedTransactions : 0;

	return (
		<div className="grid grid-cols-2 gap-2">
			<div className="flex flex-col gap-1.5 rounded-lg border border-border/80 bg-card p-3">
				<div className="flex items-center justify-between">
					<span className="text-xs font-mono uppercase text-muted-foreground font-medium">Ticket Médio</span>
					<Tooltip>
						<Tooltip.Trigger>
							<Icon icon={HelpCircleIcon} className="icon-xxs cursor-help text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
						</Tooltip.Trigger>
						<Tooltip.Content className="max-w-72">
							<Tooltip.Arrow />
							<span className="font-medium">Ticket Médio por Transação</span>
							<br />
							<span className="text-xs">
								Valor médio das transações aprovadas. Calculado dividindo o TPV pelo número de transações.
							</span>
						</Tooltip.Content>
					</Tooltip>
				</div>
				<AnimatedCurrency value={ticketMedio} className="text-base font-bold font-mono tracking-tight text-foreground" />
				<GrowthIndicator growth={growth.netMarginGrowth} comparisonLabel={growth.growthComparisonLabel} />
			</div>

			<div className="flex flex-col gap-1.5 rounded-lg border border-border/80 bg-card p-3">
				<div className="flex items-center justify-between">
					<span className="text-xs font-mono uppercase text-muted-foreground font-medium">Volume Sacado</span>
					<Tooltip>
						<Tooltip.Trigger>
							<Icon icon={HelpCircleIcon} className="icon-xxs cursor-help text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
						</Tooltip.Trigger>
						<Tooltip.Content className="max-w-72">
							<Tooltip.Arrow />
							<span className="font-medium">Total de Saques (Payouts)</span>
							<br />
							<span className="text-xs">
								Soma de todos os saques processados e enviados para as organizações.
							</span>
						</Tooltip.Content>
					</Tooltip>
				</div>
				<AnimatedCurrency value={financial.totalPayoutAmount} className="text-base font-bold font-mono tracking-tight text-foreground" />
				<GrowthIndicator growth={growth.payoutAmountGrowth} comparisonLabel={growth.growthComparisonLabel} />
				<span className="text-xs font-mono text-muted-foreground">{financial.totalPayouts.toLocaleString('pt-BR')} saques</span>
			</div>

			<div className="flex flex-col gap-1.5 rounded-lg border border-border/80 bg-card p-3">
				<span className="text-xs font-mono uppercase text-muted-foreground font-medium">Taxa de Aprovação</span>
				<AnimatedNumber
					value={financial.totalTransactions > 0 ? (financial.completedTransactions / financial.totalTransactions) * 100 : 0}
					maximumFractionDigits={1}
					minimumFractionDigits={1}
					suffix="%"
					className="text-base font-bold font-mono tracking-tight text-foreground"
				/>
				<GrowthIndicator growth={growth.approvalRateGrowth} comparisonLabel={growth.growthComparisonLabel} />
				<span className="text-xs font-mono text-muted-foreground">
					{financial.completedTransactions.toLocaleString('pt-BR')} de {financial.totalTransactions.toLocaleString('pt-BR')}
				</span>
			</div>

			<div className="flex flex-col gap-1.5 rounded-lg border border-border/80 bg-card p-3">
				<span className="text-xs font-mono uppercase text-muted-foreground font-medium">Transações com Falha</span>
				<div className="flex items-baseline justify-between">
					<span className="text-base font-bold font-mono tracking-tight text-foreground">{financial.failedTransactions.toLocaleString('pt-BR')}</span>
					<GrowthIndicator growth={growth.failedRateGrowth} comparisonLabel={growth.growthComparisonLabel} invertColors />
				</div>
				<span className="text-xs font-mono text-muted-foreground">
					<AnimatedNumber
						value={financial.totalTransactions > 0 ? (financial.failedTransactions / financial.totalTransactions) * 100 : 0}
						maximumFractionDigits={1}
						minimumFractionDigits={1}
						suffix="% do total"
					/>
				</span>
			</div>
		</div>
	);
}

function FinancialPeriodCards({ financial }: { financial: AdminFinancialKpis }) {
	return (
		<div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
			{[
				{ title: 'Hoje', volume: financial.volumeToday, fees: financial.feesToday, acquirer: financial.acquirerFeesToday, net: financial.netRevenueToday },
				{ title: 'Esta Semana', volume: financial.volumeThisWeek, fees: financial.feesThisWeek, acquirer: financial.acquirerFeesThisWeek, net: financial.netRevenueThisWeek },
				{ title: 'Este Mês', volume: financial.volumeThisMonth, fees: financial.feesThisMonth, acquirer: financial.acquirerFeesThisMonth, net: financial.netRevenueThisMonth },
			].map((period) => (
				<Card key={period.title}>
					<Card.Content className="p-3">
						<div className="flex items-center justify-between">
							<span className="text-xs font-medium text-muted-foreground">{period.title}</span>
							<Tooltip>
								<Tooltip.Trigger>
									<Icon icon={HelpCircleIcon} className="icon-xxs cursor-help text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
								</Tooltip.Trigger>
								<Tooltip.Content className="max-w-64">
									<Tooltip.Arrow />
									<span className="text-xs">Métricas financeiras de {period.title.toLowerCase()}</span>
								</Tooltip.Content>
							</Tooltip>
						</div>
						<div className="mt-2 flex flex-col gap-1.5 text-xs">
							<div className="flex items-center justify-between">
								<span className="text-muted">Volume</span>
								<AnimatedCurrency value={period.volume} className="font-mono font-medium" />
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted">Receita Bruta</span>
								<AnimatedCurrency value={period.fees} className="font-mono font-medium text-success" />
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted">Custo Adquirentes</span>
								<AnimatedCurrency value={period.acquirer} className="font-mono font-medium text-danger" />
							</div>
							<div className="flex items-center justify-between border-t border-border/60 pt-1.5">
								<span className="font-medium text-emerald-400">Resultado Líquido</span>
								<AnimatedCurrency value={period.net} className="font-mono font-bold text-emerald-400" />
							</div>
						</div>
					</Card.Content>
				</Card>
			))}
		</div>
	);
}
