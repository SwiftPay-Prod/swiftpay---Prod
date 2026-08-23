'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Routes } from '@/router/routes';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import {
	RevolutWalletIcon,
	RevolutPlusIcon,
	RevolutArrowUpRightIcon,
	RevolutStatementIcon,
	RevolutEyeIcon,
	RevolutEyeOffIcon,
	RevolutInfoIcon,
	RevolutLockIcon,
} from '@/components/ui/revolut-icons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ReadMerchantDashboardData } from '@/types/merchant/dashboard';

export interface MerchantReserveConfig {
	pixReservePercentage: number;
	boletoReservePercentage: number;
	creditCardReservePercentage: number;
}

export interface RevolutHeroBalanceCardProps {
	balance?: ReadMerchantDashboardData['balance'] | null;
	isBalanceVisible: boolean;
	onToggleBalanceVisibility?: () => void;
	hasReserveEnabled?: boolean;
	reserveConfig?: MerchantReserveConfig | null;
	className?: string;
}

export function RevolutHeroBalanceCard({
	balance,
	isBalanceVisible,
	onToggleBalanceVisibility,
	hasReserveEnabled = false,
	reserveConfig = null,
	className = '',
}: RevolutHeroBalanceCardProps) {
	const router = useRouter();
	const blurClass = isBalanceVisible ? '' : 'visual-blur';

	const available = typeof balance?.available === 'number' ? balance.available : 0;
	const pending = typeof balance?.pending === 'number' ? balance.pending : 0;
	const reserved = typeof balance?.reserved === 'number' ? balance.reserved : 0;

	return (
		<div
			className={`relative overflow-hidden rounded-[20px] bg-[#16181a] border border-white/12 p-6 sm:p-7 transition-all ${className}`}
		>
			{/* Ambient Cobalt Glow */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#494fdf]/10 blur-3xl"
			/>

			<div className="relative z-10 flex flex-col justify-between gap-6">
				{/* Header: Label + Live Status & Visibility Toggle */}
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-2.5">
						<div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-white/90">
							<RevolutWalletIcon size={18} />
						</div>
						<div>
							<span className="text-[11px] font-semibold uppercase tracking-widest text-white/60">
								Saldo Disponível
							</span>
						</div>
					</div>

					<div className="flex items-center gap-2">
						{/* Real-time Status Badge */}
						<div className="inline-flex items-center gap-1.5 rounded-full border border-[#00a87e]/20 bg-[#00a87e]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#00a87e]">
							<span className="relative flex h-1.5 w-1.5">
								<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00a87e] opacity-75" />
								<span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#00a87e]" />
							</span>
							<span>Tempo Real</span>
						</div>

						{/* Balance Obfuscation Toggle */}
						{onToggleBalanceVisibility && (
							<button
								type="button"
								onClick={onToggleBalanceVisibility}
								title={isBalanceVisible ? 'Ocultar valores' : 'Mostrar valores'}
								className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
							>
								{isBalanceVisible ? <RevolutEyeOffIcon size={14} /> : <RevolutEyeIcon size={14} />}
							</button>
						)}
					</div>
				</div>

				{/* Primary Value: Hero Tabular Display */}
				<div className="flex flex-col gap-2">
					<div className={`font-mono text-3xl font-extrabold tracking-tight text-white sm:text-5xl ${blurClass}`}>
						<AnimatedCurrency value={available} />
					</div>

					{/* Secondary Balance Breakdown */}
					<div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-white/60 font-mono">
						<span className="inline-flex items-center gap-1">
							<span>Pendente:</span>
							<span className={`font-medium text-white/80 ${blurClass}`}>
								<AnimatedCurrency value={pending} />
							</span>
						</span>

						{hasReserveEnabled && reserved > 0 && reserveConfig && (
							<>
								<span className="text-white/20">·</span>
								<span className="inline-flex items-center gap-1">
									<RevolutLockIcon size={12} className="text-white/50" />
									<span>Reserva:</span>
									<span className={`font-medium text-white/80 ${blurClass}`}>
										<AnimatedCurrency value={reserved} />
									</span>
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger className="cursor-help text-white/40 hover:text-white/70 inline-flex items-center">
												<RevolutInfoIcon size={12} />
											</TooltipTrigger>
											<TooltipContent
												side="top"
												className="max-w-64 border-white/12 bg-[#0a0a0a] text-xs text-white shadow-xl"
											>
												<p className="font-semibold text-white/90">Retenção de Reserva:</p>
												<p className="mt-1 text-white/70">
													Taxa de garantia PIX {reserveConfig.pixReservePercentage}% retida conforme contrato de operação.
												</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</span>
							</>
						)}
					</div>
				</div>

				{/* Pill Actions Group */}
				<div className="flex flex-wrap items-center gap-2.5 pt-1">
					{/* Primary White Button */}
					<button
						type="button"
						onClick={() => router.push(Routes.panel.merchant.checkoutsUpsert('new'))}
						className="button-primary"
					>
						<RevolutPlusIcon size={16} />
						<span>Criar Cobrança</span>
					</button>

					{/* Secondary Saque Button */}
					<button
						type="button"
						onClick={() => router.push(Routes.panel.merchant.cashouts)}
						className="button-outline-dark"
					>
						<RevolutArrowUpRightIcon size={16} />
						<span>Solicitar Saque</span>
					</button>

					{/* Secondary Extrato Button */}
					<button
						type="button"
						onClick={() => router.push(Routes.panel.merchant.balanceHistory)}
						className="button-outline-dark"
					>
						<RevolutStatementIcon size={16} />
						<span>Extrato de Saldo</span>
					</button>
				</div>
			</div>
		</div>
	);
}
