'use client';

import React, { useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrency } from '@/utils/currency';
import { RevolutAnalyticsIcon } from '@/components/ui/revolut-icons';
import type { MerchantDailyVolumeData, MerchantWeeklyVolumeData } from '@/types/merchant/dashboard';

const REVOLUT_COBALT = 'var(--brand)';

export type ChartMetricMode = 'volume' | 'transactions';

export interface RevolutAnalyticsChartProps {
	weeklyData?: MerchantWeeklyVolumeData[] | null;
	dailyData?: MerchantDailyVolumeData[] | null;
	isHourlyGranularity?: boolean;
	isProcessing?: boolean;
	className?: string;
}

export function RevolutAnalyticsChart({
	weeklyData = [],
	dailyData = [],
	isHourlyGranularity = false,
	isProcessing = false,
	className = '',
}: RevolutAnalyticsChartProps) {
	const [activeMode, setActiveMode] = useState<ChartMetricMode>('volume');

	const safeWeekly = Array.isArray(weeklyData) ? weeklyData : [];
	const safeDaily = Array.isArray(dailyData) ? dailyData : [];

	const rawData = isHourlyGranularity ? safeWeekly : safeDaily.length > 0 ? safeDaily : safeWeekly;

	const chartData = rawData.map((item) => {
		const label = 'label' in item ? item.label : new Date(item.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' });
		const volume = typeof item.volume === 'number' ? item.volume : 0;
		const transactionCount = typeof item.transactionCount === 'number' ? item.transactionCount : 0;

		return {
			label,
			volume,
			transactionCount,
		};
	});

	const metricTabs: Array<{ id: ChartMetricMode; label: string }> = [
		{ id: 'volume', label: 'Volume (R$)' },
		{ id: 'transactions', label: 'Transações (Qtd)' },
	];

	return (
		<div
			className={`flex flex-col gap-6 rounded-[20px] border border-white/12 bg-card p-6 sm:p-7 transition-all ${
				isProcessing ? 'opacity-70' : ''
			} ${className}`}
		>
			{/* Header: Title + Mode Pill Selector */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand/15 text-link">
						<RevolutAnalyticsIcon size={20} />
					</div>
					<div>
						<h2 className="text-base font-bold text-white tracking-tight">Performance e Tendência</h2>
						<p className="text-xs text-white/50">
							{isHourlyGranularity ? 'Fluxo detalhado nas últimas horas' : 'Evolução agregada no período selecionado'}
						</p>
					</div>
				</div>

				{/* Metric Mode Pill Selector */}
				<div className="flex items-center gap-1 rounded-full border border-white/10 bg-surface-deep p-1">
					{metricTabs.map((tab) => {
						const isActive = activeMode === tab.id;
						return (
							<button
								key={tab.id}
								type="button"
								onClick={() => setActiveMode(tab.id)}
								className={`rounded-full px-3.5 py-1.5 text-xs transition-all ${
									isActive
										? 'border border-white/15 bg-card font-semibold text-whitesm'
										: 'font-medium text-white/50 hover:text-white'
								}`}
							>
								{tab.label}
							</button>
						);
					})}
				</div>
			</div>

			{/* Chart Canvas */}
			<div className="h-56 w-full">
				<ResponsiveContainer width="100%" height="100%">
					<AreaChart data={chartData} margin={{ top: 12, right: 8, left: 8, bottom: 0 }}>
						<defs>
							<linearGradient id="revolutCobaltGradient" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor="var(--brand)" stopOpacity={0.45} />
								<stop offset="60%" stopColor="var(--brand)" stopOpacity={0.06} />
								<stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
							</linearGradient>
						</defs>

						<XAxis
							dataKey="label"
							tickLine={false}
							axisLine={false}
							tickMargin={12}
							fontSize={11}
							tick={{ fill: 'rgba(255, 255, 255, 0.40)', fontFamily: 'var(--font-mono, monospace)' }}
						/>
						<YAxis hide />

						<Tooltip
							content={({ active, payload }) => {
								if (!active || !payload || payload.length === 0) return null;
								const item = payload[0]?.payload;
								return (
									<div className="flex flex-col gap-1.5 rounded-2xl border border-white/15 bg-surface-deep/95 p-3.5  backdrop-blur-md font-mono text-xs text-white min-w-44">
										<span className="text-[11px] font-semibold uppercase text-white/50">{item.label}</span>
										<div className="flex items-center justify-between gap-4 pt-1 border-t border-white/10">
											<span className="text-white/70">
												{activeMode === 'volume' ? 'Volume' : 'Transações'}
											</span>
											<span className="font-bold text-link">
												{activeMode === 'volume'
													? formatCurrency(item.volume)
													: `${item.transactionCount} txs`}
											</span>
										</div>
									</div>
								);
							}}
						/>

						<Area
							type="monotone"
							dataKey={activeMode === 'volume' ? 'volume' : 'transactionCount'}
							stroke={REVOLUT_COBALT}
							strokeWidth={2.5}
							fill="url(#revolutCobaltGradient)"
							activeDot={{ r: 5, fill: '#ffffff', stroke: REVOLUT_COBALT, strokeWidth: 3 }}
						/>
					</AreaChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}
