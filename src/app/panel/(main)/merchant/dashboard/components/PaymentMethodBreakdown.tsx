'use client';

import React from 'react';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { AnimatedNumber } from '@/components/ui/animated-number';
import {
	RevolutPixIcon,
	RevolutCheckIcon,
	RevolutAnalyticsIcon,
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
	const totalCompleted = typeof kpis?.completedTransactions === 'number' ? kpis.completedTransactions : 0;
	const totalTransactions = typeof kpis?.totalTransactions === 'number' ? kpis.totalTransactions : 0;
	const approvalRate = typeof kpis?.approvalRate === 'number' ? kpis.approvalRate : 0;

	return (
		<div
			className={`flex flex-col justify-between gap-5 rounded-[24px] border border-white/12 bg-[#16181a] p-6 sm:p-7 transition-all ${className}`}
		>
			<div className="flex items-center justify-between gap-3">
				<div className="flex flex-col gap-1">
					<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
						Infraestrutura PIX Exclusiva
					</span>
					<h3 className="text-base font-bold text-white tracking-tight">
						Desempenho da Captura Instantânea
					</h3>
				</div>

				<div className="inline-flex items-center gap-1.5 rounded-full border border-[#00a87e]/20 bg-[#00a87e]/10 px-2.5 py-0.5 text-xs font-semibold text-[#00a87e]">
					<span className="relative flex h-1.5 w-1.5">
						<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00a87e] opacity-75" />
						<span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#00a87e]" />
					</span>
					<span>PIX D+0 Ativo</span>
				</div>
			</div>

			<div className="flex flex-col gap-3 font-mono">
				{/* Block 1: PIX Dinâmico Volume */}
				<div className="flex flex-col gap-2.5 rounded-[18px] border border-white/8 bg-[#0a0a0a] p-4 transition-all hover:border-white/15">
					<div className="flex items-center justify-between gap-3">
						<div className="flex items-center gap-3">
							<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00a87e]/15 text-[#00a87e]">
								<RevolutPixIcon size={18} />
							</div>
							<div className="flex flex-col font-sans">
								<div className="flex items-center gap-2">
									<span className="text-sm font-semibold text-white">PIX QR Code & Copia e Cola</span>
									<span className="rounded-full border border-[#00a87e]/30 bg-[#00a87e]/15 px-2 py-0.2 text-[10px] font-semibold text-[#00a87e]">
										100% Volume
									</span>
								</div>
								<span className="text-xs text-white/40">Liquidação imediata D+0 sem intermediários</span>
							</div>
						</div>

						<div className="flex flex-col items-end">
							<span className={`text-sm font-bold text-white ${blurClass}`}>
								<AnimatedCurrency value={totalVolume} />
							</span>
							<span className="text-[11px] text-white/40">{totalCompleted} liquidados</span>
						</div>
					</div>

					{/* 100% Active PIX Bar */}
					<div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
						<div
							className="h-full rounded-full bg-[#00a87e] transition-all"
							style={{ width: totalVolume > 0 ? '100%' : '0%' }}
						/>
					</div>
				</div>

				{/* Block 2: Velocidade & Eficiência de Liquidação */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div className="flex items-center justify-between rounded-[18px] border border-white/8 bg-[#0a0a0a] p-4">
						<div className="flex items-center gap-2.5 font-sans">
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1]">
								<RevolutCheckIcon size={16} />
							</div>
							<div className="flex flex-col">
								<span className="text-xs font-semibold text-white">Tempo de Confirmação</span>
								<span className="text-[11px] text-white/40">SPI / Banco Central</span>
							</div>
						</div>
						<span className="text-xs font-bold text-[#00a87e]">Instantâneo (&lt; 3s)</span>
					</div>

					<div className="flex items-center justify-between rounded-[18px] border border-white/8 bg-[#0a0a0a] p-4">
						<div className="flex items-center gap-2.5 font-sans">
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00a87e]/15 text-[#00a87e]">
								<RevolutAnalyticsIcon size={16} />
							</div>
							<div className="flex flex-col">
								<span className="text-xs font-semibold text-white">Conversão de QR Code</span>
								<span className="text-[11px] text-white/40">{totalCompleted} de {totalTransactions} pagos</span>
							</div>
						</div>
						<span className={`text-xs font-bold text-white ${blurClass}`}>
							<AnimatedNumber value={approvalRate} suffix="%" maximumFractionDigits={1} />
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
