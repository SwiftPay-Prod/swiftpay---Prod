'use client';

import React from 'react';
import { Icon } from '@/components/ui/icon';
import { ArrowRight01Icon, ZapIcon } from '@hugeicons/core-free-icons';

interface LandingCtaProps {
	onOpenAuth: (mode: 'signin' | 'signup') => void;
}

export function LandingCta({ onOpenAuth }: LandingCtaProps) {
	return (
		<section className="relative py-16 sm:py-24 bg-[#0B0E14] border-t border-border/40">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				
				<div className="rounded-3xl border border-[#1E2638] bg-gradient-to-b from-[#121721] to-[#090C10] p-8 sm:p-16 text-center space-y-8 relative overflow-hidden shadow-2xl">
					{/* Subtle Top Lime Border Highlight */}
					<div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#A3E635] to-transparent opacity-80" />

					<div className="inline-flex items-center gap-2 rounded-full border border-[#1E2638] bg-[#090C10] px-4 py-1.5 text-xs font-semibold text-[#A3E635]">
						<Icon icon={ZapIcon} className="w-3.5 h-3.5" />
						<span>CADASTRO INSTANTÂNEO</span>
					</div>

					<h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground max-w-3xl mx-auto leading-tight">
						Pronto para operar com a infraestrutura PIX mais rápida do mercado?
					</h2>

					<p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
						Junte-se à elite do digital. Sem mensalidade, sem taxa de adesão e com suporte técnico dedicado.
					</p>

					<div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
						<button
							type="button"
							onClick={() => onOpenAuth('signup')}
							className="group flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#A3E635] px-8 py-4 text-base font-bold text-[#0B0E14] shadow-[0_4px_20px_rgba(163,230,53,0.35)] hover:bg-[#b2f042] active:scale-[0.98] transition-all"
						>
							<span>Criar Conta Gratuita Agora</span>
							<Icon icon={ArrowRight01Icon} className="w-5 h-5 transition-transform group-hover:translate-x-1" />
						</button>

						<button
							type="button"
							onClick={() => onOpenAuth('signin')}
							className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-border bg-surface-secondary/80 px-8 py-4 text-base font-semibold text-foreground hover:bg-surface-secondary transition-all active:scale-[0.98]"
						>
							<span>Já tenho uma conta (Entrar)</span>
						</button>
					</div>

					<div className="text-xs font-mono text-muted-foreground pt-4">
						⚡ Setup em menos de 2 minutos • Liquidação D+0 • Suporte Humano
					</div>
				</div>

			</div>
		</section>
	);
}
