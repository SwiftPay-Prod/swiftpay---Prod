'use client';

import { Card } from '@heroui/react';
import {
	Analytics02Icon,
	AnalyticsUpIcon,
	CheckmarkCircle02Icon,
	CancelCircleIcon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import type { AdminDailyVolumeData, AdminDashboardGrowthKpis, AdminFinancialKpis } from '@/types/admin/dashboard';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { formatCurrency } from '@/utils/currency';
import { Bar, CartesianGrid, ComposedChart, Legend, Line, XAxis, YAxis } from 'recharts';
import {
	conversionRateChartConfig,
	revenueEvolutionChartConfig,
	ticketMedioChartConfig,
	transactionFailuresChartConfig,
} from '../dashboard-chart-config';
import { GrowthIndicator } from '../components/growth-indicator';

export function TransactionsTab({
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
				<RevenueEvolutionChart data={volumeChart} periodLabel={periodLabel} />
				<TransactionKpiCards financial={financial} growth={growth} />
			</div>
			<div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
				<ConversionRateChart data={volumeChart} periodLabel={periodLabel} />
				<TicketMedioChart data={volumeChart} periodLabel={periodLabel} />
			</div>
			<TransactionFailuresChart data={volumeChart} financial={financial} periodLabel={periodLabel} />
		</div>
	);
}

function TransactionKpiCards({ financial, growth }: { financial: AdminFinancialKpis; growth: AdminDashboardGrowthKpis }) {
	const metrics = [
		{ label: 'Total', value: financial.totalTransactions, growth: growth.transactionsGrowth },
		{ label: 'Aprovadas', value: financial.completedTransactions, growth: growth.approvalRateGrowth, positive: true },
		{ label: 'Pendentes', value: financial.pendingTransactions, growth: undefined },
		{ label: 'Com Falha', value: financial.failedTransactions, growth: growth.failedRateGrowth, invert: true },
	];

	return (
		<Card className="border border-border/80 bg-card">
			<Card.Header className="px-3 pt-3">
				<Card.Title className="flex items-center gap-2 text-sm">
					<Icon icon={Analytics02Icon} className="icon-xs text-accent" />
					Pipeline Transacional
				</Card.Title>
				<Card.Description className="text-xs">Status atual das transações</Card.Description>
			</Card.Header>
			<Card.Content className="grid grid-cols-2 gap-3 px-3 pb-3">
				{metrics.map((item) => (
					<div key={item.label} className="flex flex-col gap-1">
						<span className="text-xs font-mono uppercase text-muted-foreground font-medium">{item.label}</span>
						<span className={`text-base font-bold font-mono tracking-tight ${item.label === 'Aprovadas' ? 'text-success' : item.label === 'Com Falha' ? 'text-danger' : item.label === 'Pendentes' ? 'text-warning' : 'text-foreground'}`}>
							{item.value.toLocaleString('pt-BR')}
						</span>
						{item.growth != null && (
							<GrowthIndicator growth={item.growth} comparisonLabel={growth.growthComparisonLabel} invertColors={item.invert} />
						)}
					</div>
				))}
				<div className="col-span-2 flex items-center justify-between border-t border-border/60 pt-2">
					<div className="flex items-center gap-1.5">
						<Icon icon={CheckmarkCircle02Icon} className="icon-xxs text-success" />
						<span className="text-xs font-mono text-muted-foreground font-medium">Taxa de Aprovação</span>
					</div>
					<div className="flex items-center gap-2">
						<AnimatedNumber value={financial.approvalRate} suffix="%" maximumFractionDigits={1} className="text-sm font-bold font-mono" />
						{financial.approvalRate >= 90 ? (
							<Icon icon={CheckmarkCircle02Icon} className="icon-xs text-success" />
						) : financial.approvalRate >= 70 ? (
							<Icon icon={CheckmarkCircle02Icon} className="icon-xs text-warning" />
						) : (
							<Icon icon={CancelCircleIcon} className="icon-xs text-danger" />
						)}
					</div>
				</div>
			</Card.Content>
		</Card>
	);
}

function RevenueEvolutionChart({ data, periodLabel }: { data: AdminDailyVolumeData[]; periodLabel: string }) {
	const chartData = data.map((item) => ({
		...item,
		date: new Date(item.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
		transactions: item.transactionCount,
	}));

	return (
		<Card className="border border-border/80 bg-card">
			<Card.Header className="px-3 pt-3">
				<Card.Title className="flex items-center gap-2 text-sm">
					<Icon icon={AnalyticsUpIcon} className="icon-xs text-accent" />
					Evolução do TPV
				</Card.Title>
				<Card.Description className="text-xs">{periodLabel}, TPV e quantidade de transações</Card.Description>
			</Card.Header>
			<Card.Content className="px-3 pb-3">
				<ChartContainer config={revenueEvolutionChartConfig} className="h-40 w-full">
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
							width={30}
							allowDecimals={false}
						/>
						<ChartTooltip
							content={
								<ChartTooltipContent
									formatter={(value, name) => {
										if (name === 'volume') {
											return formatCurrency(value as number);
										}
										return `${value} transações`;
									}}
								/>
							}
						/>
						<Legend />
						<Bar yAxisId="left" dataKey="volume" fill="var(--color-volume)" radius={[3, 3, 0, 0]} name="TPV" />
						<Line
							yAxisId="right"
							type="monotone"
							dataKey="transactions"
							stroke="var(--color-transactions)"
							strokeWidth={2}
							dot={{ r: 3 }}
							name="Transações"
						/>
					</ComposedChart>
				</ChartContainer>
			</Card.Content>
		</Card>
	);
}

function ConversionRateChart({ data, periodLabel }: { data: AdminDailyVolumeData[]; periodLabel: string }) {
	const chartData = data.map((item) => {
		const total = item.transactionCount;
		const completed = item.completedTransactions;
		const rate = total > 0 ? (completed / total) * 100 : 0;
		return {
			date: new Date(item.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
			completed,
			total,
			rate: Math.round(rate * 10) / 10,
		};
	});

	const avgRate =
		chartData.length > 0 ? chartData.reduce((sum, item) => sum + item.rate, 0) / chartData.length : 0;

	return (
		<Card>
			<Card.Header className="px-4 pt-4">
				<Card.Title className="flex items-center gap-2 text-base">
					<Icon icon={CheckmarkCircle02Icon} className="icon-sm text-success" />
					Taxa de Aprovação Diária
				</Card.Title>
				<Card.Description className="text-xs">
					{periodLabel},
					{' '}
					Média: <AnimatedNumber value={avgRate} suffix="%" maximumFractionDigits={1} /> de aprovação
				</Card.Description>
			</Card.Header>
			<Card.Content className="px-4 pb-4">
				<ChartContainer config={conversionRateChartConfig} className="h-48 w-full">
					<ComposedChart accessibilityLayer data={chartData}>
						<CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-default-200" />
						<XAxis dataKey="date" tickLine={false} tickMargin={8} axisLine={false} fontSize={10} />
						<YAxis yAxisId="left" tickLine={false} axisLine={false} fontSize={10} width={40} allowDecimals={false} />
						<YAxis
							yAxisId="right"
							orientation="right"
							tickLine={false}
							axisLine={false}
							fontSize={10}
							width={40}
							domain={[0, 100]}
							tickFormatter={(value) => `${value}%`}
						/>
						<ChartTooltip
							content={
								<ChartTooltipContent
									formatter={(value, name) => {
										if (name === 'rate') return `${value}%`;
										return `${value} transações`;
									}}
								/>
							}
						/>
						<Legend />
						<Bar
							yAxisId="left"
							dataKey="completed"
							fill="var(--color-completed)"
							radius={[4, 4, 0, 0]}
							name="Aprovadas"
						/>
						<Line
							yAxisId="right"
							type="monotone"
							dataKey="rate"
							stroke="var(--color-rate)"
							strokeWidth={2}
							dot={{ r: 4 }}
							name="Taxa (%)"
						/>
					</ComposedChart>
				</ChartContainer>
			</Card.Content>
		</Card>
	);
}

function TicketMedioChart({ data, periodLabel }: { data: AdminDailyVolumeData[]; periodLabel: string }) {
	const chartData = data.map((item) => ({
		date: new Date(item.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
		volume: item.volume,
		ticketMedio: item.transactionCount > 0 ? item.volume / item.transactionCount : 0,
	}));

	const avgTicket =
		chartData.length > 0 ? chartData.reduce((sum, item) => sum + item.ticketMedio, 0) / chartData.length : 0;

	return (
		<Card>
			<Card.Header className="px-4 pt-4">
				<Card.Title className="flex items-center gap-2 text-base">
					<Icon icon={Analytics02Icon} className="icon-sm text-warning" />
					Ticket Médio Diário
				</Card.Title>
				<Card.Description className="text-xs">
					{periodLabel},
					{' '}
					Média do período: <span className="font-medium">{formatCurrency(avgTicket)}</span>
				</Card.Description>
			</Card.Header>
			<Card.Content className="px-4 pb-4">
				<ChartContainer config={ticketMedioChartConfig} className="h-48 w-full">
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
						<Bar yAxisId="left" dataKey="volume" fill="var(--color-volume)" radius={[4, 4, 0, 0]} name="TPV" />
						<Line
							yAxisId="right"
							type="monotone"
							dataKey="ticketMedio"
							stroke="var(--color-ticketMedio)"
							strokeWidth={2}
							dot={{ r: 4 }}
							name="Ticket Médio"
						/>
					</ComposedChart>
				</ChartContainer>
			</Card.Content>
		</Card>
	);
}

function TransactionFailuresChart({
	data,
	financial,
	periodLabel,
}: {
	data: AdminDailyVolumeData[];
	financial: AdminFinancialKpis;
	periodLabel: string;
}) {
	const globalFailureRate = financial.failedRate;

	const chartData = data.map((item) => {
		const total = item.transactionCount;
		const failed = item.failedTransactions;
		return {
			date: new Date(item.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
			total,
			failed,
			failureRate: total > 0 ? (failed / total) * 100 : 0,
		};
	});

	return (
		<Card>
			<Card.Header className="px-4 pt-4">
				<Card.Title className="flex items-center gap-2 text-base">
					<Icon icon={CancelCircleIcon} className="icon-sm text-danger" />
					Transações x Falhas
				</Card.Title>
				<Card.Description className="text-xs">
					{periodLabel},
					{' '}
					Taxa de falha geral:{' '}
					<AnimatedNumber value={globalFailureRate} suffix="%" maximumFractionDigits={2} minimumFractionDigits={2} />
				</Card.Description>
			</Card.Header>
			<Card.Content className="px-4 pb-4">
				<ChartContainer config={transactionFailuresChartConfig} className="h-48 w-full">
					<ComposedChart accessibilityLayer data={chartData}>
						<CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-default-200" />
						<XAxis dataKey="date" tickLine={false} tickMargin={8} axisLine={false} fontSize={10} />
						<YAxis yAxisId="left" tickLine={false} axisLine={false} fontSize={10} width={40} allowDecimals={false} />
						<YAxis
							yAxisId="right"
							orientation="right"
							tickLine={false}
							axisLine={false}
							fontSize={10}
							width={40}
							domain={[0, 'auto']}
							tickFormatter={(value) => `${value.toFixed(0)}%`}
						/>
						<ChartTooltip
							content={
								<ChartTooltipContent
									formatter={(value, name) => {
										if (name === 'failureRate') return `${(value as number).toFixed(2)}%`;
										return `${value} transações`;
									}}
								/>
							}
						/>
						<Legend />
						<Bar yAxisId="left" dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} name="Total" />
						<Bar yAxisId="left" dataKey="failed" fill="var(--color-failed)" radius={[4, 4, 0, 0]} name="Com Falha" />
						<Line
							yAxisId="right"
							type="monotone"
							dataKey="failureRate"
							stroke="var(--color-failureRate)"
							strokeWidth={2}
							dot={{ r: 4 }}
							name="Taxa Falha (%)"
						/>
					</ComposedChart>
				</ChartContainer>
			</Card.Content>
		</Card>
	);
}
