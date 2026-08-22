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
	kpis?: MerchantKpiData | null;
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

	const completedTransactions = typeof kpis?.completedTransactions === 'number' ? kpis.completedTransactions : 0;
	const totalVolume = typeof kpis?.totalVolume === 'number' ? kpis.totalVolume : 0;
	const failedTransactions = typeof kpis?.failedTransactions === 'number' ? kpis.failedTransactions : 0;
	const refundedAmount = typeof kpis?.refundedAmount === 'number' ? kpis.refundedAmount : 0;
	const chargebackCount = typeof kpis?.chargebackCount === 'number' ? kpis.chargebackCount : 0;
	const chargebackRate = typeof kpis?.chargebackRate === 'number' ? kpis.chargebackRate : 0;

	const avgTicket = completedTransactions > 0 ? Math.round(totalVolume / completedTransactions) : 0;
	const hasFailed = failedTransactions > 0;
	const hasRefunded = refundedAmount > 0;
	const hasChargebacks = chargebackCount > 0;

	return (
		<div className={`grid grid-cols-2 gap-2.5 ${className}`}>
			{/* Tile 1: Ticket Médio */}
			<div className="flex flex-col justify-between gap-1.5 rounded-[16px] border border-white/8 bg-[#0a0a0a] p-3.5 transition-all hover:border-white/15">
				<div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/50">
					<RevolutTrendingUpIcon size={13} className="text-white/40" />
					<span>Ticket Médio</span>
				</div>
				<div className={`font-mono text-base font-bold tracking-tight text-white ${blurClass}`}>
					<AnimatedCurrency value={avgTicket} />
				</div>
			</div>

			{/* Tile 2: Recusadas */}
			<div className="flex flex-col justify-between gap-1.5 rounded-[16px] border border-white/8 bg-[#0a0a0a] p-3.5 transition-all hover:border-white/15">
				<div className="flex items-center justify-between gap-1">
					<div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/50">
						<RevolutAlertIcon size={13} className={hasFailed ? 'text-[#ec7e00]' : 'text-white/40'} />
						<span>Recusadas</span>
					</div>
					{hasFailed && (
						<span className="rounded border border-[#ec7e00]/20 bg-[#ec7e00]/10 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-[#ec7e00]">
							Alerta
						</span>
					)}
				</div>
				<div
					className={`font-mono text-base font-bold tracking-tight ${
						hasFailed ? 'text-[#ec7e00]' : 'text-white'
					} ${blurClass}`}
				>
					<AnimatedNumber value={failedTransactions} />
				</div>
			</div>

			{/* Tile 3: Estornos */}
			<div className="flex flex-col justify-between gap-1.5 rounded-[16px] border border-white/8 bg-[#0a0a0a] p-3.5 transition-all hover:border-white/15">
				<div className="flex items-center justify-between gap-1">
					<div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/50">
						<RevolutRefundIcon size={13} className={hasRefunded ? 'text-[#e23b4a]' : 'text-white/40'} />
						<span>Estornos</span>
					</div>
					{hasRefunded && (
						<span className="rounded border border-[#e23b4a]/20 bg-[#e23b4a]/10 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-[#e23b4a]">
							Estornado
						</span>
					)}
				</div>
				<div
					className={`font-mono text-base font-bold tracking-tight ${
						hasRefunded ? 'text-[#e23b4a]' : 'text-white'
					} ${blurClass}`}
				>
					<AnimatedCurrency value={refundedAmount} />
				</div>
			</div>

			{/* Tile 4: Chargebacks */}
			<div className="flex flex-col justify-between gap-1.5 rounded-[16px] border border-white/8 bg-[#0a0a0a] p-3.5 transition-all hover:border-white/15">
				<div className="flex items-center justify-between gap-1">
					<div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/50">
						<RevolutAlertIcon size={13} className={hasChargebacks ? 'text-[#e23b4a]' : 'text-white/40'} />
						<span>Chargebacks</span>
					</div>

					{chargebackRate > 0 && (
						<span className="rounded border border-[#e23b4a]/20 bg-[#e23b4a]/10 px-1 py-0.2 font-mono text-[10px] font-semibold text-[#e23b4a]">
							<AnimatedNumber value={chargebackRate} suffix="%" maximumFractionDigits={1} />
						</span>
					)}
				</div>
				<div
					className={`font-mono text-base font-bold tracking-tight ${
						hasChargebacks ? 'text-[#e23b4a]' : 'text-white'
					} ${blurClass}`}
				>
					<AnimatedNumber value={chargebackCount} />
				</div>
			</div>
		</div>
	);
}
