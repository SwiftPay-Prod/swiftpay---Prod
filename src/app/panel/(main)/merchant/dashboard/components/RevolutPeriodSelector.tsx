'use client';

import React from 'react';
import type { DashboardPeriod } from '@/types/merchant/dashboard';
import { RevolutRefreshIcon } from '@/components/ui/revolut-icons';

export interface PeriodOptionItem {
	key: DashboardPeriod;
	label: string;
}

const REVOLUT_QUICK_PERIODS: PeriodOptionItem[] = [
	{ key: 'today', label: 'Hoje' },
	{ key: 'yesterday', label: 'Ontem' },
	{ key: '7d', label: '7 Dias' },
	{ key: '30d', label: '30 Dias' },
	{ key: 'this_month', label: 'Este Mês' },
	{ key: 'all', label: 'Total' },
];

export interface RevolutPeriodSelectorProps {
	selectedPeriod: DashboardPeriod;
	onPeriodChange: (period: DashboardPeriod) => void;
	onRefresh?: () => void;
	isRefreshing?: boolean;
	className?: string;
}

export function RevolutPeriodSelector({
	selectedPeriod,
	onPeriodChange,
	onRefresh,
	isRefreshing = false,
	className = '',
}: RevolutPeriodSelectorProps) {
	return (
		<div className={`flex items-center gap-2 ${className}`}>
			{/* Segmented Capsule Pill Container */}
			<div className="flex items-center gap-1 rounded-full border border-white/10 bg-[#0a0a0a] p-1 overflow-x-auto scrollbar-hide shadow-inner">
				{REVOLUT_QUICK_PERIODS.map((period) => {
					const isActive = selectedPeriod === period.key;
					return (
						<button
							key={period.key}
							type="button"
							onClick={() => onPeriodChange(period.key)}
							className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs transition-all ${
								isActive
									? 'border border-white/15 bg-[#16181a] font-semibold text-white shadow-sm'
									: 'font-medium text-white/60 hover:bg-white/5 hover:text-white'
							}`}
						>
							{period.label}
						</button>
					);
				})}
			</div>

			{/* Optional Integrated Refresh Pill */}
			{onRefresh && (
				<button
					type="button"
					onClick={onRefresh}
					disabled={isRefreshing}
					title="Atualizar dados"
					className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#0a0a0a] text-white/70 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-white disabled:opacity-50"
				>
					<RevolutRefreshIcon size={14} className={isRefreshing ? 'animate-spin text-[#4f55f1]' : ''} />
				</button>
			)}
		</div>
	);
}
