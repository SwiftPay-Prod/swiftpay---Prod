'use client';

import React from 'react';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { AnimatedNumber } from '@/components/ui/animated-number';
import {
	RevolutTrendingUpIcon,
	RevolutTrendingDownIcon,
	RevolutStatementIcon,
	RevolutCheckIcon,
	RevolutArrowUpRightIcon,
	RevolutArrowDownRightIcon,
} from '@/components/ui/revolut-icons';
import type { MerchantKpiData } from '@/types/merchant/dashboard';

export interface RevolutFinancialMetricsGridProps {
	kpis: MerchantKpiData;
	isBalanceVisible: boolean;
	className?: string;
}

export function RevolutFinancialMetricsGrid({
	kpis,
	isBalanceVisible,
	className = '',
}: RevolutFinancialMetricsGridProps) {
	const blurClass = isBalanceVisible ? '' : 'visual-blur';

	const volumeGrowth = kpis.volumeGrowth;
	const hasVolumeGrowth = volumeGrowth != null && !isNaN(volumeGrowth);
	const isVolumeGrowthPositive = hasVolumeGrowth && volumeGrowth > 0;
	const isVolumeGrowthNegative = hasVolumeGrowth && volumeGrowth < 0;

	const transactionsGrowth = kpis.transactionsGrowth;
	const hasTxGrowth = transactionsGrowth != null && !isNaN(transactionsGrowth);
	const isTxGrowthPositive = hasTxGrowth && transactionsGrowth > 0;

	const totalTransactions = kpis.totalTransactions ?? 0;
	const hasTransactions = totalTransactions > 0;
	const approvalRate = kpis.approvalRate ?? 0;
	const isHighApproval = hasTransactions && approvalRate >= 80;
	const isMediumApproval = hasTransactions && approvalRate >= 60 && approvalRate < 80;

	const ApprovalIcon = !hasTransactions || isHighApproval ? RevolutCheckIcon : RevolutAlertIcon;
	const iconBg = !hasTransactions
		? 'bg-white/5 text-white/50'
		: isHighApproval
			? 'bg-[#00a87e]/15 text-[#00a87e]'
			: isMediumApproval
				? 'bg-[#ec7e00]/15 text-[#ec7e00]'
				: 'bg-[#e23b4a]/15 text-[#e23b4a]';
	return (
		<div className={`grid grid-cols-1 gap-3.5 sm:grid-cols-3 ${className}`}>
			{/* Card 1: Faturamento Líquido */}
			<div className="flex flex-col justify-between gap-4 rounded-[20px] border border-white/12 bg-[#16181a] p-5 sm:p-6 transition-all hover:border-white/20">
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00a87e]/15 text-[#00a87e]">
							<RevolutTrendingUpIcon size={16} />
						</div>
						<span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
							Faturamento Líquido
						</span>
					</div>

					{/* Growth Pill */}
					{hasVolumeGrowth && volumeGrowth !== 0 && (
						<div
							className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
								isVolumeGrowthPositive
									? 'border border-[#00a87e]/20 bg-[#00a87e]/15 text-[#00a87e]'
									: isVolumeGrowthNegative
										? 'border border-[#e23b4a]/20 bg-[#e23b4a]/15 text-[#e23b4a]'
										: 'bg-white/5 text-white/60'
							}`}
						>
							{isVolumeGrowthPositive ? (
								<RevolutArrowUpRightIcon size={12} />
							) : (
								<RevolutArrowDownRightIcon size={12} />
							)}
							<AnimatedNumber
								value={volumeGrowth}
								prefix={isVolumeGrowthPositive ? '+' : undefined}
								suffix="%"
								maximumFractionDigits={1}
							/>
						</div>
					)}
				</div>

				<div className="flex flex-col gap-1">
					<div className={`font-mono text-2xl font-extrabold tracking-tight text-white sm:text-3xl ${blurClass}`}>
						<AnimatedCurrency value={kpis.totalNetVolume} />
					</div>
					<span className="text-xs text-white/50">Receita líquida no período selecionado</span>
				</div>
			</div>

			{/* Card 2: Volume Bruto */}
			<div className="flex flex-col justify-between gap-4 rounded-[20px] border border-white/12 bg-[#16181a] p-5 sm:p-6 transition-all hover:border-white/20">
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1]">
							<RevolutStatementIcon size={16} />
						</div>
						<span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
							Volume Bruto
						</span>
					</div>

					<span className="text-xs font-mono text-white/40">Total</span>
				</div>

				<div className="flex flex-col gap-1">
					<div className={`font-mono text-2xl font-extrabold tracking-tight text-white sm:text-3xl ${blurClass}`}>
						<AnimatedCurrency value={kpis.totalVolume} />
					</div>
					<span className="text-xs text-white/50">Total transacionado antes de taxas e estornos</span>
				</div>
			</div>

			{/* Card 3: Taxa de Aprovação / Conversão */}
			<div className="flex flex-col justify-between gap-4 rounded-[20px] border border-white/12 bg-[#16181a] p-5 sm:p-6 transition-all hover:border-white/20">
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<div className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconBg}`}>
							<ApprovalIcon size={16} />
						</div>
						<span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
							Taxa de Aprovação
						</span>
					</div>

					{/* Health Pill */}
					{!hasTransactions ? (
						<div className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-semibold text-white/50">
							Sem Vendas
						</div>
					) : (
						<div
							className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
								isHighApproval
									? 'border border-[#00a87e]/20 bg-[#00a87e]/15 text-[#00a87e]'
									: isMediumApproval
										? 'border border-[#ec7e00]/20 bg-[#ec7e00]/15 text-[#ec7e00]'
										: 'border border-[#e23b4a]/20 bg-[#e23b4a]/15 text-[#e23b4a]'
							}`}
						>
							{isHighApproval ? 'Excelente' : isMediumApproval ? 'Estável' : 'Atenção'}
						</div>
					)}
				</div>

				<div className="flex flex-col gap-1">
					<div className="flex items-baseline gap-2">
						<div className={`font-mono text-2xl font-extrabold tracking-tight text-white sm:text-3xl ${blurClass}`}>
							<AnimatedNumber value={approvalRate} suffix="%" maximumFractionDigits={1} />
						</div>

						{hasTxGrowth && transactionsGrowth !== 0 && (
							<span
								className={`inline-flex items-center text-xs font-mono font-medium ${
									isTxGrowthPositive ? 'text-[#00a87e]' : 'text-[#e23b4a]'
								}`}
							>
								{isTxGrowthPositive ? '+' : ''}
								{transactionsGrowth.toFixed(1)}%
							</span>
						)}
					</div>

					<span className="text-xs text-white/50 font-mono">
						<span className={`text-white/80 font-medium ${blurClass}`}>{kpis.completedTransactions}</span> de{' '}
						<span className="text-white/80 font-medium">{kpis.totalTransactions}</span> transações aprovadas
					</span>
				</div>
			</div>
		</div>
	);
}
