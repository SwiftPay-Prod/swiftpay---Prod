'use client';

import { Card, Tooltip, Spinner } from '@heroui/react';
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	XAxis,
	YAxis,
} from 'recharts';
import {
	Analytics02Icon,
	AnalyticsUpIcon,
	CheckmarkCircle02Icon,
	InformationCircleIcon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { formatCurrency } from '@/utils/currency';
import { approvalRateLevelParse } from '@/parse';
import { ApprovalRateLevel } from '@/types/enums';
import type { MerchantDailyVolumeData, MerchantWeeklyVolumeData } from '@/types/merchant/dashboard';

interface MobileChartsProps {
	volumeChart: MerchantDailyVolumeData[];
	weeklyChart: MerchantWeeklyVolumeData[];
	periodStartDate: string;
	periodEndDate: string;
	approvalRate: number;
	approvalRateLevel?: ApprovalRateLevel | null;
	isProcessing: boolean;
	periodLabel?: string;
	isBalanceVisible: boolean;
}

const CHART_COLORS = {
	accent: 'var(--accent)',
	success: 'var(--success)',
	warning: 'var(--warning)',
	danger: 'var(--danger)',
};

const volumeChartConfig = {
	volume: { label: 'Volume', color: CHART_COLORS.accent },
} satisfies ChartConfig;

const weeklyChartConfig = {
	volume: { label: 'Faturamento', color: CHART_COLORS.accent },
} satisfies ChartConfig;

const GAUGE_COLORS = {
	danger: '#d4d4d4',
	warning: '#a3a3a3',
	yellow: '#737373',
	accent: '#404040',
	success: '#171717',
};

const GAUGE_DATA = [
	{ name: 'Crítico', value: 15, color: GAUGE_COLORS.danger },
	{ name: 'Abaixo', value: 10, color: GAUGE_COLORS.warning },
	{ name: 'Média', value: 10, color: GAUGE_COLORS.yellow },
	{ name: 'Bom', value: 15, color: GAUGE_COLORS.accent },
	{ name: 'Excelente', value: 50, color: GAUGE_COLORS.success },
];

const RADIAN = Math.PI / 180;

function getNeedleCoordinates(value: number, cx: number, cy: number, innerRadius: number, outerRadius: number) {
	const ang = 180 - (value / 100) * 180;
	const length = (innerRadius + outerRadius) / 2;
	const sin = Math.sin(-RADIAN * ang);
	const cos = Math.cos(-RADIAN * ang);
	return { x: cx + length * cos, y: cy + length * sin, cx, cy };
}

const colorMap: Record<string, string> = {
	danger: 'text-danger',
	warning: 'text-warning',
	default: 'text-amber-500',
	accent: 'text-accent',
	success: 'text-success',
};

export function MobileCharts({
	volumeChart,
	weeklyChart,
	periodStartDate,
	periodEndDate,
	approvalRate,
	approvalRateLevel,
	isProcessing,
	periodLabel,
	isBalanceVisible,
}: MobileChartsProps) {
	const periodDays = Math.max(
		1,
		Math.floor((new Date(periodEndDate).getTime() - new Date(periodStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
	);
	const isHourlyGranularity = periodDays <= 2;

	return (
		<>
			<VolumeChartCard
				data={volumeChart}
				adaptiveData={weeklyChart}
				isHourlyGranularity={isHourlyGranularity}
				isProcessing={isProcessing}
				periodLabel={periodLabel}
			/>
			<WeeklyVolumeChartCard data={weeklyChart} isHourlyGranularity={isHourlyGranularity} isProcessing={isProcessing} />
			<ApprovalRateGaugeCard
				approvalRate={approvalRate}
				approvalRateLevel={approvalRateLevel}
				isProcessing={isProcessing}
				isBalanceVisible={isBalanceVisible}
			/>
		</>
	);
}

function VolumeChartCard({
	data,
	adaptiveData,
	isHourlyGranularity,
	isProcessing,
	periodLabel,
}: {
	data: MerchantDailyVolumeData[];
	adaptiveData: MerchantWeeklyVolumeData[];
	isHourlyGranularity: boolean;
	isProcessing: boolean;
	periodLabel?: string;
}) {
	const chartData = isHourlyGranularity
		? adaptiveData.map((item) => ({ date: item.label, volume: item.volume, transactionCount: item.transactionCount }))
		: data.map((item) => ({
			date: new Date(item.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
			volume: item.volume,
			transactionCount: item.transactionCount,
		}));

	return (
		<Card className={isProcessing ? 'opacity-70' : ''}>
			<Card.Header className="px-4 pt-3">
				<Card.Title className="flex items-center gap-2 text-sm">
					<Icon icon={Analytics02Icon} className="icon-sm text-accent" />
					{isHourlyGranularity ? 'Volume por hora' : 'Volume diário'}
					<Tooltip>
						<Tooltip.Trigger>
							<Icon icon={InformationCircleIcon} className="icon-xs cursor-help text-muted opacity-60" />
						</Tooltip.Trigger>
						<Tooltip.Content className="max-w-64">
							<Tooltip.Arrow />
							Valor total de transações aprovadas por dia no período selecionado.
						</Tooltip.Content>
					</Tooltip>
					{isProcessing && <Spinner size="sm" className="ml-2" />}
				</Card.Title>
				<Card.Description className="text-xs">{periodLabel ?? 'Período selecionado'}</Card.Description>
			</Card.Header>
			<Card.Content className="px-4 pb-3">
				<ChartContainer config={volumeChartConfig} className="h-36 w-full">
					<BarChart accessibilityLayer data={chartData}>
						<CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-default-200" />
						<XAxis dataKey="date" tickLine={false} tickMargin={6} axisLine={false} fontSize={9} />
						<ChartTooltip
							content={
								<ChartTooltipContent
									formatter={(value, name) =>
										name === 'volume' ? formatCurrency(value as number) : `${value} transações`
									}
								/>
							}
						/>
						<Bar dataKey="volume" fill="var(--color-volume)" radius={[4, 4, 0, 0]} />
					</BarChart>
				</ChartContainer>
			</Card.Content>
		</Card>
	);
}

function WeeklyVolumeChartCard({
	data,
	isHourlyGranularity,
	isProcessing,
}: {
	data: MerchantWeeklyVolumeData[];
	isHourlyGranularity: boolean;
	isProcessing: boolean;
}) {
	const chartData = data.map((item) => ({
		week: item.label,
		volume: item.volume,
		transactionCount: item.transactionCount,
	}));

	return (
		<Card className={isProcessing ? 'opacity-70' : ''}>
			<Card.Header className="px-4 pt-3">
				<Card.Title className="flex items-center gap-2 text-sm">
					<Icon icon={AnalyticsUpIcon} className="icon-sm text-accent" />
					{isHourlyGranularity ? 'Evolução por hora' : 'Evolução diária'}
					<Tooltip>
						<Tooltip.Trigger>
							<Icon icon={InformationCircleIcon} className="icon-xs cursor-help text-muted opacity-60" />
						</Tooltip.Trigger>
						<Tooltip.Content className="max-w-64">
							<Tooltip.Arrow />
							Comparativo de volume entre as últimas semanas.
						</Tooltip.Content>
					</Tooltip>
					{isProcessing && <Spinner size="sm" className="ml-2" />}
				</Card.Title>
				<Card.Description className="text-xs">
					{isHourlyGranularity ? 'Últimas horas do período' : 'Período selecionado (agrupado por dia)'}
				</Card.Description>
			</Card.Header>
			<Card.Content className="px-4 pb-3">
				<ChartContainer config={weeklyChartConfig} className="h-36 w-full">
					<AreaChart accessibilityLayer data={chartData}>
						<defs>
							<linearGradient id="mobileVolumeGradient" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor={CHART_COLORS.accent} stopOpacity={0.3} />
								<stop offset="95%" stopColor={CHART_COLORS.accent} stopOpacity={0} />
							</linearGradient>
						</defs>
						<CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-default-200" />
						<XAxis dataKey="week" tickLine={false} tickMargin={6} axisLine={false} fontSize={9} />
						<YAxis hide />
						<ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />} />
						<Area type="monotone" dataKey="volume" stroke={CHART_COLORS.accent} strokeWidth={2} fill="url(#mobileVolumeGradient)" />
					</AreaChart>
				</ChartContainer>
			</Card.Content>
		</Card>
	);
}

function ApprovalRateGaugeCard({ approvalRate, approvalRateLevel, isProcessing, isBalanceVisible }: { approvalRate: number; approvalRateLevel?: ApprovalRateLevel | null; isProcessing: boolean; isBalanceVisible: boolean }) {
	const cx = 100;
	const cy = 85;
	const innerRadius = 50;
	const outerRadius = 75;
	const needle = getNeedleCoordinates(approvalRate, cx, cy, innerRadius, outerRadius);

	const levelKey = approvalRateLevel ?? ApprovalRateLevel.Average;
	const levelParse = approvalRateLevelParse[levelKey] ?? approvalRateLevelParse[ApprovalRateLevel.Average];

	return (
		<Card className={isProcessing ? 'opacity-70' : ''}>
			<Card.Header className="px-4 pt-3">
				<Card.Title className="flex items-center gap-2 text-sm">
					<Icon icon={CheckmarkCircle02Icon} className="icon-sm text-success" />
					Taxa de Aprovação
					<Tooltip>
						<Tooltip.Trigger>
							<Icon icon={InformationCircleIcon} className="icon-xs cursor-help text-muted opacity-60" />
						</Tooltip.Trigger>
						<Tooltip.Content className="max-w-64">
							<Tooltip.Arrow />
							Percentual de transações aprovadas no período, classificado por nível de desempenho.
						</Tooltip.Content>
					</Tooltip>
					{isProcessing && <Spinner size="sm" className="ml-2" />}
				</Card.Title>
				<Card.Description className="text-xs">Desempenho dos pagamentos</Card.Description>
			</Card.Header>
			<Card.Content className="flex flex-col items-center px-4 pb-3">
				<PieChart width={200} height={110}>
					<Pie
						data={GAUGE_DATA}
						cx={cx}
						cy={cy}
						startAngle={180}
						endAngle={0}
						innerRadius={innerRadius}
						outerRadius={outerRadius}
						dataKey="value"
						stroke="none"
					>
						{GAUGE_DATA.map((entry, index) => (
							<Cell key={`gauge-cell-${index}`} fill={entry.color} />
						))}
					</Pie>
					<g>
						<circle cx={needle.cx} cy={needle.cy} r={4} fill="var(--foreground)" />
						<path
							d={`M ${needle.cx} ${needle.cy} L ${needle.x} ${needle.y}`}
							stroke="var(--foreground)"
							strokeWidth={2}
							strokeLinecap="round"
						/>
					</g>
				</PieChart>
				<div className="-mt-2 flex flex-col items-center gap-0.5">
					<AnimatedNumber
						value={approvalRate}
						suffix="%"
						maximumFractionDigits={1}
						className={`text-2xl font-bold ${isBalanceVisible ? '' : 'visual-blur'}`}
					/>
					<span className={`text-xs font-medium ${colorMap[levelParse.color] ?? 'text-foreground'} ${isBalanceVisible ? '' : 'visual-blur'}`}>
						{levelParse.label}
					</span>
				</div>
			</Card.Content>
		</Card>
	);
}
