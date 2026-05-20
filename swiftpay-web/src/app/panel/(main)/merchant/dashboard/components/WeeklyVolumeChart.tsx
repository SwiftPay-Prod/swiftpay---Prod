'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { AnalyticsUpIcon, InformationCircleIcon } from '@hugeicons/core-free-icons';
import { Card, Spinner, Tooltip } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { formatCurrency } from '@/utils/currency';
import type { MerchantWeeklyVolumeData } from '@/types/merchant/dashboard';

const ACCENT = 'var(--accent)';

const weeklyChartConfig = {
	volume: {
		label: 'Faturamento',
		color: ACCENT,
	},
} satisfies ChartConfig;

interface WeeklyVolumeChartProps {
	data: MerchantWeeklyVolumeData[];
	isHourlyGranularity: boolean;
	isProcessing?: boolean;
}

export function WeeklyVolumeChart({ data, isHourlyGranularity, isProcessing }: WeeklyVolumeChartProps) {
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
							Mostra a tendência do seu faturamento. A linha ajuda a visualizar se seus ganhos estão crescendo ou
							diminuindo.
						</Tooltip.Content>
					</Tooltip>
					{isProcessing && <Spinner size="sm" className="ml-2" />}
				</Card.Title>
				<Card.Description className="text-xs">
					{isHourlyGranularity ? 'Últimas horas do período' : 'Período selecionado (agrupado por dia)'}
				</Card.Description>
			</Card.Header>
			<Card.Content className="px-4 pb-3">
				<ChartContainer config={weeklyChartConfig} className="h-32 w-full">
					<AreaChart accessibilityLayer data={chartData}>
						<defs>
							<linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor={ACCENT} stopOpacity={0.3} />
								<stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
							</linearGradient>
						</defs>
						<CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-default-200" />
						<XAxis dataKey="week" tickLine={false} tickMargin={6} axisLine={false} fontSize={9} />
						<YAxis hide />
						<ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />} />
						<Area type="monotone" dataKey="volume" stroke={ACCENT} strokeWidth={2} fill="url(#volumeGradient)" />
					</AreaChart>
				</ChartContainer>
			</Card.Content>
		</Card>
	);
}
