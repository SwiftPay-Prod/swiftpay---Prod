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
		<section id="pricing" className="relative py-16 sm:py-24 bg-[#000000] border-t border-white/10 text-white">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				
				<div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
					<div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-white/12 bg-[#16181a] text-xs font-semibold text-[#4f55f1]">
						<Icon icon={CalculatorIcon} className="w-3.5 h-3.5" />
						<span className="font-mono">TRANSPARÊNCIA & ECONOMIA</span>
					</div>
					<h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
						Calcule quanto você economiza com a SwiftPay.
					</h2>
					<p className="text-base sm:text-lg text-white/60">
						Sem mensalidades ocultas, sem taxa de adesão e com a liquidação PIX instantânea.
					</p>
				</div>

				{/* Calculator Box */}
				<div className="max-w-4xl mx-auto rounded-2xl border border-white/12 bg-[#16181a] p-6 sm:p-10 shadow-2xl space-y-8">
					
					{/* Slider Control */}
					<div className="space-y-4">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
							<span className="text-sm font-semibold text-white/80">
								Seu Volume de Faturamento Mensal (R$)
							</span>
							<span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums">
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
							className="w-full h-2.5 bg-[#0a0a0a] rounded-lg appearance-none cursor-pointer accent-white"
						/>

						<div className="flex justify-between text-xs font-mono text-white/40">
							<span>R$ 10.000</span>
							<span>R$ 500.000</span>
							<span>R$ 1.000.000+</span>
						</div>
					</div>

					{/* Comparison Grid */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/10">
						
						{/* Traditional Gateways */}
						<div className="rounded-xl border border-white/8 bg-[#0a0a0a] p-5 space-y-3">
							<div className="text-xs font-bold text-white/40 uppercase tracking-wider">
								Outros Gateways & Adquirentes
							</div>
							<div className="text-xl font-extrabold font-mono text-[#e23b4a] tabular-nums">
								~ {formatCurrency(traditionalFee)} / mês
							</div>
							<ul className="text-xs text-white/50 space-y-1.5 font-mono">
								<li>• Taxa média de 2,99% a 3,99% por venda</li>
								<li>• Prazo de liquidação: D+14 a D+30</li>
								<li>• Mensalidade ou taxa de adesão oculta</li>
							</ul>
						</div>

						{/* SwiftPay Savings */}
						<div className="rounded-xl border border-[#00a87e]/30 bg-[#00a87e]/5 p-5 space-y-3 shadow-[0_0_20px_rgba(0,168,126,0.06)]">
							<div className="text-xs font-bold text-[#00a87e] uppercase tracking-wider font-mono">
								Com a SwiftPay (Economia Estimada)
							</div>
							<div className="text-2xl font-extrabold font-mono text-white tabular-nums">
								Economia de <span className="text-[#00a87e]">{formatCurrency(monthlySavings)}</span> / mês
							</div>
							<div className="text-xs font-semibold text-[#00a87e] font-mono">
								~ {formatCurrency(annualSavings)} economizados por ano!
							</div>
							<ul className="text-xs text-white/80 font-medium space-y-1.5 pt-1">
								<li className="flex items-center gap-1.5">
									<Icon icon={CheckmarkCircle02Icon} className="w-3.5 h-3.5 text-[#00a87e]" />
									<span>Liquidação Instantânea D+0 SPI</span>
								</li>
								<li className="flex items-center gap-1.5">
									<Icon icon={CheckmarkCircle02Icon} className="w-3.5 h-3.5 text-[#00a87e]" />
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
							className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-black shadow-md hover:bg-white/90 transition-all cursor-pointer"
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
