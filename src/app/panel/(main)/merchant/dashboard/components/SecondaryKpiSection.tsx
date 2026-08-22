'use client';

import React from 'react';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { AnimatedNumber } from '@/components/ui/animated-number';
import {
	RevolutRefundIcon,
	RevolutAlertIcon,
	RevolutTrendingUpIcon,
} from '@/components/ui/revolut-icons';
import type { MerchantKpiData, DashboardCacheInfo } from '@/types/merchant/dashboard';

export interface SecondaryKpiSectionProps {
	kpis: MerchantKpiData;
	cacheInfo?: DashboardCacheInfo;
	isBalanceVisible: boolean;
	className?: string;
}

export function SecondaryKpiSection({
	kpis,
	isBalanceVisible,
	className = '',
}: SecondaryKpiSectionProps) {
	const blurClass = isBalanceVisible ? '' : 'visual-blur';
	const avgTicket = kpis.completedTransactions > 0 ? Math.round(kpis.totalVolume / kpis.completedTransactions) : 0;

	return (
		<div className={`grid grid-cols-2 gap-2.5 ${className}`}>
			{/* Tile 1: Ticket Médio */}
			<div className="flex flex-col justify-between gap-1.5 rounded-[16px] border border-white/8 bg-[#0a0a0a] p-3.5 transition-all hover:border-white/15">
				<div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/50">
					<RevolutTrendingUpIcon size={13} className="text-[#00a87e]" />
					<span>Ticket Médio</span>
				</div>
				<div className={`font-mono text-base font-bold tracking-tight text-white ${blurClass}`}>
					<AnimatedCurrency value={avgTicket} />
				</div>
			</div>

			{/* Tile 2: Recusadas */}
			<div className="flex flex-col justify-between gap-1.5 rounded-[16px] border border-white/8 bg-[#0a0a0a] p-3.5 transition-all hover:border-white/15">
				<div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#ec7e00]/90">
					<RevolutAlertIcon size={13} className="text-[#ec7e00]" />
					<span>Recusadas</span>
				</div>
				<div className={`font-mono text-base font-bold tracking-tight text-[#ec7e00] ${blurClass}`}>
					<AnimatedNumber value={kpis.failedTransactions} />
				</div>
			</div>

			{/* Tile 3: Estornos */}
			<div className="flex flex-col justify-between gap-1.5 rounded-[16px] border border-white/8 bg-[#0a0a0a] p-3.5 transition-all hover:border-white/15">
				<div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#e23b4a]/90">
					<RevolutRefundIcon size={13} className="text-[#e23b4a]" />
					<span>Estornos</span>
				</div>
				<div className={`font-mono text-base font-bold tracking-tight text-[#e23b4a] ${blurClass}`}>
					<AnimatedCurrency value={kpis.refundedAmount} />
				</div>
			</div>

			{/* Tile 4: Chargebacks */}
			<div className="flex flex-col justify-between gap-1.5 rounded-[16px] border border-white/8 bg-[#0a0a0a] p-3.5 transition-all hover:border-white/15">
				<div className="flex items-center justify-between gap-1">
					<div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#e23b4a]/90">
						<RevolutAlertIcon size={13} className="text-[#e23b4a]" />
						<span>Chargebacks</span>
					</div>

					{kpis.chargebackRate > 0 && (
						<span className="rounded border border-[#e23b4a]/20 bg-[#e23b4a]/10 px-1 py-0.2 font-mono text-[10px] font-semibold text-[#e23b4a]">
							<AnimatedNumber value={kpis.chargebackRate} suffix="%" maximumFractionDigits={1} />
						</span>
					)}
				</div>
				<div className={`font-mono text-base font-bold tracking-tight text-[#e23b4a] ${blurClass}`}>
					<AnimatedNumber value={kpis.chargebackCount} />
				</div>
			</div>
		</div>
	);
}
