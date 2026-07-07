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
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import type { AdminDashboardGrowthKpis, AdminDashboardPeriod, AdminFinancialKpis } from '@/types/admin/dashboard';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { GrowthIndicator } from '../components/growth-indicator';

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
}: {
	financial: AdminFinancialKpis;
	growth: AdminDashboardGrowthKpis;
	selectedPeriod: AdminDashboardPeriod;
}) {
	return (
		<div className="flex flex-col gap-4">
			<FinancialOverviewCards financial={financial} growth={growth} selectedPeriod={selectedPeriod} />
			<FinancialSecondaryCards financial={financial} growth={growth} />
			{selectedPeriod === 'all' && <FinancialPeriodCards financial={financial} />}
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

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<Card className="bg-linear-to-br from-accent/10 to-accent/5">
				<Card.Content className="flex flex-col gap-2 p-4">
					<div className="flex items-center gap-2 text-accent">
						<Icon icon={Wallet01Icon} className="icon-md" />
						<span className="text-sm font-medium">TPV</span>
						<Tooltip>
							<Tooltip.Trigger>
								<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
							</Tooltip.Trigger>
							<Tooltip.Content className="max-w-72">
								<Tooltip.Arrow />
								<span className="font-medium">TPV, Total Payment Volume</span>
								<br />
								<span className="text-xs">
									Soma de todos os pagamentos aprovados e processados com sucesso na plataforma.
								</span>
							</Tooltip.Content>
						</Tooltip>
					</div>
				<AnimatedCurrency value={periodData.volume} className="text-2xl font-bold" />
				<GrowthIndicator growth={growth.volumeGrowth} comparisonLabel={growth.growthComparisonLabel} />
				{selectedPeriod === 'all' && (
					<span className="text-xs text-muted">
						{financial.completedTransactions.toLocaleString('pt-BR')} transações
					</span>
				)}
				</Card.Content>
			</Card>

			<Card className="bg-linear-to-br from-success/10 to-success/5">
				<Card.Content className="flex flex-col gap-2 p-4">
					<div className="flex items-center gap-2 text-success">
						<Icon icon={Wallet03Icon} className="icon-md" />
						<span className="text-sm font-medium">Receita Bruta de Taxas</span>
						<Tooltip>
							<Tooltip.Trigger>
								<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
							</Tooltip.Trigger>
							<Tooltip.Content className="max-w-72">
								<Tooltip.Arrow />
								<span className="font-medium">Receita Bruta (Taxas Cobradas)</span>
								<br />
								<span className="text-xs">
									Total de taxas que a SwiftPay cobrou das organizações (pagamentos + saques). Não representa o lucro líquido, pois ainda há custos das adquirentes.
								</span>
							</Tooltip.Content>
						</Tooltip>
					</div>
				<AnimatedCurrency value={periodData.fees} className="text-2xl font-bold" />
				<GrowthIndicator growth={growth.totalFeesGrowth} comparisonLabel={growth.growthComparisonLabel} />
				<span className="text-xs text-muted">
					<AnimatedNumber
						value={periodData.volume > 0 ? (periodData.fees / periodData.volume) * 100 : 0}
							maximumFractionDigits={2}
							minimumFractionDigits={2}
							suffix="%"
						/>
						do volume
					</span>
				</Card.Content>
			</Card>

			<Card className="bg-linear-to-br from-danger/10 to-danger/5">
				<Card.Content className="flex flex-col gap-2 p-4">
					<div className="flex items-center gap-2 text-danger">
						<Icon icon={BankIcon} className="icon-md" />
						<span className="text-sm font-medium">Custo com Adquirentes</span>
						<Tooltip>
							<Tooltip.Trigger>
								<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
							</Tooltip.Trigger>
							<Tooltip.Content className="max-w-72">
								<Tooltip.Arrow />
								<span className="font-medium">Custo das Adquirentes</span>
								<br />
								<span className="text-xs">
									Total de taxas que a SwiftPay paga às adquirentes (Bankizi, etc.) para processar pagamentos e saques. Este é o custo operacional.
								</span>
							</Tooltip.Content>
						</Tooltip>
					</div>
				<AnimatedCurrency value={periodData.acquirerFees} className="text-2xl font-bold" />
				<GrowthIndicator growth={growth.totalAcquirerFeesGrowth} comparisonLabel={growth.growthComparisonLabel} invertColors />
				<span className="text-xs text-muted">
					<AnimatedNumber
						value={periodData.volume > 0 ? (periodData.acquirerFees / periodData.volume) * 100 : 0}
							maximumFractionDigits={2}
							minimumFractionDigits={2}
							suffix="%"
						/>
						do volume
					</span>
				</Card.Content>
			</Card>

			<Card className="bg-linear-to-br from-emerald-600/10 to-emerald-600/5 border-emerald-500/20">
				<Card.Content className="flex flex-col gap-2 p-4">
					<div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
						<Icon icon={AnalyticsUpIcon} className="icon-md" />
						<span className="text-sm font-medium">Resultado Líquido</span>
						<Tooltip>
							<Tooltip.Trigger>
								<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
							</Tooltip.Trigger>
							<Tooltip.Content className="max-w-72">
								<Tooltip.Arrow />
								<span className="font-medium">Resultado Líquido de Taxas</span>
								<br />
								<span className="text-xs">
									Receita Bruta de Taxas menos Custo com Adquirentes. Este é o resultado líquido real da SwiftPay em taxas de pagamentos e saques.
								</span>
								<br />
								<span className="mt-1 flex items-center gap-1 text-xs text-muted">
									Fórmula:
									<AnimatedCurrency value={periodData.fees} className="font-medium" />
									-
									<AnimatedCurrency value={periodData.acquirerFees} className="font-medium" />
								</span>
							</Tooltip.Content>
						</Tooltip>
					</div>
					<AnimatedCurrency value={periodData.netRevenue} className="text-2xl font-bold" />
					<GrowthIndicator growth={growth.netRevenueGrowth} comparisonLabel={growth.growthComparisonLabel} />
					<span className="text-xs text-muted">
						<AnimatedNumber value={marginPercent} maximumFractionDigits={2} minimumFractionDigits={2} suffix="%" /> margem líquida
					</span>
				</Card.Content>
			</Card>
		</div>
	);
}

function FinancialSecondaryCards({ financial, growth }: { financial: AdminFinancialKpis; growth: AdminDashboardGrowthKpis }) {
	const ticketMedio = financial.completedTransactions > 0 ? financial.totalVolume / financial.completedTransactions : 0;

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<Card>
				<Card.Content className="flex flex-col gap-2 p-4">
					<div className="flex items-center gap-2 text-warning">
						<Icon icon={Analytics02Icon} className="icon-md" />
						<span className="text-sm font-medium">Ticket Médio</span>
						<Tooltip>
							<Tooltip.Trigger>
								<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
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
					<AnimatedCurrency value={ticketMedio} className="text-2xl font-bold" />
					<GrowthIndicator growth={growth.netMarginGrowth} comparisonLabel={growth.growthComparisonLabel} />
					<span className="text-xs text-muted">por transação</span>
				</Card.Content>
			</Card>

			<Card>
				<Card.Content className="flex flex-col gap-2 p-4">
					<div className="flex items-center gap-2 text-secondary">
						<Icon icon={ArrowDataTransferHorizontalIcon} className="icon-md" />
						<span className="text-sm font-medium">Saques Realizados</span>
						<Tooltip>
							<Tooltip.Trigger>
								<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
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
					<AnimatedCurrency value={financial.totalPayoutAmount} className="text-2xl font-bold" />
					<GrowthIndicator growth={growth.payoutAmountGrowth} comparisonLabel={growth.growthComparisonLabel} />
					<span className="text-xs text-muted">{financial.totalPayouts.toLocaleString('pt-BR')} saques</span>
				</Card.Content>
			</Card>

			<Card>
				<Card.Content className="flex flex-col gap-2 p-4">
					<div className="flex items-center gap-2 text-accent">
						<Icon icon={CheckmarkCircle02Icon} className="icon-md" />
						<span className="text-sm font-medium">Taxa de Aprovação</span>
						<Tooltip>
							<Tooltip.Trigger>
								<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
							</Tooltip.Trigger>
							<Tooltip.Content className="max-w-72">
								<Tooltip.Arrow />
								<span className="font-medium">Taxa de Aprovação</span>
								<br />
								<span className="text-xs">
									Percentual de transações aprovadas com sucesso em relação ao total de transações criadas.
								</span>
							</Tooltip.Content>
						</Tooltip>
					</div>
					<AnimatedNumber
						value={financial.totalTransactions > 0 ? (financial.completedTransactions / financial.totalTransactions) * 100 : 0}
						maximumFractionDigits={1}
						minimumFractionDigits={1}
						suffix="%"
						className="text-2xl font-bold"
					/>
					<GrowthIndicator growth={growth.approvalRateGrowth} comparisonLabel={growth.growthComparisonLabel} />
					<span className="text-xs text-muted">
						{financial.completedTransactions.toLocaleString('pt-BR')} de {financial.totalTransactions.toLocaleString('pt-BR')}
					</span>
				</Card.Content>
			</Card>

			<Card>
				<Card.Content className="flex flex-col gap-2 p-4">
					<div className="flex items-center gap-2 text-danger">
						<Icon icon={CancelCircleIcon} className="icon-md" />
						<span className="text-sm font-medium">Transações com Falha</span>
						<Tooltip>
							<Tooltip.Trigger>
								<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
							</Tooltip.Trigger>
							<Tooltip.Content className="max-w-72">
								<Tooltip.Arrow />
								<span className="font-medium">Transações com Falha</span>
								<br />
								<span className="text-xs">
									Total de transações que falharam, expiraram ou foram canceladas.
								</span>
							</Tooltip.Content>
						</Tooltip>
					</div>
					<span className="text-2xl font-bold">{financial.failedTransactions.toLocaleString('pt-BR')}</span>
					<GrowthIndicator growth={growth.failedRateGrowth} comparisonLabel={growth.growthComparisonLabel} invertColors />
					<span className="text-xs text-muted">
						<AnimatedNumber
							value={financial.totalTransactions > 0 ? (financial.failedTransactions / financial.totalTransactions) * 100 : 0}
							maximumFractionDigits={1}
							minimumFractionDigits={1}
							suffix="%"
						/>
						 do total
					</span>
				</Card.Content>
			</Card>
		</div>
	);
}

function FinancialPeriodCards({ financial }: { financial: AdminFinancialKpis }) {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
			<Card>
				<Card.Content className="p-4">
					<div className="flex flex-col gap-3">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">Hoje</span>
							<Tooltip>
								<Tooltip.Trigger>
									<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
								</Tooltip.Trigger>
								<Tooltip.Content className="max-w-64">
									<Tooltip.Arrow />
									<span className="text-xs">Métricas financeiras do dia atual</span>
								</Tooltip.Content>
							</Tooltip>
						</div>
						<div className="flex flex-col gap-2 text-sm">
							<div className="flex items-center justify-between">
								<span className="text-muted">Volume</span>
								<AnimatedCurrency value={financial.volumeToday} className="font-semibold" />
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted">Receita Bruta de Taxas</span>
								<AnimatedCurrency value={financial.feesToday} className="font-semibold text-success" />
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted">Custo com Adquirentes</span>
								<AnimatedCurrency value={financial.acquirerFeesToday} className="font-semibold text-danger" />
							</div>
							<div className="flex items-center justify-between border-t border-default-200 pt-2">
								<span className="font-medium text-emerald-600 dark:text-emerald-400">Resultado Líquido</span>
								<AnimatedCurrency
									value={financial.netRevenueToday}
									className="font-bold text-emerald-600 dark:text-emerald-400"
								/>
							</div>
						</div>
					</div>
				</Card.Content>
			</Card>

			<Card>
				<Card.Content className="p-4">
					<div className="flex flex-col gap-3">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">Esta Semana</span>
							<Tooltip>
								<Tooltip.Trigger>
									<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
								</Tooltip.Trigger>
								<Tooltip.Content className="max-w-64">
									<Tooltip.Arrow />
									<span className="text-xs">Métricas financeiras da semana atual</span>
								</Tooltip.Content>
							</Tooltip>
						</div>
						<div className="flex flex-col gap-2 text-sm">
							<div className="flex items-center justify-between">
								<span className="text-muted">Volume</span>
								<AnimatedCurrency value={financial.volumeThisWeek} className="font-semibold" />
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted">Receita Bruta de Taxas</span>
								<AnimatedCurrency value={financial.feesThisWeek} className="font-semibold text-success" />
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted">Custo com Adquirentes</span>
								<AnimatedCurrency value={financial.acquirerFeesThisWeek} className="font-semibold text-danger" />
							</div>
							<div className="flex items-center justify-between border-t border-default-200 pt-2">
								<span className="font-medium text-emerald-600 dark:text-emerald-400">Resultado Líquido</span>
								<AnimatedCurrency
									value={financial.netRevenueThisWeek}
									className="font-bold text-emerald-600 dark:text-emerald-400"
								/>
							</div>
						</div>
					</div>
				</Card.Content>
			</Card>

			<Card>
				<Card.Content className="p-4">
					<div className="flex flex-col gap-3">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">Este Mês</span>
							<Tooltip>
								<Tooltip.Trigger>
									<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
								</Tooltip.Trigger>
								<Tooltip.Content className="max-w-64">
									<Tooltip.Arrow />
									<span className="text-xs">Métricas financeiras do mês atual</span>
								</Tooltip.Content>
							</Tooltip>
						</div>
						<div className="flex flex-col gap-2 text-sm">
							<div className="flex items-center justify-between">
								<span className="text-muted">Volume</span>
								<AnimatedCurrency value={financial.volumeThisMonth} className="font-semibold" />
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted">Receita Bruta de Taxas</span>
								<AnimatedCurrency value={financial.feesThisMonth} className="font-semibold text-success" />
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted">Custo com Adquirentes</span>
								<AnimatedCurrency value={financial.acquirerFeesThisMonth} className="font-semibold text-danger" />
							</div>
							<div className="flex items-center justify-between border-t border-default-200 pt-2">
								<span className="font-medium text-emerald-600 dark:text-emerald-400">Resultado Líquido</span>
								<AnimatedCurrency
									value={financial.netRevenueThisMonth}
									className="font-bold text-emerald-600 dark:text-emerald-400"
								/>
							</div>
						</div>
					</div>
				</Card.Content>
			</Card>
		</div>
	);
}
