'use client';

import React from 'react';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { AnimatedNumber } from '@/components/ui/animated-number';
import {
	RevolutPixIcon,
	RevolutWalletIcon,
	RevolutStatementIcon,
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

	// In this gateway, PIX is the primary capture method (100% of real live traffic)
	const pixVolume = totalVolume;
	const pixShare = totalVolume > 0 ? 100 : 0;

	const methods = [
		{
			id: 'pix',
			label: 'PIX Instantâneo',
			subLabel: 'Liquidação D+0 em tempo real',
			volume: pixVolume,
			share: pixShare,
			txCount: totalCompleted,
			icon: RevolutPixIcon,
			badge: 'Principal',
			color: '#00a87e',
		},
		{
			id: 'card',
			label: 'Cartão de Crédito',
			subLabel: 'Antifraude ativo · Liquidação D+30',
			volume: 0,
			share: 0,
			txCount: 0,
			icon: RevolutWalletIcon,
			badge: 'Ativo',
			color: '#494fdf',
		},
		{
			id: 'boleto',
			label: 'Boleto Bancário',
			subLabel: 'Compensação em 1 dia útil',
			volume: 0,
			share: 0,
			txCount: 0,
			icon: RevolutStatementIcon,
			badge: 'Ativo',
			color: '#ec7e00',
		},
	];

	return (
		<div
			className={`flex flex-col justify-between gap-5 rounded-[24px] border border-white/12 bg-[#16181a] p-6 sm:p-7 transition-all ${className}`}
		>
			<div className="flex flex-col gap-1">
				<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
					Meios de Captura
				</span>
				<h3 className="text-base font-bold text-white tracking-tight">
					Distribuição por Método de Pagamento
				</h3>
			</div>

			<div className="flex flex-col gap-3">
				{methods.map((method) => {
					const MethodIcon = method.icon;
					const isZero = method.volume === 0;

					return (
						<div
							key={method.id}
							className="flex flex-col gap-2.5 rounded-[18px] border border-white/8 bg-[#0a0a0a] p-4 transition-all hover:border-white/15"
						>
							<div className="flex items-center justify-between gap-3">
								<div className="flex items-center gap-3">
									<div
										className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors"
										style={{ backgroundColor: `${method.color}20`, color: method.color }}
									>
										<MethodIcon size={18} />
									</div>
									<div className="flex flex-col">
										<div className="flex items-center gap-2">
											<span className="text-sm font-semibold text-white">{method.label}</span>
											<span
												className="rounded-full px-2 py-0.2 text-[10px] font-semibold"
												style={{
													backgroundColor: `${method.color}15`,
													color: method.color,
													border: `1px solid ${method.color}30`,
												}}
											>
												{method.badge}
											</span>
										</div>
										<span className="text-xs text-white/40">{method.subLabel}</span>
									</div>
								</div>

								<div className="flex flex-col items-end font-mono">
									<span className={`text-sm font-bold ${isZero ? 'text-white/40' : 'text-white'} ${blurClass}`}>
										<AnimatedCurrency value={method.volume} />
									</span>
									<span className="text-[11px] text-white/40">
										{method.share}% · {method.txCount} txs
									</span>
								</div>
							</div>

							{/* Distribution Progress Bar */}
							<div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
								<div
									className="h-full rounded-full transition-all"
									style={{
										width: `${method.share}%`,
										backgroundColor: method.color,
									}}
								/>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
