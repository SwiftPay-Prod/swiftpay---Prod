'use client';

import { Card, Tooltip, Spinner, Skeleton, Select, ListBox, DateRangePicker, DateField, RangeCalendar } from '@heroui/react';
import { Bar, BarChart, XAxis, CartesianGrid, Area, AreaChart, YAxis, PieChart, Pie, Cell } from 'recharts';
import {
	Alert01Icon,
	Analytics02Icon,
	AnalyticsUpIcon,
	ArrowReloadHorizontalIcon,
	Building02Icon,
	CalendarCheckIn01Icon,
	CheckmarkCircle02Icon,
	ChartDownIcon,
	ChartUpIcon,
	HelpCircleIcon,
	InformationCircleIcon,
	MoneyReceive01Icon,
	PiggyBankIcon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { formatRelativeTime } from '@/utils/datetime';
import { formatCurrency } from '@/utils/currency';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { AsyncButton } from '@/components/ui/async-button';
import { approvalRateLevelParse } from '@/parse';
import { ApprovalRateLevel } from '@/types/enums';
import type { AdminAcquirerStatsData, AdminAcquirerChartItem } from '@/types/admin/acquirers';
import type { DashboardPeriod } from '@/types/merchant/dashboard';
import type { IconSvgElement } from '@hugeicons/react';
import { parseDate } from '@internationalized/date';
import { ACQUIRER_STATS_PERIOD_OPTIONS } from '../acquirer-stats.constants';

const CHART_COLORS = {
	accent: 'var(--accent)',
	success: 'var(--success)',
	warning: 'var(--warning)',
	danger: 'var(--danger)',
};

const volumeChartConfig = {
	value: {
		label: 'Volume',
		color: CHART_COLORS.accent,
	},
} satisfies ChartConfig;

const profitChartConfig = {
	value: {
		label: 'Lucro',
		color: CHART_COLORS.success,
	},
} satisfies ChartConfig;

const KPI_TOOLTIPS = {
	volume: 'Volume total de transações processadas por esta processadora no período selecionado.',
	transactions: 'Quantidade total de transações. O número entre parênteses indica quantas foram concluídas com sucesso.',
	approval: 'Porcentagem de transações aprovadas. Quanto maior, melhor a performance da processadora.',
	failures: 'Quantidade de transações que falharam ou expiraram.',
	merchants: 'Quantidade de organizações ativos usando esta processadora.',
	profit: 'Lucro total gerado no período (taxas da plataforma - custos da processadora).',
};

const CHART_TOOLTIPS = {
	volume: 'Mostra o volume de transações por dia. Cada barra representa o total processado em um dia.',
	profit: 'Mostra a evolução do lucro ao longo do período. A área ajuda a visualizar a tendência de crescimento.',
	approvalGauge: 'Medidor de performance: Crítico (0-15%), Abaixo da média (15-25%), Dentro da média (25-35%), Boa performance (35-50%) e Alta performance (50%+).',
	failureGauge: 'Medidor de falhas: quanto menor, melhor. Excelente (0-5%), Bom (5-10%), Médio (10-20%), Alto (20-35%) e Crítico (35%+).',
};

interface StatsTabProps {
	statsData: AdminAcquirerStatsData | null;
	isLoading: boolean;
	isPending: boolean;
	selectedPeriod: DashboardPeriod;
	onPeriodChange: (period: DashboardPeriod) => void;
	customStartDate: string;
	customEndDate: string;
	onCustomRangeChange: (startDate: string, endDate: string) => void;
	onRefresh: () => void;
}

export function StatsTab({
	statsData,
	isLoading,
	isPending,
	selectedPeriod,
	onPeriodChange,
	customStartDate,
	customEndDate,
	onCustomRangeChange,
	onRefresh,
}: StatsTabProps) {
	if (isLoading && !statsData) {
		return <StatsSkeleton />;
	}

	if (!statsData) {
		return (
			<div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-surface p-8">
				<Icon icon={AnalyticsUpIcon} className="icon-xl text-muted" />
				<div className="text-center">
					<p className="text-sm font-medium">Nenhuma estatística disponível</p>
					<p className="text-xs text-muted">As estatísticas serão exibidas aqui quando houver dados.</p>
				</div>
			</div>
		);
	}

	const { kpis, volumeChart, profitChart, cacheInfo, periodInfo } = statsData;
	const isProcessing = cacheInfo.isProcessing || isPending;
	const rangeValue =
		customStartDate && customEndDate ? { start: parseDate(customStartDate), end: parseDate(customEndDate) } : null;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-wrap items-center gap-2">
					<Select
						variant="secondary"
						key={`period-select-${selectedPeriod}`}
						aria-label="Selecionar período"
						defaultValue={selectedPeriod}
						onChange={(key) => {
							if (key) onPeriodChange(key as DashboardPeriod);
						}}
						className="w-44"
					>
						<Select.Trigger>
							<Select.Value />
							<Select.Indicator />
						</Select.Trigger>
						<Select.Popover>
							<ListBox>
								{ACQUIRER_STATS_PERIOD_OPTIONS.map((opt) => (
									<ListBox.Item key={opt.key} id={opt.key} textValue={opt.label}>
										{opt.label}
										<ListBox.ItemIndicator />
									</ListBox.Item>
								))}
							</ListBox>
						</Select.Popover>
					</Select>

					{selectedPeriod === 'custom' && (
						<DateRangePicker
							value={rangeValue}
							onChange={(value) => {
								const nextStartDate = value?.start ? value.start.toString().slice(0, 10) : customStartDate;
								const nextEndDate = value?.end ? value.end.toString().slice(0, 10) : customEndDate;
								if (nextStartDate && nextEndDate) {
									onCustomRangeChange(nextStartDate, nextEndDate);
								}
							}}
						>
							<DateField.Group fullWidth variant="secondary" className="min-w-72">
								<DateField.Input slot="start">{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
								<DateRangePicker.RangeSeparator />
								<DateField.Input slot="end">{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
								<DateField.Suffix>
									<DateRangePicker.Trigger>
										<DateRangePicker.TriggerIndicator />
									</DateRangePicker.Trigger>
								</DateField.Suffix>
							</DateField.Group>
							<DateRangePicker.Popover>
								<RangeCalendar aria-label="Período personalizado" visibleDuration={{ months: 2 }}>
									<RangeCalendar.Header>
										<RangeCalendar.YearPickerTrigger>
											<RangeCalendar.YearPickerTriggerHeading />
											<RangeCalendar.YearPickerTriggerIndicator />
										</RangeCalendar.YearPickerTrigger>
										<RangeCalendar.NavButton slot="previous" />
										<RangeCalendar.NavButton slot="next" />
									</RangeCalendar.Header>
									<RangeCalendar.Grid>
										<RangeCalendar.GridHeader>
											{(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
										</RangeCalendar.GridHeader>
										<RangeCalendar.GridBody>{(date) => <RangeCalendar.Cell date={date} />}</RangeCalendar.GridBody>
									</RangeCalendar.Grid>
									<RangeCalendar.YearPickerGrid>
										<RangeCalendar.YearPickerGridBody>
											{({ year }) => <RangeCalendar.YearPickerCell year={year} />}
										</RangeCalendar.YearPickerGridBody>
									</RangeCalendar.YearPickerGrid>
								</RangeCalendar>
							</DateRangePicker.Popover>
						</DateRangePicker>
					)}

					{periodInfo && (
						<div className="flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1">
							<Icon icon={CalendarCheckIn01Icon} className="icon-xs text-accent" />
							<span className="text-xs font-medium text-accent">{periodInfo.label}</span>
						</div>
					)}
				</div>

				<div className="flex items-center gap-3">
					{cacheInfo.isProcessing && (
						<div className="flex items-center gap-2 rounded-full bg-warning-soft px-3 py-1">
							<Spinner size="sm" color="warning" />
							<span className="text-xs font-medium text-warning">Atualizando...</span>
						</div>
					)}
					{cacheInfo.calculatedAt && (
						<div className="flex items-center gap-1.5">
							<span className="text-xs text-muted">Atualizado {formatRelativeTime(cacheInfo.calculatedAt)}</span>
							<Tooltip>
								<Tooltip.Trigger>
									<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
								</Tooltip.Trigger>
								<Tooltip.Content className="max-w-72">
									<Tooltip.Arrow />
									<span className="font-medium">Como funciona a atualização?</span>
									<br />
									<span className="text-xs">
										As estatísticas são atualizadas a cada {cacheInfo.cacheDurationMinutes} minutos para otimizar a performance.
									</span>
								</Tooltip.Content>
							</Tooltip>
						</div>
					)}
					<AsyncButton variant="secondary" size="sm" onPress={onRefresh} isPending={isPending}>
						<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
						Atualizar
					</AsyncButton>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
				<KpiCard
					icon={AnalyticsUpIcon}
					label="Volume"
					tooltip={KPI_TOOLTIPS.volume}
					value={<AnimatedCurrency value={kpis.totalVolume} className="text-lg font-bold" compact />}
					growth={kpis.volumeGrowth}
					growthComparisonLabel={kpis.growthComparisonLabel}
					isProcessing={isProcessing}
				/>
				<KpiCard
					icon={Analytics02Icon}
					label="Transações"
					tooltip={KPI_TOOLTIPS.transactions}
					value={
						<div className="flex items-baseline gap-1.5">
							<span className="text-lg font-bold">{kpis.totalTransactions}</span>
							<span className="text-xs text-success">({kpis.completedTransactions} ok)</span>
						</div>
					}
					growth={kpis.transactionsGrowth}
					growthComparisonLabel={kpis.growthComparisonLabel}
					isProcessing={isProcessing}
				/>
				<KpiCard
					icon={CheckmarkCircle02Icon}
					iconColor="text-success"
					label="Aprovação"
					tooltip={KPI_TOOLTIPS.approval}
					value={<span className="text-lg font-bold">{kpis.approvalRate.toFixed(1)}%</span>}
					growth={kpis.approvalRateGrowth}
					growthComparisonLabel={kpis.growthComparisonLabel}
					isProcessing={isProcessing}
				/>
				<KpiCard
					icon={Alert01Icon}
					iconColor="text-danger"
					label="Falhas"
					tooltip={KPI_TOOLTIPS.failures}
					value={
						<div className="flex items-baseline gap-1.5">
							<span className="text-lg font-bold">{kpis.failedTransactions + kpis.expiredTransactions}</span>
							<span className="text-xs text-muted">erros</span>
						</div>
					}
					growth={kpis.failedRateGrowth}
					growthComparisonLabel={kpis.growthComparisonLabel}
					invertColors
					isProcessing={isProcessing}
				/>
				<KpiCard
					icon={Building02Icon}
					label="Organizações"
					tooltip={KPI_TOOLTIPS.merchants}
					value={<span className="text-lg font-bold">{kpis.totalMerchants}</span>}
					isProcessing={isProcessing}
				/>
				<KpiCard
					icon={PiggyBankIcon}
					iconColor="text-success"
					label="Lucro"
					tooltip={KPI_TOOLTIPS.profit}
					value={<AnimatedCurrency value={kpis.totalProfit} className="text-lg font-bold" compact />}
					growth={kpis.profitGrowth}
					growthComparisonLabel={kpis.growthComparisonLabel}
					isProcessing={isProcessing}
				/>
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
				<VolumeChart data={volumeChart} isProcessing={isProcessing} periodLabel={periodInfo?.label} />
				<ProfitChart data={profitChart} isProcessing={isProcessing} periodLabel={periodInfo?.label} />
				<ApprovalRateGauge approvalRate={kpis.approvalRate} approvalRateLevel={kpis.approvalRateLevel} isProcessing={isProcessing} />
				<FailureRateGauge failureRate={kpis.failureRate ?? 0} isProcessing={isProcessing} />
			</div>

			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				<Card className="transition-opacity duration-200">
					<Card.Content className="flex items-center gap-3 p-4">
						<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
							<Icon icon={MoneyReceive01Icon} className="icon-sm text-accent" />
						</div>
						<div className="flex flex-col gap-0.5">
							<div className="flex items-center gap-1">
								<span className="text-xs text-muted">Taxas Plataforma</span>
								<Tooltip>
									<Tooltip.Trigger>
										<Icon icon={InformationCircleIcon} className="icon-xs cursor-help text-muted opacity-60" />
									</Tooltip.Trigger>
									<Tooltip.Content className="max-w-64">
										<Tooltip.Arrow />
										Total de taxas cobradas dos merchants pela plataforma SwiftPay no período.
									</Tooltip.Content>
								</Tooltip>
							</div>
							<span className="text-sm font-semibold">{formatCurrency(kpis.totalPlatformFees)}</span>
						</div>
					</Card.Content>
				</Card>
				<Card className="transition-opacity duration-200">
					<Card.Content className="flex items-center gap-3 p-4">
						<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-warning/10">
							<Icon icon={Analytics02Icon} className="icon-sm text-warning" />
						</div>
						<div className="flex flex-col gap-0.5">
							<div className="flex items-center gap-1">
								<span className="text-xs text-muted">Taxas Processadora</span>
								<Tooltip>
									<Tooltip.Trigger>
										<Icon icon={InformationCircleIcon} className="icon-xs cursor-help text-muted opacity-60" />
									</Tooltip.Trigger>
									<Tooltip.Content className="max-w-64">
										<Tooltip.Arrow />
										Total de taxas cobradas pela processadora da plataforma SwiftPay no período.
									</Tooltip.Content>
								</Tooltip>
							</div>
							<span className="text-sm font-semibold">{formatCurrency(kpis.totalAcquirerFees)}</span>
						</div>
					</Card.Content>
				</Card>
				<Card className="transition-opacity duration-200">
					<Card.Content className="flex items-center gap-3 p-4">
						<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-success/10">
							<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm text-success" />
						</div>
						<div className="flex flex-col gap-0.5">
							<div className="flex items-center gap-1">
								<span className="text-xs text-muted">Saques Processados</span>
								<Tooltip>
									<Tooltip.Trigger>
										<Icon icon={InformationCircleIcon} className="icon-xs cursor-help text-muted opacity-60" />
									</Tooltip.Trigger>
									<Tooltip.Content className="max-w-64">
										<Tooltip.Arrow />
										Quantidade de saques processados por esta processadora no período.
									</Tooltip.Content>
								</Tooltip>
							</div>
							<span className="text-sm font-semibold">{kpis.totalPayouts}</span>
						</div>
					</Card.Content>
				</Card>
				<Card className="transition-opacity duration-200">
					<Card.Content className="flex items-center gap-3 p-4">
						<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-pink-500/10">
							<Icon icon={PiggyBankIcon} className="icon-sm text-pink-500" />
						</div>
						<div className="flex flex-col gap-0.5">
							<div className="flex items-center gap-1">
								<span className="text-xs text-muted">Volume de Saques</span>
								<Tooltip>
									<Tooltip.Trigger>
										<Icon icon={InformationCircleIcon} className="icon-xs cursor-help text-muted opacity-60" />
									</Tooltip.Trigger>
									<Tooltip.Content className="max-w-64">
										<Tooltip.Arrow />
										Valor total em reais dos saques processados por esta processadora no período.
									</Tooltip.Content>
								</Tooltip>
							</div>
							<span className="text-sm font-semibold">{formatCurrency(kpis.totalPayoutVolume)}</span>
						</div>
					</Card.Content>
				</Card>
			</div>
		</div>
	);
}

function StatsSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<Skeleton className="h-10 w-44 rounded-lg" />
				<div className="flex items-center gap-3">
					<Skeleton className="h-4 w-32 rounded-lg" />
					<Skeleton className="h-9 w-24 rounded-lg" />
				</div>
			</div>

			<div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
				{[...Array(6)].map((_, i) => (
					<Card key={i}>
						<Card.Content className="flex flex-col gap-1 p-3">
							<Skeleton className="h-3 w-16 rounded-lg" />
							<Skeleton className="h-6 w-24 rounded-lg" />
						</Card.Content>
					</Card>
				))}
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
				{[...Array(4)].map((_, i) => (
					<Card key={i}>
						<Card.Header className="px-4 pt-3">
							<Skeleton className="h-4 w-28 rounded-lg" />
							<Skeleton className="mt-1 h-3 w-20 rounded-lg" />
						</Card.Header>
						<Card.Content className="px-4 pb-3">
							<Skeleton className="h-32 w-full rounded-lg" />
						</Card.Content>
					</Card>
				))}
			</div>
		</div>
	);
}

interface KpiCardProps {
	icon: IconSvgElement;
	iconColor?: string;
	label: string;
	tooltip?: string;
	value: React.ReactNode;
	growth?: number | null;
	growthSuffix?: string;
	growthComparisonLabel?: string | null;
	invertColors?: boolean;
	isProcessing?: boolean;
}

function KpiCard({
	icon,
	iconColor = 'text-accent',
	label,
	tooltip,
	value,
	growth,
	growthSuffix = '%',
	growthComparisonLabel,
	invertColors = false,
	isProcessing,
}: KpiCardProps) {
	const hasGrowth = growth !== null && growth !== undefined;
	const isPositive = hasGrowth && growth > 0;
	const isNegative = hasGrowth && growth < 0;

	const growthColor = invertColors
		? isPositive
			? 'text-danger'
			: isNegative
				? 'text-success'
				: 'text-muted'
		: isPositive
			? 'text-success'
			: isNegative
				? 'text-danger'
				: 'text-muted';

	const GrowthIcon = isPositive ? ChartUpIcon : ChartDownIcon;

	return (
		<Card className={isProcessing ? 'opacity-70 transition-opacity duration-200' : 'transition-opacity duration-200'}>
			<Card.Content className="relative flex flex-col gap-1 p-3">
				<div className="flex items-center gap-1.5">
					<Icon icon={icon} className={`icon-xs ${iconColor}`} />
					<span className="text-xs text-muted">{label}</span>
					{tooltip && (
						<Tooltip>
							<Tooltip.Trigger>
								<Icon icon={InformationCircleIcon} className="icon-xs cursor-help text-muted opacity-60" />
							</Tooltip.Trigger>
							<Tooltip.Content className="max-w-64">
								<Tooltip.Arrow />
								{tooltip}
							</Tooltip.Content>
						</Tooltip>
					)}
				</div>
				{value}
				{hasGrowth && growth !== 0 && (
					<div className={`absolute right-2 top-2 flex items-center gap-0.5 ${growthColor}`}>
						<Icon icon={GrowthIcon} className="icon-xs" />
						<Tooltip>
							<Tooltip.Trigger>
								<span className="flex cursor-help items-center gap-0.5 text-xs font-medium">
									{isPositive ? '+' : ''}
									{growth.toFixed(1)}
									{growthSuffix}
									<Icon icon={HelpCircleIcon} className="icon-xs opacity-50" />
								</span>
							</Tooltip.Trigger>
							<Tooltip.Content>
								<span className="text-xs">
									{invertColors ? (isPositive ? 'Aumento' : 'Redução') : isPositive ? 'Crescimento' : 'Queda'} de{' '}
									{Math.abs(growth).toFixed(1)}
									{growthSuffix} {growthComparisonLabel || 'vs. período anterior'}
								</span>
							</Tooltip.Content>
						</Tooltip>
					</div>
				)}
			</Card.Content>
		</Card>
	);
}

function VolumeChart({ data, isProcessing, periodLabel }: { data: AdminAcquirerChartItem[]; isProcessing?: boolean; periodLabel?: string }) {
	const chartData = data.map((item) => ({
		...item,
		date: new Date(item.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
		valueFormatted: formatCurrency(item.value),
	}));

	return (
		<Card className={isProcessing ? 'opacity-70 transition-opacity duration-200' : 'transition-opacity duration-200'}>
			<Card.Header className="px-4 pt-3">
				<Card.Title className="flex items-center gap-2 text-sm">
					<Icon icon={Analytics02Icon} className="icon-sm text-accent" />
					Volume diário
					<Tooltip>
						<Tooltip.Trigger>
							<Icon icon={InformationCircleIcon} className="icon-xs cursor-help text-muted opacity-60" />
						</Tooltip.Trigger>
						<Tooltip.Content className="max-w-64">
							<Tooltip.Arrow />
							{CHART_TOOLTIPS.volume}
						</Tooltip.Content>
					</Tooltip>
				</Card.Title>
				<Card.Description className="text-xs">{periodLabel || 'Período selecionado'}</Card.Description>
			</Card.Header>
			<Card.Content className="px-4 pb-3">
				<ChartContainer config={volumeChartConfig} className="h-32 w-full">
					<BarChart accessibilityLayer data={chartData}>
						<CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-default-200" />
						<XAxis dataKey="date" tickLine={false} tickMargin={6} axisLine={false} fontSize={9} />
						<ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />} />
						<Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
					</BarChart>
				</ChartContainer>
			</Card.Content>
		</Card>
	);
}

function ProfitChart({ data, isProcessing, periodLabel }: { data: AdminAcquirerChartItem[]; isProcessing?: boolean; periodLabel?: string }) {
	const chartData = data.map((item) => ({
		...item,
		date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
		valueFormatted: formatCurrency(item.value),
	}));

	return (
		<Card className={isProcessing ? 'opacity-70 transition-opacity duration-200' : 'transition-opacity duration-200'}>
			<Card.Header className="px-4 pt-3">
				<Card.Title className="flex items-center gap-2 text-sm">
					<Icon icon={MoneyReceive01Icon} className="icon-sm text-success" />
					Lucro diário
					<Tooltip>
						<Tooltip.Trigger>
							<Icon icon={InformationCircleIcon} className="icon-xs cursor-help text-muted opacity-60" />
						</Tooltip.Trigger>
						<Tooltip.Content className="max-w-64">
							<Tooltip.Arrow />
							{CHART_TOOLTIPS.profit}
						</Tooltip.Content>
					</Tooltip>
				</Card.Title>
				<Card.Description className="text-xs">{periodLabel || 'Período selecionado'}</Card.Description>
			</Card.Header>
			<Card.Content className="px-4 pb-3">
				<ChartContainer config={profitChartConfig} className="h-32 w-full">
					<AreaChart accessibilityLayer data={chartData}>
						<defs>
							<linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.3} />
								<stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0} />
							</linearGradient>
						</defs>
						<CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-default-200" />
						<XAxis dataKey="date" tickLine={false} tickMargin={6} axisLine={false} fontSize={9} />
						<YAxis hide />
						<ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />} />
						<Area type="monotone" dataKey="value" stroke={CHART_COLORS.success} strokeWidth={2} fill="url(#profitGradient)" />
					</AreaChart>
				</ChartContainer>
			</Card.Content>
		</Card>
	);
}

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
	const x = cx + length * cos;
	const y = cy + length * sin;
	return { x, y, cx, cy };
}

function ApprovalRateGauge({ approvalRate, approvalRateLevel, isProcessing }: { approvalRate: number; approvalRateLevel?: ApprovalRateLevel | null; isProcessing?: boolean }) {
	const cx = 100;
	const cy = 85;
	const innerRadius = 50;
	const outerRadius = 75;
	const needle = getNeedleCoordinates(approvalRate, cx, cy, innerRadius, outerRadius);

	const levelKey = approvalRateLevel ?? ApprovalRateLevel.Average;
	const levelParse = approvalRateLevelParse[levelKey] ?? approvalRateLevelParse[ApprovalRateLevel.Average];
	const colorMap: Record<string, string> = {
		danger: 'text-danger',
		warning: 'text-warning',
		default: 'text-amber-500',
		accent: 'text-accent',
		success: 'text-success',
	};

	return (
		<Card className={isProcessing ? 'opacity-70 transition-opacity duration-200' : 'transition-opacity duration-200'}>
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
							{CHART_TOOLTIPS.approvalGauge}
						</Tooltip.Content>
					</Tooltip>
				</Card.Title>
				<Card.Description className="text-xs">Desempenho das transações</Card.Description>
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
							<Cell key={`cell-${index}`} fill={entry.color} />
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
					<span className="text-2xl font-bold">{approvalRate.toFixed(1)}%</span>
					<span className={`text-xs font-medium ${colorMap[levelParse.color]}`}>{levelParse.label}</span>
				</div>
				<div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[10px] text-muted">
					<div className="flex items-center gap-1">
						<div className="h-2 w-2 rounded-full" style={{ backgroundColor: GAUGE_COLORS.danger }} />
						<span>0-15%</span>
					</div>
					<div className="flex items-center gap-1">
						<div className="h-2 w-2 rounded-full" style={{ backgroundColor: GAUGE_COLORS.warning }} />
						<span>15-25%</span>
					</div>
					<div className="flex items-center gap-1">
						<div className="h-2 w-2 rounded-full" style={{ backgroundColor: GAUGE_COLORS.yellow }} />
						<span>25-35%</span>
					</div>
					<div className="flex items-center gap-1">
						<div className="h-2 w-2 rounded-full" style={{ backgroundColor: GAUGE_COLORS.accent }} />
						<span>35-50%</span>
					</div>
					<div className="flex items-center gap-1">
						<div className="h-2 w-2 rounded-full" style={{ backgroundColor: GAUGE_COLORS.success }} />
						<span>50%+</span>
					</div>
				</div>
			</Card.Content>
		</Card>
	);
}

const FAILURE_GAUGE_DATA = [
	{ name: 'Excelente', value: 5, color: GAUGE_COLORS.success },
	{ name: 'Bom', value: 5, color: GAUGE_COLORS.accent },
	{ name: 'Médio', value: 10, color: GAUGE_COLORS.yellow },
	{ name: 'Alto', value: 15, color: GAUGE_COLORS.warning },
	{ name: 'Crítico', value: 65, color: GAUGE_COLORS.danger },
];

function getFailureRateLevel(rate: number): { label: string; color: string } {
	if (rate <= 5) return { label: 'Excelente', color: 'text-success' };
	if (rate <= 10) return { label: 'Bom', color: 'text-accent' };
	if (rate <= 20) return { label: 'Médio', color: 'text-amber-500' };
	if (rate <= 35) return { label: 'Alto', color: 'text-warning' };
	return { label: 'Crítico', color: 'text-danger' };
}

function FailureRateGauge({ failureRate, isProcessing }: { failureRate: number; isProcessing?: boolean }) {
	const cx = 100;
	const cy = 85;
	const innerRadius = 50;
	const outerRadius = 75;
	const needle = getNeedleCoordinates(failureRate, cx, cy, innerRadius, outerRadius);
	const level = getFailureRateLevel(failureRate);

	return (
		<Card className={isProcessing ? 'opacity-70 transition-opacity duration-200' : 'transition-opacity duration-200'}>
			<Card.Header className="px-4 pt-3">
				<Card.Title className="flex items-center gap-2 text-sm">
					<Icon icon={Alert01Icon} className="icon-sm text-danger" />
					Taxa de Falhas
					<Tooltip>
						<Tooltip.Trigger>
							<Icon icon={InformationCircleIcon} className="icon-xs cursor-help text-muted opacity-60" />
						</Tooltip.Trigger>
						<Tooltip.Content className="max-w-64">
							<Tooltip.Arrow />
							{CHART_TOOLTIPS.failureGauge}
						</Tooltip.Content>
					</Tooltip>
				</Card.Title>
				<Card.Description className="text-xs">Quanto menor, melhor</Card.Description>
			</Card.Header>
			<Card.Content className="flex flex-col items-center px-4 pb-3">
				<PieChart width={200} height={110}>
					<Pie
						data={FAILURE_GAUGE_DATA}
						cx={cx}
						cy={cy}
						startAngle={180}
						endAngle={0}
						innerRadius={innerRadius}
						outerRadius={outerRadius}
						dataKey="value"
						stroke="none"
					>
						{FAILURE_GAUGE_DATA.map((entry, index) => (
							<Cell key={`cell-${index}`} fill={entry.color} />
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
					<span className="text-2xl font-bold">{failureRate.toFixed(1)}%</span>
					<span className={`text-xs font-medium ${level.color}`}>{level.label}</span>
				</div>
				<div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[10px] text-muted">
					<div className="flex items-center gap-1">
						<div className="h-2 w-2 rounded-full" style={{ backgroundColor: GAUGE_COLORS.success }} />
						<span>0-5%</span>
					</div>
					<div className="flex items-center gap-1">
						<div className="h-2 w-2 rounded-full" style={{ backgroundColor: GAUGE_COLORS.accent }} />
						<span>5-10%</span>
					</div>
					<div className="flex items-center gap-1">
						<div className="h-2 w-2 rounded-full" style={{ backgroundColor: GAUGE_COLORS.yellow }} />
						<span>10-20%</span>
					</div>
					<div className="flex items-center gap-1">
						<div className="h-2 w-2 rounded-full" style={{ backgroundColor: GAUGE_COLORS.warning }} />
						<span>20-35%</span>
					</div>
					<div className="flex items-center gap-1">
						<div className="h-2 w-2 rounded-full" style={{ backgroundColor: GAUGE_COLORS.danger }} />
						<span>35%+</span>
					</div>
				</div>
			</Card.Content>
		</Card>
	);
}
