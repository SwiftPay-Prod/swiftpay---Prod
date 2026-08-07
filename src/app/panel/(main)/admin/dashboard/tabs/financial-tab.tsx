'use client';

import { Card } from '@heroui/react';
import {
	AnalyticsUpIcon,
	Wallet01Icon,
	Wallet03Icon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
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
		<div className="flex flex-col gap-3">
			<div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
				<VolumeChart data={volumeChart} periodLabel={periodLabel} />
				<VolumeVsProfitChart data={volumeChart} periodLabel={periodLabel} />
			</div>
			<div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
				<MarginChart data={volumeChart} periodLabel={periodLabel} />
				<CumulativeVolumeChart data={volumeChart} periodLabel={periodLabel} />
			</div>
			<PayoutKpiCards financial={financial} growth={growth} />
		</div>
	);
}

function PayoutKpiCards({ financial, growth }: { financial: AdminFinancialKpis; growth: AdminDashboardGrowthKpis }) {
	return (
		<div className="grid grid-cols-2 gap-2 lg:grid-cols-2">
			<Card className="border border-border/80 bg-card">
				<Card.Content className="flex items-center gap-3 p-3">
					<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
						<Icon icon={Wallet03Icon} className="icon-sm text-accent" />
					</div>
					<div className="flex flex-col">
						<span className="text-xs text-muted">Total de Saques</span>
						<span className="text-sm font-bold font-mono">{financial.totalPayouts.toLocaleString('pt-BR')}</span>
						<GrowthIndicator growth={growth.payoutsGrowth} comparisonLabel={growth.growthComparisonLabel} />
					</div>
				</Card.Content>
			</Card>

			<Card className="border border-border/80 bg-card">
				<Card.Content className="flex items-center gap-3 p-3">
					<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/10">
						<Icon icon={Wallet01Icon} className="icon-sm text-success" />
					</div>
					<div className="flex flex-col">
						<span className="text-xs text-muted">Volume Sacado</span>
						<AnimatedCurrency value={financial.totalPayoutAmount} className="text-sm font-bold font-mono" />
						<GrowthIndicator growth={growth.payoutAmountGrowth} comparisonLabel={growth.growthComparisonLabel} />
					</div>
				</Card.Content>
			</Card>
		</div>
	);
}

function VolumeChart({ data, periodLabel }: { data: AdminDailyVolumeData[]; periodLabel: string }) {
	const chartData = data.map((item) => ({
		...item,
		date: new Date(item.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
	}));

	return (
		<Card className="border border-border/80 bg-card">
			<Card.Header className="px-3 pt-3">
				<Card.Title className="flex items-center gap-2 text-sm">
					<Icon icon={AnalyticsUpIcon} className="icon-xs text-accent" />
					TPV Diário
				</Card.Title>
				<Card.Description className="text-xs">{periodLabel} (todas as organizações)</Card.Description>
			</Card.Header>
			<Card.Content className="px-3 pb-3">
				<ChartContainer config={volumeChartConfig} className="h-32 w-full">
					<BarChart accessibilityLayer data={chartData}>
						<CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-default-200" />
						<XAxis dataKey="date" tickLine={false} tickMargin={8} axisLine={false} fontSize={10} />
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
			</Card.Content>
		</Card>
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
		<Card className="border border-border/80 bg-card">
			<Card.Header className="px-3 pt-3">
				<Card.Title className="flex items-center gap-2 text-sm">
					<Icon icon={Wallet03Icon} className="icon-xs text-success" />
					TPV vs Resultado Líquido
				</Card.Title>
				<Card.Description className="text-xs">
					{periodLabel},
					{' '}
					Margem líquida média:{' '}
					<AnimatedNumber value={marginPercentage} maximumFractionDigits={2} minimumFractionDigits={2} suffix="%" /> do volume
				</Card.Description>
			</Card.Header>
			<Card.Content className="px-3 pb-3">
				<ChartContainer config={volumeVsProfitChartConfig} className="h-32 w-full">
					<ComposedChart accessibilityLayer data={chartData}>
						<CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-default-200" />
						<XAxis dataKey="date" tickLine={false} tickMargin={8} axisLine={false} fontSize={10} />
						<YAxis
							yAxisId="left"
							tickLine={false}
							axisLine={false}
							fontSize={10}
							width={60}
							tickFormatter={(value) => formatCurrency(value)}
						/>
						<YAxis
							yAxisId="right"
							orientation="right"
							tickLine={false}
							axisLine={false}
							fontSize={10}
							width={50}
							tickFormatter={(value) => formatCurrency(value)}
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
			</Card.Content>
		</Card>
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
		<Card className="border border-border/80 bg-card">
			<Card.Header className="px-3 pt-3">
				<Card.Title className="flex items-center gap-2 text-sm">
					<Icon icon={Wallet03Icon} className="icon-xs text-success" />
					Margem Líquida Diária
				</Card.Title>
				<Card.Description className="text-xs">
					{periodLabel},
					{' '}
					Margem líquida média:{' '}
					<AnimatedNumber value={avgMargin} maximumFractionDigits={2} minimumFractionDigits={2} suffix="%" />
				</Card.Description>
			</Card.Header>
			<Card.Content className="px-3 pb-3">
				<ChartContainer config={marginChartConfig} className="h-40 w-full">
					<ComposedChart accessibilityLayer data={chartData}>
						<CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-default-200" />
						<XAxis dataKey="date" tickLine={false} tickMargin={8} axisLine={false} fontSize={10} />
						<YAxis
							yAxisId="left"
							tickLine={false}
							axisLine={false}
							fontSize={10}
							width={60}
							tickFormatter={(value) => formatCurrency(value)}
						/>
						<YAxis
							yAxisId="right"
							orientation="right"
							tickLine={false}
							axisLine={false}
							fontSize={10}
							width={40}
							tickFormatter={(value) => `${value.toFixed(1)}%`}
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
			</Card.Content>
		</Card>
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
		<Card className="border border-border/80 bg-card">
			<Card.Header className="px-3 pt-3">
				<Card.Title className="flex items-center gap-2 text-sm">
					<Icon icon={AnalyticsUpIcon} className="icon-xs text-accent" />
					TPV Acumulado
				</Card.Title>
				<Card.Description className="text-xs">{periodLabel}, total acumulado: {formatCurrency(totalCumulative)}</Card.Description>
			</Card.Header>
			<Card.Content className="px-3 pb-3">
				<ChartContainer config={cumulativeVolumeChartConfig} className="h-40 w-full">
					<ComposedChart accessibilityLayer data={chartData}>
						<CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-default-200" />
						<XAxis dataKey="date" tickLine={false} tickMargin={8} axisLine={false} fontSize={10} />
						<YAxis
							yAxisId="left"
							tickLine={false}
							axisLine={false}
							fontSize={10}
							width={60}
							tickFormatter={(value) => formatCurrency(value)}
						/>
						<YAxis
							yAxisId="right"
							orientation="right"
							tickLine={false}
							axisLine={false}
							fontSize={10}
							width={60}
							tickFormatter={(value) => formatCurrency(value)}
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
			</Card.Content>
		</Card>
	);
}
