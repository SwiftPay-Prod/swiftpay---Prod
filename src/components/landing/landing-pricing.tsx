'use client';

import React, { useState } from 'react';
import { Icon } from '@/components/ui/icon';
import {
	CalculatorIcon,
	CheckmarkCircle02Icon,
	ArrowRight01Icon,
} from '@hugeicons/core-free-icons';

interface LandingPricingProps {
	onOpenAuth: (mode: 'signin' | 'signup') => void;
}

export function LandingPricing({ onOpenAuth }: LandingPricingProps) {
	const [monthlyVolume, setMonthlyVolume] = useState(100000); // R$ 100.000 default

	// Calculations
	// Standard card/gateway rate ~2.99% vs SwiftPay competitive PIX fee ~0.99%
	const traditionalFee = monthlyVolume * 0.0299;
	const swiftpayFee = monthlyVolume * 0.0099;
	const monthlySavings = traditionalFee - swiftpayFee;
	const annualSavings = monthlySavings * 12;

	const formatCurrency = (val: number) => {
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL',
			maximumFractionDigits: 0,
		}).format(val);
	};

	return (
		<section id="pricing" className="relative py-16 sm:py-24 bg-[#0B0E14] border-t border-border/40">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				
				<div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
					<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border/80 bg-surface-secondary text-xs font-semibold text-[#A3E635]">
						<Icon icon={CalculatorIcon} className="w-3.5 h-3.5" />
						<span>TRANSPARÊNCIA & ECONOMIA</span>
					</div>
					<h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
						Calcule quanto você economiza com a SwiftPay.
					</h2>
					<p className="text-base sm:text-lg text-muted-foreground">
						Sem mensalidades oculta, sem taxa de adesão e com a menor taxa de PIX do mercado.
					</p>
				</div>

				{/* Calculator Box */}
				<div className="max-w-4xl mx-auto rounded-2xl border border-[#1E2638] bg-[#121721] p-6 sm:p-10 shadow-2xl space-y-8">
					
					{/* Slider Control */}
					<div className="space-y-4">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
							<span className="text-sm font-semibold text-foreground">
								Seu Volume de Faturamento Mensal (R$)
							</span>
							<span className="text-2xl font-extrabold font-mono text-[#A3E635] tabular-nums">
								{formatCurrency(monthlyVolume)} / mês
							</span>
						</div>

						<input
							type="range"
							min="10000"
							max="1000000"
							step="10000"
							value={monthlyVolume}
							onChange={(e) => setMonthlyVolume(Number(e.target.value))}
							className="w-full h-2.5 bg-surface-secondary rounded-lg appearance-none cursor-pointer accent-[#A3E635]"
						/>

						<div className="flex justify-between text-xs font-mono text-muted-foreground">
							<span>R$ 10.000</span>
							<span>R$ 500.000</span>
							<span>R$ 1.000.000+</span>
						</div>
					</div>

					{/* Comparison Grid */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-border/40">
						
						{/* Traditional Gateways */}
						<div className="rounded-xl border border-border/60 bg-[#090C10] p-5 space-y-3">
							<div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
								Outros Gateways & Adquirentes
							</div>
							<div className="text-xl font-extrabold font-mono text-rose-400 tabular-nums">
								~ {formatCurrency(traditionalFee)} / mês
							</div>
							<ul className="text-xs text-muted-foreground space-y-1.5">
								<li>• Taxa média de 2,99% a 3,99% por venda</li>
								<li>• Prazo de liquidação: D+14 a D+30</li>
								<li>• Mensalidade ou taxa de adesão oculta</li>
							</ul>
						</div>

						{/* SwiftPay Savings */}
						<div className="rounded-xl border border-[#A3E635]/40 bg-[#121721] p-5 space-y-3 shadow-[0_0_20px_rgba(163,230,53,0.06)]">
							<div className="text-xs font-bold text-[#A3E635] uppercase tracking-wider">
								Com a SwiftPay (Economia Estimada)
							</div>
							<div className="text-2xl font-extrabold font-mono text-foreground tabular-nums">
								Economia de <span className="text-[#A3E635]">{formatCurrency(monthlySavings)}</span> / mês
							</div>
							<div className="text-xs font-semibold text-emerald-400">
								~ {formatCurrency(annualSavings)} economizados por ano!
							</div>
							<ul className="text-xs text-foreground font-medium space-y-1.5 pt-1">
								<li className="flex items-center gap-1.5">
									<Icon icon={CheckmarkCircle02Icon} className="w-3.5 h-3.5 text-[#A3E635]" />
									<span>Liquidação Instantânea D+0</span>
								</li>
								<li className="flex items-center gap-1.5">
									<Icon icon={CheckmarkCircle02Icon} className="w-3.5 h-3.5 text-[#A3E635]" />
									<span>Zero Mensalidade ou Anuidade</span>
								</li>
							</ul>
						</div>

					</div>

					{/* CTA inside calculator */}
					<div className="pt-2 flex justify-center">
						<button
							type="button"
							onClick={() => onOpenAuth('signup')}
							className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#A3E635] px-8 py-3.5 text-sm font-bold text-[#0B0E14] shadow-md hover:bg-[#b2f042] transition-all"
						>
							<span>Começar a Economizar Agora</span>
							<Icon icon={ArrowRight01Icon} className="w-4 h-4 transition-transform group-hover:translate-x-1" />
						</button>
					</div>

				</div>

			</div>
		</section>
	);
}
