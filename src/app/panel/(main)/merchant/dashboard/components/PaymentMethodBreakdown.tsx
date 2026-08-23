'use client';

import React from 'react';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { AnimatedNumber } from '@/components/ui/animated-number';
import {
	RevolutPixIcon,
	RevolutTrendingUpIcon,
	RevolutAlertIcon,
} from '@/components/ui/revolut-icons';
import type { MerchantKpiData } from '@/types/merchant/dashboard';

export interface PaymentMethodBreakdownProps {
	kpis?: MerchantKpiData | null;
	isBalanceVisible: boolean;
	className?: string;
}

export function PaymentMethodBreakdown({
	kpis,
	isBalanceVisible,
	className = '',
}: PaymentMethodBreakdownProps) {
	const blurClass = isBalanceVisible ? '' : 'visual-blur';

	const totalVolume = typeof kpis?.totalVolume === 'number' ? kpis.totalVolume : 0;
	const totalNetVolume = typeof kpis?.totalNetVolume === 'number' ? kpis.totalNetVolume : 0;
	const totalCompleted = typeof kpis?.completedTransactions === 'number' ? kpis.completedTransactions : 0;
	const totalTransactions = typeof kpis?.totalTransactions === 'number' ? kpis.totalTransactions : 0;
	const approvalRate = typeof kpis?.approvalRate === 'number' ? kpis.approvalRate : 0;
	const failedTransactions = typeof kpis?.failedTransactions === 'number' ? kpis.failedTransactions : 0;

	const unpaidTransactions = Math.max(totalTransactions - totalCompleted, failedTransactions);
	const avgTicket = totalCompleted > 0 ? Math.round(totalVolume / totalCompleted) : 0;

	return (
		<div
			className={`flex flex-col justify-between gap-5 rounded-[20px] border border-white/12 bg-[#16181a] p-6 sm:p-7 transition-all ${className}`}
		>
			<div className="flex items-center justify-between gap-3">
				<div className="flex flex-col gap-1">
					<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
						Operações PIX
					</span>
					<h3 className="text-base font-bold text-white tracking-tight">
						Desempenho da Captura Instantânea
					</h3>
				</div>

				<div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0a0a0a] px-3 py-1 text-xs font-mono text-white/60">
					<span>Conversão:</span>
					<span className={`font-bold text-white ${blurClass}`}>{approvalRate.toFixed(1)}%</span>
				</div>
			</div>

			<div className="flex flex-col gap-3 font-mono">
				{/* Block 1: Real PIX Volume & Conversion */}
				<div className="flex flex-col gap-3 rounded-[18px] border border-white/8 bg-[#0a0a0a] p-4 transition-all hover:border-white/15">
					<div className="flex items-center justify-between gap-3">
						<div className="flex items-center gap-3">
							<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00a87e]/15 text-[#00a87e]">
								<RevolutPixIcon size={18} />
							</div>
							<div className="flex flex-col font-sans">
								<span className="text-sm font-semibold text-white">PIX Dinâmico (QR Code & Copia e Cola)</span>
								<span className="text-xs text-white/40 font-mono">
									{totalCompleted} de {totalTransactions} cobranças pagas
								</span>
							</div>
						</div>

						<div className="flex flex-col items-end">
							<span className={`text-sm font-bold text-white ${blurClass}`}>
								<AnimatedCurrency value={totalVolume} />
							</span>
							<span className="text-[11px] text-white/40">
								Líquido: <span className={blurClass}><AnimatedCurrency value={totalNetVolume} /></span>
							</span>
						</div>
					</div>

					{/* Real Conversion Progress Bar */}
					<div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
						<div
							className="h-full rounded-full bg-[#00a87e] transition-all"
							style={{ width: `${Math.min(approvalRate, 100)}%` }}
						/>
					</div>
				</div>

				{/* Block 2: Real Database Sub-metrics */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div className="flex items-center justify-between rounded-[18px] border border-white/8 bg-[#0a0a0a] p-4">
						<div className="flex items-center gap-2.5 font-sans">
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1]">
								<RevolutTrendingUpIcon size={16} />
							</div>
							<div className="flex flex-col">
								<span className="text-xs font-semibold text-white">Ticket Médio</span>
								<span className="text-[11px] text-white/40">Por PIX liquidado</span>
							</div>
						</div>
						<span className={`text-xs font-bold text-white ${blurClass}`}>
							<AnimatedCurrency value={avgTicket} />
						</span>
					</div>

					<div className="flex items-center justify-between rounded-[18px] border border-white/8 bg-[#0a0a0a] p-4">
						<div className="flex items-center gap-2.5 font-sans">
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/50">
								<RevolutAlertIcon size={16} />
							</div>
							<div className="flex flex-col">
								<span className="text-xs font-semibold text-white">Não Concluídas</span>
								<span className="text-[11px] text-white/40">Não pagas / expiradas</span>
							</div>
						</div>
						<span className={`text-xs font-bold ${unpaidTransactions > 0 ? 'text-white' : 'text-white/40'} ${blurClass}`}>
							<AnimatedNumber value={unpaidTransactions} />
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
