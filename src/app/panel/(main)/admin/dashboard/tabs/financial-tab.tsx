'use client';

import { Tooltip } from '@heroui/react';
import {
	AnalyticsUpIcon,
	Wallet01Icon,
	Wallet03Icon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { RevolutStatusBadge } from '@/components/ui/revolut-status-badge';
import {
	RevolutWalletIcon,
	RevolutCheckIcon,
	RevolutTrendingUpIcon,
} from '@/components/ui/revolut-icons';
import type { AdminDailyVolumeData, AdminDashboardGrowthKpis, AdminFinancialKpis } from '@/types/admin/dashboard';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { formatCurrency } from '@/utils/currency';
import { Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, XAxis, YAxis, Area } from 'recharts';
import {
	cumulativeVolumeChartConfig,
	marginChartConfig,
	volumeChartConfig,
	volumeVsProfitChartConfig,
} from '../dashboard-chart-config';
import { GrowthIndicator } from '../components/growth-indicator';

export function FinancialTab({
	financial,
	volumeChart,
	growth,
	periodLabel,
}: {
	financial: AdminFinancialKpis;
	volumeChart: AdminDailyVolumeData[];
	growth: AdminDashboardGrowthKpis;
	periodLabel: string;
}) {
	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<VolumeChart data={volumeChart} periodLabel={periodLabel} />
				<VolumeVsProfitChart data={volumeChart} periodLabel={periodLabel} />
			</div>
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<MarginChart data={volumeChart} periodLabel={periodLabel} />
				<CumulativeVolumeChart data={volumeChart} periodLabel={periodLabel} />
			</div>
			<PayoutKpiCards financial={financial} growth={growth} />
		</div>
	);
}

function PayoutKpiCards({ financial, growth }: { financial: AdminFinancialKpis; growth: AdminDashboardGrowthKpis }) {
	return (
		<div className="grid grid-cols-2 gap-3 lg:grid-cols-2">
			<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex items-center gap-4">
				<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/70">
					<Icon icon={Wallet03Icon} className="icon-sm" />
				</div>
				<div className="flex flex-col">
					<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Total de Saques</span>
					<span className="text-sm font-bold font-mono text-white tabular-nums">{financial.totalPayouts.toLocaleString('pt-BR')}</span>
					<GrowthIndicator growth={growth.payoutsGrowth} comparisonLabel={growth.growthComparisonLabel} />
				</div>
			</div>

			<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex items-center gap-4">
				<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00a87e]/15 text-[#00a87e] border border-[#00a87e]/30">
					<Icon icon={Wallet01Icon} className="icon-sm" />
				</div>
				<div className="flex flex-col">
					<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Volume Sacado</span>
					<AnimatedCurrency value={financial.totalPayoutAmount} className="text-sm font-bold font-mono text-white tabular-nums" />
					<GrowthIndicator growth={growth.payoutAmountGrowth} comparisonLabel={growth.growthComparisonLabel} />
				</div>
			</div>
		</div>
	);
}

function VolumeChart({ data, periodLabel }: { data: AdminDailyVolumeData[]; periodLabel: string }) {
	const chartData = data.map((item) => ({
		...item,
		date: new Date(item.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
	}));

	return (
		<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 sm:p-6 overflow-hidden">
			<div className="px-1 pt-1">
				<div className="flex items-center gap-2">
					<Icon icon={AnalyticsUpIcon} className="icon-xs text-[#4f55f1]" />
					<span className="text-sm font-semibold text-white">TPV Diário</span>
				</div>
				<p className="text-xs text-white/50 mt-1">{periodLabel} (todas as organizações)</p>
			</div>
			<div className="px-1 pb-1">
				<ChartContainer config={volumeChartConfig} className="h-48 w-full">
					<BarChart accessibilityLayer data={chartData}>
						<CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-white/10" />
						<XAxis dataKey="date" tickLine={false} tickMargin={8} axisLine={false} fontSize={10} className="text-white/60" />
						<ChartTooltip
							content={
								<ChartTooltipContent
									formatter={(value, name) => {
										if (name === 'volume' || name === 'fees') {
											return formatCurrency(value as number);
										}
										return `${value} transações`;
									}}
								/>
							}
						/>
						<Bar dataKey="volume" fill="var(--color-volume)" radius={[3, 3, 0, 0]} />
					</BarChart>
				</ChartContainer>
			</div>
		</div>
	);
}

function VolumeVsProfitChart({ data, periodLabel }: { data: AdminDailyVolumeData[]; periodLabel: string }) {
	const chartData = data.map((item) => ({
		date: new Date(item.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
		volume: item.volume,
		netProfit: item.fees + item.payoutFees - item.acquirerFees - item.payoutAcquirerFees,
	}));

	const totalVolume = data.reduce((sum, item) => sum + item.volume, 0);
	const totalNetProfit = data.reduce(
		(sum, item) => sum + (item.fees + item.payoutFees - item.acquirerFees - item.payoutAcquirerFees),
		0
	);
	const marginPercentage = totalVolume > 0 ? (totalNetProfit / totalVolume) * 100 : 0;

	return (
		<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 sm:p-6 overflow-hidden">
			<div className="px-1 pt-1">
				<div className="flex items-center gap-2">
					<Icon icon={Wallet03Icon} className="icon-xs text-[#00a87e]" />
					<span className="text-sm font-semibold text-white">TPV vs Resultado Líquido</span>
				</div>
				<p className="text-xs text-white/50 mt-1">
					{periodLabel},{' '}
					Margem líquida média:{' '}
					<AnimatedNumber value={marginPercentage} maximumFractionDigits={2} minimumFractionDigits={2} suffix="%" className="text-white tabular-nums" /> do volume
				</p>
			</div>
			<div className="px-1 pb-1">
				<ChartContainer config={volumeVsProfitChartConfig} className="h-48 w-full">
					<ComposedChart accessibilityLayer data={chartData}>
						<CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-white/10" />
						<XAxis dataKey="date" tickLine={false} tickMargin={8} axisLine={false} fontSize={10} className="text-white/60" />
						<YAxis
							yAxisId="left"
							tickLine={false}
							axisLine={false}
							fontSize={10}
							width={60}
							tickFormatter={(value) => formatCurrency(value)}
							className="text-white/60"
						/>
						<YAxis
							yAxisId="right"
							orientation="right"
							tickLine={false}
							axisLine={false}
							fontSize={10}
							width={50}
							tickFormatter={(value) => formatCurrency(value)}
							className="text-white/60"
						/>
						<ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />} />
						<Legend />
						<Area
							yAxisId="left"
							type="monotone"
							dataKey="volume"
							fill="var(--color-volume)"
							fillOpacity={0.2}
							stroke="var(--color-volume)"
							strokeWidth={2}
							name="TPV"
						/>
						<Bar yAxisId="right" dataKey="netProfit" fill="var(--color-netProfit)" radius={[3, 3, 0, 0]} name="Resultado Líquido" />
					</ComposedChart>
				</ChartContainer>
			</div>
		</div>
	);
}

function MarginChart({ data, periodLabel }: { data: AdminDailyVolumeData[]; periodLabel: string }) {
	const chartData = data.map((item) => {
		const netProfit = item.fees + item.payoutFees - item.acquirerFees - item.payoutAcquirerFees;
		return {
			date: new Date(item.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
			netProfit,
			margin: item.volume > 0 ? (netProfit / item.volume) * 100 : 0,
		};
	});

	const avgMargin = chartData.length > 0 ? chartData.reduce((sum, item) => sum + item.margin, 0) / chartData.length : 0;

	return (
		<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 sm:p-6 overflow-hidden">
			<div className="px-1 pt-1">
				<div className="flex items-center gap-2">
					<Icon icon={Wallet03Icon} className="icon-xs text-[#00a87e]" />
					<span className="text-sm font-semibold text-white">Margem Líquida Diária</span>
				</div>
				<p className="text-xs text-white/50 mt-1">
					{periodLabel},{' '}
					Margem líquida média:{' '}
					<AnimatedNumber value={avgMargin} maximumFractionDigits={2} minimumFractionDigits={2} suffix="%" className="tabular-nums text-white" />
				</p>
			</div>
			<div className="px-1 pb-1">
				<ChartContainer config={marginChartConfig} className="h-56 w-full">
					<ComposedChart accessibilityLayer data={chartData}>
						<CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-white/10" />
						<XAxis dataKey="date" tickLine={false} tickMargin={8} axisLine={false} fontSize={10} className="text-white/60" />
						<YAxis
							yAxisId="left"
							tickLine={false}
							axisLine={false}
							fontSize={10}
							width={60}
							tickFormatter={(value) => formatCurrency(value)}
							className="text-white/60"
						/>
						<YAxis
							yAxisId="right"
							orientation="right"
							tickLine={false}
							axisLine={false}
							fontSize={10}
							width={40}
							tickFormatter={(value) => `${value.toFixed(1)}%`}
							className="text-white/60"
						/>
						<ChartTooltip
							content={
								<ChartTooltipContent
									formatter={(value, name) => {
										if (name === 'margin') return `${(value as number).toFixed(2)}%`;
										return formatCurrency(value as number);
									}}
								/>
							}
						/>
						<Legend />
						<Bar yAxisId="left" dataKey="netProfit" fill="var(--color-netProfit)" radius={[3, 3, 0, 0]} name="Resultado Líquido" />
						<Line
							yAxisId="right"
							type="monotone"
							dataKey="margin"
							stroke="var(--color-margin)"
							strokeWidth={2}
							dot={{ r: 3 }}
							name="Margem (%)"
						/>
					</ComposedChart>
				</ChartContainer>
			</div>
		</div>
	);
}

function CumulativeVolumeChart({ data, periodLabel }: { data: AdminDailyVolumeData[]; periodLabel: string }) {
	const chartData = data.map((item, index) => {
		const cumulativeVolume = data.slice(0, index + 1).reduce((sum, d) => sum + d.volume, 0);
		return {
			date: new Date(item.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
			volume: item.volume,
			cumulative: cumulativeVolume,
		};
	});

	const totalCumulative = data.reduce((sum, item) => sum + item.volume, 0);

	return (
		<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 sm:p-6 overflow-hidden">
			<div className="px-1 pt-1">
				<div className="flex items-center gap-2">
					<Icon icon={AnalyticsUpIcon} className="icon-xs text-[#4f55f1]" />
					<span className="text-sm font-semibold text-white">TPV Acumulado</span>
				</div>
				<p className="text-xs text-white/50 mt-1">{periodLabel}, total acumulado: {formatCurrency(totalCumulative)}</p>
			</div>
			<div className="px-1 pb-1">
				<ChartContainer config={cumulativeVolumeChartConfig} className="h-56 w-full">
					<ComposedChart accessibilityLayer data={chartData}>
						<CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-white/10" />
						<XAxis dataKey="date" tickLine={false} tickMargin={8} axisLine={false} fontSize={10} className="text-white/60" />
						<YAxis
							yAxisId="left"
							tickLine={false}
							axisLine={false}
							fontSize={10}
							width={60}
							tickFormatter={(value) => formatCurrency(value)}
							className="text-white/60"
						/>
						<YAxis
							yAxisId="right"
							orientation="right"
							tickLine={false}
							axisLine={false}
							fontSize={10}
							width={60}
							tickFormatter={(value) => formatCurrency(value)}
							className="text-white/60"
						/>
						<ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />} />
						<Legend />
						<Bar
							yAxisId="left"
							dataKey="volume"
							fill="var(--color-volume)"
							radius={[3, 3, 0, 0]}
							name="TPV Diário"
						/>
						<Line
							yAxisId="right"
							type="monotone"
							dataKey="cumulative"
							stroke="var(--color-cumulative)"
							strokeWidth={2}
							dot={{ r: 3 }}
							name="Acumulado"
						/>
					</ComposedChart>
				</ChartContainer>
			</div>
		</div>
	);
}
