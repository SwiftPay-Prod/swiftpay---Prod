'use client';

import React from 'react';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { AnimatedNumber } from '@/components/ui/animated-number';
import {
	RevolutAlertIcon,
	RevolutRefundIcon,
	RevolutLockIcon,
} from '@/components/ui/revolut-icons';
import type { MerchantKpiData } from '@/types/merchant/dashboard';

export interface RiskDisputesControlProps {
	kpis?: MerchantKpiData | null;
	isBalanceVisible: boolean;
	className?: string;
}

export function RiskDisputesControl({
	kpis,
	isBalanceVisible,
	className = '',
}: RiskDisputesControlProps) {
	const blurClass = isBalanceVisible ? '' : 'visual-blur';

	const chargebackCount = typeof kpis?.chargebackCount === 'number' ? kpis.chargebackCount : 0;
	const chargebackRate = typeof kpis?.chargebackRate === 'number' ? kpis.chargebackRate : 0;
	const refundedAmount = typeof kpis?.refundedAmount === 'number' ? kpis.refundedAmount : 0;
	const failedTransactions = typeof kpis?.failedTransactions === 'number' ? kpis.failedTransactions : 0;

	const isHealthyRisk = chargebackRate < 1.0;
	const hasActiveDisputes = chargebackCount > 0;
	const hasRefunds = refundedAmount > 0;
	const hasFailed = failedTransactions > 0;

	return (
		<div
			className={`flex flex-col justify-between gap-5 rounded-[20px] border border-white/12 bg-card p-6 sm:p-7 transition-all ${className}`}
		>
			<div className="flex items-center justify-between gap-3">
				<div className="flex flex-col gap-1">
					<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
						Controle de Risco & Disputas
					</span>
					<h3 className="text-base font-bold text-white tracking-tight">
						Prevenção de Perdas e Estornos
					</h3>
				</div>

				<div
					className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
						isHealthyRisk
							? 'border border-success/20 bg-success/10 text-success'
							: 'border border-danger/20 bg-danger/10 text-danger'
					}`}
				>
					{isHealthyRisk ? 'Risco Seguro (< 1%)' : 'Atenção ao Risco'}
				</div>
			</div>

			<div className="grid grid-cols-2 gap-3 font-mono">
				{/* Tile 1: Índice de Chargeback */}
				<div className="flex flex-col justify-between gap-2 rounded-[18px] border border-white/8 bg-surface-deep p-4 transition-all hover:border-white/15">
					<div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/50">
						<RevolutAlertIcon size={14} className={hasActiveDisputes ? 'text-danger' : 'text-white/40'} />
						<span>Taxa de Chargeback</span>
					</div>
					<div className="flex items-baseline gap-1.5">
						<span className={`text-lg font-bold ${hasActiveDisputes ? 'text-danger' : 'text-white'} ${blurClass}`}>
							<AnimatedNumber value={chargebackRate} suffix="%" maximumFractionDigits={2} />
						</span>
						<span className="text-[11px] text-white/40">limite 1.0%</span>
					</div>
				</div>

				{/* Tile 2: Disputas Abertas */}
				<div className="flex flex-col justify-between gap-2 rounded-[18px] border border-white/8 bg-surface-deep p-4 transition-all hover:border-white/15">
					<div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/50">
						<RevolutLockIcon size={14} className={hasActiveDisputes ? 'text-danger' : 'text-white/40'} />
						<span>Disputas / Contestações</span>
					</div>
					<div className="flex items-baseline gap-1.5">
						<span className={`text-lg font-bold ${hasActiveDisputes ? 'text-danger' : 'text-white'} ${blurClass}`}>
							<AnimatedNumber value={chargebackCount} />
						</span>
						<span className="text-[11px] text-white/40">casos</span>
					</div>
				</div>

				{/* Tile 3: Estornos */}
				<div className="flex flex-col justify-between gap-2 rounded-[18px] border border-white/8 bg-surface-deep p-4 transition-all hover:border-white/15">
					<div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/50">
						<RevolutRefundIcon size={14} className={hasRefunds ? 'text-danger' : 'text-white/40'} />
						<span>Estornos Devolvidos</span>
					</div>
					<div className="flex items-baseline gap-1.5">
						<span className={`text-lg font-bold ${hasRefunds ? 'text-danger' : 'text-white'} ${blurClass}`}>
							<AnimatedCurrency value={refundedAmount} />
						</span>
					</div>
				</div>

				{/* Tile 4: Transações Recusadas */}
				<div className="flex flex-col justify-between gap-2 rounded-[18px] border border-white/8 bg-surface-deep p-4 transition-all hover:border-white/15">
					<div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/50">
						<RevolutAlertIcon size={14} className={hasFailed ? 'text-warning' : 'text-white/40'} />
						<span>Recusas Operacionais</span>
					</div>
					<div className="flex items-baseline gap-1.5">
						<span className={`text-lg font-bold ${hasFailed ? 'text-warning' : 'text-white'} ${blurClass}`}>
							<AnimatedNumber value={failedTransactions} />
						</span>
						<span className="text-[11px] text-white/40">bloqueios</span>
					</div>
				</div>
			</div>
		</div>
	);
}
