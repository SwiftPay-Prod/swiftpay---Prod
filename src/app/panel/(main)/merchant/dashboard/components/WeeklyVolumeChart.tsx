'use client';

import React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { formatCurrency } from '@/utils/currency';
import { RevolutAnalyticsIcon } from '@/components/ui/revolut-icons';
import type { MerchantWeeklyVolumeData } from '@/types/merchant/dashboard';

const REVOLUT_COBALT = '#4f55f1';

const weeklyChartConfig = {
	volume: {
		label: 'Faturamento',
		color: REVOLUT_COBALT,
	},
} satisfies ChartConfig;

export interface WeeklyVolumeChartProps {
	data?: MerchantWeeklyVolumeData[] | null;
	isHourlyGranularity?: boolean;
	isProcessing?: boolean;
	className?: string;
}

export function WeeklyVolumeChart({
	data = [],
	isHourlyGranularity = false,
	isProcessing = false,
	className = '',
}: WeeklyVolumeChartProps) {
	const safeData = Array.isArray(data) ? data : [];
	const chartData = safeData.map((item) => ({
		week: item?.label ?? '',
		volume: typeof item?.volume === 'number' ? item.volume : 0,
		transactionCount: typeof item?.transactionCount === 'number' ? item.transactionCount : 0,
	}));

	return (
		<div
			className={`rounded-[20px] border border-white/12 bg-[#16181a] p-5 sm:p-6 transition-all hover:border-white/20 ${
				isProcessing ? 'opacity-70' : ''
			} ${className}`}
		>
			<div className="flex items-center justify-between gap-2 pb-4">
				<div className="flex items-center gap-2.5">
					<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1]">
						<RevolutAnalyticsIcon size={16} />
					</div>
					<div>
						<div className="text-sm font-semibold text-white tracking-tight">
							{isHourlyGranularity ? 'Evolução por Hora' : 'Evolução do Faturamento'}
						</div>
						<p className="text-xs text-white/50">
							{isHourlyGranularity ? 'Últimas horas do período' : 'Tendência de receita agrupada por dia'}
						</p>
					</div>
				</div>

				{isProcessing && (
					<div className="h-4 w-4 animate-spin rounded-full border-2 border-[#4f55f1] border-t-transparent" />
				)}
			</div>

			<ChartContainer config={weeklyChartConfig} className="h-44 w-full">
				<AreaChart accessibilityLayer data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
					<defs>
						<linearGradient id="revolutWeeklyGradient" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="#494fdf" stopOpacity={0.35} />
							<stop offset="60%" stopColor="#494fdf" stopOpacity={0.08} />
							<stop offset="100%" stopColor="#494fdf" stopOpacity={0} />
						</linearGradient>
					</defs>

					<CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />

					<XAxis
						dataKey="week"
						tickLine={false}
						tickMargin={8}
						axisLine={false}
						fontSize={10}
						tick={{ fill: 'rgba(255, 255, 255, 0.45)', fontFamily: 'var(--font-mono, monospace)' }}
					/>
					<YAxis hide />

					<ChartTooltip
						content={
							<ChartTooltipContent
								className="border border-white/15 bg-[#0a0a0a]/95 backdrop-blur-md text-white shadow-2xl rounded-xl"
								formatter={(value, name) =>
									name === 'volume' ? (
										<span className="font-mono font-semibold text-[#4f55f1]">
											{formatCurrency(typeof value === 'number' ? value : 0)}
										</span>
									) : (
										`${value}`
									)
								}
							/>
						}
					/>

					<Area
						type="monotone"
						dataKey="volume"
						stroke={REVOLUT_COBALT}
						strokeWidth={2.5}
						fill="url(#revolutWeeklyGradient)"
						activeDot={{ r: 4, fill: '#ffffff', stroke: REVOLUT_COBALT, strokeWidth: 2 }}
					/>
				</AreaChart>
			</ChartContainer>
		</div>
	);
}
