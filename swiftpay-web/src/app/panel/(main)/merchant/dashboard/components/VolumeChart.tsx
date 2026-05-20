'use client';

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { Analytics02Icon, InformationCircleIcon } from '@hugeicons/core-free-icons';
import { Card, Spinner, Tooltip } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { formatCurrency } from '@/utils/currency';
import type { MerchantDailyVolumeData, MerchantWeeklyVolumeData } from '@/types/merchant/dashboard';

const volumeChartConfig = {
	volume: {
		label: 'Volume',
		color: 'var(--accent)',
	},
} satisfies ChartConfig;

interface VolumeChartProps {
	data: MerchantDailyVolumeData[];
	adaptiveData: MerchantWeeklyVolumeData[];
	isHourlyGranularity: boolean;
	isProcessing?: boolean;
	periodLabel?: string;
}

export function VolumeChart({ data, adaptiveData, isHourlyGranularity, isProcessing, periodLabel }: VolumeChartProps) {
	const chartData = isHourlyGranularity
		? adaptiveData.map((item) => ({
				date: item.label,
				volume: item.volume,
				transactionCount: item.transactionCount,
			}))
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
							Mostra quanto você recebeu por dia. Cada barra representa o total de um dia. Passe o mouse sobre as barras para
							ver os valores.
						</Tooltip.Content>
					</Tooltip>
					{isProcessing && <Spinner size="sm" className="ml-2" />}
				</Card.Title>
				<Card.Description className="text-xs">{periodLabel || 'Últimos 7 dias'}</Card.Description>
			</Card.Header>
			<Card.Content className="px-4 pb-3">
				<ChartContainer config={volumeChartConfig} className="h-32 w-full">
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
