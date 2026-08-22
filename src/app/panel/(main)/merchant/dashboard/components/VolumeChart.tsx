'use client';

import React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { formatCurrency } from '@/utils/currency';
import { RevolutAnalyticsIcon } from '@/components/ui/revolut-icons';
import type { MerchantDailyVolumeData, MerchantWeeklyVolumeData } from '@/types/merchant/dashboard';

const REVOLUT_ACCENT = '#494fdf';

const volumeChartConfig = {
	volume: {
		label: 'Volume',
		color: REVOLUT_ACCENT,
	},
} satisfies ChartConfig;

export interface VolumeChartProps {
	data?: MerchantDailyVolumeData[] | null;
	adaptiveData?: MerchantWeeklyVolumeData[] | null;
	isHourlyGranularity?: boolean;
	isProcessing?: boolean;
	periodLabel?: string;
	className?: string;
}

function formatChartDate(dateStr?: string): string {
	if (!dateStr) return '';
	const parsed = new Date(dateStr);
	if (isNaN(parsed.getTime())) {
		return dateStr;
	}
	return parsed.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' });
}

export function VolumeChart({
	data = [],
	adaptiveData = [],
	isHourlyGranularity = false,
	isProcessing = false,
	periodLabel,
	className = '',
}: VolumeChartProps) {
	const safeAdaptive = Array.isArray(adaptiveData) ? adaptiveData : [];
	const safeData = Array.isArray(data) ? data : [];

	const chartData = isHourlyGranularity
		? safeAdaptive.map((item) => ({
				date: item?.label ?? '',
				volume: typeof item?.volume === 'number' ? item.volume : 0,
				transactionCount: typeof item?.transactionCount === 'number' ? item.transactionCount : 0,
			}))
		: safeData.map((item) => ({
				date: formatChartDate(item?.date),
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
							{isHourlyGranularity ? 'Volume por Hora' : 'Volume Diário'}
						</div>
						<p className="text-xs text-white/50">{periodLabel || 'Distribuição no período selecionado'}</p>
					</div>
				</div>

				{isProcessing && (
					<div className="h-4 w-4 animate-spin rounded-full border-2 border-[#4f55f1] border-t-transparent" />
				)}
			</div>

			<ChartContainer config={volumeChartConfig} className="h-44 w-full">
				<BarChart accessibilityLayer data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
					<CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />

					<XAxis
						dataKey="date"
						tickLine={false}
						tickMargin={8}
						axisLine={false}
						fontSize={10}
						tick={{ fill: 'rgba(255, 255, 255, 0.45)', fontFamily: 'var(--font-mono, monospace)' }}
					/>

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
										`${value} transações`
									)
								}
							/>
						}
					/>

					<Bar
						dataKey="volume"
						fill={REVOLUT_ACCENT}
						radius={[4, 4, 0, 0]}
						maxBarSize={40}
					/>
				</BarChart>
			</ChartContainer>
		</div>
	);
}
